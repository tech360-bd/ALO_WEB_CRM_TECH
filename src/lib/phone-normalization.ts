/**
 * Phone Normalization Utility
 *
 * Handles Bangladesh (+880) and international phone normalization.
 *
 * Rules (BD):
 *   - "01XXXXXXXXX"           → "8801XXXXXXXXX"
 *   - "+8801XXXXXXXXX"        → "8801XXXXXXXXX"
 *   - "008801XXXXXXXXX"       → "8801XXXXXXXXX"
 *   - "8801XXXXXXXXX"         → unchanged
 *
 * Rules (intl):
 *   - "00CC..."               → "CC..."   (strip leading 00)
 *   - "+CC..."                → "CC..."   (strip leading +)
 *
 * All outputs are digit-only strings (no '+', no spaces, no dashes).
 */

// ─── Internal helpers ───────────────────────────────────────────

function stripNonDigits(input: string): string {
  return (input || "").replace(/[^\d]/g, "");
}

function isBlank(input: string | null | undefined): input is "" | null | undefined {
  return input == null || input.trim() === "";
}

/**
 * Normalize a phone number into canonical digit-only form.
 *
 * - Returns "" for empty/null/undefined input.
 * - For Bangladesh numbers, always returns the 13-digit form "8801XXXXXXXXX".
 * - For international numbers, returns country-code-prefixed digits
 *   (with leading "00" or "+" removed).
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (isBlank(phone)) return "";
  const digits = stripNonDigits(phone);
  if (digits === "") return "";

  // ── Bangladesh normalization ──
  // Local format: 01XXXXXXXXX (11 digits) → 8801XXXXXXXXX
  if (/^01\d{9}$/.test(digits)) {
    return `880${digits}`;
  }
  // Already BD with country code: 8801XXXXXXXXX
  if (/^8801\d{9}$/.test(digits)) {
    return digits;
  }
  // +8801XXXXXXXXX becomes 8801XXXXXXXXX (after digit strip already done)
  // 008801XXXXXXXXX → 8801XXXXXXXXX
  if (/^008801\d{9}$/.test(digits)) {
    return digits.slice(2);
  }
  // 880 + longer — already canonical
  if (/^880\d+$/.test(digits)) {
    return digits;
  }

  // ── International normalization ──
  // "00" prefix → strip
  if (digits.startsWith("00")) {
    return digits.slice(2);
  }
  // Otherwise return digits as-is (already stripped of '+')
  return digits;
}

/**
 * Normalize phone to E.164 format (with leading "+").
 *
 * Returns "" for empty input. Always returns a string starting with "+".
 */
export function normalizePhoneE164(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone);
  if (normalized === "") return "";
  return `+${normalized}`;
}

/**
 * Generate all reasonable variants of a phone number for fuzzy matching.
 *
 * E.g. for "8801712345678" returns:
 *   ["8801712345678", "+8801712345678", "01712345678", "1712345678",
 *    "008801712345678"]
 *
 * Empty input → empty array.
 */
export function phoneVariants(phone: string | null | undefined): string[] {
  const normalized = normalizePhone(phone);
  if (normalized === "") return [];

  const variants = new Set<string>();
  variants.add(normalized);

  // E.164 form
  variants.add(`+${normalized}`);

  // BD local form: strip leading "880" → "01XXXXXXXXX"
  if (normalized.startsWith("880") && normalized.length >= 11) {
    const local = normalized.slice(3);
    variants.add(local);
    // also without leading 0
    if (local.startsWith("0")) {
      variants.add(local.slice(1));
    }
  }

  // 00 international prefix form
  variants.add(`00${normalized}`);

  return Array.from(variants);
}

/**
 * Check whether two phone numbers refer to the same subscriber.
 *
 * Compares normalized forms; returns false if either is empty.
 */
export function phonesMatch(p1: string | null | undefined, p2: string | null | undefined): boolean {
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (n1 === "" || n2 === "") return false;
  return n1 === n2;
}

/**
 * Build a set of Prisma `where` conditions that match any of the
 * provided fields against the given phone (using all variants).
 *
 * Example:
 *   phoneMatchConditions("8801712345678", ["phone", "altPhone", "mobile"])
 *   // → { OR: [{ phone: "8801712345678" }, { phone: "+8801712345678" },
 *   //        { altPhone: "..." }, ...] }
 *
 * Returns null if phone is empty or no fields provided.
 */
export function phoneMatchConditions(
  phone: string | null | undefined,
  fields: string[]
): { OR: Array<Record<string, string>> } | null {
  const variants = phoneVariants(phone);
  if (variants.length === 0 || fields.length === 0) return null;

  const conditions: Array<Record<string, string>> = [];
  for (const field of fields) {
    for (const v of variants) {
      conditions.push({ [field]: v } as Record<string, string>);
    }
  }
  return { OR: conditions };
}
