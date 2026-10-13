/**
 * DOCUMENT ACCESS & LIFECYCLE SERVICE
 * ===================================
 * One place that answers "may this actor see / review / delete this document?",
 * shared by the student, partner, counselor, CRM and visa document routes.
 *
 * WHY THIS EXISTS (established by code inspection, not assumption):
 *
 *  1. The same "skip the check when the owner field is empty" bug appeared in two
 *     independent places:
 *       • /api/counselor/documents  — `if (counselorId && counselorId !== auth.userId)`
 *       • /api/visa/documents/[id]/{approve,reject,needs-update,download}
 *                                  — `if (!isSuper && visaCase.visaOfficerId && …)`
 *     When a student was not assigned a counselor, or a visa case had no officer,
 *     the ownership test was skipped entirely and ANY authenticated staff account
 *     could read or modify that student's documents by supplying an id. Missing
 *     assignment must deny, not permit.
 *
 *  2. /api/crm/documents PUT (the document review endpoint) validated the target
 *     status but performed NO role check at all, so any authenticated account —
 *     including a partner user — could approve or reject a document.
 *
 *  3. Student documents live in two disconnected tables (`StudentDocument` keyed by
 *     studentId, `PortalStudentDocument` keyed by studentProfileId). Partner and
 *     portal uploads land in one; the counselor view read the other, so the two
 *     portals could not see each other's files. They are NOT merged here; a
 *     read-only normalisation layer makes both visible to authorised staff.
 *
 * The decision functions are pure so they can be proven without a database. The
 * resolvers below read only what they need and never return storage paths.
 */

// ────────────────────────────────────────────────────────────────────────────
// Role policy
// ────────────────────────────────────────────────────────────────────────────

/** Roles that may approve/reject/verify a document. */
export const DOCUMENT_REVIEWER_ROLES = [
  'super_admin',
  'admin',
  'application_manager',
  'application_team',
  'visa_officer',
  'visa_interview_officer',
  'document_officer',
] as const;

/** Roles that may delete or archive a document (product spec: Admin + Super Admin only). */
export const DOCUMENT_DELETION_ROLES = ['super_admin', 'admin'] as const;

/** Roles that may read a student's documents at all, beyond the assigned counselor. */
export const DOCUMENT_READ_ROLES = [
  ...DOCUMENT_REVIEWER_ROLES,
  'counselor',
  'senior_counselor',
  'finance',
  'finance_officer',
] as const;

function normaliseRoles(roles: string[] | undefined | null): string[] {
  return (roles || []).map((role) => String(role).toLowerCase());
}

export function canReviewDocuments(roles: string[] | undefined | null): boolean {
  const list = normaliseRoles(roles);
  return list.some((role) => (DOCUMENT_REVIEWER_ROLES as readonly string[]).includes(role));
}

/**
 * Only Admin and Super Admin may delete. Partners, students and ordinary staff
 * are refused — this is asserted here rather than trusted to each route.
 */
export function canDeleteDocuments(roles: string[] | undefined | null): boolean {
  const list = normaliseRoles(roles);
  return list.some((role) => (DOCUMENT_DELETION_ROLES as readonly string[]).includes(role));
}

export function canReadDocumentsByRole(roles: string[] | undefined | null): boolean {
  const list = normaliseRoles(roles);
  return list.some((role) => (DOCUMENT_READ_ROLES as readonly string[]).includes(role));
}

export function isAdminLike(roles: string[] | undefined | null): boolean {
  const list = normaliseRoles(roles);
  return list.some((role) => role === 'super_admin' || role === 'admin');
}

// ────────────────────────────────────────────────────────────────────────────
// Staff access decision
// ────────────────────────────────────────────────────────────────────────────

export interface StaffDocumentActor {
  userId: string;
  roles: string[];
}

export interface StudentAccessFacts {
  /** The Student row id, when a Student record exists. */
  studentId?: string | null;
  /** Counselor assigned to the student record. */
  counselorId?: string | null;
  /** Counselor recorded on the relevant application instead, where applicable. */
  applicationCounselorId?: string | null;
  /** True when the student originated from a B2B partner. */
  isPartnerStudent?: boolean;
  /** Does the student have at least one application that reached submission? */
  hasActiveAloApplication?: boolean;
  /**
   * False when the student row could not be found at all. An unknown student is
   * never a reason to allow access — it is a reason to refuse.
   */
  found?: boolean;
}

export interface DocumentAccessDecision {
  allowed: boolean;
  /** `admin` | `reviewer` | `assigned_counselor` | `assigned_officer` | `none` */
  via: string;
  reason: string;
  /** True when the actor may also change review status. */
  canReview: boolean;
  /** True when the actor may delete/archive. */
  canDelete: boolean;
}

/**
 * Decide whether a staff actor may access a student's documents.
 *
 * Deny-by-default. The previous implementations allowed whenever the assignment
 * field was empty; here an unassigned or unknown student is an explicit refusal.
 */
