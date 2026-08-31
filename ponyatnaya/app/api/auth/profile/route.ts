import { eq, and, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/session"
import { normalizePhone } from "@/lib/utils/text"
import { ok, fail, userPublic } from "@/lib/api"

export async function PATCH(req: Request) {
  const current = await getCurrentUser()
  if (!current) return fail("Требуется авторизация.", 401)

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (typeof body.first_name === "string") updates.firstName = body.first_name.trim()
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Введите корректный email.")
    updates.email = email
    updates.emailVerified = false
    updates.emailVerificationToken = null
    updates.emailVerificationExpires = null
  }
  if (typeof body.phone === "string" && body.phone.trim()) {
    const phone = normalizePhone(body.phone)
    const clash = await db
      .select({ id: appUser.id })
      .from(appUser)
      .where(and(eq(appUser.phone, phone), ne(appUser.id, current.id)))
      .limit(1)
    if (clash.length) return fail("Этот номер уже используется.")
    updates.phone = phone
  }

  if (Object.keys(updates).length === 0) return ok(userPublic(current))

  const [updated] = await db.update(appUser).set(updates).where(eq(appUser.id, current.id)).returning()
  return ok(userPublic(updated))
}
