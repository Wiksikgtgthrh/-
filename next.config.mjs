/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // pg не должен бандловаться Next.js — он должен брать нативные бинарники из node_modules
  serverExternalPackages: ["pg", "pg-native"],
  // instrumentation.ts работает по умолчанию в Next 16 — автосид при cold start
  // Базовые security-заголовки: clickjacking, MIME-sniffing, рефререр,
  // разграничение фич браузера. CSP не ставим — сломает инлайновые стили
  // Tailwind и платёжный редирект ЮKassa; HSTS включается на HTTPS-прокси.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self \"https://yoomoney.ru\")",
          },
        ],
      },
    ]
  },
}

export default nextConfig
