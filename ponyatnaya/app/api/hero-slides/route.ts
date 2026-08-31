import type { NextRequest } from "next/server"
import { asc, eq } from "drizzle-orm"
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
  if (img instanceof File && img.size > 0) image = (await uploadFile(img, "hero")) || ""

  const inserted = await db
    .insert(heroSlide)
    .values({
      title,
      subtitle: String(form.get("subtitle") || ""),
      buttonText: String(form.get("button_text") || ""),
      buttonLink: String(form.get("button_link") || ""),
      displayOrder: Number(form.get("display_order") || 0),
      isActive: form.get("is_active") !== "false",
      image,
    })
    .returning()
  return ok(serializeHeroSlide(inserted[0]), 201)
}
