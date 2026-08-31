/** Нормализует номер телефона к формату +7XXXXXXXXXX (как в Django-бэкенде). */
export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "")
  if (digits.length === 10) return "+7" + digits
  if (digits.length === 11 && digits.startsWith("8")) return "+7" + digits.slice(1)
  if (digits.length === 11 && digits.startsWith("7")) return "+" + digits
  if (digits.length === 12 && phone.trim().startsWith("+7")) return "+" + digits
  return "+" + digits
}

const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
}

/** Формирует slug (латиница) из строки, включая транслитерацию кириллицы. */
export function slugify(input: string): string {
  const lower = (input || "").toLowerCase().trim()
  let out = ""
  for (const ch of lower) {
    if (translitMap[ch] !== undefined) out += translitMap[ch]
    else if (/[a-z0-9]/.test(ch)) out += ch
    else if (/\s|-|_/.test(ch)) out += "-"
  }
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "")
  return out || "item"
}
