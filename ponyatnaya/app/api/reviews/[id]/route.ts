import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { review } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeReview } from "@/lib/serializers"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { id } = await params
  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if (body.is_published != null) patch.isPublished = body.is_published
  if (body.rating != null) patch.rating = Number(body.rating)
  if (body.text != null) patch.text = body.text
  if (body.author != null) patch.author = body.author
  const updated = await db.update(review).set(patch).where(eq(review.id, Number(id))).returning()
  if (!updated[0]) return fail("Отзыв не найден.", 404)
  return ok(serializeReview(updated[0]))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { id } = await params
  await db.delete(review).where(eq(review.id, Number(id)))
  return ok({ success: true }, 204)
}
