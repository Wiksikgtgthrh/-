import type { NextRequest } from "next/server"
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder, orderItem, product } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeOrder } from "@/lib/serializers"

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const scope = req.nextUrl.searchParams.get("scope")

  // Личная история покупок пользователя — доступна без прав администратора.
  if (scope === "my") {
    if (!user) return fail("Требуется авторизация.", 401)
    const rows = await db
      .select()
      .from(appOrder)
      .where(eq(appOrder.userId, user.id))
      .orderBy(desc(appOrder.createdAt))
    if (!rows.length) return ok([])
    const ids = rows.map((o) => o.id)
    const items = await db
      .select({
        id: orderItem.id,
        orderId: orderItem.orderId,
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        price: orderItem.price,
        productName: product.nameWithWeight,
      })
      .from(orderItem)
      .leftJoin(product, eq(orderItem.productId, product.id))
      .where(inArray(orderItem.orderId, ids))
    const byOrder = new Map<number, typeof items>()
    for (const it of items) {
      const arr = byOrder.get(it.orderId) || []
      arr.push(it)
      byOrder.set(it.orderId, arr)
    }
    return ok(
      rows.map((o) =>
        serializeOrder(
          o,
          (byOrder.get(o.id) || []).map((it) => ({ ...it, productName: it.productName || "" })),
        ),
      ),
    )
  }

  const denied = requireAdmin(user)
  if (denied) return denied

  const filters = [inArray(appOrder.status, ["completed", "cancelled"])]
  const dateStr = req.nextUrl.searchParams.get("date")
  if (dateStr) {
    const start = new Date(`${dateStr}T00:00:00`)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    filters.push(gte(appOrder.createdAt, start), lt(appOrder.createdAt, end))
  }

  const rows = await db
    .select()
    .from(appOrder)
    .where(and(...filters))
    .orderBy(desc(appOrder.createdAt))

  if (!rows.length) return ok([])
  const ids = rows.map((o) => o.id)
  const items = await db
    .select({
      id: orderItem.id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      price: orderItem.price,
      productName: product.nameWithWeight,
    })
    .from(orderItem)
    .leftJoin(product, eq(orderItem.productId, product.id))
    .where(inArray(orderItem.orderId, ids))
  const byOrder = new Map<number, typeof items>()
  for (const it of items) {
    const arr = byOrder.get(it.orderId) || []
    arr.push(it)
    byOrder.set(it.orderId, arr)
  }
  return ok(
    rows.map((o) =>
      serializeOrder(
        o,
        (byOrder.get(o.id) || []).map((it) => ({ ...it, productName: it.productName || "" })),
      ),
    ),
  )
}
