import { and, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { fail, ok } from "@/lib/api"
import { hashPassword } from "@/lib/auth/password"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const token = String(body.token ?? "")
  const password = String(body.password ?? "")
  const passwordConfirm = String(body.password_confirm ?? "")

  if (!token) return fail("Ссылка для сброса недействительна.")
  if (password.length < 8) return fail("Пароль должен быть не менее 8 символов.")
  if (password !== passwordConfirm) return fail("Пароли не совпадают.")

  const [user] = await db.select().from(appUser).where(and(eq(appUser.passwordResetToken, token), gt(appUser.passwordResetExpires, new Date()))).limit(1)
  if (!user) return fail("Ссылка недействительна или истекла.")

  await db.update(appUser).set({
    passwordHash: await hashPassword(password),
    passwordResetToken: null,
    passwordResetExpires: null,
  }).where(eq(appUser.id, user.id))

  return ok({ detail: "Пароль изменён. Теперь можно войти с новым паролем." })
}
