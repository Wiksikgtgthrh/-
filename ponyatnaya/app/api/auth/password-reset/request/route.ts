import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { fail, ok } from "@/lib/api"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = String(body.email ?? "").trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Введите корректный email.")

  const generic = "Если аккаунт с такой почтой существует, мы отправили ссылку для сброса пароля."
  const [user] = await db.select().from(appUser).where(eq(appUser.email, email)).limit(1)
  if (!user?.emailVerified) return ok({ detail: generic })

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return fail("Сервис отправки писем временно не настроен.", 503)

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000)
  const resetUrl = new URL("/reset-password", request.url)
  resetUrl.searchParams.set("token", token)

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Сброс пароля — Понятная еда",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px"><h2>Сброс пароля</h2><p>Нажмите на кнопку, чтобы установить новый пароль.</p><p><a href="${resetUrl.toString()}" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:12px 20px;border-radius:8px">Установить новый пароль</a></p><p style="color:#666;font-size:14px">Ссылка действует 1 час. Если это были не вы, просто проигнорируйте письмо.</p></div>`,
  })
  if (error) return fail("Не удалось отправить письмо. Попробуйте позже.", 502)

  await db.update(appUser).set({ passwordResetToken: token, passwordResetExpires: expires }).where(eq(appUser.id, user.id))
  return ok({ detail: generic })
}
