import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { deliveryZone } from "@/lib/db/schema"
import { fail, ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET() {
  const rows = await db.select().from(deliveryZone).where(eq(deliveryZone.isActive, true)).orderBy(asc(deliveryZone.displayOrder))
  return ok(rows.map((z) => ({ id: z.slug, name: z.name, price: Number(z.price), min_order_amount: Number(z.minOrderAmount) })))
}

export async function PUT(req: Request) {
  const denied = requireAdmin(await getCurrentUser())
  if (denied) return denied
  const body = await req.json().catch(() => null)
  if (!Array.isArray(body?.zones)) return fail("Передайте список зон доставки.")
  const slugs: string[] = []
  for (let i = 0; i < body.zones.length; i++) {
    const item = body.zones[i]
    const name = String(item?.name || "").trim()
    const slug = String(item?.id || "").trim().toLowerCase()
    const price = Number(item?.price)
    const minOrderAmount = Number(item?.min_order_amount ?? 0)
    if (!name || !/^[a-z0-9-]+$/.test(slug) || !Number.isFinite(price) || price < 0 || !Number.isFinite(minOrderAmount) || minOrderAmount < 0) return fail(`Некорректные данные зоны в строке ${i + 1}.`)
    slugs.push(slug)
    await db.insert(deliveryZone).values({ name, slug, price: String(price), minOrderAmount: String(minOrderAmount), isActive: true, displayOrder: i }).onConflictDoUpdate({ target: deliveryZone.slug, set: { name, price: String(price), minOrderAmount: String(minOrderAmount), isActive: true, displayOrder: i } })
  }
  const existing = await db.select({ id: deliveryZone.id, slug: deliveryZone.slug }).from(deliveryZone)
  for (const row of existing) if (!slugs.includes(row.slug)) await db.update(deliveryZone).set({ isActive: false }).where(eq(deliveryZone.id, row.id))
  return ok({ success: true })
}
