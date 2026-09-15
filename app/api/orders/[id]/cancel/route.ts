import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeOrder } from "@/lib/serializers"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { id } = await params
  const updated = await db
    .update(appOrder)
    .set({ status: "cancelled" })
    .where(eq(appOrder.id, Number(id)))
    .returning()
  if (!updated[0]) return fail("Заказ не найден.", 404)
  return ok(serializeOrder(updated[0], []))
}
