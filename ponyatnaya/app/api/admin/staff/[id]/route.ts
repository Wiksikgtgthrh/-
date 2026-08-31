import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { getAdminPhones, getStaffPhones } from "@/lib/auth/roles"
import { revokeAllTokens } from "@/lib/auth/session"
import { ok, fail, requireAdmin, parseBody } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

function roleOf(u: { isSuperuser: boolean; isStaff: boolean }): "admin" | "staff" | "user" {
  if (u.isSuperuser) return "admin"
  if (u.isStaff) return "staff"
  return "user"
}

function generatePassword(): string {
  return randomBytes(9)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .replace(/[0OoIl1]/g, "x")
    .slice(0, 10)
}

function serializeStaff(
  u: {
    id: number
    phone: string
    firstName: string
    isSuperuser: boolean
    isStaff: boolean
    isActive: boolean
    createdAt: Date
  },
  lockedPhones: Set<string>,
) {
  return {
    id: u.id,
    phone: u.phone,
    first_name: u.firstName,
    role: roleOf(u),
    is_active: u.isActive,
    locked: lockedPhones.has(u.phone),
    created_at: u.createdAt.toISOString(),
  }
}

function isLocked(phone: string): boolean {
  return new Set<string>([...getAdminPhones(), ...getStaffPhones()]).has(phone)
}

// PATCH — сменить роль и/или сбросить пароль сотрудника.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const { id } = await params
  const userId = Number(id)
  if (!Number.isFinite(userId)) return fail("Некорректный идентификатор.")

  const [target] = await db.select().from(appUser).where(eq(appUser.id, userId)).limit(1)
  if (!target) return fail("Сотрудник не найден.", 404)

  const body = await parseBody(req)
  const action = String(body.action ?? "")

  // Сотрудников/админов из env-списков нельзя менять из панели.
  if (isLocked(target.phone) && (action === "set_role" || action === "reset_password")) {
    return fail("Эта роль задана через переменные окружения и не может быть изменена в панели.", 403)
  }

  const locked = new Set<string>([...getAdminPhones(), ...getStaffPhones()])

  if (action === "set_role") {
    const role = String(body.role ?? "")
    if (!["admin", "staff", "user"].includes(role)) return fail("Некорректная роль.")
    // Нельзя снять роль с самого себя, чтобы не потерять доступ.
    if (target.id === user!.id && role !== "admin") {
      return fail("Нельзя изменить собственную роль администратора.", 400)
    }
    const [updated] = await db
      .update(appUser)
      .set({
        isSuperuser: role === "admin",
        isStaff: role === "admin" || role === "staff",
      })
      .where(eq(appUser.id, userId))
      .returning()
    return ok({ staff: serializeStaff(updated, locked) })
  }

  if (action === "reset_password") {
    let password = String(body.password ?? "").trim()
    if (password && password.length < 8) return fail("Пароль должен быть не менее 8 символов.")
    if (!password) password = generatePassword()
    const passwordHash = await hashPassword(password)
    const [updated] = await db
      .update(appUser)
      .set({ passwordHash })
      .where(eq(appUser.id, userId))
      .returning()
    // Сбрасываем активные сессии сотрудника — старый пароль больше не действует.
    await revokeAllTokens(userId)
    return ok({ staff: serializeStaff(updated, locked), password })
  }

  return fail("Неизвестное действие.")
}

// DELETE — снять сотрудника с должности (роль -> обычный пользователь, аккаунт сохраняется).
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const { id } = await params
  const userId = Number(id)
  if (!Number.isFinite(userId)) return fail("Некорректный идентификатор.")

  const [target] = await db.select().from(appUser).where(eq(appUser.id, userId)).limit(1)
  if (!target) return fail("Сотрудник не найден.", 404)

  if (target.id === user!.id) return fail("Нельзя снять с должности самого себя.", 400)
  if (isLocked(target.phone)) {
    return fail("Эта роль задана через переменные окружения и не может быть снята в панели.", 403)
  }

  await db
    .update(appUser)
    .set({ isStaff: false, isSuperuser: false })
    .where(eq(appUser.id, userId))
  // Снимаем активные сессии — доступ к панели прекращается сразу.
  await revokeAllTokens(userId)
  return ok(null, 204)
}
