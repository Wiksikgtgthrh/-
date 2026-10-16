import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Montserrat, Montserrat_Alternates } from "next/font/google"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
})

const montserratAlternates = Montserrat_Alternates({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat-alternates",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ponyatnayaeda.ru"),
  title: {
    default: "Понятная еда — доставка честной еды в Ульяновске",
    template: "%s — Понятная еда",
  },
  description: "Свежие блюда с полным составом и КБЖУ. Доставка на дом и заказ в заведении.",
  keywords: ["доставка еды Ульяновск", "кафе Ульяновск", "меню с КБЖУ", "понятная еда", "заказать еду"],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Понятная еда",
    title: "Понятная еда — доставка честной еды в Ульяновске",
    description: "Свежие блюда с полным составом и КБЖУ. Доставка на дом и заказ в заведении.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#dc2626",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`light bg-white ${montserrat.variable} ${montserratAlternates.variable}`}>
      <body className="antialiased font-montserrat">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
