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
  const reviewerNote = typeof body?.reviewerNote === 'string' ? body.reviewerNote.trim() : '';
  if (reviewerNote.length > 1000) return NextResponse.json({ success: false, error: 'Reviewer note must be at most 1000 characters.' }, { status: 400 });
  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.applicationDocument.findUnique({ where: { id: params.id } });
      if (!existing) return null;
      const application = await tx.application.findUnique({ where: { id: existing.applicationId } });
      if (!application) return null;
      if (!canReviewApplicationDocument(auth, application, existing)) throw new Error('DOCUMENT_ACCESS_DENIED');
      const isB2b = isB2bConfidentialApplication(application) || existing.isB2bConfidential === true || ['b2b_confidential', 'b2b_internal'].includes(String(existing.visibility || '').toLowerCase());
      if (existing.status === 'SUPERSEDED' || existing.status === 'LOCKED') throw new Error('DOCUMENT_IMMUTABLE');
      const reviewedAt = new Date();
      const studentDocument = existing.documentId
        ? await tx.studentDocument.findFirst({ where: { id: existing.documentId, studentId: existing.studentId, isArchived: false } })
        : null;
      const note = reviewerNote || 'Please upload a corrected document.';
      if (studentDocument) {
        await tx.studentDocument.update({
          where: { id: studentDocument.id },
          data: { status: 'needs_update', reviewerNote: note, rejectionReason: note, reviewedBy: auth.userId, reviewedAt },
        });
        await tx.documentAudit.create({
          data: { documentId: studentDocument.id, studentId: existing.studentId, actorId: auth.userId, actorName: auth.name || auth.email, actorRole: auth.roles[0] || '', action: 'request_again', previousStatus: studentDocument.status, newStatus: 'needs_update', note },
        });
        await syncStudentDocumentReadiness(tx, studentDocument.id, 'REQUEST_AGAIN', { reviewerId: auth.userId, reviewerNote: note });
      } else {
        await tx.applicationDocument.update({ where: { id: params.id }, data: { status: 'REQUEST_AGAIN', reviewerId: auth.userId, reviewerNote: note } });
        await refreshApplicationDocumentStatus(tx, existing.applicationId);
      }
      const updated = await tx.applicationDocument.findUnique({ where: { id: params.id } });
      await tx.applicationStatusLog.create({
        data: { applicationId: existing.applicationId, oldStatus: existing.status, newStatus: 'REQUEST_AGAIN', safeStatus: 'DOCUMENTS_REQUIRED', changedBy: auth.userId, visibility: isB2b ? 'B2B_CONFIDENTIAL' : 'public_safe', note: `Document ${existing.documentType} v${existing.version} needs a replacement: ${note}` },
      });
      await tx.auditLog.create({
        data: { userId: auth.userId, action: 'REQUEST_DOCUMENT_AGAIN', resource: 'ApplicationDocument', resourceId: params.id, details: JSON.stringify({ documentType: existing.documentType, version: existing.version, linkedStudentDocument: Boolean(studentDocument), reviewerNote: note }), actorRole: auth.roles[0] || '', studentId: existing.studentId },
      });
      return updated;
    });
    if (!result) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: sanitizeApplicationDocumentResponse(result as any), message: 'A replacement was requested; the current document version was preserved.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_ACCESS_DENIED') return NextResponse.json({ success: false, error: 'Forbidden: application document is outside your review scope.' }, { status: 403 });
    if (error instanceof Error && error.message === 'DOCUMENT_IMMUTABLE') return NextResponse.json({ success: false, error: 'A locked or superseded document cannot be requested again.' }, { status: 409 });
    console.error('[application-document-request-again] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Document review could not be completed.' }, { status: 503 });
  }
});
