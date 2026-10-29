const MAX_SOURCE_REVIEW_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function asDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Public language-prep facts need a recent source-review marker and an HTTPS
 * source. A code-level marker is not independent proof that the source itself
 * is correct; it is only the site's publication gate.
 */
export function hasCurrentLanguagePrepSourceReview(
  record: { lastVerifiedAt?: unknown; lastCheckedAt?: unknown; sourceUrl?: unknown; officialUrl?: unknown; officialRequirementUrl?: unknown },
  now: Date | number = Date.now(),
): boolean {
  const checkedAt = asDate(record.lastVerifiedAt ?? record.lastCheckedAt);
  if (!checkedAt) return false;
  const nowMs = now instanceof Date ? now.getTime() : now;
  const ageMs = nowMs - checkedAt.getTime();
  if (ageMs < 0 || ageMs > MAX_SOURCE_REVIEW_AGE_MS) return false;
  const source = record.sourceUrl ?? record.officialUrl ?? record.officialRequirementUrl;
  return isHttpsUrl(source);
}

/** Test catalogue entries additionally require an explicit verified status. */
export function hasCurrentLanguagePrepVerification(
  record: { verificationStatus?: unknown; lastVerifiedAt?: unknown; sourceUrl?: unknown; officialUrl?: unknown },
  now: Date | number = Date.now(),
): boolean {
  const status = String(record.verificationStatus ?? '').trim().toLowerCase();
  return ['verified', 'verified_recent'].includes(status)
    && hasCurrentLanguagePrepSourceReview(record, now);
}

export const LANGUAGE_PREP_REVIEW_MAX_AGE_DAYS = 90;
