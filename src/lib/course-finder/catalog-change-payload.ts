import { createHash } from 'node:crypto';

export { PROPOSAL_STATUS, PROPOSAL_STATUS_LABELS } from './catalog-change-status';

export interface ProposalPayload {
  id: string;
  universityId: string;
  courseId: string;
  entityType: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  evidenceUrl: string;
}

/**
 * SHA-256 over exactly the fields a reviewer approves. Recorded in the approve
 * audit entry and recomputed at apply time; any difference means the payload
 * is not the one that was approved.
 */
export function proposalPayloadHash(p: ProposalPayload): string {
  const canonical = JSON.stringify([
    'catalog-proposal-v1',
    p.id,
    p.universityId ?? '',
    p.courseId ?? '',
    p.entityType ?? '',
    p.fieldName ?? '',
    p.oldValue ?? '',
    p.newValue ?? '',
    p.evidenceUrl ?? '',
  ]);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/** A fingerprint is valid only if it is a lowercase hex SHA-256 digest. */
export function isValidFingerprint(raw: unknown): raw is string {
  return typeof raw === 'string' && /^[a-f0-9]{64}$/.test(raw);
}

export type ApprovalFingerprintState = 'valid' | 'missing' | 'mismatch';

/** Reads the approvedPayloadHash recorded in an approve audit entry's metadata. */
export function approvalHashFromAudit(audit: { metadata?: unknown } | null | undefined): string {
  if (!audit) return '';
  try {
    const meta = JSON.parse(String(audit.metadata ?? '{}'));
    return typeof meta?.approvedPayloadHash === 'string' ? meta.approvedPayloadHash : '';
  } catch {
    return '';
  }
}

/**
 * Whether the latest approval of a proposal still covers its current payload.
 * Historical approvals (made before fingerprints existed, or with a malformed
 * fingerprint) are `missing` and must be approved again; they are never
 * silently upgraded.
 */
export function approvalFingerprintState(
  request: { id: unknown; universityId?: unknown; courseId?: unknown; entityType?: unknown; fieldName?: unknown; oldValue?: unknown; newValue?: unknown; evidenceUrl?: unknown },
  latestApproveAudit: { metadata?: unknown } | null | undefined,
): ApprovalFingerprintState {
  const recorded = approvalHashFromAudit(latestApproveAudit);
  if (!isValidFingerprint(recorded)) return 'missing';
  const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  const current = proposalPayloadHash({
    id: s(request.id), universityId: s(request.universityId), courseId: s(request.courseId), entityType: s(request.entityType),
    fieldName: s(request.fieldName), oldValue: s(request.oldValue), newValue: s(request.newValue), evidenceUrl: s(request.evidenceUrl),
  });
  return current === recorded ? 'valid' : 'mismatch';
}
