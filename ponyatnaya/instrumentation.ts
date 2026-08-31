export async function register() {
  // Выполняется один раз при старте сервера (Node.js runtime, не Edge)
  // На PM2/VPS NEXT_RUNTIME может не быть — поэтому проверяем оба варианта
  const isNode =
    process.env.NEXT_RUNTIME === "nodejs" ||
    (typeof process !== "undefined" && typeof window === "undefined" && !process.env.NEXT_RUNTIME)

  if (isNode) {
    try {
      const { seed } = await import("./lib/db/seed")
      await seed()
    } catch (e) {
      console.error("[instrumentation] seed failed:", e)
    }
  }
}
