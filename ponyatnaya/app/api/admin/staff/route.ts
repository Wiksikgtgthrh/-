import { randomBytes } from "crypto"
import { or, eq, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { getAdminPhones, getStaffPhones } from "@/lib/auth/roles"
import { normalizePhone } from "@/lib/utils/text"
import { ok, fail, requireAdmin, parseBody } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

/** Определяет текстовую роль пользователя. */
function roleOf(u: { isSuperuser: boolean; isStaff: boolean }): "admin" | "staff" | "user" {
  if (u.isSuperuser) return "admin"
  if (u.isStaff) return "staff"
  return "user"
}

/** Генерирует читаемый временный пароль. */
function generatePassword(): string {
  // 9 символов из base64url без похожих символов — легко продиктовать.
  return randomBytes(9)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .replace(/[0OoIl1]/g, "x")
    .slice(0, 10)
}

function serializeStaff(u: {
  id: number
  phone: string
  firstName: string
  isSuperuser: boolean
  isStaff: boolean
  isActive: boolean
  createdAt: Date
}, lockedPhones: Set<string>) {
  return {
    id: u.id,
    phone: u.phone,
    first_name: u.firstName,
    role: roleOf(u),
    is_active: u.isActive,
    // Роль задана через env и не может быть изменена из панели.
    locked: lockedPhones.has(u.phone),
    created_at: u.createdAt.toISOString(),
  }
}

// GET — список всех сотрудников и администраторов.
export async function GET() {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const rows = await db
    .select()
    .from(appUser)
    .where(or(eq(appUser.isStaff, true), eq(appUser.isSuperuser, true)))
    .orderBy(desc(appUser.isSuperuser), desc(appUser.createdAt))

  const locked = new Set<string>([...getAdminPhones(), ...getStaffPhones()])
  return ok(rows.map((r) => serializeStaff(r, locked)))
}

// POST — назначить нового сотрудника/админа. Если пользователь с таким телефоном
// уже есть — повышаем его роль, иначе создаём аккаунт с заданным/сгенерированным паролём.
export async function POST(req: Request) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const body = await parseBody(req)
  const firstName = String(body.first_name ?? "").trim()
  let phone = String(body.phone ?? "").trim()
  const role = String(body.role ?? "staff") === "admin" ? "admin" : "staff"
  let password = String(body.password ?? "").trim()

  if (!phone) return fail("Укажите номер телефона.")
  phone = normalizePhone(phone)

  const isSuperuser = role === "admin"
  const isStaff = true

  // Пароль: заданный админом или автоматически сгенерированный (показывается один раз).
  if (password && password.length < 8) {
    return fail("Пароль должен быть не менее 8 символов.")
  }
  if (!password) password = generatePassword()
  const passwordHash = await hashPassword(password)

  const [existing] = await db.select().from(appUser).where(eq(appUser.phone, phone)).limit(1)

  let saved
  if (existing) {
    ;[saved] = await db
      .update(appUser)
      .set({
        isStaff,
        isSuperuser,
        isActive: true,
        // Имя обновляем, только если передано.
        ...(firstName ? { firstName } : {}),
        // Пароль перезаписываем всегда (админ назначает доступ заново).
        passwordHash,
      })
      .where(eq(appUser.id, existing.id))
      .returning()
  } else {
    ;[saved] = await db
      .insert(appUser)
      .values({
        phone,
        firstName: firstName || "Сотрудник",
        passwordHash,
        isActive: true,
        isPhoneVerified: true,
        isStaff,
        isSuperuser,
      })
      .returning()
  }

  const locked = new Set<string>([...getAdminPhones(), ...getStaffPhones()])
  // Возвращаем пароль ОДИН раз, чтобы админ мог передать его сотруднику.
  return ok({ staff: serializeStaff(saved, locked), password }, 201)
}
