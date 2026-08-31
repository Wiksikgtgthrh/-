import type { NextRequest } from "next/server"
import { eq, notInArray } from "drizzle-orm"
import * as XLSX from "xlsx"
import { db } from "@/lib/db"
import { product, category, subcategory } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { slugify } from "@/lib/utils/text"
import { getMenuColumns, buildHeaderLookup, type MenuFieldKey } from "@/lib/menu-columns"

type Row = Record<string, unknown>

function toNum(v: unknown): number {
  if (v == null || v === "") return 0
  const n = Number(String(v).replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v
  const s = String(v ?? "").trim().toLowerCase()
  return ["1", "true", "да", "yes", "y", "+"].includes(s)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const form = await req.formData()
  const file = form.get("file")
  const mode = form.get("mode") === "replace" ? "replace" : "merge"
  if (!(file instanceof File) || file.size === 0) return fail("Прикрепите файл меню (Excel или JSON).")

  const buf = Buffer.from(await file.arrayBuffer())
  let rows: Row[] = []
  const name = file.name.toLowerCase()
  try {
    if (name.endsWith(".json")) {
      const parsed = JSON.parse(buf.toString("utf-8"))
      rows = Array.isArray(parsed) ? parsed : parsed.products || []
    } else {
      const wb = XLSX.read(buf, { type: "buffer" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" })
    }
  } catch {
    return fail("Не удалось прочитать файл. Проверьте формат.")
  }
  if (!rows.length) return fail("Файл не содержит строк с блюдами.")

  // Действующая конфигурация колонок: распознаём заголовки по ключу,
  // русскому названию, пользовательскому заголовку и синонимам.
  const columns = await getMenuColumns()
  const headerLookup = buildHeaderLookup(columns)

  // Приводим каждую строку к каноническим ключам полей.
  const normalized: Array<Partial<Record<MenuFieldKey, unknown>>> = rows.map((r) => {
    const out: Partial<Record<MenuFieldKey, unknown>> = {}
    for (const [rawKey, value] of Object.entries(r)) {
      const field = headerLookup.get(rawKey.trim().toLowerCase())
      if (field && out[field] === undefined) out[field] = value
    }
    return out
  })

  const validationErrors = normalized.flatMap((row, index) => {
    const missing: string[] = []
    if (!String(row.category ?? "").trim()) missing.push("категория")
    if (!String(row.name_with_weight ?? "").trim()) missing.push("название")
    if (row.price == null || String(row.price).trim() === "") missing.push("цена")
    return missing.length ? [`Строка ${index + 2}: отсутствует ${missing.join(", ")}.`] : []
  })
  if (mode === "replace" && validationErrors.length) {
    return fail(`Замена отменена: исправьте обязательные поля. ${validationErrors.slice(0, 5).join(" ")}`)
  }

  // Кеш категорий/подкатегорий по имени, чтобы не плодить дубликаты
  const cats = await db.select().from(category)
  const catByName = new Map(cats.map((c) => [c.name.trim().toLowerCase(), c]))
  const subs = await db.select().from(subcategory)
  const subByKey = new Map(subs.map((s) => [`${s.categoryId}:${s.name.trim().toLowerCase()}`, s]))

  async function ensureCategory(nameRaw: string) {
    const key = nameRaw.trim().toLowerCase()
    if (!key) return null
    const found = catByName.get(key)
    if (found) return found
    const created = (
      await db
        .insert(category)
        .values({ name: nameRaw.trim(), slug: `${slugify(nameRaw)}-${Date.now().toString(36)}` })
        .returning()
    )[0]
    catByName.set(key, created)
    return created
  }

  async function ensureSubcategory(categoryId: number, nameRaw: string) {
    const key = `${categoryId}:${nameRaw.trim().toLowerCase()}`
    if (!nameRaw.trim()) return null
    const found = subByKey.get(key)
    if (found) return found
    const created = (
      await db
        .insert(subcategory)
        .values({ categoryId, name: nameRaw.trim(), slug: `${slugify(nameRaw)}-${Date.now().toString(36)}` })
        .returning()
    )[0]
    subByKey.set(key, created)
    return created
  }

  let created = 0
  let updated = 0
  let deactivated = 0
  const importedProductIds: number[] = []
  const errors: string[] = [...validationErrors]

  for (let i = 0; i < normalized.length; i++) {
    const r = normalized[i]
    const nameWithWeight = String(r.name_with_weight ?? "").trim()
    const catName = String(r.category ?? "").trim()
    if (!nameWithWeight || !catName || r.price == null || String(r.price).trim() === "") continue
    const cat = await ensureCategory(catName)
    if (!cat) {
      errors.push(`Строка ${i + 2}: не удалось создать категорию.`)
      continue
    }
    const subName = String(r.subcategory ?? "").trim()
    const sub = subName ? await ensureSubcategory(cat.id, subName) : null

    const values = {
      nameWithWeight,
      price: String(toNum(r.price)),
      composition: String(r.composition ?? ""),
      proteinPer100g: String(toNum(r.protein_per_100g)),
      fatPer100g: String(toNum(r.fat_per_100g)),
      carbsPer100g: String(toNum(r.carbs_per_100g)),
      caloriesPer100g: String(toNum(r.calories_per_100g)),
      isAvailable: r.is_available === "" || r.is_available == null ? true : toBool(r.is_available),
      categoryId: cat.id,
      subcategoryId: sub?.id ?? null,
    }

    // Обновляем существующее блюдо с тем же названием, иначе создаём новое
    const existing = await db
      .select()
      .from(product)
      .where(eq(product.nameWithWeight, nameWithWeight))
      .limit(1)
    if (existing[0]) {
      await db.update(product).set(values).where(eq(product.id, existing[0].id))
      importedProductIds.push(existing[0].id)
      updated++
    } else {
      const inserted = await db
        .insert(product)
        .values({ ...values, slug: `${slugify(nameWithWeight)}-${Date.now().toString(36)}-${i}` })
        .returning({ id: product.id })
      importedProductIds.push(inserted[0].id)
      created++
    }
  }

  // Историю заказов нельзя ломать физическим удалением товаров: позиции заказа
  // ссылаются на product.id. Поэтому «замена» делает отсутствующие в файле блюда
  // недоступными, а импортированные оставляет/возвращает в актуальное меню.
  if (mode === "replace" && importedProductIds.length) {
    const stale = await db
      .update(product)
      .set({ isAvailable: false })
      .where(notInArray(product.id, importedProductIds))
      .returning({ id: product.id })
    deactivated = stale.length
  }

  return ok({ success: true, mode, created, updated, deactivated, total: rows.length, errors })
}
