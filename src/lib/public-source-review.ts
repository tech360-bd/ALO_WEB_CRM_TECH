const PUBLIC_SOURCE_REVIEW_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export interface ReviewedPublicRecord {
  verificationStatus?: unknown;
  sourceUrl?: unknown;
  lastVerifiedAt?: unknown;
}

/**
 * Fail closed for public facts unless an HTTPS source is attached and an
 * explicit verified marker is still within the site's 90-day review window.
 * This is a publication gate, not independent proof that the source is official
 * or that the facts are correct.
 */
export function hasCurrentVerifiedPublicSource(
  record: ReviewedPublicRecord,
  now: Date | number = Date.now(),
): boolean {
  if (String(record.verificationStatus ?? '').trim().toLowerCase() !== 'verified') return false;
  if (typeof record.sourceUrl !== 'string' || !record.sourceUrl.trim()) return false;

  let source: URL;
  try {
    source = new URL(record.sourceUrl);
  } catch {
    return false;
  }
  if (source.protocol !== 'https:' || !source.hostname || source.username || source.password) return false;

  const verifiedAt = record.lastVerifiedAt instanceof Date
    ? record.lastVerifiedAt
    : typeof record.lastVerifiedAt === 'string' || typeof record.lastVerifiedAt === 'number'
      ? new Date(record.lastVerifiedAt)
      : null;
  if (!verifiedAt || Number.isNaN(verifiedAt.getTime())) return false;

  const nowMs = now instanceof Date ? now.getTime() : now;
  const ageMs = nowMs - verifiedAt.getTime();
  return ageMs >= 0 && ageMs <= PUBLIC_SOURCE_REVIEW_MAX_AGE_MS;
}

export const PUBLIC_SOURCE_REVIEW_MAX_AGE_DAYS = 90;
