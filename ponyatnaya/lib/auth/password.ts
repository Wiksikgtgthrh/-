import { scrypt, randomBytes, timingSafeEqual } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scrypt)

/** Хеширует пароль: scrypt с солью. Формат: scrypt$<salt_hex>$<hash_hex> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `scrypt$${salt}$${derived.toString("hex")}`
}

/** Проверяет пароль против сохранённого хеша. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  const [, salt, hashHex] = parts
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  const hashBuf = Buffer.from(hashHex, "hex")
  if (hashBuf.length !== derived.length) return false
  return timingSafeEqual(hashBuf, derived)
}
