/**
 * Verification state after an ordinary admin edit of a CrmCourse or
 * CrmUniversity (PUT /api/admin/courses/[id], PUT /api/admin/universities/[id]).
 *
 * Phase 1 review (2026-10-12), P1-D. Both endpoints previously set
 * verificationStatus = VERIFIED whenever the body contained a sourceUrl and
 * stamped lastVerifiedAt = now on EVERY edit, so an ordinary edit certified
 * the whole record. Now an edit never upgrades verification and never writes
 * a verification date; changing a factual field of a VERIFIED record sends it
 * back to NEEDS_REVIEW (which also removes it from public listings, because
 * the public gate requires VERIFIED).
 */
import { isAcceptableSourceUrl } from './content-page-guards';

export function isVerifiedStatus(value: unknown): boolean {
  return typeof value === 'string' && value.toUpperCase() === 'VERIFIED';
}

export function changedFields(data: Record<string, unknown>, existing: Record<string, unknown>, fields: readonly string[]): string[] {
  return fields.filter((f) => Object.prototype.hasOwnProperty.call(data, f) && (data[f] ?? null) !== (existing[f] ?? null));
}

export function verificationAfterEdit(existingStatus: string, factsChanged: boolean): string {
  return factsChanged && isVerifiedStatus(existingStatus) ? 'NEEDS_REVIEW' : existingStatus;
}

/**
 * '' clears a URL; any other NEW value must be an acceptable https URL.
 * A value identical to the stored one is not re-validated, so legacy values
 * do not block unrelated edits.
 */
export function invalidUrlField(body: Record<string, unknown>, fields: readonly string[], existing: Record<string, unknown> = {}): string | null {
  for (const f of fields) {
    const v = body[f];
    if (v === undefined || v === '' || v === null) continue;
    if (v === existing[f]) continue;
    if (!isAcceptableSourceUrl(v)) return f;
  }
  return null;
}

/** Body keys that an edit endpoint must never accept. */
export const EDIT_CONTROL_FIELDS = ['verificationStatus', 'lastVerifiedAt', 'publicationStatus'] as const;

export function presentControlFields(body: Record<string, unknown>): string[] {
  return EDIT_CONTROL_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
}
