import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/session"

const DEFAULTS = {
  phone: "+7 (842) 123-45-67",
  hours_weekdays: "8:00–21:00",
  hours_weekends: "9:00–21:00",
  delivery_mode: "yandex",
  delivery_url: "https://eda.yandex.ru/r/ponatnaa_plan_restaurant?placeSlug=ponyatnaya_plan",
  delivery_phone: "+7 (842) 123-45-67",
  delivery_contact_url: "",
}

// GET /api/admin/settings — публичный (для Header, Footer, О нас)
export async function GET() {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1)
    const row = rows[0]
    if (!row) {
      return NextResponse.json(DEFAULTS)
    }
    return NextResponse.json({
      phone: row.phone,
      hours_weekdays: row.hoursWeekdays,
      hours_weekends: row.hoursWeekends,
      delivery_mode: row.deliveryMode,
      delivery_url: row.deliveryUrl,
      delivery_phone: row.deliveryPhone,
      delivery_contact_url: row.deliveryContactUrl,
    })
  } catch {
    return NextResponse.json(DEFAULTS)
  }
}

// PUT /api/admin/settings — только для стаффа
export async function PUT(req: Request) {
  let user
  try {
    user = await getCurrentUser()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сессии"
    console.log("[v0] getCurrentUser error:", msg)
    return NextResponse.json({ error: "Ошибка сервера: " + msg }, { status: 500 })
  }

  if (!user || !user.isStaff) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { phone, hours_weekdays, hours_weekends, delivery_mode, delivery_url, delivery_phone, delivery_contact_url } = body as Record<string, string>

    if (!phone?.trim() || !hours_weekdays?.trim() || !hours_weekends?.trim()) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 })
    }

    const values = {
      id: 1,
      phone: phone.trim(),
      hoursWeekdays: hours_weekdays.trim(),
      hoursWeekends: hours_weekends.trim(),
      deliveryMode: delivery_mode === "local" ? "local" : "yandex",
      deliveryUrl: delivery_url?.trim() || DEFAULTS.delivery_url,
      deliveryPhone: delivery_phone?.trim() || phone.trim(),
      deliveryContactUrl: delivery_contact_url?.trim() || "",
      updatedAt: new Date(),
    }

    await db
      .insert(siteSettings)
      .values(values)
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          phone: values.phone,
          hoursWeekdays: values.hoursWeekdays,
          hoursWeekends: values.hoursWeekends,
          deliveryMode: values.deliveryMode,
          deliveryUrl: values.deliveryUrl,
          deliveryPhone: values.deliveryPhone,
          deliveryContactUrl: values.deliveryContactUrl,
          updatedAt: values.updatedAt,
        },
      })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Ошибка сервера"
    console.log("[v0] PUT /api/admin/settings error:", msg, e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
