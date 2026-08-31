import { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { sitePopup } from "@/lib/db/schema"
import { fail, ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { uploadFile } from "@/lib/upload"

export async function GET() {
  const rows = await db.select().from(sitePopup).where(eq(sitePopup.id, 1)).limit(1)
  return ok(rows[0] ?? null)
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const form = await req.formData()
  const file = form.get("image")
  const current = await db.select().from(sitePopup).where(eq(sitePopup.id, 1)).limit(1)
  let imageUrl = String(form.get("imageUrl") || current[0]?.imageUrl || "")
  if (file instanceof File && file.size > 0) imageUrl = (await uploadFile(file, "popup")) || imageUrl

  const values = {
    enabled: form.get("enabled") === "true",
    imageUrl,
    title: String(form.get("title") || "").trim(),
    body: String(form.get("body") || "").trim(),
    primaryLabel: String(form.get("primaryLabel") || "").trim(),
    primaryUrl: String(form.get("primaryUrl") || "").trim(),
    secondaryLabel: String(form.get("secondaryLabel") || "").trim(),
    secondaryUrl: String(form.get("secondaryUrl") || "").trim(),
    initialDelaySeconds: Math.max(0, Number(form.get("initialDelaySeconds") || 0)),
    repeatAfterMinutes: Math.max(1, Number(form.get("repeatAfterMinutes") || 1)),
    updatedAt: new Date(),
  }
  if (!values.title || !values.body) return fail("Заполните заголовок и текст.")

  const rows = current[0]
    ? await db.update(sitePopup).set(values).where(eq(sitePopup.id, 1)).returning()
    : await db.insert(sitePopup).values({ id: 1, ...values }).returning()
  return ok(rows[0])
}
