import { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appOrder } from "@/lib/db/schema"

export async function POST(req: NextRequest) {
  const event = await req.json()
  if (event.event === "payment.succeeded") {
    const orderId = Number(event.object?.metadata?.order_id)
    if (orderId) await db.update(appOrder).set({ status: "paid" }).where(eq(appOrder.id, orderId))
  }
  return Response.json({ ok: true })
}
