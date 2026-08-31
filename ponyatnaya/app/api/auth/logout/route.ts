import { revokeCurrentToken, clearAuthCookie } from "@/lib/auth/session"
import { ok } from "@/lib/api"

export async function POST() {
  await revokeCurrentToken()
  await clearAuthCookie()
  return ok({ success: true })
}
