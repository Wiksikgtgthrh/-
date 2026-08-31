import type { NextRequest } from "next/server"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { promotion } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializePromotion } from "@/lib/serializers"
import { slugify } from "@/lib/utils/text"
import { uploadFile } from "@/lib/upload"

export async function GET() {
  const rows = await db.select().from(promotion).orderBy(desc(promotion.createdAt))
  return ok(rows.map(serializePromotion))
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  const form = await req.formData()
  const name = String(form.get("name") || "").trim()
  if (!name) return fail("Укажите название акции.")

  async function up(field: string, folder: string) {
    const f = form.get(field)
    if (f instanceof File && f.size > 0) return (await uploadFile(f, folder)) || ""
    return ""
  }

  const endDate = form.get("end_date")
  const inserted = await db
    .insert(promotion)
    .values({
      name,
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      description: String(form.get("description") || ""),
      conditions: String(form.get("conditions") || ""),
      terms: String(form.get("terms") || ""),
      pdfLinkText: String(form.get("pdf_link_text") || ""),
      image: await up("image", "promotions"),
      bannerImage: await up("banner_image", "promotions"),
      pdfFile: await up("pdf_file", "promotions"),
      endDate: endDate ? new Date(String(endDate)) : null,
    })
    .returning()
  return ok(serializePromotion(inserted[0]), 201)
}
