import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import Spa from "@/src/spa-client"
import { db } from "@/lib/db"
import { product, promotion, legalDocument } from "@/lib/db/schema"

// Все клиентские маршруты (кроме /api и статики) отдают SPA,
// а react-router разбирает путь на стороне клиента.
// Мета-теги и JSON-LD при этом генерируются на сервере — для SEO
// и превью ссылок в соцсетях/мессенджерах.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ponyatnayaeda.ru"
const SITE_NAME = "Понятная еда"

// Кэш маршрута: метаданные товаров/акций обновляются раз в 15 минут.
export const revalidate = 900

const STATIC_META: Record<string, { title: string; description: string }> = {
  catalog: {
    title: `Меню — ${SITE_NAME}`,
    description: "Полное меню с составом и КБЖУ: гарниры, супы, горячие блюда, завтраки, салаты и напитки. Доставка по Ульяновску.",
  },
  about: {
    title: `О нас — ${SITE_NAME}`,
    description: "Понятная еда в самом центре Ульяновска: домашние блюда, свежая выпечка и честные составы.",
  },
  delivery: {
    title: `Доставка и оплата — ${SITE_NAME}`,
    description: "Условия доставки по Ульяновску: зоны, стоимость, способы оплаты и время приёма заказов.",
  },
  contacts: {
    title: `Контакты — ${SITE_NAME}`,
    description: "Контакты кафе «Понятная еда»: телефон, адрес, режим работы и карта.",
  },
  promotions: {
    title: `Акции — ${SITE_NAME}`,
    description: "Актуальные акции и специальные предложения кафе «Понятная еда».",
  },
  "custom-order": {
    title: `Торт на заказ — ${SITE_NAME}`,
    description: "Изготовление тортов и блюд на заказ в Ульяновске: выберите начинку, размер и оформление.",
  },
  cart: {
    title: `Корзина — ${SITE_NAME}`,
    description: "Ваш заказ в кафе «Понятная еда».",
  },
  account: {
    title: `Личный кабинет — ${SITE_NAME}`,
    description: "История заказов и настройки профиля.",
  },
}

interface RouteMeta {
  title?: string
  description?: string
  image?: string | null
  jsonLd?: Record<string, unknown> | null
}

async function resolveRouteMeta(segments: string[]): Promise<RouteMeta> {
  const [head, second] = segments

  if (head === "product" && second) {
    try {
      const rows = await db.select().from(product).where(eq(product.slug, second)).limit(1)
      const p = rows[0]
      if (p) {
        const description =
          (p.composition && `Состав: ${p.composition}`.slice(0, 300)) ||
          `${p.nameWithWeight} — заказать с доставкой по Ульяновску в кафе «Понятная еда».`
        const price = Number(p.price)
        return {
          title: `${p.nameWithWeight} — купить с доставкой | ${SITE_NAME}`,
          description,
          image: p.image,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.nameWithWeight,
            description,
            image: p.image ? [new URL(p.image, SITE_URL).toString()] : undefined,
            brand: { "@type": "Brand", name: SITE_NAME },
            offers: {
              "@type": "Offer",
              url: `${SITE_URL}/product/${p.slug}`,
              price: Number.isFinite(price) ? price.toFixed(2) : undefined,
              priceCurrency: "RUB",
              availability: p.isAvailable
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          },
        }
      }
    } catch {
      /* БД недоступна (например, при сборке) — отдаём заглушку ниже */
    }
  }

  if (head === "promotions" && second) {
    try {
      const rows = await db.select().from(promotion).where(eq(promotion.slug, second)).limit(1)
      const pr = rows[0]
      if (pr) {
        return {
          title: `${pr.name} — акция | ${SITE_NAME}`,
          description: (pr.description || "").slice(0, 300) || `Акция «${pr.name}» в кафе «Понятная еда».`,
          image: pr.image,
        }
      }
    } catch {
      /* то же */
    }
  }

  if (head === "documents" && second) {
    try {
      const rows = await db.select().from(legalDocument).where(eq(legalDocument.slug, second)).limit(1)
      const doc = rows[0]
      if (doc) {
        return {
          title: `${doc.title} — ${SITE_NAME}`,
          description: (doc.content || doc.title).replace(/<[^>]+>/g, " ").slice(0, 300),
        }
      }
    } catch {
      /* то же */
    }
  }

  const path = segments.join("/")
  const staticMeta = STATIC_META[path]
  if (staticMeta) return staticMeta

  return {}
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const segments = slug ?? []
  const meta = await resolveRouteMeta(segments)
  const image = meta.image ? new URL(meta.image, SITE_URL).toString() : undefined

  return {
    title: meta.title ?? `${SITE_NAME} — доставка честной еды`,
    description: meta.description,
    alternates: { canonical: `${SITE_URL}/${segments.join("/")}`.replace(/\/$/, "") || SITE_URL },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ru_RU",
      url: `${SITE_URL}/${segments.join("/")}`,
      title: meta.title,
      description: meta.description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: meta.title,
      description: meta.description,
    },
  }
}

export default async function CatchAll({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const segments = slug ?? []

  // Запросы к несуществующим файлам (картинки, favicon и т.п.) не должны
  // получать SPA-страницу с кодом 200 — это ломает <img> и плодит
  // «мягкие 404» в поисковой выдаче.
  if (segments.length > 0 && segments[segments.length - 1].includes(".")) {
    notFound()
  }

  const meta = await resolveRouteMeta(segments)

  return (
    <>
      {meta.jsonLd && (
        <script
          type="application/ld+json"
          // Данные из БД, сериализованы JSON.stringify — безопасно.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(meta.jsonLd) }}
        />
      )}
      <Spa />
    </>
  )
}
