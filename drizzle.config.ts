import type { Config } from "drizzle-kit"

/**
 * Конфигурация Drizzle Kit для создания/обновления таблиц на вашем Postgres.
 * Используется командой `npm run db:push` (см. DEPLOYMENT.md).
 *
 * ВАЖНО: Drizzle Kit требует прямого (direct) подключения к БД — без pgbouncer/pooler.
 * Neon предоставляет два URL:
 *   DATABASE_URL         — pooled (через pgbouncer), используется приложением
 *   DATABASE_URL_UNPOOLED — direct, используется только для миграций/db:push
 */
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Drizzle Kit зависает на pooled-соединении (pgbouncer).
    // Используем прямой URL: DATABASE_URL_UNPOOLED или DATABASE_URL без -pooler.
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!,
  },
} satisfies Config
