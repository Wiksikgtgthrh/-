import type { NextRequest } from "next/server"
import { asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { subcategory } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeSubcategory } from "@/lib/serializers"
import { slugify } from "@/lib/utils/text"

export async function GET() {
  const rows = await db.select().from(subcategory).orderBy(asc(subcategory.id))
  return ok(rows.map(serializeSubcategory))
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const body = await req.json()
  const name = String(body.name || "").trim()
  const categoryId = Number(body.category)
  if (!name || !categoryId) return fail("Укажите название и категорию.")
  const inserted = await db
    .insert(subcategory)
    .values({ name, categoryId, slug: `${slugify(name)}-${Date.now().toString(36)}` })
    .returning()
  return ok(serializeSubcategory(inserted[0]), 201)
}
