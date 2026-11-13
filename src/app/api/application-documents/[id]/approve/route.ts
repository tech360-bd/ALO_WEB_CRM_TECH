import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { refreshApplicationDocumentStatus, syncStudentDocumentReadiness } from '@/lib/application-manager/document-readiness';
import { canReviewApplicationDocument, isB2bConfidentialApplication, sanitizeApplicationDocumentResponse } from '@/lib/application-manager/document-security';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const canReview = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.review_documents');
  const isPartner = Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  if (!canReview || isPartner) return NextResponse.json({ success: false, error: 'Forbidden: review_documents permission required' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reviewerNote = typeof body?.reviewerNote === 'string' ? body.reviewerNote.trim().slice(0, 1000) : 'Verified';
  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.applicationDocument.findUnique({ where: { id: params.id } });
      if (!existing) return null;
      const application = await tx.application.findUnique({ where: { id: existing.applicationId } });
      if (!application) return null;
      if (!canReviewApplicationDocument(auth, application, existing)) throw new Error('DOCUMENT_ACCESS_DENIED');
      const isB2b = isB2bConfidentialApplication(application) || existing.isB2bConfidential === true || ['b2b_confidential', 'b2b_internal'].includes(String(existing.visibility || '').toLowerCase());
      if (existing.status === 'SUPERSEDED') throw new Error('DOCUMENT_SUPERSEDED');
      const reviewedAt = new Date();
      const studentDocument = existing.documentId
        ? await tx.studentDocument.findFirst({ where: { id: existing.documentId, studentId: existing.studentId, isArchived: false } })
        : null;
      if (studentDocument) {
        await tx.studentDocument.update({
          where: { id: studentDocument.id },
          data: { status: 'approved', reviewerNote, reviewedBy: auth.userId, reviewedAt },
        });
        await tx.documentAudit.create({
          data: { documentId: studentDocument.id, studentId: existing.studentId, actorId: auth.userId, actorName: auth.name || auth.email, actorRole: auth.roles[0] || '', action: 'approve', previousStatus: studentDocument.status, newStatus: 'approved', note: reviewerNote },
        });
        await syncStudentDocumentReadiness(tx, studentDocument.id, 'VERIFIED', { reviewerId: auth.userId, reviewerNote });
      } else {
        await tx.applicationDocument.update({
          where: { id: params.id },
          data: { status: 'VERIFIED', reviewerId: auth.userId, reviewerNote },
        });
        await refreshApplicationDocumentStatus(tx, existing.applicationId);
      }
      const updated = await tx.applicationDocument.findUnique({ where: { id: params.id } });
      await tx.applicationStatusLog.create({
        data: { applicationId: existing.applicationId, oldStatus: existing.status, newStatus: 'VERIFIED', safeStatus: 'UNDER_REVIEW', changedBy: auth.userId, visibility: isB2b ? 'B2B_CONFIDENTIAL' : 'internal', note: `Document ${existing.documentType} v${existing.version} verified` },
      });
      await tx.auditLog.create({
        data: { userId: auth.userId, action: 'APPROVE_DOCUMENT', resource: 'ApplicationDocument', resourceId: params.id, details: JSON.stringify({ documentType: existing.documentType, version: existing.version, linkedStudentDocument: Boolean(studentDocument), reviewerNote }), actorRole: auth.roles[0] || '', studentId: existing.studentId },
      });
      return updated;
    });
    if (!result) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: sanitizeApplicationDocumentResponse(result as any), message: 'Document approved; application readiness recalculated.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_ACCESS_DENIED') return NextResponse.json({ success: false, error: 'Forbidden: application document is outside your review scope.' }, { status: 403 });
    if (error instanceof Error && error.message === 'DOCUMENT_SUPERSEDED') return NextResponse.json({ success: false, error: 'A superseded document version cannot be reviewed.' }, { status: 409 });
    console.error('[application-document-approve] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Document review could not be completed.' }, { status: 503 });
  }
});
