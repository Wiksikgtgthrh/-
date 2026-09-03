ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "allergens" text DEFAULT '' NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "additives" text DEFAULT '' NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "shelf_life" text DEFAULT '' NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "storage_conditions" text DEFAULT '' NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "regulatory_documents" text DEFAULT '' NOT NULL;

-- Оставляем одну каноническую запись оферты; устаревшие дубли скрываем.
DELETE FROM "legal_document"
WHERE lower("slug") IN ('public-offer', 'public_offer', 'publichnaya-oferta', 'oferta')
   OR (lower("title") LIKE '%публичн%оферт%' AND "slug" <> 'offer');
