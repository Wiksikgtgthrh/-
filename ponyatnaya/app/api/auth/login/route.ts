import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import { createToken, setAuthCookie } from "@/lib/auth/session"
import { roleForPhone, envCredentialRole } from "@/lib/auth/roles"
import { normalizePhone } from "@/lib/utils/text"
import { ok, fail, userPublic } from "@/lib/api"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  let phone = String(body.phone ?? "").trim()
  const password = String(body.password ?? "")

  if (!phone || !password) return fail("Укажите номер телефона и пароль.")
  phone = normalizePhone(phone)

  // Вход по учётным данным из .env: номер из ADMIN_PHONES/STAFF_PHONES + соответствующий
  // пароль (ADMIN_PASSWORD/STAFF_PASSWORD). Работает даже без предварительной регистрации.
  const envRoleLogin = envCredentialRole(phone, password)

  let [user] = await db.select().from(appUser).where(eq(appUser.phone, phone)).limit(1)

  if (!user) {
    // Аккаунта нет: разрешаем создать его на лету только по валидным env-данным.
    if (!envRoleLogin) {
      return fail("Неверный номер телефона или пароль.", 401)
    }
    const [created] = await db
      .insert(appUser)
      .values({
        phone,
        passwordHash: await hashPassword(password),
        firstName: envRoleLogin.isSuperuser ? "Администратор" : "Сотрудник",
        isStaff: envRoleLogin.isStaff,
        isSuperuser: envRoleLogin.isSuperuser,
      })
      .returning()
    user = created
    const token = await createToken(user.id)
    await setAuthCookie(token)
    return ok({ token, user: userPublic(user) })
  }

  // Аккаунт есть: пускаем либо по личному паролю, либо по env-паролю (для админа/сотрудника).
  const personalOk = await verifyPassword(password, user.passwordHash)
  if (!personalOk && !envRoleLogin) {
    return fail("Неверный номер телефона или пароль.", 401)
  }
  if (!user.isActive) return fail("Аккаунт деактивирован.", 403)

  // Роли админа/сотрудника полностью определяются .env (ADMIN_PHONES / STAFF_PHONES) —
  // это единственный источник истины. Номер добавили в env → права выдаются при входе;
  // убрали из env → права снимаются при следующем входе (доступ к админке пропадает).
  const envRole = roleForPhone(phone)
  const wantSuperuser = envRole.isSuperuser
  const wantStaff = envRole.isStaff
  if (wantSuperuser !== user.isSuperuser || wantStaff !== user.isStaff) {
    const [updated] = await db
      .update(appUser)
      .set({ isSuperuser: wantSuperuser, isStaff: wantStaff })
      .where(eq(appUser.id, user.id))
      .returning()
    user = updated
  }

  const token = await createToken(user.id)
  await setAuthCookie(token)
  return ok({ token, user: userPublic(user) })
}
