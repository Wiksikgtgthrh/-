import { readFile, stat } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

/**
 * Раздача загруженных через админку файлов.
 *
 * Next.js в production индексирует папку public на старте: файл, загруженный
 * во время работы, отдаётся как 404 до перезапуска. Поэтому /uploads/*
 * переписывается сюда (см. rewrites в next.config.mjs) и читается с диска.
 */

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params
  if (!segments?.length) return new NextResponse("Not found", { status: 404 })
  if (segments.some((segment) => !segment || segment.startsWith("."))) {
    return new NextResponse("Not found", { status: 404 })
  }

  const uploadRoot = path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads"),
  )
  const target = path.resolve(uploadRoot, ...segments)
  // Защита от выхода за пределы папки загрузок.
  if (!target.startsWith(uploadRoot + path.sep)) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const info = await stat(target)
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 })

    const ext = path.extname(target).toLowerCase()
    const body = await readFile(target)
    const isSvg = ext === ".svg"
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        // Имена файлов уникальны (timestamp+random) — содержимое неизменяемо.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ...(isSvg ? { "Content-Security-Policy": "default-src 'none'; sandbox" } : {}),
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}