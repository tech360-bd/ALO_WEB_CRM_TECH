import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { syncStudentDocumentReadiness } from '@/lib/application-manager/document-readiness';
import { loadAuthorizedVisaDocument } from '@/lib/visa/document-access';

const schema = z.object({ reviewerNote: z.string().trim().max(1000).default('') }).strict();
function auditData(auth: AuthContext, action: string, documentId: string, studentId: string, caseId: string, details: Record<string, unknown>) {
  return { actorUserId: auth.actorUserId, action, entityType: 'StudentDocument', entityId: documentId, metadata: JSON.stringify({ studentId, caseId, ...details }), ipAddress: '', userAgent: '' };
}

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Document ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaDocument(auth, id, 'visa.documents.review');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    if (['approved', 'verified', 'locked'].includes(access.document.status.toLowerCase())) return NextResponse.json({ success: false, error: 'This document version has already been approved and is immutable.' }, { status: 409 });
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid review note.', details: parsed.error.flatten() }, { status: 400 });

    const updated = await db.$transaction(async (tx) => {
      const changed = await tx.studentDocument.updateMany({ where: { id, status: access.document.status, isArchived: false }, data: { status: 'approved', reviewerNote: parsed.data.reviewerNote, reviewedBy: auth.actorUserId, reviewedAt: new Date() } });
      if (changed.count !== 1) throw new Error('DOCUMENT_CHANGED');
      const document = await tx.studentDocument.findUnique({ where: { id }, select: { id: true, studentId: true, caseId: true, category: true, fileName: true, fileSize: true, status: true, version: true, reviewedAt: true, reviewedBy: true } });
      if (!document) throw new Error('DOCUMENT_NOT_FOUND');
      await tx.documentAudit.create({ data: { documentId: id, studentId: access.document.studentId, actorId: auth.actorUserId, actorName: auth.actorName || auth.name, actorRole: auth.roles[0] || '', action: 'approve', previousStatus: access.document.status, newStatus: 'approved', note: parsed.data.reviewerNote } });
      await syncStudentDocumentReadiness(tx, id, 'VERIFIED', { reviewerId: auth.actorUserId, reviewerNote: parsed.data.reviewerNote });
      await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_DOCUMENT_APPROVED', id, access.document.studentId, access.visaCase.id, { before: { status: access.document.status }, after: { status: 'approved' }, reviewerNoteLength: parsed.data.reviewerNote.length }) });
      await tx.timelineEvent.create({ data: { studentId: access.document.studentId, stage: 'VISA_DOCUMENT_APPROVED', title: 'A visa document was approved after officer review.', description: 'The document remains in private storage with its version and review history.', actor: auth.actorUserId } });
      return document;
    });
    return NextResponse.json({ success: true, data: updated, note: 'The reviewed document remains private; its version and audit history are retained.' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_CHANGED') return NextResponse.json({ success: false, code: 'CONCURRENT_UPDATE', error: 'The document changed during review. Reload and retry.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Document review could not be completed; audit failure rolled back.' }, { status: 503 });
  }
});
