import type { NextRequest } from "next/server"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { dishOfTheDay } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { getActiveDish } from "@/lib/dish"

export async function GET() {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const dish = await getActiveDish()
  // Для админского экрана отсутствие блюда — нормальное состояние, а не
  // ошибка загрузки. Возвращаем 200, чтобы в консоли не появлялся 404.
  if (!dish) return ok(null)
  return ok(dish)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const body = await req.json()
  if (!body.product_id) return fail("Выберите товар.")
  // Только одно активное блюдо дня
  await db.update(dishOfTheDay).set({ isActive: false }).where(eq(dishOfTheDay.isActive, true))
  await db.insert(dishOfTheDay).values({
    productId: Number(body.product_id),
    oldPrice: body.old_price != null ? String(body.old_price) : null,
    salePrice: body.sale_price != null ? String(body.sale_price) : null,
    activeFrom: body.active_from ? new Date(body.active_from) : null,
    activeUntil: body.active_until ? new Date(body.active_until) : null,
    isActive: true,
  })
  return ok(await getActiveDish(), 201)
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const body = await req.json()
  const rows = await db
    .select()
    .from(dishOfTheDay)
    .where(eq(dishOfTheDay.isActive, true))
    .orderBy(desc(dishOfTheDay.createdAt))
    .limit(1)
  if (!rows[0]) return fail("Блюдо дня не назначено.", 404)
  const patch: Record<string, unknown> = {}
  if (body.product_id != null) patch.productId = Number(body.product_id)
  if (body.old_price !== undefined) patch.oldPrice = body.old_price != null ? String(body.old_price) : null
  if (body.sale_price !== undefined) patch.salePrice = body.sale_price != null ? String(body.sale_price) : null
  if (body.active_from !== undefined) patch.activeFrom = body.active_from ? new Date(body.active_from) : null
  if (body.active_until !== undefined) patch.activeUntil = body.active_until ? new Date(body.active_until) : null
  if (body.is_active != null) patch.isActive = body.is_active
  await db.update(dishOfTheDay).set(patch).where(eq(dishOfTheDay.id, rows[0].id))
  return ok(await getActiveDish())
}

export async function DELETE() {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  await db.update(dishOfTheDay).set({ isActive: false }).where(eq(dishOfTheDay.isActive, true))
  return ok({ success: true }, 204)
}
