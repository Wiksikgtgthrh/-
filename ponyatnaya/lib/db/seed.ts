import { Pool } from "pg"
import { existsSync } from "fs"
import { config as loadDotenv } from "dotenv"
import { resolve } from "path"

// Загружаем .env файлы если DATABASE_URL не передан снаружи
if (!process.env.DATABASE_URL) {
  const envFiles = [
    ".env.development.local",
    ".env.local",
    ".env.production.local",
    ".env",
  ]
  const root = resolve(__dirname, "../..")
  for (const f of envFiles) {
    const p = resolve(root, f)
    if (existsSync(p)) {
      loadDotenv({ path: p })
      break
    }
  }
}

const DB_URL = process.env.DATABASE_URL
if (!DB_URL) throw new Error("DATABASE_URL is not set")

const pool = new Pool({ connectionString: DB_URL })

const CATEGORIES = [
  { name: "Завтраки", slug: "zavtraki",  image: "/images/categories/zavtraki.png",  show_in_slider: true, slider_order: 1 },
  { name: "Супы",     slug: "supy",      image: "/images/categories/supy.png",      show_in_slider: true, slider_order: 2 },
  { name: "Горячие блюда",  slug: "goryachee", image: "/images/categories/goryachee.png", show_in_slider: true, slider_order: 3 },
  { name: "Салаты",   slug: "salaty",    image: "/images/categories/salaty.png",    show_in_slider: true, slider_order: 4 },
  { name: "Гарниры",  slug: "garniry",   image: "/images/categories/garniry.png",   show_in_slider: true, slider_order: 5 },
  { name: "Лимонады",  slug: "limonady",   image: "/images/categories/napitki.png",   show_in_slider: true, slider_order: 6 },
]

const LEGAL_DOCUMENTS = [
  {
    slug: "privacy-policy",
    title: "Политика конфиденциальности",
    content: "Настоящая политика описывает обработку персональных данных, которые посетитель предоставляет при оформлении заказа. Мы используем имя, телефон, email и адрес только для связи с клиентом, обработки и исполнения заказа. Оформляя заказ, клиент соглашается на обработку указанных данных в соответствии с законодательством Российской Федерации.\n\nОператор: ИП Бодров Сергей Юрьевич. ИНН: 732603950300. ОГРНИП: 31773250013295. Юридический адрес: 432044, г. Ульяновск, ул. Хрустальная, д. 28, кв. 20.\n\nПо вопросам обработки персональных данных можно обратиться по контактам, указанным на сайте.",
    display_order: 1,
  },
  {
    slug: "delivery-terms",
    title: "Условия доставки и оплаты",
    content: "Доставка оформляется через страницу ресторана «Понятная Еда» на Яндекс.Еде, если на сайте выбран режим «Яндекс.Еда». При выборе локального режима заказ оформляется через корзину сайта.\n\nЗоны доставки, доступность, стоимость и время доставки зависят от выбранного способа и сообщаются до подтверждения заказа. Оплата банковской картой на сайте выполняется через защищённую платёжную страницу ЮKassa. Данные банковской карты не передаются и не хранятся на сайте.\n\nЗаказ считается оплаченным после подтверждения платежа платёжной системой.",
    display_order: 2,
  },
  {
    slug: "offer",
    title: "Публичная оферта",
    content: "ПУБЛИЧНАЯ ОФЕРТА НА ОКАЗАНИЕ УСЛУГ ОБЩЕСТВЕННОГО ПИТАНИЯ И ДОСТАВКИ\n\nОператор: ИП Бодров Сергей Юрьевич. ИНН: 732603950300. ОГРНИП: 31773250013295. Адрес: 432044, г. Ульяновск, ул. Хрустальная, д. 28, кв. 20.\n\n1. Общие положения\nНастоящий документ является предложением заключить договор на приготовление и передачу продукции общественного питания и её доставку. Оформляя заказ на сайте, покупатель подтверждает, что ознакомился с условиями и принимает их.\n\n2. Заказ и оплата\nЗаказ формируется из выбранных блюд, их количества, стоимости доставки и иных отображённых в корзине условий. Договор считается заключённым после подтверждения заказа исполнителем. Оплата банковской картой проводится через платёжный сервис ЮKassa. Данные карты не хранятся на сайте.\n\n3. Доставка и получение\nСрок, адрес, стоимость и возможность доставки сообщаются до подтверждения заказа. При получении рекомендуется проверить комплектность, наименование и состояние заказа.\n\n4. Отмена и возврат\nПо вопросам отмены заказа, возврата денежных средств, недовоза или ненадлежащего качества покупатель обращается по контактам на сайте с указанием номера заказа. Возврат осуществляется в случаях и порядке, предусмотренных законодательством Российской Федерации.\n\n5. Реквизиты\nИП Бодров Сергей Юрьевич, ИНН 732603950300, ОГРНИП 31773250013295, адрес: 432044, г. Ульяновск, ул. Хрустальная, д. 28, кв. 20.",
    display_order: 3,
  },
]

