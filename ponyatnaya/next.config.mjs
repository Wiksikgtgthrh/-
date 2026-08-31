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
  // Включает instrumentation.ts — автосид при каждом cold start сервера
  experimental: {
    instrumentationHook: true,
  },
}

export default nextConfig
