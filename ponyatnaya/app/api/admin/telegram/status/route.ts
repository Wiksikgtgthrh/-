import type { NextRequest } from "next/server"
import { ok, requireAdmin } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth/session"
import { botClient, botConfigured, BotError } from "@/lib/bot-client"

/**
 * Диагностика связки «сайт → бот → Telegram».
 * Сайт не ходит в Telegram напрямую: он опрашивает бота по HTTP,
 * а бот сам подключён к Telegram через прокси.
 */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser()
  const denied = requireAdmin(user)
  if (denied) return denied

  if (!botConfigured()) {
    return ok({
      configured: false,
      reachable: false,
      error: "Не заданы BOT_SERVICE_URL и/или BOT_SERVICE_API_KEY.",
      bot_username: "",
      subscribers: 0,
      proxy_enabled: false,
      pending_registrations: 0,
    })
  }

  try {
    const h = await botClient.health()
    return ok({
      configured: true,
      reachable: true,
      error: "",
      bot_username: h.bot_username,
      subscribers: h.subscribers,
      proxy_enabled: h.proxy_enabled,
      pending_registrations: h.pending_registrations,
    })
  } catch (e) {
    return ok({
      configured: true,
      reachable: false,
      error: e instanceof BotError ? e.message : e instanceof Error ? e.message : "Бот недоступен.",
      bot_username: "",
      subscribers: 0,
      proxy_enabled: false,
      pending_registrations: 0,
    })
  }
}
