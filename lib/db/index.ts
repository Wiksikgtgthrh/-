import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is not set"
  )
}

const pool = new Pool({ connectionString })

export const db = drizzle(pool, { schema })

let siteSettingsColumnsReady: Promise<void> | null = null
/** Лёгкая миграция полей доставки в site_settings (без пересоздания таблицы). */
export function ensureSiteSettingsColumns() {
  if (!siteSettingsColumnsReady) {
    siteSettingsColumnsReady = pool.query(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS delivery_address text NOT NULL DEFAULT '432017, г. Ульяновск, ул. Железной Дивизии, д. 7';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS delivery_zone_note text NOT NULL DEFAULT 'Доставляем по г. Ульяновску и пригороду в пределах 15 км от адреса заведения.';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS delivery_enabled boolean NOT NULL DEFAULT true;
    `).then(() => undefined).catch((error) => {
      siteSettingsColumnsReady = null
      throw error
    })
  }
  return siteSettingsColumnsReady
}

let productColumnsReady: Promise<void> | null = null
export function ensureProductComplianceColumns() {
  if (!productColumnsReady) {
    productColumnsReady = pool.query(`
      ALTER TABLE product ADD COLUMN IF NOT EXISTS allergens text DEFAULT '' NOT NULL;
      ALTER TABLE product ADD COLUMN IF NOT EXISTS additives text DEFAULT '' NOT NULL;
      ALTER TABLE product ADD COLUMN IF NOT EXISTS shelf_life text DEFAULT '' NOT NULL;
      ALTER TABLE product ADD COLUMN IF NOT EXISTS storage_conditions text DEFAULT '' NOT NULL;
      ALTER TABLE product ADD COLUMN IF NOT EXISTS regulatory_documents text DEFAULT '' NOT NULL;
    `).then(() => undefined).catch((error) => {
      productColumnsReady = null
      throw error
    })
  }
  return productColumnsReady
}

export { schema }
