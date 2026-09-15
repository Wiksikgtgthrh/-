import { db } from "@/lib/db"
import { appOrder, orderItem } from "@/lib/db/schema"
import { ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

/**
 * Полная очистка истории заказов.
 * Используется только вручную из раздела «Для разработчиков» в админке.
 * Требует прав суперпользователя, поэтому обычный сотрудник эту операцию
 * выполнить не сможет.
 */
export async function DELETE() {
  const denied = requireAdmin(await getCurrentUser())
  if (denied) return denied
  await db.delete(orderItem)
  const deleted = await db.delete(appOrder).returning({ id: appOrder.id })
  return ok({ deleted: deleted.length })
}
