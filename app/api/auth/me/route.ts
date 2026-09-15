import { getCurrentUser } from "@/lib/auth/session"
import { ok, fail, userPublic } from "@/lib/api"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return fail("Требуется авторизация.", 401)
  return ok(userPublic(user))
}
