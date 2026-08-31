import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { createToken, setAuthCookie } from "@/lib/auth/session"
import { roleForPhone } from "@/lib/auth/roles"
import { normalizePhone } from "@/lib/utils/text"
import { ok, fail, userPublic } from "@/lib/api"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  let phone = String(body.phone ?? "").trim()
  const password = String(body.password ?? "")
  const passwordConfirm = String(body.password_confirm ?? "")

  if (!phone) return fail("Укажите номер телефона.")
  phone = normalizePhone(phone)

  const existing = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.phone, phone)).limit(1)
  if (existing.length) return fail("Пользователь с таким номером уже зарегистрирован.")
  if (password.length < 8) return fail("Пароль должен быть не менее 8 символов.")
  if (password !== passwordConfirm) return fail("Пароли не совпадают.")

  const passwordHash = await hashPassword(password)
  // Если номер указан в env-списках ADMIN_PHONES/STAFF_PHONES — сразу выдаём роль.
  const envRole = roleForPhone(phone)
  const [user] = await db
    .insert(appUser)
    .values({
      phone,
      firstName: "",
      email: "",
      passwordHash,
      isActive: true,
      isPhoneVerified: true,
      isStaff: envRole.isStaff,
      isSuperuser: envRole.isSuperuser,
    })
    .returning()

  const token = await createToken(user.id)
  await setAuthCookie(token)
  return ok({ token, user: userPublic(user) })
}
