import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { createToken, setAuthCookie } from "@/lib/auth/session"
import { normalizePhone } from "@/lib/utils/text"
import { botClient, BotError } from "@/lib/bot-client"
import { ok, fail, userPublic } from "@/lib/api"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const token = String(body.token ?? "").trim()
  const password = String(body.password ?? "")
  const passwordConfirm = String(body.password_confirm ?? "")

  if (!token) return fail("Токен обязателен.")
  if (password.length < 8) return fail("Пароль должен быть не менее 8 символов.")
  if (password !== passwordConfirm) return fail("Пароли не совпадают.")

  // Статус регистрации держит бот — спрашиваем его.
  let reg
  try {
    reg = await botClient.checkRegistration(token)
  } catch (e) {
    const status = e instanceof BotError ? e.status : 502
    return fail(e instanceof Error ? e.message : "Бот недоступен.", status)
  }
  if (reg.status !== "completed") {
    return fail("Регистрация не завершена. Подтвердите номер в Telegram.")
  }

  const phone = normalizePhone(reg.phone)
  const existing = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.phone, phone)).limit(1)
  if (existing.length) return fail("Пользователь с таким номером уже зарегистрирован.")

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(appUser)
    .values({
      phone,
      firstName: reg.first_name || "Пользователь",
      passwordHash,
      isActive: true,
      isPhoneVerified: true,
      telegramChatId: reg.chat_id ?? undefined,
    })
    .returning()

  const authTok = await createToken(user.id)
  await setAuthCookie(authTok)
  return ok({ token: authTok, user: userPublic(user) })
}
