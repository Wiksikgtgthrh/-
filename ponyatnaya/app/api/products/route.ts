import type { NextRequest } from "next/server"
import { and, desc, eq, ilike } from "drizzle-orm"
import { db } from "@/lib/db"
import { product } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeProduct } from "@/lib/serializers"
import { slugify } from "@/lib/utils/text"
import { uploadFile } from "@/lib/upload"

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const filters = []
  // Публичный каталог по умолчанию отдаёт только доступные товары
  if (sp.get("available") === "1") filters.push(eq(product.isAvailable, true))
  const cat = sp.get("category")
  if (cat) filters.push(eq(product.categoryId, Number(cat)))
  const sub = sp.get("subcategory")
  if (sub) filters.push(eq(product.subcategoryId, Number(sub)))
  const promo = sp.get("promotion")
  if (promo) filters.push(eq(product.promotionId, Number(promo)))
  const search = sp.get("search")
  if (search) filters.push(ilike(product.nameWithWeight, `%${search}%`))

  const rows = await db
    .select()
    .from(product)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(product.createdAt))
  return ok(rows.map(serializeProduct))
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const form = await req.formData()
  const nameWithWeight = String(form.get("name_with_weight") || "").trim()
  if (!nameWithWeight) return fail("Укажите название товара.")
  const categoryId = Number(form.get("category")) || null
  // Категория - опциональное поле

  const nutritionRaw = form.getAll("nutrition_per_100g").map((x) => Number(x))
  const [protein, fat, carbs, calories] = [
    nutritionRaw[0] || 0,
    nutritionRaw[1] || 0,
    nutritionRaw[2] || 0,
    nutritionRaw[3] || 0,
  ]

  const imageFile = form.get("image")
  let imageUrl = ""
  if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = (await uploadFile(imageFile, "products")) || ""
  }

  const subVal = form.get("subcategory")
  const promoVal = form.get("promotion")

  const inserted = await db
    .insert(product)
    .values({
      nameWithWeight,
      slug: `${slugify(nameWithWeight)}-${Date.now().toString(36)}`,
      price: String(Number(form.get("price") || 0)),
      image: imageUrl,
      isAvailable: form.get("is_available") !== "false",
      composition: String(form.get("composition") || ""),
      proteinPer100g: String(protein),
      fatPer100g: String(fat),
      carbsPer100g: String(carbs),
      caloriesPer100g: String(calories),
      categoryId: categoryId ? Number(categoryId) : null,
      subcategoryId: subVal ? Number(subVal) : null,
      promotionId: promoVal ? Number(promoVal) : null,
    })
    .returning()
  return ok(serializeProduct(inserted[0]), 201)
}
