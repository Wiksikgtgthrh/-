import { mkdir, writeFile } from "fs/promises"
import path from "path"

/**
 * Сохраняет файл (из multipart/form-data) на локальный диск сервера и возвращает
 * публичный URL. Возвращает null, если файл не передан.
 *
 * Хранилище настраивается через переменные окружения:
 *   UPLOAD_DIR         — папка на диске для файлов (по умолчанию ./public/uploads)
 *   UPLOAD_PUBLIC_BASE — базовый URL, по которому эти файлы отдаются (по умолчанию /uploads)
 *
 * По умолчанию файлы кладутся в public/uploads и отдаются самим Next.js по пути /uploads/...
 * При желании папку можно вынести за пределы проекта и раздавать через nginx.
 */
export async function uploadFile(file: unknown, prefix = "misc"): Promise<string | null> {
  if (!file || typeof file === "string") return null
  const f = file as File
  if (!f.size || !f.name) return null

  const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`

  const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads")
  const targetDir = path.join(uploadRoot, prefix)
  await mkdir(targetDir, { recursive: true })

  const buffer = Buffer.from(await f.arrayBuffer())
  await writeFile(path.join(targetDir, fileName), buffer)

  const publicBase = (process.env.UPLOAD_PUBLIC_BASE || "/uploads").replace(/\/$/, "")
  return `${publicBase}/${prefix}/${fileName}`
}
