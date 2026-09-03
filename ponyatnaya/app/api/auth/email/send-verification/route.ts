import { fail } from "@/lib/api"

/** Подтверждение email отключено по решению владельца сайта. */
export async function POST() {
  return fail("Подтверждение email отключено. Email сохраняется как контактный адрес.", 410)
}
