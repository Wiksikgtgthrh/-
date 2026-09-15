import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { broadcast } from "@/lib/db/schema"
import { ok, fail, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { botClient, botConfigured, BotError } from "@/lib/bot-client"

const TITLE_STYLE_TAG: Record<string, [string, string]> = {
  bold: ["<b>", "</b>"],
  italic: ["<i>", "</i>"],
  underline: ["<u>", "</u>"],
}

function renderTitle(title: string, titleStyle: string): string {
  if (!title) return ""
  const tag = TITLE_STYLE_TAG[titleStyle]
  return tag ? `${tag[0]}${title}${tag[1]}` : title
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied
  if (!botConfigured()) {
    return fail("Бот не настроен: задайте BOT_SERVICE_URL и BOT_SERVICE_API_KEY.", 400)
  }

  const { id } = await params
  const rows = await db.select().from(broadcast).where(eq(broadcast.id, Number(id))).limit(1)
  const b = rows[0]
  if (!b) return fail("Рассылка не найдена.", 404)

  // Отправку выполняет бот: он знает подписчиков и ходит в Telegram через прокси.
  try {
    const res = await botClient.broadcast({
      title: renderTitle(b.title, b.titleStyle),
      text: b.text,
      image_url: b.imageUrl || undefined,
      parse_mode: "HTML",
    })

    await db
      .update(broadcast)
      .set({ isSent: true, sentAt: new Date(), sentCount: res.sent_count })
      .where(eq(broadcast.id, b.id))

    const errors: string[] = []
    if (res.total === 0) errors.push("У бота нет подписчиков — никто не запустил бота через /start.")
    else if (res.failed_count > 0) errors.push(`Не доставлено: ${res.failed_count}.`)

    return ok({
      success: true,
      sent_count: res.sent_count,
      failed_count: res.failed_count,
      total: res.total,
      errors,
    })
  } catch (e) {
    const status = e instanceof BotError ? e.status : 502
    return fail(e instanceof Error ? e.message : "Бот недоступен.", status)
  }
}
