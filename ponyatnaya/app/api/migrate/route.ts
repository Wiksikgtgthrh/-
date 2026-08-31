import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"

// Защищённый эндпоинт для применения миграций через HTTPS (без TCP/5432).
// Используется на хостингах, которые блокируют исходящий TCP на порт 5432.
//
// Вызвать после деплоя:
//   curl -X POST https://yourdomain.com/api/migrate \
//        -H "X-Migrate-Secret: <MIGRATE_SECRET>"

export async function POST(req: Request) {
  const secret = process.env.MIGRATE_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "Переменная MIGRATE_SECRET не задана на сервере" },
      { status: 500 },
    )
  }

  const incoming = req.headers.get("x-migrate-secret")
  if (incoming !== secret) {
    return NextResponse.json({ error: "Неверный секрет" }, { status: 403 })
  }

  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) {
    return NextResponse.json(
      { error: "DATABASE_URL / DATABASE_URL_UNPOOLED не задан" },
      { status: 500 },
    )
  }

  try {
    const sql = neon(url)
    const db = drizzle(sql)

    // Читает SQL-файлы из ./drizzle/ и применяет через HTTPS — порт 443, не 5432
    await migrate(db, { migrationsFolder: "./drizzle" })

    return NextResponse.json({ ok: true, message: "Миграции применены успешно" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
