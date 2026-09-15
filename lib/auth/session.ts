import "server-only"
import { randomBytes } from "crypto"
import { cookies, headers } from "next/headers"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser, authToken } from "@/lib/db/schema"

export const AUTH_COOKIE = "auth_token"

export type SessionUser = {
  id: number
  phone: string
  firstName: string
  email: string
  emailVerified: boolean
  isActive: boolean
  isStaff: boolean
  isSuperuser: boolean
  telegramChatId: number | null
  isPhoneVerified: boolean
}

/** Создаёт токен авторизации для пользователя и пишет его в auth_token. */
export async function createToken(userId: number): Promise<string> {
  const token = randomBytes(24).toString("hex")
  await db.insert(authToken).values({ token, userId })
  return token
}

/** Устанавливает httpOnly cookie с токеном.
 *
 * `secure: true` требует HTTPS — в dev на http://localhost cookie тогда
 * просто НЕ ставится (Chrome молча блокирует Secure над HTTP), и после
 * возврата с ЮKassa пользователя выкидывает из аккаунта. Поэтому secure
 * включаем только в production.
 * `sameSite: "lax"` — чтобы браузер прислал cookie при top-level редиректе
 * с внешнего домена (сценарий возврата с оплаты).
 */
export async function setAuthCookie(token: string) {
  const c = await cookies()
  const isProd = process.env.NODE_ENV === "production"
  c.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearAuthCookie() {
  const c = await cookies()
  c.delete(AUTH_COOKIE)
}

async function readToken(): Promise<string | null> {
  const c = await cookies()
  const fromCookie = c.get(AUTH_COOKIE)?.value
  if (fromCookie) return fromCookie
  const h = await headers()
  const auth = h.get("authorization") || ""
  if (auth.toLowerCase().startsWith("token ")) return auth.slice(6).trim()
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim()
  return null
}

/** Возвращает текущего пользователя по токену из cookie/заголовка, либо null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await readToken()
  if (!token) return null
  const rows = await db
    .select({
      id: appUser.id,
      phone: appUser.phone,
      firstName: appUser.firstName,
      email: appUser.email,
      emailVerified: appUser.emailVerified,
      isActive: appUser.isActive,
      isStaff: appUser.isStaff,
      isSuperuser: appUser.isSuperuser,
      telegramChatId: appUser.telegramChatId,
      isPhoneVerified: appUser.isPhoneVerified,
    })
    .from(authToken)
    .innerJoin(appUser, eq(authToken.userId, appUser.id))
    .where(eq(authToken.token, token))
    .limit(1)
  const user = rows[0]
  if (!user || !user.isActive) return null
  return user
}

/** Удаляет текущий токен (logout). */
export async function revokeCurrentToken() {
  const token = await readToken()
  if (token) await db.delete(authToken).where(eq(authToken.token, token))
}

/** Удаляет все токены пользователя (например при смене пароля). */
export async function revokeAllTokens(userId: number) {
  await db.delete(authToken).where(eq(authToken.userId, userId))
}
