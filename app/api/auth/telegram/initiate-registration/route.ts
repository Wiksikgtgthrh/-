import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { normalizePhone } from "@/lib/utils/text"
import { botClient, BotError } from "@/lib/bot-client"
import { ok, fail } from "@/lib/api"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  let phone = String(body.phone ?? "").trim()
  if (!phone) return fail("Укажите номер телефона.")
  phone = normalizePhone(phone)

  // Аккаунт хранится в базе сайта (PostgreSQL) — проверяем занятость номера здесь.
  const existing = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.phone, phone)).limit(1)
  if (existing.length) return fail("Пользователь с таким номером уже зарегистрирован.")

  // Токен регистрации и ссылку выдаёт бот (он же держит состояние в памяти).
  try {
    const res = await botClient.initiateRegistration(phone)
    if (!res.telegram_link) return fail("Регистрация через Telegram временно недоступна.", 503)
    return ok({ telegram_link: res.telegram_link, token: res.token, expires_in: res.expires_in })
  } catch (e) {
    const status = e instanceof BotError ? e.status : 502
    return fail(e instanceof Error ? e.message : "Бот недоступен.", status)
  }
}
