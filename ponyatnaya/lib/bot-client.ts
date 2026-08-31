/**
 * Клиент внешнего Telegram-бота.
 *
 * Сайт из РФ не может напрямую обращаться к api.telegram.org, поэтому весь обмен
 * с Telegram идёт через бота (он ходит в Telegram через SOCKS5-прокси).
 * Здесь — тонкая обёртка над HTTP API бота.
 *
 * Требуются переменные окружения проекта:
 *   BOT_SERVICE_URL     — адрес бота, например https://bot.ponyatnayaeda.ru
 *   BOT_SERVICE_API_KEY — общий секрет (на боте это API_SECRET)
 */

const BASE = (process.env.BOT_SERVICE_URL || "").replace(/\/$/, "")
const KEY = process.env.BOT_SERVICE_API_KEY || ""

export function botConfigured(): boolean {
  return Boolean(BASE && KEY)
}

class BotError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.status = status
  }
}

async function call<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  timeoutMs = 15000,
): Promise<T> {
  if (!botConfigured()) {
    throw new BotError("Бот не настроен: задайте BOT_SERVICE_URL и BOT_SERVICE_API_KEY.", 503)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    })
    const data = (await res.json().catch(() => ({}))) as T & { error?: string }
    if (!res.ok) {
      throw new BotError((data as { error?: string })?.error || `Бот вернул HTTP ${res.status}`, res.status)
    }
    return data as T
  } catch (e) {
    if (e instanceof BotError) throw e
    if (e instanceof Error && e.name === "AbortError") {
      throw new BotError("Бот не ответил (таймаут). Проверьте, что бот запущен и доступен.", 504)
    }
    throw new BotError(
      e instanceof Error ? `Не удалось связаться с ботом: ${e.message}` : "Не удалось связаться с ботом.",
    )
  } finally {
    clearTimeout(timer)
  }
}

export interface BotHealth {
  status: string
  bot_username: string
  subscribers: number
  pending_registrations: number
  proxy_enabled: boolean
}

export interface BotRegistrationInit {
  telegram_link: string
  token: string
  expires_in: number
}

export interface BotRegistrationStatus {
  success: boolean
  status: "pending" | "completed" | "expired"
  phone: string
  chat_id: number | null
  first_name: string
}

export interface BotBroadcastResult {
  success: boolean
  sent_count: number
  failed_count: number
  total: number
}

export const botClient = {
  health: () => call<BotHealth>("GET", "/health"),
  initiateRegistration: (phone: string) =>
    call<BotRegistrationInit>("POST", "/api/initiate-registration", { phone }),
  checkRegistration: (token: string) =>
    call<BotRegistrationStatus>("GET", `/api/check-registration/${encodeURIComponent(token)}`),
  broadcast: (payload: { title?: string; text: string; image_url?: string; parse_mode?: string }) =>
    call<BotBroadcastResult>("POST", "/api/broadcast-to-all", payload, 120000),
  sendMessage: (payload: { chat_ids: number[]; text: string; parse_mode?: string }) =>
    call<{ success: boolean; sent_count: number; failed_count: number }>(
      "POST",
      "/api/send-message",
      payload,
    ),
}

export { BotError }
