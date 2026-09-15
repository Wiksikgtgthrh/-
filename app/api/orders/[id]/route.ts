import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { ok, fail, requireStaff } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeOrder } from "@/lib/serializers"

const ALLOWED_ORDER_STATUSES = new Set([
  "new",
  "awaiting_payment",
  "paid",
  "confirmed",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireStaff(user)
  if (denied) return denied
  const { id } = await params
  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if (body.status != null) {
    const status = String(body.status)
    if (!ALLOWED_ORDER_STATUSES.has(status)) return fail("Недопустимый статус заказа.")
    patch.status = status
  }
  const updated = await db.update(appOrder).set(patch).where(eq(appOrder.id, Number(id))).returning()
  if (!updated[0]) return fail("Заказ не найден.", 404)
  return ok(serializeOrder(updated[0], []))
}
