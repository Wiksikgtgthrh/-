import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import { createToken, setAuthCookie } from "@/lib/auth/session"
import { roleForPhone, envCredentialRole } from "@/lib/auth/roles"
import { normalizePhone } from "@/lib/utils/text"
import { ok, fail, userPublic } from "@/lib/api"
import { isRateLimited, clientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  // Защита от перебора паролей: не более 10 попыток входа в минуту с одного IP.
  if (isRateLimited(`login:${clientIp(req)}`, 10, 60_000)) {
    return fail("Слишком много попыток входа. Попробуйте через минуту.", 429)
  }
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

  // Синхронизация ролей с .env:
  // - телефон ЕСТЬ в env-списках → env-роль применяем при входе (env — источник истины для locked-аккаунтов);
  // - телефона НЕТ в env → роли из БД НЕ трогаем: они выданы через админку и должны сохраняться.
  // Раньше роль снималась при любом входе, если её не было в env — из-за этого слетали роли,
  // выданные в панели управления.
  const envRole = roleForPhone(phone)
  const inEnvList = envRole.isSuperuser || envRole.isStaff
  if (inEnvList) {
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
  }
  // Если телефон НЕ в env — роли из БД (выданные через админку) сохраняются как есть.

  const token = await createToken(user.id)
  await setAuthCookie(token)
  return ok({ token, user: userPublic(user) })
}
