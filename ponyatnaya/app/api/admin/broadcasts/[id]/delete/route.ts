import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { broadcast } from "@/lib/db/schema"
import { ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const { id } = await params
  await db.delete(broadcast).where(eq(broadcast.id, Number(id)))
  return ok({ success: true, message: "Рассылка удалена." })
}
