import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { heroSlide } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeHeroSlide } from "@/lib/serializers"
import { uploadFile } from "@/lib/upload"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { id } = await params
  const rows = await db.select().from(heroSlide).where(eq(heroSlide.id, Number(id))).limit(1)
  if (!rows[0]) return fail("Слайд не найден.", 404)

  const ct = req.headers.get("content-type") || ""
  const patch: Record<string, unknown> = {}
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData()
    if (form.has("title")) patch.title = String(form.get("title"))
    if (form.has("subtitle")) patch.subtitle = String(form.get("subtitle"))
    if (form.has("button_text")) patch.buttonText = String(form.get("button_text"))
    if (form.has("button_link")) patch.buttonLink = String(form.get("button_link"))
    if (form.has("display_order")) patch.displayOrder = Number(form.get("display_order"))
    if (form.has("is_active")) patch.isActive = form.get("is_active") !== "false"
    const img = form.get("image")
    if (img instanceof File && img.size > 0) patch.image = (await uploadFile(img, "hero")) || rows[0].image
  } else {
    const body = await req.json()
    if (body.title != null) patch.title = body.title
    if (body.subtitle != null) patch.subtitle = body.subtitle
    if (body.button_text != null) patch.buttonText = body.button_text
    if (body.button_link != null) patch.buttonLink = body.button_link
    if (body.display_order != null) patch.displayOrder = Number(body.display_order)
    if (body.is_active != null) patch.isActive = body.is_active
  }
  const updated = await db.update(heroSlide).set(patch).where(eq(heroSlide.id, rows[0].id)).returning()
  return ok(serializeHeroSlide(updated[0]))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { id } = await params
  await db.delete(heroSlide).where(eq(heroSlide.id, Number(id)))
  return ok({ success: true }, 204)
}
