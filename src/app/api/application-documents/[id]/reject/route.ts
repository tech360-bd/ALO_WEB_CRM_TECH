import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import {
  validateRejection,
  REJECTION_REASONS,
  rejectionReasonLabel,
} from '@/lib/documents/document-rejection';

// ============================================================================
// POST /api/application-documents/[id]/reject   (§136, §137, §138)
//
//  §136 Rejection NEVER increments the version. The next re-upload creates
//       the next version; old versions stay stored and auditable (immutable).
//  §137 VERIFIED/LOCKED documents are immutable — they can only be replaced
//       through the supersede workflow (new version + reason + elevated role).
//  §138 Rejection requires a predefined reason code (see REJECTION_REASONS)
//       and is fully audit-traceable.
// ============================================================================

export const POST = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map((r) => r.toLowerCase());
  const canReview =
    roles.includes('super_admin') ||
    roles.includes('application_manager') ||
    roles.includes('application_team') ||
    auth.permissions.includes('application.review_documents');
  if (!canReview) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: review_documents permission required' },
      { status: 403 },
    );
  }

  const body = await req.json();
  const reasonCode = String(body.reasonCode || '').toUpperCase();
  const reviewerNote = String(body.reviewerNote || '').trim();

  const existing = await db.applicationDocument.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

  // §137 state guard + §138 predefined-reason validation (pure rules lib)
  const verdict = validateRejection(existing.status, reasonCode, reviewerNote);
  if (!verdict.ok) {
    return NextResponse.json(
      { success: false, code: verdict.code, error: verdict.error, allowedReasons: REJECTION_REASONS },
      { status: verdict.httpStatus },
    );
  }

  const reasonLabel = rejectionReasonLabel(reasonCode);

  // §136 — no version increment on rejection; status + immutable audit fields only.
  const updated = await db.applicationDocument.update({
    where: { id: params.id },
    data: {
      status: 'REJECTED',
      reviewerId: auth.userId,
      reviewerNote: `[${reasonCode}] ${reviewerNote || reasonLabel}`,
    },
  });

  await db.applicationStatusLog.create({
    data: {
      applicationId: existing.applicationId,
      oldStatus: existing.status,
      newStatus: 'REJECTED',
      safeStatus: 'DOCUMENTS_REQUIRED',
      changedBy: auth.userId,
      visibility: 'internal',
      note: `Document ${existing.documentType} v${existing.version} rejected (${reasonCode}): ${reviewerNote || reasonLabel}`,
    },
  });

  await logAuditAction(auth, 'REJECT_DOCUMENT', 'ApplicationDocument', params.id, {
    reasonCode,
    reason: reviewerNote || reasonLabel,
    version: existing.version,
  });
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'REJECT_DOCUMENT',
      resource: 'ApplicationDocument',
      resourceId: params.id,
      details: JSON.stringify({
        reasonCode,
        reason: reviewerNote || reasonLabel,
        version: existing.version,
        documentType: existing.documentType,
      }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message:
      `Document rejected (v${existing.version} kept for audit). ` +
      `The next upload for this requirement becomes v${existing.version + 1}.`,
  });
});
