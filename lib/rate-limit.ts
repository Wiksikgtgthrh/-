import "server-only"

/**
 * Простой in-memory rate limiter для защиты эндпоинтов от перебора.
 * Не требует внешнего хранилища; для одного инстанса сервера этого достаточно.
 * Ключ — произвольная строка (например, IP + маршрут).
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

/** Периодически чистим протухшие бакеты, чтобы карта не росла бесконечно. */
let lastSweep = Date.now()
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/**
 * Проверяет и учитывает запрос. Возвращает true, если лимит превышен.
 * @param key    уникальный ключ (IP + маршрут)
 * @param limit  сколько запросов разрешено за окно
 * @param windowMs  размер окна в миллисекундах
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(now)
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  bucket.count++
  return bucket.count > limit
}

/** Извлекает IP запроса (за прокси смотрим x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}
