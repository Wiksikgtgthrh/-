import { NextResponse } from "next/server"
import type { SessionUser } from "@/lib/auth/session"

export function ok(data: unknown, init?: number) {
  const status = init ?? 200
  // Ответ со статусом 204/304 не может содержать тело — иначе рантайм падает
  // с 500. Возвращаем пустой ответ (используется во всех DELETE-роутах).
  if (status === 204 || status === 304) {
    return new NextResponse(null, { status })
  }
  return NextResponse.json(data, { status })
}

export function fail(detail: string, statusCode = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ detail, ...(extra || {}) }, { status: statusCode })
}

export type UserPublic = {
  id: number
  phone: string
  first_name: string
  email: string
  email_verified: boolean
  is_superuser: boolean
  is_staff: boolean
  telegram_chat_id: number | null
}

export function userPublic(u: {
  id: number
  phone: string
  firstName: string
  email: string
  emailVerified: boolean
  isSuperuser: boolean
  isStaff: boolean
  telegramChatId: number | null
}): UserPublic {
  return {
    id: u.id,
    phone: u.phone,
    first_name: u.firstName,
    email: u.email,
    email_verified: u.emailVerified,
    is_superuser: u.isSuperuser,
    is_staff: u.isStaff,
    telegram_chat_id: u.telegramChatId,
  }
}

export function requireAdmin(user: SessionUser | null) {
  if (!user) return fail("Требуется авторизация.", 401)
  if (!user.isSuperuser) return fail("Доступ запрещён. Требуются права администратора.", 403)
  return null
}

export function requireStaff(user: SessionUser | null) {
  if (!user) return fail("Требуется авторизация.", 401)
  if (!user.isStaff && !user.isSuperuser) return fail("Доступ запрещён. Требуются права сотрудника.", 403)
  return null
}

export type ParsedBody = Record<string, unknown>

/**
 * Универсальный разбор тела запроса. Фронтенд шлёт либо JSON,
 * либо multipart/form-data (когда есть файлы). Повторяющиеся ключи
 * (например nutrition_per_100g) собираются в массив, File сохраняется как есть.
 */
export async function parseBody(req: Request): Promise<ParsedBody> {
  const ct = req.headers.get("content-type") || ""
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData()
    const out: ParsedBody = {}
    for (const key of new Set(form.keys())) {
      const all = form.getAll(key)
      out[key] = all.length > 1 ? all : all[0]
    }
    return out
  }
  try {
    return (await req.json()) as ParsedBody
  } catch {
    return {}
  }
}

/** Приводит значение из формы/JSON к boolean. */
export function toBool(v: unknown, fallback = false): boolean {
  if (v === undefined || v === null || v === "") return fallback
  if (typeof v === "boolean") return v
  const s = String(v).toLowerCase()
  return s === "true" || s === "1" || s === "on" || s === "yes"
}

/** Приводит значение к числу или null. */
export function toNumOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null
  const n = Number(String(v).replace(",", "."))
  return Number.isFinite(n) ? n : null
}
