import type { NextRequest } from "next/server"
import { and, desc, eq, inArray, notInArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder, orderItem, product } from "@/lib/db/schema"
import { ok, fail, requireStaff } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeOrder } from "@/lib/serializers"
import { notifyNewOrder } from "@/lib/telegram"

async function withItems(orders: (typeof appOrder.$inferSelect)[]) {
  if (!orders.length) return []
  const ids = orders.map((o) => o.id)
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
  return orders.map((o) =>
    serializeOrder(
      o,
      (byOrder.get(o.id) || []).map((it) => ({ ...it, productName: it.productName || "" })),
    ),
  )
}

// Личный кабинет получает все заказы текущего пользователя, включая историю.
// Без scope=my маршрут остаётся административным списком активных заказов.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const isPersonalRequest = req.nextUrl.searchParams.get("scope") === "my"

  if (isPersonalRequest) {
    if (!user) return fail("Требуется авторизация.", 401)
    const rows = await db
      .select()
      .from(appOrder)
      .where(eq(appOrder.userId, user.id))
      .orderBy(desc(appOrder.createdAt))
    return ok(await withItems(rows))
  }

  const denied = requireStaff(user)
  if (denied) return denied
  const rows = await db
    .select()
    .from(appOrder)
    .where(notInArray(appOrder.status, ["completed", "cancelled"]))
    .orderBy(desc(appOrder.createdAt))
  return ok(await withItems(rows))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const items: { product_id: number; quantity: number }[] = body.items || []
  if (!items.length) return fail("Корзина пуста.")

  const prodIds = items.map((i) => Number(i.product_id))
  const prods = await db.select().from(product).where(inArray(product.id, prodIds))
  const priceById = new Map(prods.map((p) => [p.id, Number(p.price)]))

  let subtotal = 0
  for (const it of items) subtotal += (priceById.get(Number(it.product_id)) || 0) * Number(it.quantity)

  const discountPercent = Number(body.discount_percent || 0)
  const discountAmount = (subtotal * discountPercent) / 100
  const requestedDeliveryFee = Number(body.delivery_fee || 0)
  const orderType = body.order_type === "in_house" ? "in_house" : "delivery"
  let deliveryFee = 0
  if (orderType === "delivery") {
    const address = String(body.delivery_address || "").trim()
    const settlementId = String(body.delivery_settlement_id || "").trim()
    if (!settlementId) return fail("Выберите населённый пункт для доставки.")
    if (!address || address.length < 5) return fail("Укажите полный адрес доставки: улицу, дом и квартиру/офис.")
    const zones: Record<string, { fee: number; minOrder: number }> = {
      center: { fee: 199, minOrder: 0 },
      district: { fee: 299, minOrder: 0 },
      outskirts: { fee: 399, minOrder: 1500 },
    }
    const zone = zones[settlementId]
    if (!zone) return fail("Выбранный населённый пункт недоступен для доставки.")
    if (subtotal - discountAmount < zone.minOrder) {
      return fail(`Минимальная сумма заказа для выбранного населённого пункта — ${zone.minOrder} ₽.`)
    }
    deliveryFee = zone.fee
    if (!Number.isFinite(requestedDeliveryFee) || requestedDeliveryFee !== deliveryFee) {
      return fail("Стоимость доставки устарела. Обновите страницу и повторите заказ.")
    }
  }
  const total = subtotal - discountAmount + deliveryFee

  const user = await getCurrentUser()
  const inserted = await db
    .insert(appOrder)
    .values({
      userId: user?.id ?? null,
      totalPrice: String(total),
      status: "new",
      orderType,
      deliveryAddress: body.delivery_address || "",
      deliveryFee: String(deliveryFee),
      discountPercent: String(discountPercent),
      discountAmount: String(discountAmount),
      customerName: body.customer_name || "",
      customerPhone: body.customer_phone || "",
      customerEmail: body.customer_email || "",
      notes: body.notes || "",
      paymentMethod: body.payment_method || "cash",
    })
    .returning()

  const order = inserted[0]
  await db.insert(orderItem).values(
    items.map((it) => ({
      orderId: order.id,
      productId: Number(it.product_id),
      quantity: Number(it.quantity),
      price: String(priceById.get(Number(it.product_id)) || 0),
    })),
  )

  const [serialized] = await withItems([order])
  notifyNewOrder(serialized).catch(() => {})
  return ok(serialized, 201)
}
