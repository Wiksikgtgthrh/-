import { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { fail, ok } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Ручная проверка статуса платежа в ЮKassa.
 * Нужна, когда webhook не доходит (например, локальная разработка без
 * публичного HTTPS): фронтенд вызывает /verify после возврата пользователя
 * с ЮKassa и мы актуализируем статус, если оплата действительно прошла.
 */
export async function POST(req: NextRequest) {
  const { order_id } = await req.json().catch(() => ({}))
  const orderId = Number(order_id)
  if (!Number.isInteger(orderId) || orderId <= 0) return fail("Неверный id заказа.")

  const user = await getCurrentUser()
  const order = (await db.select().from(appOrder).where(eq(appOrder.id, orderId)).limit(1))[0]
  if (!order) return fail("Заказ не найден.", 404)
  if (!user || (order.userId !== user.id && !user.isStaff && !user.isSuperuser)) {
    return fail("Нет доступа к этому заказу.", 403)
  }
  if (!order.paymentId) return ok({ status: order.status })

  const shopId = process.env.YOOKASSA_SHOP_ID
  const secret = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secret) return fail("Онлайн-оплата не настроена.", 503)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  let response: Response
  try {
    response = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(order.paymentId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}` },
      cache: "no-store",
      signal: controller.signal,
    })
  } catch {
    return fail("ЮKassa не отвечает. Попробуйте позже.", 504)
  } finally {
    clearTimeout(timeout)
  }
  if (!response.ok) return fail("Не удалось получить статус оплаты.", 502)
  const verified = await response.json()
  const expected = Number(order.totalPrice).toFixed(2)
  const actual = Number(verified.amount?.value).toFixed(2)
  if (verified.status === "succeeded" && verified.paid === true && actual === expected) {
    await db.update(appOrder).set({ status: "paid" }).where(eq(appOrder.id, orderId))
    return ok({ status: "paid" })
  }
  if (verified.status === "canceled") {
    await db.update(appOrder).set({ status: "cancelled" }).where(eq(appOrder.id, orderId))
    return ok({ status: "cancelled" })
  }
  return ok({ status: order.status })
}
