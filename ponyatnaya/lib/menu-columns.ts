import { asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { menuColumnConfig } from "@/lib/db/schema"

/**
 * Канонический ключ поля блюда (соответствует полю в базе данных).
 * Эти ключи фиксированы — меняются только заголовки, синонимы, порядок и видимость.
 */
export type MenuFieldKey =
  | "category"
  | "subcategory"
  | "name_with_weight"
  | "price"
  | "composition"
  | "protein_per_100g"
  | "fat_per_100g"
  | "carbs_per_100g"
  | "calories_per_100g"
  | "is_available"

export interface MenuColumnDef {
  field: MenuFieldKey
  /** Русский заголовок, который выводится в шаблоне Excel. */
  label: string
  /** Дополнительные названия, которые распознаёт импорт (кроме заголовка и ключа). */
  aliases: string[]
  /** Порядок колонки в файле. */
  order: number
  /** Показывать ли колонку в шаблоне/экспорте. */
  enabled: boolean
  /** Обязательное поле — нельзя скрыть (Название, Цена, Категория). */
  required: boolean
}

/** Значения по умолчанию — исходный жёстко заданный формат. */
export const DEFAULT_MENU_COLUMNS: MenuColumnDef[] = [
  { field: "category", label: "Категория", aliases: [], order: 0, enabled: true, required: true },
  { field: "subcategory", label: "Подкатегория", aliases: [], order: 1, enabled: true, required: false },
  { field: "name_with_weight", label: "Название", aliases: [], order: 2, enabled: true, required: true },
  { field: "price", label: "Цена", aliases: [], order: 3, enabled: true, required: true },
  { field: "composition", label: "Состав", aliases: [], order: 4, enabled: true, required: false },
  { field: "protein_per_100g", label: "Белки", aliases: [], order: 5, enabled: true, required: false },
  { field: "fat_per_100g", label: "Жиры", aliases: [], order: 6, enabled: true, required: false },
  { field: "carbs_per_100g", label: "Углеводы", aliases: [], order: 7, enabled: true, required: false },
  { field: "calories_per_100g", label: "Калории", aliases: [], order: 8, enabled: true, required: false },
  { field: "is_available", label: "Доступно", aliases: [], order: 9, enabled: true, required: false },
]

const DEFAULT_BY_FIELD = new Map(DEFAULT_MENU_COLUMNS.map((c) => [c.field, c]))
const VALID_FIELDS = new Set(DEFAULT_MENU_COLUMNS.map((c) => c.field))

export function isValidMenuField(field: string): field is MenuFieldKey {
  return VALID_FIELDS.has(field as MenuFieldKey)
}

function parseAliases(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Возвращает действующую конфигурацию колонок: значения по умолчанию,
 * поверх которых наложены сохранённые в базе настройки. Отсортировано по порядку.
 */
export async function getMenuColumns(): Promise<MenuColumnDef[]> {
  const saved = await db.select().from(menuColumnConfig).orderBy(asc(menuColumnConfig.displayOrder))
  const savedByField = new Map(saved.map((s) => [s.field, s]))

  const merged = DEFAULT_MENU_COLUMNS.map((def) => {
    const row = savedByField.get(def.field)
    if (!row) return { ...def }
    return {
      ...def,
      label: row.label?.trim() || def.label,
      aliases: parseAliases(row.aliases || ""),
      order: row.displayOrder,
      // Обязательные колонки всегда включены, даже если в базе стоит false.
      enabled: def.required ? true : row.isEnabled,
    }
  })

  merged.sort((a, b) => a.order - b.order)
  return merged
}

/**
 * Строит карту «нормализованное название → ключ поля» для распознавания
 * колонок при импорте. Учитывает ключ, русский заголовок по умолчанию,
 * пользовательский заголовок и все синонимы.
 */
export function buildHeaderLookup(columns: MenuColumnDef[]): Map<string, MenuFieldKey> {
  const lookup = new Map<string, MenuFieldKey>()
  const add = (name: string, field: MenuFieldKey) => {
    const key = name.trim().toLowerCase()
    if (key) lookup.set(key, field)
  }
  for (const col of columns) {
    add(col.field, col.field)
    const def = DEFAULT_BY_FIELD.get(col.field)
    if (def) add(def.label, col.field)
    add(col.label, col.field)
    for (const alias of col.aliases) add(alias, col.field)
  }
  return lookup
}
