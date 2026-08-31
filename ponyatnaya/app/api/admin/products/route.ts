import type { NextRequest } from "next/server"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { product } from "@/lib/db/schema"
import { ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeProduct } from "@/lib/serializers"

// GET /api/admin/products — все товары (включая недоступные), только для staff
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const rows = await db
    .select()
    .from(product)
    .orderBy(desc(product.createdAt))

  return ok(rows.map(serializeProduct))
}
