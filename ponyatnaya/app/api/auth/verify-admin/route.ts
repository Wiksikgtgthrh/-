import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth/session"
import { ok, fail } from "@/lib/api"

/**
 * Доступ к панели управления защищён двумя паролями из переменных окружения (.env):
 *   STAFF_PASSWORD — пароль для входа в панель (режим «Сотрудник»).
 *   ADMIN_PASSWORD — отдельный пароль для входа в режим «Админ».
 * Личные пароли аккаунтов здесь НЕ используются. Роли (кто сотрудник/админ)
 * по-прежнему определяются номером телефона через ADMIN_PHONES / STAFF_PHONES.
 */

function staffPassword(): string {
  return process.env.STAFF_PASSWORD?.trim() ?? ""
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() ?? ""
}

/** GET — сообщает фронтенду, какие пароли-гейты включены (заданы в .env). */
export async function GET() {
  const current = await getCurrentUser()
  if (!current) return fail("Требуется авторизация.", 401)
  if (!current.isStaff) return fail("Доступ запрещён.", 403)
  return ok({
    staff_required: staffPassword().length > 0,
    admin_required: adminPassword().length > 0,
  })
}

/**
 * POST { scope: 'staff' | 'admin', password }
 * Проверяет соответствующий env-пароль.
 */
export async function POST(req: Request) {
  const current = await getCurrentUser()
  if (!current) return fail("Требуется авторизация.", 401)

  const body = await req.json().catch(() => ({}))
  const scope = body.scope === "staff" ? "staff" : "admin"
  const password = String(body.password ?? "")

  if (scope === "staff") {
    if (!current.isStaff) return fail("Доступ к панели только у сотрудников.", 403)
    const expected = staffPassword()
    // Пароль не задан в .env — гейт отключён, вход свободный для сотрудников.
    if (!expected) return ok({ verified: true, scope })
    if (password !== expected) return fail("Неверный пароль для входа в панель.", 401)
    return ok({ verified: true, scope })
  }

  // scope === 'admin'
  if (!current.isSuperuser) return fail("Доступ запрещён. Требуются права администратора.", 403)
  const expected = adminPassword()
  if (!expected) {
    return fail("Режим «Админ» недоступен: не задан ADMIN_PASSWORD в .env.", 403)
  }
  if (password !== expected) return fail("Неверный пароль администратора.", 401)

  const [row] = await db.select().from(appUser).where(eq(appUser.id, current.id)).limit(1)
  return ok({ verified: true, scope, is_superuser: true, phone: row?.phone ?? current.phone })
}
