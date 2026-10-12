// Client-safe (no Node built-ins): status vocabulary for the catalogue proposal queue.

/**
 * Status vocabulary for UniversityUpdateRequest (the catalogue proposal queue).
 * Stored as plain strings in the existing `status` column; no migration.
 *
 *   pending_approval / pending -> awaiting review
 *   reviewed_unverified        -> APPROVED for apply (approval never means verified)
 *   rejected                   -> rejected
 *   applied                    -> written to the live catalogue by a Super Admin
 *   apply_failed               -> apply was refused or failed; needs fresh review
 */
export const PROPOSAL_STATUS = {
  PENDING: 'pending_approval',
  PENDING_LEGACY: 'pending',
  APPROVED: 'reviewed_unverified',
  REJECTED: 'rejected',
  APPLIED: 'applied',
  APPLY_FAILED: 'apply_failed',
} as const;

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending review',
  pending: 'Pending review',
  reviewed_unverified: 'Approved – not applied',
  approved: 'Approved (legacy label) – not applied',
  rejected: 'Rejected',
  applied: 'Applied',
  apply_failed: 'Apply failed – needs review',
  published: 'Published (legacy)',
  rolled_back: 'Rolled back (legacy)',
};
