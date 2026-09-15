import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { dishOfTheDay, product } from "@/lib/db/schema"
import { serializeProduct } from "@/lib/serializers"

export async function getActiveDish() {
  const rows = await db
    .select()
    .from(dishOfTheDay)
    .where(eq(dishOfTheDay.isActive, true))
    .orderBy(desc(dishOfTheDay.createdAt))
    .limit(1)
  const dish = rows[0]
  if (!dish) return null
  const prods = await db.select().from(product).where(eq(product.id, dish.productId)).limit(1)
  if (!prods[0]) return null
  return {
    id: String(dish.id),
    product: serializeProduct(prods[0]),
    old_price: dish.oldPrice != null ? Number(dish.oldPrice) : undefined,
    sale_price: dish.salePrice != null ? Number(dish.salePrice) : undefined,
    active_from: dish.activeFrom ? dish.activeFrom.toISOString() : undefined,
    active_until: dish.activeUntil ? dish.activeUntil.toISOString() : undefined,
    is_active: dish.isActive,
  }
}
