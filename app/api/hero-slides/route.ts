import type { NextRequest } from "next/server"
import { asc, eq, max } from "drizzle-orm"
import { db } from "@/lib/db"
import { heroSlide } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeHeroSlide } from "@/lib/serializers"
import { uploadFile } from "@/lib/upload"

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const isAdmin = Boolean(user?.isSuperuser)
  const rows = await db.select().from(heroSlide).orderBy(asc(heroSlide.displayOrder), asc(heroSlide.id))
  const filtered = isAdmin ? rows : rows.filter((r) => r.isActive)
  return ok(filtered.map(serializeHeroSlide))
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const form = await req.formData()
  const title = String(form.get("title") || "").trim()
  if (!title) return fail("Укажите заголовок слайда.")
  let image = ""
  const img = form.get("image")
  if (img instanceof File && img.size > 0) {
    try {
      image = (await uploadFile(img, "hero")) || ""
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Не удалось сохранить изображение.")
    }
  }

  // Порядок не передан — ставим слайд в конец, а не поверх первого.
  const rawOrder = form.get("display_order")
  let displayOrder: number
  if (rawOrder === null || String(rawOrder).trim() === "") {
    const [row] = await db.select({ max: max(heroSlide.displayOrder) }).from(heroSlide)
    displayOrder = (row?.max ?? -1) + 1
  } else {
    const parsed = Number(rawOrder)
    displayOrder = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
  }

  const inserted = await db
    .insert(heroSlide)
    .values({
      title,
      subtitle: String(form.get("subtitle") || "").trim(),
      buttonText: String(form.get("button_text") || "").trim(),
      buttonLink: String(form.get("button_link") || "").trim(),
      displayOrder,
      isActive: form.get("is_active") !== "false",
      image,
    })
    .returning()
  return ok(serializeHeroSlide(inserted[0]), 201)
}