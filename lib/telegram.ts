import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { and, eq, isNotNull } from "drizzle-orm"
import { botClient, botConfigured } from "@/lib/bot-client"

type OrderNotice = {
  id: number | string
  order_type: string
  total_price: string
  customer_name?: string
  customer_phone?: string
  delivery_address?: string
  items?: { product_name?: string; quantity: number }[]
}

/**
 * Уведомляет всех администраторов о новом заказе в Telegram.
 * Отправка идёт через внешнего бота (сайт из РФ не ходит в Telegram напрямую).
 */
export async function notifyNewOrder(order: OrderNotice): Promise<void> {
  if (!botConfigured()) return
  const admins = await db
    .select({ chatId: appUser.telegramChatId })
    .from(appUser)
    .where(and(eq(appUser.isSuperuser, true), isNotNull(appUser.telegramChatId)))
  const chatIds = admins.map((a) => a.chatId).filter((c): c is number => typeof c === "number")
  if (!chatIds.length) return

  const typeLabel = order.order_type === "in_house" ? "На месте" : "Доставка"
  const lines = [
    `<b>Новый заказ #${order.id}</b>`,
    `Тип: ${typeLabel}`,
    order.customer_name ? `Имя: ${order.customer_name}` : "",
    order.customer_phone ? `Телефон: ${order.customer_phone}` : "",
    order.delivery_address ? `Адрес: ${order.delivery_address}` : "",
    "",
    ...(order.items || []).map((it) => `• ${it.product_name || ""} × ${it.quantity}`),
    "",
    `Итого: ${order.total_price} ₽`,
  ].filter(Boolean)

  try {
    await botClient.sendMessage({ chat_ids: chatIds, text: lines.join("\n"), parse_mode: "HTML" })
  } catch {
    // Уведомление не критично для оформления заказа — молча игнорируем сбой бота.
  }
}
