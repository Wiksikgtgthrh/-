import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"

export const runtime = "nodejs"

/**
 * Обработчик уведомления ЮKassa.
 * Одного JSON webhook недостаточно: злоумышленник мог бы отправить такой же
 * POST вручную. Поэтому после получения уведомления повторно запрашиваем
 * платёж по серверному секрету и сверяем id, статус и сумму.
 */
export async function POST(req: Request) {
  const event = await req.json().catch(() => null)
  const payment = event?.object
  if (event?.event !== "payment.succeeded" || !payment?.id || payment.status !== "succeeded") {
    return Response.json({ ok: true })
  }

  const orderId = Number(payment.metadata?.order_id)
  if (!Number.isInteger(orderId) || orderId <= 0) return Response.json({ ok: true })
  const order = (await db.select().from(appOrder).where(eq(appOrder.id, orderId)).limit(1))[0]
  if (!order || order.paymentId !== payment.id) return Response.json({ ok: true })

  const shopId = process.env.YOOKASSA_SHOP_ID
  const secret = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secret) return new Response("", { status: 503 })

  const response = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(payment.id)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}` },
    cache: "no-store",
  })
  if (!response.ok) return new Response("", { status: 502 })
  const verified = await response.json()
  const expected = Number(order.totalPrice).toFixed(2)
  const actual = Number(verified.amount?.value).toFixed(2)
  if (verified.status === "succeeded" && verified.paid === true && actual === expected) {
    await db.update(appOrder).set({ status: "paid" }).where(eq(appOrder.id, orderId))
  }
  return Response.json({ ok: true })
}
