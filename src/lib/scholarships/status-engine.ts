// ============================================================================
// ALO Scholarship status engine (spec §20): Open / Closing Soon / Closed /
// Upcoming / Needs Verification + stale-verification rule (§21: outdated
// verification must show "Needs Manual Verification", never "currently open").
// Pure functions — fully unit-testable.
// ============================================================================

export type ScholarshipStatus = 'OPEN' | 'CLOSING_SOON' | 'CLOSED' | 'UPCOMING' | 'NEEDS_VERIFICATION';

/** Publication-staleness threshold for time-sensitive items (days). */
export const VERIFICATION_STALE_DAYS = 90;

export interface ScholarshipStatusInput {
  openingDate?: Date | string | null;
  deadlineDate?: Date | string | null;
  verificationStatus?: string | null;
  lastVerifiedAt?: Date | string | null;
  status?: string | null; // stored: active/draft/archived/CLOSED/PUBLISHED
  now?: Date;
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isVerificationStale(lastVerifiedAt: Date | string | null | undefined, staleDays: number = VERIFICATION_STALE_DAYS, now: Date = new Date()): boolean {
  const d = toDate(lastVerifiedAt);
  if (!d) return true; // never verified = cannot present as current
  return (now.getTime() - d.getTime()) > staleDays * 24 * 60 * 60 * 1000;
}

export function computeScholarshipStatus(input: ScholarshipStatusInput): ScholarshipStatus {
  const now = input.now || new Date();
  const stored = String(input.status || '').toUpperCase();
  if (stored === 'CLOSED' || stored === 'ARCHIVED') return 'CLOSED';

  const verification = String(input.verificationStatus || '').toLowerCase();
  if (verification !== 'verified' && verification !== 'verified_recent') {
    return 'NEEDS_VERIFICATION';
  }
  if (isVerificationStale(input.lastVerifiedAt, VERIFICATION_STALE_DAYS, now)) {
    return 'NEEDS_VERIFICATION';
  }

  const opening = toDate(input.openingDate);
  const deadline = toDate(input.deadlineDate);

  if (opening && opening.getTime() > now.getTime()) return 'UPCOMING';
  if (deadline && deadline.getTime() < now.getTime()) return 'CLOSED';
  if (deadline) {
    const daysLeft = (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    if (daysLeft <= 30) return 'CLOSING_SOON';
  }
  return 'OPEN';
}

/** Display badge metadata for the five statuses. */
export const SCHOLARSHIP_STATUS_BADGES: Record<ScholarshipStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  OPEN: { label: 'Open', tone: 'success' },
  CLOSING_SOON: { label: 'Closing Soon', tone: 'warning' },
  CLOSED: { label: 'Closed', tone: 'danger' },
  UPCOMING: { label: 'Upcoming', tone: 'info' },
  NEEDS_VERIFICATION: { label: 'Needs Manual Verification', tone: 'neutral' },
};
