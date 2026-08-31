import type { NextRequest } from "next/server"
import { and, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { ok, requireStaff } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { count } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireStaff(user)
  if (denied) return denied
  const filters = [eq(appOrder.status, "new")]
  const since = req.nextUrl.searchParams.get("since")
  if (since) {
    const d = new Date(since)
    if (!isNaN(d.getTime())) filters.push(gt(appOrder.createdAt, d))
  }
  const res = await db.select({ c: count() }).from(appOrder).where(and(...filters))
  return ok({ count: Number(res[0]?.c || 0) })
}
