import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { menuColumnConfig } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { getMenuColumns, isValidMenuField, DEFAULT_MENU_COLUMNS, type MenuFieldKey } from "@/lib/menu-columns"

function serialize(cols: Awaited<ReturnType<typeof getMenuColumns>>) {
  return cols.map((c) => ({
    field: c.field,
    label: c.label,
    aliases: c.aliases,
    order: c.order,
    enabled: c.enabled,
    required: c.required,
  }))
}

// Список колонок с действующими настройками (по умолчанию + сохранённые).
export async function GET() {
  const cols = await getMenuColumns()
  return ok(serialize(cols))
}

// Полное сохранение конфигурации колонок.
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  const items = Array.isArray(body?.columns) ? body.columns : null
  if (!items) return fail("Ожидается массив columns.")

  const requiredFields = new Set(DEFAULT_MENU_COLUMNS.filter((c) => c.required).map((c) => c.field))

  const rows = items
    .filter((it: { field?: string }): it is { field: MenuFieldKey } & typeof it =>
      Boolean(it.field && isValidMenuField(it.field)),
    )
    .map((it: { field: MenuFieldKey; label?: string; aliases?: unknown; order?: number; enabled?: boolean }, idx: number) => {
      const aliases = Array.isArray(it.aliases)
        ? it.aliases.map((a) => String(a).trim()).filter(Boolean).join(", ")
        : String(it.aliases ?? "").trim()
      return {
        field: it.field,
        label: String(it.label ?? "").trim(),
        aliases,
        displayOrder: Number.isFinite(it.order) ? Number(it.order) : idx,
        // Обязательные колонки всегда включены.
        isEnabled: requiredFields.has(it.field) ? true : it.enabled !== false,
        updatedAt: new Date(),
      }
    })

  if (!rows.length) return fail("Нет корректных колонок для сохранения.")

  for (const row of rows) {
    await db
      .insert(menuColumnConfig)
      .values(row)
      .onConflictDoUpdate({
        target: menuColumnConfig.field,
        set: {
          label: row.label,
          aliases: row.aliases,
          displayOrder: row.displayOrder,
          isEnabled: row.isEnabled,
          updatedAt: row.updatedAt,
        },
      })
  }

  const cols = await getMenuColumns()
  return ok(serialize(cols))
}
