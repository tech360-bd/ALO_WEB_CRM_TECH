/**
 * DOCUMENT ACCESS RESOLVER (database-backed)
 * =========================================
 * Supplies the facts the pure policy in `document-access.ts` needs, and exposes
 * ready-made guards for the route handlers.
 *
 * The resolvers deliberately return only identifiers and booleans — never a
 * storage path, file hash or personal field — so a route cannot leak private
 * storage metadata by forgetting to select columns.
 */

import { db } from '@/lib/db';
import {
  canStaffAccessStudentDocuments,
  canReviewDocuments,
  canDeleteDocuments,
  normaliseReviewState,
  mergeDocumentViews,
  type DocumentAccessDecision,
  type NormalisedDocument,
  type StaffDocumentActor,
  type StudentAccessFacts,
} from '@/lib/documents/document-access';

/** Application stages that count as "submitted through ALO" (matches the benefit gate). */
const SUBMITTED_STAGES = new Set([
  'SUBMITTED_TO_ALO_APPLICATION_TEAM',
  'SUBMITTED_TO_B2B',
  'SUBMITTED_TO_UNIVERSITY',
  'ACKNOWLEDGEMENT_RECEIVED',
  'DECISION_PENDING',
  'MORE_DOCUMENTS_REQUESTED',
  'INTERVIEW_REQUIRED',
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
  'DEFERRED',
  'DEPOSIT_PENDING',
  'DEPOSIT_PAID',
  'CAS_PENDING',
  'CAS_RECEIVED',
  'I20_PENDING',
  'I20_RECEIVED',
  'COE_PENDING',
  'COE_RECEIVED',
  'VISA_HANDOVER_READY',
  'VISA_FILE_CREATED',
  // legacy short spellings
  'submitted',
  'offer_received',
  'conditional_offer',
  'unconditional_offer',
  'cas_pending',
  'cas_received',
  'visa_applied',
  'visa_approved',
  'visa_submitted',
  'enrolled',
]);

export interface ResolvedStudent {
  /** The canonical Student row id. */
  studentId: string | null;
  /** The portal profile id, when one exists. */
  studentProfileId: string | null;
  facts: StudentAccessFacts;
}

/**
 * Resolve the identifiers and access facts for a student identifier supplied by a
 * caller. The identifier may be a `Student.id`, a `Student.studentId` business code
 * or a `PortalStudentProfile.studentId`, because the existing routes accept all
 * three — so all three are looked up rather than assuming one.
 */
export async function resolveStudentForDocuments(identifier: string): Promise<ResolvedStudent> {
  const empty: ResolvedStudent = { studentId: null, studentProfileId: null, facts: { found: false } };
  const value = String(identifier || '').trim();
  if (!value) return empty;

  let student: { id: string; counselorId?: string | null } | null = null;
  try {
    student = await db.student.findFirst({
      where: { OR: [{ id: value }, { studentId: value }] },
      select: { id: true, counselorId: true },
    });
  } catch {
    student = null;
  }

  const profile = await db.portalStudentProfile
    .findFirst({
      where: { OR: [{ id: value }, { studentId: value }] },
      select: { id: true, studentId: true, partnerId: true },
    })
    .catch(() => null);

  const studentId = student?.id || profile?.studentId || null;
  const studentProfileId = profile?.id || null;

  if (!studentId && !studentProfileId) return empty;

  // A partner-originated student is one with a partnerId on either record.
  const isPartnerStudent = !!profile?.partnerId;

  let hasActiveAloApplication = false;
  if (studentId) {
    const applications = await db.application
      .findMany({ where: { studentId }, select: { stage: true } })
      .catch(() => [] as Array<{ stage: string }>);
    hasActiveAloApplication = applications.some((application) =>
      SUBMITTED_STAGES.has(String(application.stage || '').trim()),
    );
  }

  return {
    studentId,
    studentProfileId,
    facts: {
      studentId,
      counselorId: student?.counselorId || null,
      isPartnerStudent,
      // Only meaningful for partner students; ALO-direct students are governed by
      // the assignment and role checks alone.
      hasActiveAloApplication: isPartnerStudent ? hasActiveAloApplication : true,
      found: true,
    },
  };
}

