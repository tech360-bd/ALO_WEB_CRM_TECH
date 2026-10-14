/**
 * IMMUTABLE DOCUMENT POLICY (spec §134-§139)
 * ==========================================
 * The brief marks this MANDATORY:
 *
 *   §134 Official application documents must NEVER be physically deleted through
 *        the normal CRM UI — not by students, counselors, partners or admins.
 *        Use lifecycle states instead.
 *   §135 A counselor may REJECT a document. REJECT ≠ DELETE; it stays in history.
 *   §136 One requirement = one slot with versions (v1 rejected, v2 rejected,
 *        v3 verified) — never duplicate requirement rows.
 *   §137 Rejection is only allowed from STUDENT_SUBMITTED / UNDER_REVIEW. Once a
 *        document is VERIFIED it cannot be deleted or quietly replaced; a
 *        correction goes through a SUPERSEDE workflow with reason + authorization.
 *   §138 Rejection MUST carry a reason (predefined code + optional comment).
 *
 * The repository already models versions (`StudentDocument.version` /
 * `previousVersionId`, `DocumentVersion`) and exposes no DELETE endpoint — this
 * module supplies the missing *rule enforcement*, so the guarantee does not
 * depend on every route author remembering it.
 *
 * Pure functions: no database, no clock.
 */

export const DOCUMENT_STATES = [
  'not_uploaded',
  'student_submitted',
  'under_review',
  'verified',
  'rejected',
  'superseded',
  'archived',
] as const;
export type DocumentState = (typeof DOCUMENT_STATES)[number];

export type DocumentActor = 'student' | 'counselor' | 'partner' | 'admin' | 'system';

/** Spec §138 — predefined rejection reasons, plus a free-text comment. */
export const REJECTION_REASON_CODES = [
  'blurry',
  'incomplete',
  'wrong_document',
  'expired',
  'wrong_student',
  'wrong_format',
  'missing_page',
  'inconsistent_information',
  'university_requirement_not_met',
] as const;
export type RejectionReasonCode = (typeof REJECTION_REASON_CODES)[number];

export const REJECTION_REASON_LABELS: Record<RejectionReasonCode, string> = {
  blurry: 'The scan is not readable — please upload a clearer copy.',
  incomplete: 'Part of the document is missing.',
  wrong_document: 'This is not the document we asked for.',
  expired: 'The document has expired — please send the current one.',
  wrong_student: 'The document belongs to a different applicant.',
  wrong_format: 'The file format is not accepted — upload a PDF or a photo of the original.',
  missing_page: 'One or more pages are missing.',
  inconsistent_information: 'Details do not match your other documents or profile.',
  university_requirement_not_met: 'This does not meet the university-specific requirement.',
};

export interface DocumentTransitionRequest {
  actor: DocumentActor;
  from: DocumentState;
  to: DocumentState;
  /** Required when `to` is 'rejected' (spec §138). */
  reasonCode?: string;
  /** Optional counselor comment shown to the student alongside the reason code. */
  comment?: string;
  /** Required when superseding a verified document (spec §137). */
  supersedeReason?: string;
}

export interface TransitionDecision {
  allowed: boolean;
  /** Machine-readable code for the API response. */
  code: string;
  /** Message safe to show the actor. */
  message: string;
  /** Extra steps the caller must complete. */
  requirements?: string[];
}

const DENY_DELETE = {
  allowed: false,
  code: 'DOCUMENT_DELETE_FORBIDDEN',
  message:
    'Official application documents cannot be deleted. Use a lifecycle change instead (reject, supersede or archive) — every version stays in the audit history.',
} as const;

/**
 * The one rule the brief repeats in every section: no actor may delete.
 * Exposed as a named function so routes can call it explicitly and reviewers can
 * grep for the guarantee.
 */
export function canDeleteDocument(): typeof DENY_DELETE {
  return DENY_DELETE;
}

/** Students may upload and read; nothing else. */
export function canActorChangeDocumentState(actor: DocumentActor): boolean {
  return actor === 'counselor' || actor === 'admin' || actor === 'system';
}

/**
 * Evaluate a requested state change.
 *
 * Note the asymmetry the brief asks for: rejection is a *soft* action available
 * while a submission is still reviewable, whereas verification is a *hard* state
 * that can only be left through an authorized supersede with a stated reason.
 */
