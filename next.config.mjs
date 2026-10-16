/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Не раскрывать технологию в заголовках (базовая гигиена).
  poweredByHeader: false,
  // Оптимизация изображений на сервере (sharp): AVIF/WebP + ресайз под
  // фактический размер + кэш. Карточки товаров раньше грузили исходные
  // PNG по ~2 МБ; теперь через /_next/image отдают десятки КБ.
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [96, 256, 384],
    qualities: [65, 70, 75, 80, 85],
    // Загруженные файлы имеют уникальные имена (timestamp), поэтому
    // содержимое по URL никогда не меняется — кэшируем надолго.
    minimumCacheTTL: 86400,
  },
  experimental: {
    // lucide-react: не тянуть все иконки в бандл.
    optimizePackageImports: ["lucide-react"],
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
      {
        // Загрузки админа: имена файлов уникальны (timestamp+random) —
        // содержимое неизменяемо, кэшируем в браузере навсегда.
        // Раньше отдавалось с max-age=0 и перегружалось каждый визит.
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Статика из репозитория: может обновляться деплоем при том же
        // имени — кэш на сутки.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ]
  },
}

export default nextConfig
