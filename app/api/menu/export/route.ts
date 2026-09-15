import type { NextRequest } from "next/server"
import { asc } from "drizzle-orm"
import * as XLSX from "xlsx"
import { db } from "@/lib/db"
import { product, category, subcategory } from "@/lib/db/schema"
import { fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { getMenuColumns, type MenuFieldKey } from "@/lib/menu-columns"

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const format = req.nextUrl.searchParams.get("format") || "xlsx"
  const columns = (await getMenuColumns()).filter((c) => c.enabled)

  const products = await db.select().from(product).orderBy(asc(product.id))
  const cats = await db.select().from(category)
  const subs = await db.select().from(subcategory)
  const catById = new Map(cats.map((c) => [c.id, c.name]))
  const subById = new Map(subs.map((s) => [s.id, s.name]))

  // Значение блюда по каноническому ключу поля.
  const valueOf = (p: (typeof products)[number], field: MenuFieldKey): string | number => {
    switch (field) {
      case "category":
        return p.categoryId ? catById.get(p.categoryId) || "" : ""
      case "subcategory":
        return p.subcategoryId ? subById.get(p.subcategoryId) || "" : ""
      case "name_with_weight":
        return p.nameWithWeight
      case "price":
        return Number(p.price)
      case "composition":
        return p.composition || ""
      case "allergens":
        return p.allergens || ""
      case "additives":
        return p.additives || ""
      case "shelf_life":
        return p.shelfLife || ""
      case "storage_conditions":
        return p.storageConditions || ""
      case "regulatory_documents":
        return p.regulatoryDocuments || ""
      case "protein_per_100g":
        return Number(p.proteinPer100g)
      case "fat_per_100g":
        return Number(p.fatPer100g)
      case "carbs_per_100g":
        return Number(p.carbsPer100g)
      case "calories_per_100g":
        return Number(p.caloriesPer100g)
      case "is_available":
        return p.isAvailable ? 1 : 0
      default:
        return ""
    }
  }

  // Строки с ключами = пользовательские заголовки колонок.
  const headers = columns.map((c) => c.label)
  const rows = products.map((p) => {
    const row: Record<string, string | number> = {}
    for (const col of columns) row[col.label] = valueOf(p, col.field)
    return row
  })

  if (format === "json") {
    // В JSON отдаём по каноническим ключам + описание колонок.
    const jsonRows = products.map((p) => {
      const row: Record<string, string | number> = {}
      for (const col of columns) row[col.field] = valueOf(p, col.field)
      return row
    })
    const body = {
      columns: columns.map((c) => ({ field: c.field, label: c.label })),
      products: jsonRows,
    }
    return new Response(JSON.stringify(body, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="menu-export.json"',
      },
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Меню")
  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="menu-export.xlsx"',
    },
  })
}
