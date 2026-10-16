import type { MetadataRoute } from "next"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { product, promotion, legalDocument } from "@/lib/db/schema"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ponyatnayaeda.ru"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/delivery`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/promotions`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/custom-order`, changeFrequency: "monthly", priority: 0.6 },
  ]

  let productPages: MetadataRoute.Sitemap = []
  let promotionPages: MetadataRoute.Sitemap = []
  let documentPages: MetadataRoute.Sitemap = []

  try {
    const products = await db
      .select({ slug: product.slug })
      .from(product)
      .where(eq(product.isAvailable, true))
    productPages = products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    const promotions = await db.select({ slug: promotion.slug }).from(promotion)
    promotionPages = promotions.map((p) => ({
      url: `${SITE_URL}/promotions/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))

    const docs = await db
      .select({ slug: legalDocument.slug, updatedAt: legalDocument.updatedAt })
      .from(legalDocument)
      .where(eq(legalDocument.isPublished, true))
    documentPages = docs.map((d) => ({
      url: `${SITE_URL}/documents/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    }))
  } catch {
    // БД недоступна (например, во время локальной сборки) — только статика.
  }

  return [...staticPages, ...productPages, ...promotionPages, ...documentPages]
}
