import type { NextRequest } from "next/server"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { legalDocument } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeLegalDocument } from "@/lib/serializers"

// Публичный список правовых документов (пользовательское соглашение,
// политика конфиденциальности, условия доставки, публичная оферта).
// Возвращаем все записи с флагом is_published — сайт сам скрывает скрытые.
export async function GET() {
  const rows = await db
    .select()
    .from(legalDocument)
    .orderBy(asc(legalDocument.displayOrder), asc(legalDocument.id))
  return ok(rows.map(serializeLegalDocument))
}

// Обновление документа (только админ): текст, заголовок и флаг публикации.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const body = await req.json()
  const slug = String(body.slug || "").trim()
  if (!slug) return fail("Не указан документ.")

  const existing = await db.select().from(legalDocument).where(eq(legalDocument.slug, slug)).limit(1)
  if (!existing[0]) return fail("Документ не найден.", 404)

  const patch: Partial<typeof legalDocument.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === "string") patch.title = body.title
  if (typeof body.content === "string") patch.content = body.content
  if (typeof body.is_published === "boolean") patch.isPublished = body.is_published

  const updated = await db
    .update(legalDocument)
    .set(patch)
    .where(eq(legalDocument.id, existing[0].id))
    .returning()

  return ok(serializeLegalDocument(updated[0]))
}
