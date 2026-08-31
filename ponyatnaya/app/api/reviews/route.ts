import type { NextRequest } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { review } from "@/lib/db/schema"
import { ok, fail } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeReview } from "@/lib/serializers"

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const isAdmin = Boolean(user?.isSuperuser)
  const fiveStar = req.nextUrl.searchParams.get("five_star") === "1"

  const filters = []
  // Обычные посетители видят только опубликованные отзывы
  if (!isAdmin) filters.push(eq(review.isPublished, true))
  if (fiveStar) filters.push(eq(review.rating, 5))

  const rows = await db
    .select()
    .from(review)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(review.createdAt))
  return ok(rows.map(serializeReview))
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const isAdmin = Boolean(user?.isSuperuser)
  const body = await req.json()
  const author = String(body.author || "").trim()
  const text = String(body.text || "").trim()
  const requestedRating = Number(body.rating)
  const rating = Number.isFinite(requestedRating) ? Math.min(5, Math.max(1, Math.round(requestedRating))) : 5
  if (!author || text.length < 3) return fail("Заполните имя и текст отзыва (не менее 3 символов).")
  if (author.length > 255 || text.length > 2000) return fail("Отзыв превышает допустимую длину.")

  // Отзывы от посетителей уходят на модерацию; админ публикует сразу
  const isPublished = isAdmin ? body.is_published !== false : false
  const inserted = await db
    .insert(review)
    .values({ author, text, rating, isPublished })
    .returning()
  return ok(serializeReview(inserted[0]), 201)
}
