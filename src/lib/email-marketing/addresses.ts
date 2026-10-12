/**
 * Recipient address hygiene for marketing email.
 *
 * Deliberately conservative: anything that is not a plain ASCII address is
 * rejected rather than "repaired". Silently changing an address could send mail
 * to a different person, so a rejected row is reported and skipped instead.
 */

export const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;
const LOCAL_PART = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+$/;
const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TOP_LEVEL_DOMAIN = /^[a-z]{2,63}$/;

/** Returns the trimmed, lower-cased address, or null when it is not a plain address. */
export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  if (value.length === 0 || value.length > MAX_EMAIL_LENGTH) return null;

  const at = value.indexOf('@');
  if (at <= 0 || value.indexOf('@', at + 1) !== -1) return null;

  const localPart = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (localPart.length > MAX_LOCAL_PART_LENGTH || !LOCAL_PART.test(localPart)) return null;
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return null;

  const labels = domain.split('.');
  if (labels.length < 2) return null;
  if (!labels.every((label) => DOMAIN_LABEL.test(label))) return null;
  if (!TOP_LEVEL_DOMAIN.test(labels[labels.length - 1])) return null;

  return value;
}

/** Splits a comma-separated env value into normalized, valid addresses. Invalid entries are dropped. */
export function parseAddressList(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const email = normalizeEmail(part);
    if (email) seen.add(email);
  }
  return Array.from(seen);
}
