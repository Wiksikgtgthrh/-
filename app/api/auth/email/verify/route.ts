import { and, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { appUser } from "@/lib/db/schema"
import { fail, ok, userPublic } from "@/lib/api"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const token = String(body.token ?? "")
  if (!token) return fail("Ссылка подтверждения недействительна.")

  const [user] = await db
    .select()
    .from(appUser)
    .where(and(eq(appUser.emailVerificationToken, token), gt(appUser.emailVerificationExpires, new Date())))
    .limit(1)
  if (!user) return fail("Ссылка недействительна или срок её действия истёк.")

  const [updated] = await db
    .update(appUser)
    .set({ emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null })
    .where(eq(appUser.id, user.id))
    .returning()

  return ok({ detail: "Email подтверждён.", user: userPublic(updated) })
}
