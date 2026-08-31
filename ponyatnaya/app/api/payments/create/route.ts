import { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { fail, ok } from "@/lib/api"

export async function POST(req: NextRequest) {
  const { order_id } = await req.json()
  const order = (await db.select().from(appOrder).where(eq(appOrder.id, Number(order_id))).limit(1))[0]
  if (!order) return fail("Заказ не найден.", 404)
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secret = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secret) return fail("ЮKassa не настроена: укажите YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.", 503)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}`, "Content-Type": "application/json", "Idempotence-Key": `order-${order.id}-${Date.now()}` },
    body: JSON.stringify({ amount: { value: Number(order.totalPrice).toFixed(2), currency: "RUB" }, capture: true, description: `Заказ №${order.id}`, confirmation: { type: "redirect", return_url: `${baseUrl}/cart?payment=success` }, metadata: { order_id: String(order.id) } }),
  })
  if (!response.ok) return fail("Не удалось создать платёж в ЮKassa.", 502)
  const payment = await response.json()
  await db.update(appOrder).set({ paymentId: payment.id, paymentMethod: "card", status: "awaiting_payment" }).where(eq(appOrder.id, order.id))
  return ok({ payment_id: payment.id, confirmation_url: payment.confirmation.confirmation_url })
}
