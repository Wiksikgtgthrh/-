import { and, gte, notInArray, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"
import { ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET() {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

  const todays = await db.select().from(appOrder).where(gte(appOrder.createdAt, startOfDay))
  const statusCounts: Record<string, number> = {}
  let todayRevenue = 0
  let ordersThisHour = 0
  for (const o of todays) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    if (o.status === "completed") todayRevenue += Number(o.totalPrice)
    if (o.createdAt && o.createdAt >= startOfHour) ordersThisHour++
  }

  const active = todays.filter((o) => !["completed", "cancelled"].includes(o.status)).length
  const newCount = statusCounts["new"] || 0

  return ok({
    orders_today: todays.length,
    active_orders: active,
    new_orders: newCount,
    orders_this_hour: ordersThisHour,
    today_revenue: String(todayRevenue),
    status_counts: statusCounts,
  })
}