const PRODUCTS = [
  {
    name: "Сырники со сметаной", weight: "250 г", slug: "syrniki-so-smetanoy",
    price: 320, image: "/images/products/syrniki.png",
    composition: "Творог, яйцо, мука, сахар, сметана",
    allergens: "Молоко, яйцо, глютен",
    additives: "Нет",
    shelf_life: "24 часа",
    storage_conditions: "0…+6 °C",
    regulatory_documents: "Технологическая карта блюда",
    protein: 12.5, fat: 9.2, carbs: 28, calories: 240,
    category_slug: "zavtraki",
  },
  {
    name: "Борщ с говядиной", weight: "350 г", slug: "borsch-s-govyadinoy",
    price: 290, image: "/images/products/borsch.png",
    composition: "Говядина, свёкла, капуста, картофель, морковь",
    allergens: "Нет заявленных аллергенов",
    additives: "Нет",
    shelf_life: "24 часа",
    storage_conditions: "0…+6 °C",
    regulatory_documents: "Технологическая карта блюда",
    protein: 6.8, fat: 4.5, carbs: 72, calories: 95,
    category_slug: "supy",
  },
  {
    name: "Куриное филе гриль", weight: "300 г", slug: "kurinoe-file-gril",
    price: 430, image: "/images/products/chicken-grill.png",
    composition: "Куриное филе, кабачок, перец, специи",
    allergens: "Возможны следы сельдерея",
    additives: "Нет",
    shelf_life: "24 часа",
    storage_conditions: "0…+6 °C",
    regulatory_documents: "Технологическая карта блюда",
    protein: 22, fat: 8, carbs: 6.5, calories: 180,
    category_slug: "goryachee",
  },
  {
    name: "Цезарь с курицей", weight: "220 г", slug: "tsezar-s-kuricey",
    price: 380, image: "/images/products/caesar.png",
    composition: "Салат романо, куриное филе, пармезан, соус цезарь",
    allergens: "Молоко, яйцо, горчица, глютен",
    additives: "Нет",
    shelf_life: "12 часов",
    storage_conditions: "0…+6 °C",
    regulatory_documents: "Технологическая карта блюда",
    protein: 14, fat: 16, carbs: 8, calories: 220,
    category_slug: "salaty",
  },
]

export async function seed(force = false) {
  const client = await pool.connect()
  try {
    // Миграция названий категорий для уже существующей локальной базы.
    // Меняем подписи и slug, сохраняя связанные товары по их category_id.
  await client.query(`
      UPDATE category
      SET name = 'Горячие блюда'
      WHERE slug = 'goryachee'
  `)
  for (const zone of [
    ['center', 'Центр города', 199, 0],
    ['district', 'Спальный район', 299, 0],
    ['outskirts', 'Пригород', 399, 1500],
  ]) await client.query(`INSERT INTO delivery_zone (slug, name, price, min_order_amount, is_active, display_order) VALUES ($1,$2,$3,$4,true,$5) ON CONFLICT (slug) DO NOTHING`, [...zone, 0])
    await client.query(`
      UPDATE category
      SET name = 'Гарниры', slug = 'garniry', image = '/images/categories/garniry.png'
      WHERE slug = 'deserty'
    `)
    await client.query(`
      UPDATE category
      SET name = 'Лимонады', slug = 'limonady', image = '/images/categories/napitki.png'
      WHERE slug = 'napitki'
    `)

    for (const doc of LEGAL_DOCUMENTS) {
      if (doc.slug === "offer") {
        await client.query(
          `DELETE FROM legal_document
           WHERE lower(title) LIKE '%публичн%оферт%' AND slug <> 'offer'`,
        )
      }
      await client.query(
        `INSERT INTO legal_document (slug, title, content, is_published, display_order)
         VALUES ($1, $2, $3, true, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [doc.slug, doc.title, doc.content, doc.display_order],
      )
    }

    // Проверяем есть ли уже данные
    const { rows: existingCats } = await client.query("SELECT COUNT(*) as cnt FROM category")
    const catCount = parseInt(existingCats[0].cnt, 10)

    if (catCount > 0 && !force) {
      console.log(`[seed] Категории уже есть (${catCount} шт.), пропускаем.`)
      return
    }

    if (force) {
      await client.query("DELETE FROM product WHERE slug = ANY($1)", [PRODUCTS.map(p => p.slug)])
      await client.query("DELETE FROM category WHERE slug = ANY($1)", [CATEGORIES.map(c => c.slug)])
    }

    // Вставляем категории
    const catIdMap: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO category (name, slug, image, show_in_slider, slider_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET name=$1, image=$3, show_in_slider=$4, slider_order=$5
         RETURNING id`,
        [cat.name, cat.slug, cat.image, cat.show_in_slider, cat.slider_order]
      )
      catIdMap[cat.slug] = rows[0].id
      console.log(`[seed] Категория: ${cat.name} (id=${rows[0].id})`)
    }

    // Вставляем продукты
    for (const p of PRODUCTS) {
      const catId = catIdMap[p.category_slug] ?? null
      await client.query(
        `INSERT INTO product
           (name_with_weight, slug, price, image, composition, allergens, additives,
            shelf_life, storage_conditions, regulatory_documents,
            protein_per_100g, fat_per_100g, carbs_per_100g, calories_per_100g,
            category_id, is_available)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
          ON CONFLICT (slug) DO UPDATE
            SET name_with_weight=$1, price=$3, image=$4, composition=$5,
                allergens=$6, additives=$7, shelf_life=$8, storage_conditions=$9,
                regulatory_documents=$10, protein_per_100g=$11, fat_per_100g=$12,
                carbs_per_100g=$13, calories_per_100g=$14, category_id=$15`,
         [`${p.name} ${p.weight}`, p.slug, p.price, p.image, p.composition,
          p.allergens, p.additives, p.shelf_life, p.storage_conditions,
          p.regulatory_documents, p.protein, p.fat, p.carbs, p.calories, catId]
      )
      console.log(`[seed] Продукт: ${p.name}`)
    }

    console.log("[seed] Готово!")
  } finally {
    client.release()
  }
}

// Запуск напрямую: node_modules/.bin/tsx lib/db/seed.ts [--force]
// process.argv[1] всегда содержит путь к этому файлу при прямом запуске через tsx
if (process.argv[1]?.includes("seed")) {
  seed(process.argv.includes("--force"))
    .then(() => { pool.end(); process.exit(0) })
    .catch(e => { console.error(e); pool.end(); process.exit(1) })
}
