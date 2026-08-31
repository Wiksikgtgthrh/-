import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { ok, fail, requireStaff } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeOrder } from "@/lib/serializers"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireStaff(user)
  if (denied) return denied
  const { id } = await params
  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if (body.status != null) patch.status = String(body.status)
  const updated = await db.update(appOrder).set(patch).where(eq(appOrder.id, Number(id))).returning()
  if (!updated[0]) return fail("Заказ не найден.", 404)
  return ok(serializeOrder(updated[0], []))
}
