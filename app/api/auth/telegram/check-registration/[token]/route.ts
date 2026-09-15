import { botClient, BotError } from "@/lib/bot-client"
import { ok, fail } from "@/lib/api"

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  try {
    const reg = await botClient.checkRegistration(token)
    return ok({
      status: reg.status,
      phone: reg.phone,
      chat_id: reg.chat_id,
      first_name: reg.first_name,
    })
  } catch (e) {
    if (e instanceof BotError && e.status === 404) {
      return fail("Токен не найден или истёк.", 404, { status: "expired" })
    }
    const status = e instanceof BotError ? e.status : 502
    return fail(e instanceof Error ? e.message : "Бот недоступен.", status)
  }
}
