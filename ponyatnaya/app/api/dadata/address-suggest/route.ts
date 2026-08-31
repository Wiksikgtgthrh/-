import type { NextRequest } from "next/server"
import { ok } from "@/lib/api"

// Проксирует подсказки адресов из DaData (если задан DADATA_API_KEY), иначе пусто.
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim()
  const key = process.env.DADATA_API_KEY
  if (!query || query.length < 3 || !key) return ok({ suggestions: [] })

  try {
    const res = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${key}`,
      },
      body: JSON.stringify({ query, count: 7 }),
    })
    if (!res.ok) return ok({ suggestions: [] })
    const data = await res.json()
    const suggestions = (data?.suggestions || []).map((s: { value: string }) => s.value)
    return ok({ suggestions })
  } catch {
    return ok({ suggestions: [] })
  }
}
