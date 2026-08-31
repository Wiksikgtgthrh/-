import type { NextRequest } from "next/server"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { category, subcategory } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeCategory } from "@/lib/serializers"
import { slugify } from "@/lib/utils/text"
import { uploadFile } from "@/lib/upload"

export async function GET() {
  const cats = await db.select().from(category).orderBy(asc(category.sliderOrder), asc(category.id))
  const subs = await db.select().from(subcategory).orderBy(asc(subcategory.id))
  const byCat = new Map<number, typeof subs>()
  for (const s of subs) {
    const arr = byCat.get(s.categoryId) || []
    arr.push(s)
    byCat.set(s.categoryId, arr)
  }
  return ok(cats.map((c) => serializeCategory(c, byCat.get(c.id) || [])))
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const ct = req.headers.get("content-type") || ""
  let name = ""
  let image = ""
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData()
    name = String(form.get("name") || "").trim()
    const img = form.get("image")
    if (img instanceof File && img.size > 0) image = (await uploadFile(img, "categories")) || ""
  } else {
    const body = await req.json()
    name = String(body.name || "").trim()
  }
  if (!name) return fail("Укажите название категории.")

  const inserted = await db
    .insert(category)
    .values({ name, slug: `${slugify(name)}-${Date.now().toString(36)}`, image })
    .returning()
  return ok(serializeCategory(inserted[0], []), 201)
}
