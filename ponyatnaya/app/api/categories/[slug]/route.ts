import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { category, subcategory, product } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeCategory } from "@/lib/serializers"
import { uploadFile } from "@/lib/upload"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { slug } = await params
  const rows = await db.select().from(category).where(eq(category.slug, slug)).limit(1)
  if (!rows[0]) return fail("Категория не найдена.", 404)

  const ct = req.headers.get("content-type") || ""
  const patch: Record<string, unknown> = {}
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData()
    if (form.has("name")) patch.name = String(form.get("name"))
    if (form.has("show_in_slider")) patch.showInSlider = form.get("show_in_slider") !== "false"
    if (form.has("slider_order")) patch.sliderOrder = Number(form.get("slider_order"))
    const img = form.get("image")
    if (img instanceof File && img.size > 0) patch.image = (await uploadFile(img, "categories")) || rows[0].image
  } else {
    const body = await req.json()
    if (body.name != null) patch.name = body.name
    if (body.show_in_slider != null) patch.showInSlider = body.show_in_slider
    if (body.slider_order != null) patch.sliderOrder = Number(body.slider_order)
  }
  const updated = await db.update(category).set(patch).where(eq(category.id, rows[0].id)).returning()
  return ok(serializeCategory(updated[0], []))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { slug } = await params
  const rows = await db.select().from(category).where(eq(category.slug, slug)).limit(1)
  if (rows[0]) {
    // Обнуляем categoryId товаров вместо удаления, чтобы товары остались
    await db.update(product).set({ categoryId: null }).where(eq(product.categoryId, rows[0].id))
    // Удаляем подкатегории (они привязаны только к категории)
    await db.delete(subcategory).where(eq(subcategory.categoryId, rows[0].id))
  }
  await db.delete(category).where(eq(category.slug, slug))
  return ok({ success: true }, 204)
}
