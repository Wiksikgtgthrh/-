import { ok, fail } from "@/lib/api"
import { getActiveDish } from "@/lib/dish"

export async function GET() {
  const dish = await getActiveDish()
  if (!dish) return fail("Блюдо дня не назначено.", 404)
  return ok(dish)
}
