import type { NextRequest } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { disabledFeature } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeDisabledFeature } from "@/lib/serializers"

// Публичный список: сайт и админка используют его, чтобы скрывать отключённые
// страницы/вкладки. Возвращаем все записи (и включённые, и выключенные).
export async function GET() {
  const rows = await db.select().from(disabledFeature)
  return ok(rows.map(serializeDisabledFeature))
}

// Upsert состояния фичи (только админ)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const body = await req.json()
  const key = String(body.key || "").trim()
  const featureType = String(body.feature_type || "page")
  if (!key) return fail("Не указан ключ фичи.")
  const isDisabled = Boolean(body.is_disabled)
  const label = String(body.label || "")

  const existing = await db
    .select()
    .from(disabledFeature)
    .where(and(eq(disabledFeature.key, key), eq(disabledFeature.featureType, featureType)))
    .limit(1)

  let row
  if (existing[0]) {
    const updated = await db
      .update(disabledFeature)
      .set({ isDisabled, label: label || existing[0].label, updatedAt: new Date() })
      .where(eq(disabledFeature.id, existing[0].id))
      .returning()
    row = updated[0]
  } else {
    const inserted = await db
      .insert(disabledFeature)
      .values({ key, featureType, label, isDisabled })
      .returning()
    row = inserted[0]
  }
  return ok(serializeDisabledFeature(row))
}
