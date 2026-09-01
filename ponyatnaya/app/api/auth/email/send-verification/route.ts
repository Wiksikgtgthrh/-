import { randomBytes } from "node:crypto"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/session"
import { fail, ok } from "@/lib/api"

export async function POST(req: Request) {
  const current = await getCurrentUser()
  if (!current) return fail("Требуется авторизация.", 401)
  if (!current.email) return fail("Сначала укажите email в профиле.")
  if (current.emailVerified) return ok({ detail: "Email уже подтверждён." })

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || (process.env.NODE_ENV === "production" ? "" : "onboarding@resend.dev")
  if (!apiKey || !from) return fail("Сервис отправки писем не настроен: укажите RESEND_FROM_EMAIL.", 503)

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.update(appUser).set({ emailVerificationToken: token, emailVerificationExpires: expires }).where(eq(appUser.id, current.id))

  const isProd = process.env.NODE_ENV === "production"
  const baseUrl = isProd ? (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin) : new URL(req.url).origin
  const url = new URL("/verify-email", baseUrl)
  url.searchParams.set("token", token)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: current.email,
    subject: "Подтвердите email — Понятная еда",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px"><h2>Подтвердите email</h2><p>Нажмите на кнопку, чтобы подтвердить адрес для аккаунта «Понятная еда».</p><p><a href="${url.toString()}" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:12px 20px;border-radius:8px">Подтвердить email</a></p><p style="color:#666;font-size:14px">Ссылка действует 24 часа.</p></div>`,
  })
  if (error) return fail("Не удалось отправить письмо. Попробуйте позже.", 502)

  return ok({ detail: "Письмо с подтверждением отправлено." })
}
