import { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { fail, ok } from "@/lib/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { order_id } = await req.json()
  const order = (await db.select().from(appOrder).where(eq(appOrder.id, Number(order_id))).limit(1))[0]
  if (!order) return fail("Заказ не найден.", 404)

  const shopId = process.env.YOOKASSA_SHOP_ID
  const secret = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secret) {
    return fail("Онлайн-оплата пока не подключена. Администратору нужно указать YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.", 503)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
  const returnUrl = `${baseUrl}/account?payment=success&order=${order.id}`

  // Идемпотентный ключ должен быть стабильным по заказу — иначе ЮKassa
  // создаёт новую платёжку на каждый запрос и заказ может задвоиться.
  const idempotenceKey = `order-${order.id}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  let payment: { id?: string; confirmation?: { confirmation_url?: string } } | null = null
  try {
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}`,
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify({
        amount: { value: Number(order.totalPrice).toFixed(2), currency: "RUB" },
        capture: true,
        description: `Заказ №${order.id}`,
        confirmation: { type: "redirect", return_url: returnUrl },
        metadata: { order_id: String(order.id) },
      }),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.error("[payments/create] YooKassa error", response.status, text)
      return fail("Не удалось создать платёж в ЮKassa.", 502)
    }
    payment = await response.json()
  } catch (err) {
    console.error("[payments/create] fetch failed", err)
    return fail("ЮKassa не отвечает. Попробуйте позже или выберите оплату наличными.", 504)
  } finally {
    clearTimeout(timer)
  }

  if (!payment?.confirmation?.confirmation_url || !payment.id) {
    return fail("Некорректный ответ ЮKassa.", 502)
  }

  await db
    .update(appOrder)
    .set({ paymentId: payment.id, paymentMethod: "card", status: "awaiting_payment" })
    .where(eq(appOrder.id, order.id))

  return ok({ payment_id: payment.id, confirmation_url: payment.confirmation.confirmation_url })
}
