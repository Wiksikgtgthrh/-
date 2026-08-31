import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { broadcast } from "@/lib/db/schema"
import { ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeBroadcast } from "@/lib/serializers"

export async function GET() {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const rows = await db.select().from(broadcast).orderBy(desc(broadcast.createdAt))
  return ok(rows.map(serializeBroadcast))
}
