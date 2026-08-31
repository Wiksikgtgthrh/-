import "server-only"
import { normalizePhone } from "@/lib/utils/text"

/**
 * Роли, заданные через переменные окружения:
 *   ADMIN_PHONES — телефоны администраторов (is_superuser + is_staff)
 *   STAFF_PHONES — телефоны сотрудников (is_staff)
 * Номера перечисляются через запятую в любом формате (нормализуются к +7XXXXXXXXXX).
 */
function parsePhones(raw: string | undefined): Set<string> {
  const set = new Set<string>()
  if (!raw) return set
  for (const part of raw.split(/[,;\s]+/)) {
    const trimmed = part.trim()
    if (trimmed) set.add(normalizePhone(trimmed))
  }
  return set
}

export function getAdminPhones(): Set<string> {
  return parsePhones(process.env.ADMIN_PHONES)
}

export function getStaffPhones(): Set<string> {
  return parsePhones(process.env.STAFF_PHONES)
}

export type EnvRole = { isSuperuser: boolean; isStaff: boolean }

/**
 * Возвращает роль для телефона на основе env-списков.
 * Админ имеет приоритет над сотрудником.
 */
export function roleForPhone(phone: string): EnvRole {
  const normalized = normalizePhone(phone)
  if (getAdminPhones().has(normalized)) return { isSuperuser: true, isStaff: true }
  if (getStaffPhones().has(normalized)) return { isSuperuser: false, isStaff: true }
  return { isSuperuser: false, isStaff: false }
}

export function getStaffPassword(): string {
  return process.env.STAFF_PASSWORD || ""
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || ""
}

/**
 * Проверяет вход по учётным данным из .env.
 * Если номер указан в ADMIN_PHONES и пароль совпадает с ADMIN_PASSWORD — доступ администратора.
 * Если номер указан в STAFF_PHONES и пароль совпадает с STAFF_PASSWORD — доступ сотрудника.
 * Иначе — null (env-вход не разрешён).
 */
export function envCredentialRole(phone: string, password: string): EnvRole | null {
  const normalized = normalizePhone(phone)
  const adminPw = getAdminPassword()
  if (adminPw && getAdminPhones().has(normalized) && password === adminPw) {
    return { isSuperuser: true, isStaff: true }
  }
  const staffPw = getStaffPassword()
  if (staffPw && getStaffPhones().has(normalized) && password === staffPw) {
    return { isSuperuser: false, isStaff: true }
  }
  return null
}
