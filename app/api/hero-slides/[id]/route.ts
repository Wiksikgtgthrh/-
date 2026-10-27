import type { NextRequest } from "next/server"
import { asc, eq } from "drizzle-orm"
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
    if (form.has("title")) patch.title = String(form.get("title")).trim()
    if (form.has("subtitle")) patch.subtitle = String(form.get("subtitle")).trim()
    if (form.has("button_text")) patch.buttonText = String(form.get("button_text")).trim()
    if (form.has("button_link")) patch.buttonLink = String(form.get("button_link")).trim()
    if (form.has("display_order")) {
      const parsed = Number(form.get("display_order"))
      patch.displayOrder = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
    }
    if (form.has("is_active")) patch.isActive = form.get("is_active") !== "false"
    const removeImage = ["1", "true", "on"].includes(String(form.get("remove_image") || "").toLowerCase())
    const img = form.get("image")
    if (removeImage) {
      patch.image = ""
    } else if (img instanceof File && img.size > 0) {
      try {
        patch.image = (await uploadFile(img, "hero")) || rows[0].image
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Не удалось сохранить изображение.")
      }
    }
  } else {
    const body = await req.json().catch(() => ({}))
    if (body.title != null) patch.title = String(body.title).trim()
    if (body.subtitle != null) patch.subtitle = String(body.subtitle).trim()
    if (body.button_text != null) patch.buttonText = String(body.button_text).trim()
    if (body.button_link != null) patch.buttonLink = String(body.button_link).trim()
    if (body.display_order != null) {
      const parsed = Number(body.display_order)
      patch.displayOrder = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
    }
    if (body.is_active != null) patch.isActive = Boolean(body.is_active)
    // Пустая строка или remove_image=true — убрать текущее изображение.
    if (body.remove_image === true || body.image === "") patch.image = ""
  }

  if (patch.title !== undefined && !String(patch.title)) {
    return fail("Заголовок слайда не может быть пустым.")
  }

  if (Object.keys(patch).length === 0) {
    return ok(serializeHeroSlide(rows[0]))
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

  // После удаления убираем дыры в порядке: оставшиеся нумеруются 0..n-1.
  const left = await db.select().from(heroSlide).orderBy(asc(heroSlide.displayOrder), asc(heroSlide.id))
  await db.transaction(async (tx) => {
    for (let index = 0; index < left.length; index += 1) {
      if (left[index].displayOrder !== index) {
        await tx.update(heroSlide).set({ displayOrder: index }).where(eq(heroSlide.id, left[index].id))
      }
    }
  })

  return ok({ success: true }, 204)
}