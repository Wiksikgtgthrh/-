import type { NextRequest } from "next/server"
import { eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { heroSlide } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

/**
 * Сохраняет порядок слайдов одним запросом: переданный список id получает
 * display_order = позиция в списке. Так «вверх/вниз» и перетаскивание не
 * создают дубликатов порядка, как при инкременте на ±1.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  const raw = body && Array.isArray(body.ids) ? body.ids : null
  if (!raw || raw.length === 0) return fail("Передайте порядок слайдов.")

  const ids: number[] = raw.map((value: unknown) => Number(value))
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return fail("Некорректный список слайдов.")
  }
  if (new Set(ids).size !== ids.length) {
    return fail("Список слайдов содержит повторы.")
  }

  const existing = await db
    .select({ id: heroSlide.id })
    .from(heroSlide)
    .where(inArray(heroSlide.id, ids))
  if (existing.length !== ids.length) {
    return fail("Часть слайдов уже удалена — обновите список.", 409)
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < ids.length; index += 1) {
      await tx.update(heroSlide).set({ displayOrder: index }).where(eq(heroSlide.id, ids[index]))
    }
  })

  return ok({ success: true, ids })
}