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

const PRODUCTS = [
  {
    name: "Сырники со сметаной", weight: "250 г", slug: "syrniki-so-smetanoy",
    price: 320, image: "/images/products/syrniki.png",
    composition: "Творог, яйцо, мука, сахар, сметана",
    protein: 12.5, fat: 9.2, carbs: 28, calories: 240,
    category_slug: "zavtraki",
  },
  {
    name: "Борщ с говядиной", weight: "350 г", slug: "borsch-s-govyadinoy",
    price: 290, image: "/images/products/borsch.png",
    composition: "Говядина, свёкла, капуста, картофель, морковь",
    protein: 6.8, fat: 4.5, carbs: 72, calories: 95,
    category_slug: "supy",
  },
  {
    name: "Куриное филе гриль", weight: "300 г", slug: "kurinoe-file-gril",
    price: 430, image: "/images/products/chicken-grill.png",
    composition: "Куриное филе, кабачок, перец, специи",
    protein: 22, fat: 8, carbs: 6.5, calories: 180,
    category_slug: "goryachee",
  },
  {
    name: "Цезарь с курицей", weight: "220 г", slug: "tsezar-s-kuricey",
    price: 380, image: "/images/products/caesar.png",
    composition: "Салат романо, куриное филе, пармезан, соус цезарь",
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
           (name_with_weight, slug, price, image, composition,
            protein_per_100g, fat_per_100g, carbs_per_100g, calories_per_100g,
            category_id, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         ON CONFLICT (slug) DO UPDATE
           SET name_with_weight=$1, price=$3, image=$4, composition=$5,
               protein_per_100g=$6, fat_per_100g=$7, carbs_per_100g=$8,
               calories_per_100g=$9, category_id=$10`,
        [`${p.name} ${p.weight}`, p.slug, p.price, p.image, p.composition,
         p.protein, p.fat, p.carbs, p.calories, catId]
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