export function evaluateDocumentTransition(request: DocumentTransitionRequest): TransitionDecision {
  const { actor, from, to } = request;

  if (from === to) {
    return { allowed: true, code: 'NO_CHANGE', message: 'No state change requested.' };
  }

  // ── §134: deletion is never a lifecycle transition ──────────────────────────
  if ((to as string) === 'deleted') {
    return { ...DENY_DELETE };
  }

  // Students never review their own documents.
  if ((to === 'verified' || to === 'rejected') && !canActorChangeDocumentState(actor)) {
    return {
      allowed: false,
      code: 'REVIEW_ROLE_REQUIRED',
      message: 'Only an authorized counselor can verify or reject a document.',
    };
  }

  if (to === 'rejected') {
    // §137: only reviewable submissions may be rejected.
    if (from !== 'student_submitted' && from !== 'under_review') {
      return {
        allowed: false,
        code: from === 'verified' ? 'VERIFIED_DOCUMENT_IMMUTABLE' : 'NOT_REJECTABLE',
        message:
          from === 'verified'
            ? 'This document is already verified and cannot be rejected. Raise a correction (supersede) with a reason instead.'
            : 'Only a submitted document that is awaiting review can be rejected.',
        requirements: from === 'verified' ? ['Use the supersede workflow with an authorization reason'] : undefined,
      };
    }
    // §138: a reason is mandatory and must be one of the predefined codes.
    const code = (request.reasonCode || '').trim();
    if (!code) {
      return {
        allowed: false,
        code: 'REJECTION_REASON_REQUIRED',
        message: 'A rejection reason is required. Pick a reason code and, if useful, add a comment for the student.',
        requirements: [...REJECTION_REASON_CODES],
      };
    }
    if (!(REJECTION_REASON_CODES as readonly string[]).includes(code)) {
      return {
        allowed: false,
        code: 'REJECTION_REASON_INVALID',
        message: `Unknown rejection reason. Choose one of: ${REJECTION_REASON_CODES.join(', ')}.`,
        requirements: [...REJECTION_REASON_CODES],
      };
    }
    return { allowed: true, code: 'REJECTED', message: 'Document rejected. The submission stays in history so the student can upload a replacement.' };
  }

  if (to === 'verified') {
    if (from !== 'student_submitted' && from !== 'under_review') {
      return {
        allowed: false,
        code: from === 'rejected' ? 'REJECTED_DOCUMENT_NOT_VERIFIABLE' : 'NOT_VERIFIABLE',
        message:
          from === 'rejected'
            ? 'A rejected document cannot be verified — wait for the student to upload a replacement version.'
            : 'Only a submitted document can be verified.',
      };
    }
    return { allowed: true, code: 'VERIFIED', message: 'Document verified. It can no longer be rejected or replaced without a supersede request.' };
  }

  if (to === 'superseded') {
    // §137 correction path: allowed from verified, but only with a stated reason.
    if (!request.supersedeReason || request.supersedeReason.trim().length < 10) {
      return {
        allowed: false,
        code: 'SUPERSEDE_REASON_REQUIRED',
        message: 'Superseding a document needs a reason of at least 10 characters (who asked for the correction and why).',
      };
    }
    if (!canActorChangeDocumentState(actor)) {
      return { allowed: false, code: 'SUPERSEDE_ROLE_REQUIRED', message: 'Only an authorized counselor or admin can supersede a verified document.' };
    }
    return {
      allowed: true,
      code: 'SUPERSEDED',
      message: 'Document marked superseded. The original version remains in history and the replacement becomes the active version.',
    };
  }

  if (to === 'under_review') {
    // Viewing a submission is allowed by any reviewer, and also records the
    // counselor's first look (used by the SLA engine).
    if (!canActorChangeDocumentState(actor)) {
      return { allowed: false, code: 'REVIEW_ROLE_REQUIRED', message: 'Only an authorized counselor can move a document into review.' };
    }
    return { allowed: true, code: 'UNDER_REVIEW', message: 'Document marked as under review.' };
  }

  if (to === 'student_submitted') {
    if (from === 'verified' || from === 'superseded') {
      return {
        allowed: false,
        code: 'VERSION_REQUIRED',
        message: 'A verified document cannot be re-submitted over itself. The student must upload a new version (v2, v3 …).',
      };
    }
    return { allowed: true, code: 'SUBMITTED', message: 'Document received and queued for review.' };
  }

  if (to === 'archived') {
    if (!canActorChangeDocumentState(actor)) {
      return { allowed: false, code: 'ARCHIVE_ROLE_REQUIRED', message: 'Only staff can archive a document.' };
    }
    return { allowed: true, code: 'ARCHIVED', message: 'Document archived. It remains readable in the audit history.' };
  }

  return { allowed: false, code: 'UNSUPPORTED_TRANSITION', message: `The transition ${from} → ${to} is not defined by the document policy.` };
}

/** §136 — one requirement, many versions; the slot is never duplicated. */
export interface DocumentVersionView {
  version: number;
  state: DocumentState;
  rejectionReasonCode?: RejectionReasonCode | null;
  reviewerComment?: string | null;
  uploadedAt: string;
}

export interface DocumentSlotView {
  requirementKey: string;
  /** The single active version number, or null while nothing is verified. */
  activeVersion: number | null;
  latestVersion: number;
  state: DocumentState;
  versions: DocumentVersionView[];
}

/**
 * Build the version timeline for one requirement slot (spec §136).
 * Guarantees: versions are never collapsed, never renumbered and never dropped —
 * the caller only supplies rows.
 */
export function buildDocumentSlot(requirementKey: string, versions: DocumentVersionView[]): DocumentSlotView {
  const ordered = [...versions].sort((a, b) => a.version - b.version);
  const verified = ordered.filter((entry) => entry.state === 'verified');
  const activeVersion = verified.length > 0 ? verified[verified.length - 1].version : null;
  const latest = ordered[ordered.length - 1];
  return {
    requirementKey,
    activeVersion,
    latestVersion: latest?.version ?? 0,
    state: latest?.state ?? 'not_uploaded',
    versions: ordered,
  };
}

/** The message the student sees after a rejection (spec §135/§139). */
export function rejectionNotice(
  reasonCode: RejectionReasonCode,
  comment?: string | null
): { headline: string; reason: string; comment?: string; action: string } {
  return {
    headline: 'DOCUMENT REJECTED',
    reason: REJECTION_REASON_LABELS[reasonCode] ?? 'The document could not be accepted.',
    comment: comment?.trim() || undefined,
    action: 'Upload a replacement',
  };
}

/** Maps the stored status vocabulary of the existing routes onto the policy states. */
export function legacyStatusToState(status: string | null | undefined): DocumentState {
  switch (String(status || '').trim().toLowerCase()) {
    case 'verified':
    case 'approved':
      return 'verified';
    case 'rejected':
    case 'needs_update':
    case 'needs-update':
      return 'rejected';
    case 'under_review':
      return 'under_review';
    case 'uploaded':
    case 'pending':
    case 'pending_review':
      return 'student_submitted';
    case 'superseded':
      return 'superseded';
    case 'archived':
      return 'archived';
    default:
      return 'not_uploaded';
  }
}
