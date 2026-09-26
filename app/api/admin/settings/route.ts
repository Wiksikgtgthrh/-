import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db, ensureSiteSettingsColumns } from "@/lib/db"
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
  delivery_address: "432017, г. Ульяновск, ул. Железной Дивизии, д. 7",
  delivery_zone_note: "Доставляем по г. Ульяновску и пригороду в пределах 15 км от адреса заведения.",
  delivery_enabled: true,
}

// GET /api/admin/settings — публичный (для Header, Footer, О нас)
export async function GET() {
  try {
    await ensureSiteSettingsColumns()
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
      delivery_address: row.deliveryAddress || DEFAULTS.delivery_address,
      delivery_zone_note: row.deliveryZoneNote || DEFAULTS.delivery_zone_note,
      delivery_enabled: row.deliveryEnabled !== false,
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
    await ensureSiteSettingsColumns()
    const body = await req.json()
    const { phone, hours_weekdays, hours_weekends, delivery_mode, delivery_url, delivery_phone, delivery_contact_url, delivery_address, delivery_zone_note, delivery_enabled } = body as Record<string, string | boolean>

    const phoneStr = String(phone ?? "").trim()
    const weekdaysStr = String(hours_weekdays ?? "").trim()
    const weekendsStr = String(hours_weekends ?? "").trim()

    if (!phoneStr || !weekdaysStr || !weekendsStr) {
      return NextResponse.json({ error: "Телефон и режим работы обязательны" }, { status: 400 })
    }

    const values = {
      id: 1,
      phone: phoneStr,
      hoursWeekdays: weekdaysStr,
      hoursWeekends: weekendsStr,
      deliveryMode: delivery_mode === "local" ? "local" : "yandex",
      deliveryUrl: String(delivery_url ?? "").trim() || DEFAULTS.delivery_url,
      deliveryPhone: String(delivery_phone ?? "").trim() || phoneStr,
      deliveryContactUrl: String(delivery_contact_url ?? "").trim() || "",
      deliveryAddress: String(delivery_address ?? "").trim() || DEFAULTS.delivery_address,
      deliveryZoneNote: String(delivery_zone_note ?? "").trim() || DEFAULTS.delivery_zone_note,
      deliveryEnabled: delivery_enabled !== false && delivery_enabled !== "false",
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
          deliveryAddress: values.deliveryAddress,
          deliveryZoneNote: values.deliveryZoneNote,
          deliveryEnabled: values.deliveryEnabled,
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
