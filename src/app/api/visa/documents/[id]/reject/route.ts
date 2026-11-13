import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { syncStudentDocumentReadiness } from '@/lib/application-manager/document-readiness';
import { loadAuthorizedVisaDocument } from '@/lib/visa/document-access';

const schema = z.object({
  reason: z.string().trim().min(5).max(1000),
  reviewerNote: z.string().trim().max(1000).default(''),
}).strict();
const unsafeReason = /\b(?:internal risk|confidential|medical condition|criminal record|staff criticism|guarantee approval|100\s*%\s*success)\b/i;

function auditData(auth: AuthContext, id: string, caseId: string, studentId: string, details: Record<string, unknown>) {
  return { actorUserId: auth.actorUserId, action: 'VISA_DOCUMENT_REJECTED', entityType: 'StudentDocument', entityId: id, metadata: JSON.stringify({ caseId, studentId, ...details }), ipAddress: '', userAgent: '' };
}

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Document ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaDocument(auth, id, 'visa.documents.review');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    if (['approved', 'verified', 'locked'].includes(access.document.status.toLowerCase())) return NextResponse.json({ success: false, error: 'An approved document version cannot be rejected; use an audited supersede workflow.' }, { status: 409 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'A supportive, student-safe replacement reason is required.', details: parsed.error.flatten() }, { status: 400 });
    if (unsafeReason.test(parsed.data.reason)) return NextResponse.json({ success: false, error: 'The student-facing reason contains restricted or unsupported language.' }, { status: 400 });

    const updated = await db.$transaction(async (tx) => {
      const changed = await tx.studentDocument.updateMany({ where: { id, status: access.document.status, isArchived: false }, data: { status: 'rejected', rejectionReason: parsed.data.reason, reviewerNote: parsed.data.reviewerNote, reviewedBy: auth.actorUserId, reviewedAt: new Date() } });
      if (changed.count !== 1) throw new Error('DOCUMENT_CHANGED');
      const document = await tx.studentDocument.findUnique({ where: { id }, select: { id: true, studentId: true, caseId: true, category: true, fileName: true, fileSize: true, status: true, version: true, reviewedAt: true, reviewedBy: true } });
      if (!document) throw new Error('DOCUMENT_NOT_FOUND');
      await tx.documentAudit.create({ data: { documentId: id, studentId: access.document.studentId, actorId: auth.actorUserId, actorName: auth.actorName || auth.name, actorRole: auth.roles[0] || '', action: 'reject', previousStatus: access.document.status, newStatus: 'rejected', note: parsed.data.reviewerNote } });
      await syncStudentDocumentReadiness(tx, id, 'REJECTED', { reviewerId: auth.actorUserId, reviewerNote: parsed.data.reviewerNote });
      await tx.studentMessage.create({ data: { studentId: access.document.studentId, senderType: 'visa_team', senderName: auth.actorName || auth.name || 'Visa Team', message: `A document needs an updated version. ${parsed.data.reason}`, channel: 'portal', isRead: false } });
      await tx.portalAuditLog.create({ data: auditData(auth, id, access.visaCase.id, access.document.studentId, { before: { status: access.document.status }, after: { status: 'rejected' }, reasonLength: parsed.data.reason.length, reviewerNoteLength: parsed.data.reviewerNote.length }) });
      await tx.timelineEvent.create({ data: { studentId: access.document.studentId, stage: 'VISA_DOCUMENT_REJECTED', title: 'A visa document review requires a replacement.', description: 'Student-safe guidance is available in the authenticated portal. Prior document versions remain retained.', actor: auth.actorUserId } });
      return document;
    });
    return NextResponse.json({ success: true, data: updated, externalDelivery: false }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_CHANGED') return NextResponse.json({ success: false, code: 'CONCURRENT_UPDATE', error: 'The document changed during review. Reload and retry.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Document review could not be completed; audit failure rolled back.' }, { status: 503 });
  }
});
