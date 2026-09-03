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
