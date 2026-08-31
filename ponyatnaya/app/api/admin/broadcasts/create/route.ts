import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { broadcast } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { serializeBroadcast } from "@/lib/serializers"
import { uploadFile } from "@/lib/upload"

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  const form = await req.formData()
  const text = String(form.get("text") || "").trim()
  if (!text) return fail("Введите текст рассылки.")
  let imageUrl = ""
  const img = form.get("image")
  if (img instanceof File && img.size > 0) imageUrl = (await uploadFile(img, "broadcasts")) || ""

  const inserted = await db
    .insert(broadcast)
    .values({
      title: String(form.get("title") || ""),
      titleStyle: String(form.get("title_style") || "bold"),
      text,
      imageUrl,
    })
    .returning()
  return ok(serializeBroadcast(inserted[0]), 201)
}
