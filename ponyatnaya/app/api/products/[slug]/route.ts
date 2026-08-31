import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { product } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeProduct } from "@/lib/serializers"
import { uploadFile } from "@/lib/upload"

async function findBySlug(slug: string) {
  const rows = await db.select().from(product).where(eq(product.slug, slug)).limit(1)
  return rows[0]
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await findBySlug(slug)
  if (!row) return fail("Товар не найден.", 404)
  return ok(serializeProduct(row))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { slug } = await params
  const row = await findBySlug(slug)
  if (!row) return fail("Товар не найден.", 404)

  const ct = req.headers.get("content-type") || ""
  const patch: Record<string, unknown> = {}
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData()
    if (form.has("name_with_weight")) patch.nameWithWeight = String(form.get("name_with_weight"))
    if (form.has("price")) patch.price = String(Number(form.get("price")))
    if (form.has("composition")) patch.composition = String(form.get("composition"))
    if (form.has("is_available")) patch.isAvailable = form.get("is_available") !== "false"
    if (form.has("category")) {
      const v = form.get("category")
      patch.categoryId = v ? Number(v) : null
    }
    if (form.has("subcategory")) {
      const v = form.get("subcategory")
      patch.subcategoryId = v ? Number(v) : null
    }
    if (form.has("promotion")) {
      const v = form.get("promotion")
      patch.promotionId = v ? Number(v) : null
    }
    const nutrition = form.getAll("nutrition_per_100g").map((x) => Number(x))
    if (nutrition.length === 4) {
      patch.proteinPer100g = String(nutrition[0] || 0)
      patch.fatPer100g = String(nutrition[1] || 0)
      patch.carbsPer100g = String(nutrition[2] || 0)
      patch.caloriesPer100g = String(nutrition[3] || 0)
    }
    const imageFile = form.get("image")
    if (imageFile instanceof File && imageFile.size > 0) {
      patch.image = (await uploadFile(imageFile, "products")) || row.image
    }
  } else {
    const body = await req.json()
    if (body.name_with_weight != null) patch.nameWithWeight = body.name_with_weight
    if (body.price != null) patch.price = String(body.price)
    if (body.composition != null) patch.composition = body.composition
    if (body.is_available != null) patch.isAvailable = body.is_available
    if (body.category !== undefined) patch.categoryId = body.category ? Number(body.category) : null
    if (body.subcategory !== undefined) patch.subcategoryId = body.subcategory ? Number(body.subcategory) : null
    if (body.promotion !== undefined) patch.promotionId = body.promotion ? Number(body.promotion) : null
  }

  const updated = await db.update(product).set(patch).where(eq(product.id, row.id)).returning()
  return ok(serializeProduct(updated[0]))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { slug } = await params
  await db.delete(product).where(eq(product.slug, slug))
  return ok({ success: true }, 204)
}
