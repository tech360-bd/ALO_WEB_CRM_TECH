import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { refreshApplicationDocumentStatus, syncStudentDocumentReadiness } from '@/lib/application-manager/document-readiness';
import { validateRejection, REJECTION_REASONS, rejectionReasonLabel } from '@/lib/documents/document-rejection';
import { canReviewApplicationDocument, isB2bConfidentialApplication, sanitizeApplicationDocumentResponse } from '@/lib/application-manager/document-security';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const canReview = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.review_documents');
  const isPartner = Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  if (!canReview || isPartner) return NextResponse.json({ success: false, error: 'Forbidden: review_documents permission required' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reasonCode = typeof body?.reasonCode === 'string' ? body.reasonCode.trim().toUpperCase() : '';
  const note = typeof body?.reviewerNote === 'string' ? body.reviewerNote.trim().slice(0, 1000) : '';
  const verdictSource = await db.applicationDocument.findUnique({ where: { id: params.id } });
  if (!verdictSource) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
  const sourceApplication = await db.application.findUnique({ where: { id: verdictSource.applicationId } });
  if (!sourceApplication || !canReviewApplicationDocument(auth, sourceApplication, verdictSource)) {
    return NextResponse.json({ success: false, error: 'Forbidden: application document is outside your review scope.' }, { status: 403 });
  }
  const verdict = validateRejection(verdictSource.status, reasonCode, note);
  if (!verdict.ok) return NextResponse.json({ success: false, code: verdict.code, error: verdict.error, allowedReasons: REJECTION_REASONS }, { status: verdict.httpStatus });
  const reasonLabel = rejectionReasonLabel(reasonCode);
  const reviewerNote = `[${reasonCode}] ${note || reasonLabel}`;

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.applicationDocument.findUnique({ where: { id: params.id } });
      if (!existing) return null;
      const application = await tx.application.findUnique({ where: { id: existing.applicationId } });
      if (!application) return null;
      if (!canReviewApplicationDocument(auth, application, existing)) throw new Error('DOCUMENT_ACCESS_DENIED');
      const isB2b = isB2bConfidentialApplication(application) || existing.isB2bConfidential === true || ['b2b_confidential', 'b2b_internal'].includes(String(existing.visibility || '').toLowerCase());
      if (existing.status !== verdictSource.status || existing.version !== verdictSource.version) throw new Error('DOCUMENT_CHANGED');
      if (existing.status === 'SUPERSEDED') throw new Error('DOCUMENT_SUPERSEDED');
      const reviewedAt = new Date();
      const studentDocument = existing.documentId
        ? await tx.studentDocument.findFirst({ where: { id: existing.documentId, studentId: existing.studentId, isArchived: false } })
        : null;
      if (studentDocument) {
        await tx.studentDocument.update({
          where: { id: studentDocument.id },
          data: { status: 'rejected', rejectionReason: note || reasonLabel, reviewerNote, reviewedBy: auth.userId, reviewedAt },
        });
        await tx.documentAudit.create({
          data: { documentId: studentDocument.id, studentId: existing.studentId, actorId: auth.userId, actorName: auth.name || auth.email, actorRole: auth.roles[0] || '', action: 'reject', previousStatus: studentDocument.status, newStatus: 'rejected', note: reviewerNote },
        });
        await syncStudentDocumentReadiness(tx, studentDocument.id, 'REJECTED', { reviewerId: auth.userId, reviewerNote });
      } else {
        await tx.applicationDocument.update({ where: { id: params.id }, data: { status: 'REJECTED', reviewerId: auth.userId, reviewerNote } });
        await refreshApplicationDocumentStatus(tx, existing.applicationId);
      }
      const updated = await tx.applicationDocument.findUnique({ where: { id: params.id } });
      await tx.applicationStatusLog.create({
        data: { applicationId: existing.applicationId, oldStatus: existing.status, newStatus: 'REJECTED', safeStatus: 'DOCUMENTS_REQUIRED', changedBy: auth.userId, visibility: isB2b ? 'B2B_CONFIDENTIAL' : 'internal', note: `Document ${existing.documentType} v${existing.version} rejected (${reasonCode}): ${note || reasonLabel}` },
      });
      await tx.auditLog.create({
        data: { userId: auth.userId, action: 'REJECT_DOCUMENT', resource: 'ApplicationDocument', resourceId: params.id, details: JSON.stringify({ reasonCode, reason: note || reasonLabel, version: existing.version, documentType: existing.documentType, linkedStudentDocument: Boolean(studentDocument) }), actorRole: auth.roles[0] || '', studentId: existing.studentId },
      });
      return updated;
    });
    if (!result) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: sanitizeApplicationDocumentResponse(result as any), message: `Document v${verdictSource.version} rejected; the existing file version was preserved.` });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_ACCESS_DENIED') return NextResponse.json({ success: false, error: 'Forbidden: application document is outside your review scope.' }, { status: 403 });
    if (error instanceof Error && error.message === 'DOCUMENT_CHANGED') return NextResponse.json({ success: false, code: 'CONCURRENT_UPDATE', error: 'The document changed during review. Reload and try again.' }, { status: 409 });
    if (error instanceof Error && error.message === 'DOCUMENT_SUPERSEDED') return NextResponse.json({ success: false, code: 'SUPERSEDED_IMMUTABLE', error: 'A superseded document version cannot be reviewed.' }, { status: 409 });
    console.error('[application-document-reject] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Document review could not be completed.' }, { status: 503 });
  }
});
