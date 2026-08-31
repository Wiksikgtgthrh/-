import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { getCurrentUser, revokeAllTokens, createToken, setAuthCookie } from "@/lib/auth/session"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { ok, fail } from "@/lib/api"

export async function POST(req: Request) {
  const current = await getCurrentUser()
  if (!current) return fail("Требуется авторизация.", 401)

  const body = await req.json().catch(() => ({}))
  const oldPassword = String(body.old_password ?? "")
  const newPassword = String(body.new_password ?? "")

  const [row] = await db.select().from(appUser).where(eq(appUser.id, current.id)).limit(1)
  if (!row || !(await verifyPassword(oldPassword, row.passwordHash))) {
    return fail("Текущий пароль указан неверно.")
  }
  if (newPassword.length < 8) return fail("Пароль должен быть не менее 8 символов.")

  const passwordHash = await hashPassword(newPassword)
  await db.update(appUser).set({ passwordHash }).where(eq(appUser.id, current.id))
  await revokeAllTokens(current.id)
  // Перевыдаём токен текущей сессии, чтобы пользователь не разлогинился.
  const token = await createToken(current.id)
  await setAuthCookie(token)
  return ok({ success: true })
}