/**
 * The guard used by the counselor and CRM document list endpoints.
 * Returns a ready-to-send refusal, or the resolved ids for the caller to query with.
 */
export async function authorizeStaffDocumentRead(
  actor: StaffDocumentActor,
  studentIdentifier: string,
): Promise<{ ok: true; resolved: ResolvedStudent; decision: DocumentAccessDecision } | { ok: false; status: number; error: string }> {
  if (!String(studentIdentifier || '').trim()) {
    return { ok: false, status: 400, error: 'studentId required' };
  }
  const resolved = await resolveStudentForDocuments(studentIdentifier);
  const decision = canStaffAccessStudentDocuments(actor, resolved.facts);
  if (!decision.allowed) {
    // 404 for a student that does not exist (do not confirm existence), 403 when it
    // exists but this actor may not see it.
    return { ok: false, status: resolved.facts.found === false ? 404 : 403, error: decision.reason };
  }
  return { ok: true, resolved, decision };
}

/** Guard for review actions (approve / reject / needs-update). */
export function requireDocumentReviewer(roles: string[]): { ok: true } | { ok: false; status: number; error: string } {
  if (!canReviewDocuments(roles)) {
    return {
      ok: false,
      status: 403,
      error: 'Your role cannot review documents. Document review is limited to the application, visa and document teams and administrators.',
    };
  }
  return { ok: true };
}

/** Guard for the delete/archive operation (Admin and Super Admin only). */
export function requireDocumentDeletion(roles: string[]): { ok: true } | { ok: false; status: number; error: string } {
  if (!canDeleteDocuments(roles)) {
    return {
      ok: false,
      status: 403,
      error: 'Only an administrator may delete or archive a document.',
    };
  }
  return { ok: true };
}

/**
 * One merged, authorised list for a student: both document tables, one shape.
 * This is the fix for the split where a partner/portal upload was invisible to the
 * counselor view and vice versa.
 */
export async function listStudentDocumentsUnified(params: {
  studentId: string;
  studentProfileId?: string | null;
  /** Include archived rows (admin history view). */
  includeArchived?: boolean;
}): Promise<NormalisedDocument[]> {
  const [studentDocuments, portalDocuments] = await Promise.all([
    db.studentDocument
      .findMany({
        where: { studentId: params.studentId, ...(params.includeArchived ? {} : { isArchived: false }) },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []),
    params.studentProfileId
      ? db.portalStudentDocument
          .findMany({ where: { studentProfileId: params.studentProfileId }, orderBy: { createdAt: 'desc' } })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  return mergeDocumentViews({
    studentDocuments: studentDocuments as never,
    portalDocuments: (portalDocuments as never[]).map((row: Record<string, unknown>) => ({
      ...row,
      studentId: params.studentId,
    })) as never,
  });
}

/**
 * Look up a document in either table by id, returning the owning ids only.
 * Used by review and delete endpoints so they cannot act on a row they did not
 * resolve. Returns which table the row came from so the write targets the same one.
 */
export async function findDocumentOwnership(
  id: string,
): Promise<{ source: 'student_document'; studentId: string; status: string } | { source: 'portal_student_document'; studentId: string; studentProfileId: string; status: string } | null> {
  const studentDocument = await db.studentDocument
    .findFirst({ where: { id }, select: { id: true, studentId: true, status: true } })
    .catch(() => null);
  if (studentDocument) {
    return { source: 'student_document', studentId: studentDocument.studentId, status: studentDocument.status };
  }

  const portalDocument = await db.portalStudentDocument
    .findFirst({ where: { id }, select: { id: true, studentProfileId: true, status: true, studentProfile: { select: { studentId: true } } } })
    .catch(() => null);
  if (portalDocument) {
    return {
      source: 'portal_student_document',
      studentId: portalDocument.studentProfile?.studentId || '',
      studentProfileId: portalDocument.studentProfileId,
      status: portalDocument.status,
    };
  }
  return null;
}

/** Re-exported so routes import the review vocabulary from one place. */
export { normaliseReviewState };