export function canStaffAccessStudentDocuments(
  actor: StaffDocumentActor,
  facts: StudentAccessFacts,
): DocumentAccessDecision {
  const roles = normaliseRoles(actor.roles);
  const canReview = canReviewDocuments(roles);
  const canDelete = canDeleteDocuments(roles);

  const deny = (reason: string, via = 'none'): DocumentAccessDecision => ({
    allowed: false,
    via,
    reason,
    canReview: false,
    canDelete: false,
  });

  // An unknown student is never implicitly accessible.
  if (facts.found === false) {
    return deny('Student record not found for the supplied identifier.');
  }

  // Admin / Super Admin have oversight access.
  if (isAdminLike(roles)) {
    return { allowed: true, via: 'admin', reason: 'Administrative oversight access.', canReview, canDelete };
  }

  // The role itself must be entitled to student documents at all.
  if (!canReadDocumentsByRole(roles)) {
    return deny('Your role does not grant access to student documents.');
  }

  const assignedCounselorId = facts.counselorId || facts.applicationCounselorId || '';
  const isAssignedCounselor = !!assignedCounselorId && assignedCounselorId === actor.userId;

  // A B2B partner student with no submitted application must not become visible to
  // ALO staff simply because a profile exists in the CRM (product requirement).
  if (facts.isPartnerStudent && facts.hasActiveAloApplication === false && !isAssignedCounselor) {
    return deny(
      'This partner student has no application submitted through ALO Education, so internal staff access is not authorised.',
    );
  }

  if (isAssignedCounselor) {
    return {
      allowed: true,
      via: 'assigned_counselor',
      reason: 'You are the counselor assigned to this student.',
      canReview,
      canDelete,
    };
  }

  // Reviewing roles may work any student's documents (their queue is the whole
  // pipeline); reading-only roles are not given the same reach.
  if (canReview) {
    return {
      allowed: true,
      via: 'reviewer',
      reason: 'Your role reviews or processes documents.',
      canReview,
      canDelete,
    };
  }

  // Anything left — for example a finance officer, or an unassigned counselor —
  // is refused. Previously this case fell through as an allow.
  return deny(
    assignedCounselorId
      ? 'This student is assigned to another counselor, and your role does not grant document review.'
      : 'This student has no assigned counselor, so access requires a document review role.',
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Cross-portal document normalisation
// ────────────────────────────────────────────────────────────────────────────

/** Which table a document row lives in. */
export type DocumentSource = 'student_document' | 'portal_student_document' | 'crm_document';

/** One shape for both tables, so staff views stop being split by storage model. */
export interface NormalisedDocument {
  id: string;
  source: DocumentSource;
  /** Canonical Student id where one can be resolved. */
  studentId: string;
  /** Portal profile id when the row came from the portal table. */
  studentProfileId: string | null;
  name: string;
  category: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  status: string;
  /** Review status in one vocabulary: pending | verified | rejected | superseded. */
  reviewState: 'pending' | 'verified' | 'rejected' | 'superseded';
  rejectionReason: string | null;
  reviewerNote: string | null;
  reviewedBy: string | null;
  version: number;
  previousVersionId: string | null;
  isArchived: boolean;
  hasFile: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalise the stored status vocabularies onto one review vocabulary.
 * `StudentDocument` uses not_uploaded/uploaded/pending/verified/rejected while
 * `PortalStudentDocument` uses pending/approved/rejected/needs_update.
 */
export function normaliseReviewState(status: string | null | undefined): NormalisedDocument['reviewState'] {
  switch (String(status || '').trim().toLowerCase()) {
    case 'verified':
    case 'approved':
    case 'accepted':
      return 'verified';
    case 'rejected':
    case 'needs_update':
    case 'needs-update':
    case 'refused':
      return 'rejected';
    case 'superseded':
    case 'archived':
      return 'superseded';
    default:
      return 'pending';
  }
}

interface StudentDocumentRow {
  id: string; studentId: string; category?: string | null; fileName?: string | null;
  storagePath?: string | null; mimeType?: string | null; fileSize?: number | null; status?: string | null;
  version?: number | null; previousVersionId?: string | null; rejectionReason?: string | null;
  reviewerNote?: string | null; reviewedBy?: string | null; isArchived?: boolean | null;
  createdAt: Date | string; updatedAt: Date | string;
}

interface PortalDocumentRow {
  id: string; studentProfileId: string; name?: string | null; category?: string | null;
  fileName?: string | null; storagePath?: string | null; mimeType?: string | null; fileSize?: number | null;
  status?: string | null; rejectionReason?: string | null; reviewedBy?: string | null;
  createdAt: Date | string; updatedAt: Date | string;
}

const iso = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : String(value || '');

export function fromStudentDocument(row: StudentDocumentRow): NormalisedDocument {
  return {
    id: row.id,
    source: 'student_document',
    studentId: row.studentId,
    studentProfileId: null,
    name: row.category || row.fileName || 'Document',
    category: row.category || '',
    fileName: row.fileName || '',
    mimeType: row.mimeType ?? null,
    fileSize: row.fileSize ?? 0,
    status: row.status || 'not_uploaded',
    reviewState: normaliseReviewState(row.status),
    rejectionReason: row.rejectionReason || null,
    reviewerNote: row.reviewerNote || null,
    reviewedBy: row.reviewedBy || null,
    version: row.version ?? 1,
    previousVersionId: row.previousVersionId || null,
    isArchived: !!row.isArchived,
    // Never expose the storage path itself — only whether a file is attached.
    hasFile: !!row.storagePath,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function fromPortalDocument(row: PortalDocumentRow, studentId: string): NormalisedDocument {
  return {
    id: row.id,
    source: 'portal_student_document',
    studentId,
    studentProfileId: row.studentProfileId,
    name: row.name || row.fileName || 'Document',
    category: row.category || '',
    fileName: row.fileName || '',
    mimeType: row.mimeType ?? null,
    fileSize: row.fileSize ?? 0,
    status: row.status || 'pending',
    reviewState: normaliseReviewState(row.status),
    rejectionReason: row.rejectionReason || null,
    reviewerNote: null,
    reviewedBy: row.reviewedBy || null,
    // The portal table has no versioning columns; a portal upload is v1 of its slot
    // until the version policy is extended to it.
    version: 1,
    previousVersionId: null,
    isArchived: false,
    hasFile: !!row.storagePath,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/**
 * Merge the two sources into one ordered list. Filtering by section/category is
 * done by the caller so the same helper serves the counselor, CRM and partner
 * views without each inventing its own union query.
 */
export function mergeDocumentViews(input: {
  studentDocuments?: StudentDocumentRow[];
  portalDocuments?: Array<PortalDocumentRow & { studentId?: string | null }>;
  /** Resolve a portal profile's canonical Student id when the row does not carry one. */
  studentIdForProfile?: (studentProfileId: string) => string | null | undefined;
}): NormalisedDocument[] {
  const fromStudent = (input.studentDocuments || []).map(fromStudentDocument);
  const fromPortal = (input.portalDocuments || []).map((row) =>
    fromPortalDocument(row, row.studentId || input.studentIdForProfile?.(row.studentProfileId) || ''),
  );
  return [...fromStudent, ...fromPortal].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ────────────────────────────────────────────────────────────────────────────
// Versioning
// ────────────────────────────────────────────────────────────────────────────

/**
 * Decide the version number and predecessor for a new upload in a slot.
 *
 * The version chain is the mechanism that keeps earlier uploads retrievable. The
 * brief's "upload the same document three times" is implemented as three retained
 * versions — never an overwrite — and there is deliberately NO hard maximum on
 * how many corrections a student may make.
 */
export function nextVersionFor(input: {
  existingVersions: Array<{ id: string; version: number; reviewState: NormalisedDocument['reviewState'] }>;
}): { version: number; previousVersionId: string | null; priorVerifiedVersionId: string | null } {
  if (input.existingVersions.length === 0) {
    return { version: 1, previousVersionId: null, priorVerifiedVersionId: null };
  }
  const highest = input.existingVersions.reduce((max, row) => Math.max(max, row.version || 0), 0);
  const latest = input.existingVersions.find((row) => row.version === highest) || null;
  const verified = input.existingVersions.filter((row) => row.reviewState === 'verified');
  return {
    version: highest + 1,
    previousVersionId: latest?.id ?? null,
    priorVerifiedVersionId: verified.length > 0 ? verified[verified.length - 1].id : null,
  };
}

/**
 * A replacement upload must never inherit "verified" from the file it replaces.
 * Returns the status the new row must be created with.
 */
export function initialStatusForReplacement(): 'pending' {
  return 'pending';
}

export interface VersionReviewImpact {
  /** The new upload stays pending until a human reviews it. */
  newUploadState: 'pending';
  /** Previous verified version becomes superseded, but only AFTER the new one is verified. */
  supersedePreviousVerified: boolean;
  message: string;
}

/**
 * How a new upload affects the previous verified version. The previous file keeps
 * its approved status and remains downloadable until the replacement is itself
 * verified, so an unreviewed upload can never masquerade as approved.
 */
export function versionReviewImpact(previousVerifiedExists: boolean): VersionReviewImpact {
  return {
    newUploadState: 'pending',
    supersedePreviousVerified: previousVerifiedExists,
    message: previousVerifiedExists
      ? 'Previous verified version stays available until the replacement is verified, then becomes superseded.'
      : 'No earlier verified version to supersede.',
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Idempotency
// ────────────────────────────────────────────────────────────────────────────

/**
 * Prevent an upload retry (double-click, network replay) from creating a second
 * row for the same bytes in the same slot.
 */
export function isDuplicateUpload(input: {
  fileHash: string;
  category: string;
  existing: Array<{ fileHash?: string | null; category?: string | null; reviewState: NormalisedDocument['reviewState'] }>;
}): boolean {
  if (!input.fileHash) return false;
  const category = String(input.category || '').toLowerCase();
  return input.existing.some(
    (row) =>
      String(row.fileHash || '').toLowerCase() === input.fileHash.toLowerCase() &&
      String(row.category || '').toLowerCase() === category &&
      row.reviewState !== 'rejected',
  );
}
