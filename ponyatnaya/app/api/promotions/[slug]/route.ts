import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { promotion } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializePromotion } from "@/lib/serializers"
import { uploadFile } from "@/lib/upload"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await db.select().from(promotion).where(eq(promotion.slug, slug)).limit(1)
  if (!rows[0]) return fail("Акция не найдена.", 404)
  return ok(serializePromotion(rows[0]))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { slug } = await params
  const rows = await db.select().from(promotion).where(eq(promotion.slug, slug)).limit(1)
  if (!rows[0]) return fail("Акция не найдена.", 404)

  const form = await req.formData()
  const patch: Record<string, unknown> = {}
  if (form.has("name")) patch.name = String(form.get("name"))
  if (form.has("description")) patch.description = String(form.get("description"))
  if (form.has("conditions")) patch.conditions = String(form.get("conditions"))
  if (form.has("terms")) patch.terms = String(form.get("terms"))
  if (form.has("pdf_link_text")) patch.pdfLinkText = String(form.get("pdf_link_text"))
  if (form.has("end_date")) {
    const v = form.get("end_date")
    patch.endDate = v ? new Date(String(v)) : null
  }
  for (const [field, col] of [
    ["image", "image"],
    ["banner_image", "bannerImage"],
    ["pdf_file", "pdfFile"],
  ] as const) {
    const f = form.get(field)
    if (f instanceof File && f.size > 0) patch[col] = (await uploadFile(f, "promotions")) || ""
  }
  const updated = await db.update(promotion).set(patch).where(eq(promotion.id, rows[0].id)).returning()
  return ok(serializePromotion(updated[0]))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { slug } = await params
  await db.delete(promotion).where(eq(promotion.slug, slug))
  return ok({ success: true }, 204)
}
