/**
 * Phone Normalization Utilities
 *
 * Handles Bangladeshi + international phone number normalization.
 * Used across WhatsApp, 3CX, SMS, and CRM contact-matching flows.
 *
 * BD rules:
 *   01XXXXXXXXX        → 8801XXXXXXXXX  (11-digit local)
 *   1XXXXXXXXX         → 8801XXXXXXXXX  (10-digit missing leading 0)
 *   +8801XXXXXXXXX     → 8801XXXXXXXXX  (strip +)
 *   008801XXXXXXXXX    → 8801XXXXXXXXX  (strip 00 international prefix)
 *
 * International rules:
 *   00CC...            → CC...          (strip 00 international prefix)
 *   +CC...             → CC...          (strip +)
 */

/** Strip all non-digit characters. */
function digitsOnly(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Normalize any phone number to a canonical digit-only form
 * (no leading +, no leading 00, no leading 0 for BD locals).
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let d = digitsOnly(phone);
  if (!d) return "";

  // Bangladeshi local formats
  if (d.startsWith("00880")) {
    d = "880" + d.slice(5);
  } else if (d.startsWith("880")) {
    // already canonical BD
  } else if (d.startsWith("01") && d.length === 11) {
    d = "880" + d.slice(1);
  } else if (d.length === 10 && d.startsWith("1")) {
    d = "880" + d;
  } else if (d.startsWith("00")) {
    // Generic international prefix
    d = d.slice(2);
  }
  // else: leave as-is (already digits, no special prefix)

  return d;
}

/**
 * Normalize a phone to E.164 format with leading "+".
 * Returns "" for falsy input.
 */
export function normalizePhoneE164(phone: string | null | undefined): string {
  const n = normalizePhone(phone);
  return n ? "+" + n : "";
}

/**
 * Return all reasonable variants of a phone number for matching
 * (used in OR queries so a slight format mismatch still hits the DB).
 */
export function phoneVariants(phone: string | null | undefined): string[] {
  const n = normalizePhone(phone);
  if (!n) return [];
  const variants = new Set<string>([n]);

  // E.164
  variants.add("+" + n);

  // BD-specific variants
  if (n.startsWith("880")) {
    const local11 = "0" + n.slice(3); // 01XXXXXXXXX
    variants.add(local11);
    variants.add(n.slice(3)); // 1XXXXXXXXX (without leading 0)
    variants.add("00" + n);   // 008801XXXXXXXXX
  }

  // Strip leading + if user typed it
  if (phone && phone.startsWith("+")) {
    variants.add(digitsOnly(phone));
  }
  // Original as-typed (digits only)
  const rawDigits = digitsOnly(phone || "");
  if (rawDigits) variants.add(rawDigits);

  // Filter empties
  return Array.from(variants).filter(Boolean);
}

/**
 * Check whether two phone numbers match (any variant overlaps).
 */
export function phonesMatch(p1: string | null | undefined, p2: string | null | undefined): boolean {
  const a = normalizePhone(p1);
  const b = normalizePhone(p2);
  if (!a || !b) return false;
  if (a === b) return true;
  // Cross-check variant sets in case canonical forms differ
  const v1 = phoneVariants(p1);
  const v2 = phoneVariants(p2);
  return v1.some((v) => v2.includes(v));
}

/**
 * Build a Prisma `OR` condition array for matching the given phone
 * against one or more DB string fields.
 *
 * Example:
 *   phoneMatchConditions(from, ["mobile", "altMobile"])
 *   → [{ mobile: "8801..." }, { mobile: "+8801..." }, { altMobile: "8801..." }, ...]
 */
export function phoneMatchConditions(
  phone: string | null | undefined,
  fields: string[]
): Record<string, string>[] {
  const variants = phoneVariants(phone);
  const conds: Record<string, string>[] = [];
  for (const f of fields) {
    for (const v of variants) {
      conds.push({ [f]: v } as Record<string, string>);
    }
  }
  return conds;
}
