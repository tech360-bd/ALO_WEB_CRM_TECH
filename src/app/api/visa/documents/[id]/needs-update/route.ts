import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { syncStudentDocumentReadiness } from '@/lib/application-manager/document-readiness';
import { loadAuthorizedVisaDocument } from '@/lib/visa/document-access';

const schema = z.object({
  reason: z.string().trim().min(5).max(1000),
  reviewerNote: z.string().trim().max(1000).default(''),
  nextAction: z.string().trim().max(500).default('Upload a corrected document version.'),
  dueDate: z.string().datetime().optional(),
}).strict();
const unsafeReason = /\b(?:internal risk|confidential|medical condition|criminal record|staff criticism|guarantee approval|100\s*%\s*success)\b/i;

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Document ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaDocument(auth, id, 'visa.documents.review');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    if (['approved', 'verified', 'locked'].includes(access.document.status.toLowerCase())) return NextResponse.json({ success: false, code: 'VERIFIED_IMMUTABLE', error: 'An approved document cannot be changed without an audited supersede workflow.' }, { status: 409 });
    if (access.document.status.toLowerCase() === 'needs_update') return NextResponse.json({ success: false, code: 'ALREADY_REQUESTED', error: 'A replacement has already been requested for this document version.' }, { status: 409 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'A supportive, student-safe reason and next action are required.', details: parsed.error.flatten() }, { status: 400 });
    if (unsafeReason.test(`${parsed.data.reason}\n${parsed.data.nextAction}`)) return NextResponse.json({ success: false, error: 'Student-facing guidance contains restricted or unsupported language.' }, { status: 400 });
    const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

    const updated = await db.$transaction(async (tx) => {
      const changed = await tx.studentDocument.updateMany({ where: { id, status: access.document.status, isArchived: false }, data: { status: 'needs_update', reviewerNote: parsed.data.reviewerNote, rejectionReason: parsed.data.reason, reviewedBy: auth.actorUserId, reviewedAt: new Date() } });
      if (changed.count !== 1) throw new Error('DOCUMENT_CHANGED');
      const document = await tx.studentDocument.findUnique({ where: { id }, select: { id: true, studentId: true, caseId: true, category: true, fileName: true, fileSize: true, status: true, version: true, reviewedAt: true, reviewedBy: true } });
      if (!document) throw new Error('DOCUMENT_NOT_FOUND');

      const duplicateTask = await tx.visaTask.findFirst({ where: { studentId: access.document.studentId, caseId: access.visaCase.id, taskType: 'DOCUMENT_REQUEST', status: { in: ['pending', 'in_progress'] }, description: { contains: `documentId=${id}` } }, select: { id: true } });
      if (!duplicateTask) {
        await tx.visaTask.create({ data: { caseId: access.visaCase.id, studentId: access.document.studentId, taskType: 'DOCUMENT_REQUEST', title: 'Visa document replacement requested.', description: `documentId=${id}; ${parsed.data.reason} Next action: ${parsed.data.nextAction}`, assignedTo: 'student', dueDate, status: 'pending', priority: 'high', createdBy: auth.actorUserId } });
      }
      await tx.documentAudit.create({ data: { documentId: id, studentId: access.document.studentId, actorId: auth.actorUserId, actorName: auth.actorName || auth.name, actorRole: auth.roles[0] || '', action: 'request_update', previousStatus: access.document.status, newStatus: 'needs_update', note: parsed.data.reviewerNote } });
      await syncStudentDocumentReadiness(tx, id, 'REQUEST_AGAIN', { reviewerId: auth.actorUserId, reviewerNote: parsed.data.reviewerNote });
      await tx.studentMessage.create({ data: { studentId: access.document.studentId, senderType: 'visa_team', senderName: auth.actorName || auth.name || 'Visa Team', message: `Please provide an updated document. ${parsed.data.reason} ${parsed.data.nextAction}`, channel: 'portal', isRead: false } });
      await tx.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_DOCUMENT_NEEDS_UPDATE', entityType: 'StudentDocument', entityId: id, metadata: JSON.stringify({ caseId: access.visaCase.id, studentId: access.document.studentId, before: { status: access.document.status }, after: { status: 'needs_update' }, reasonLength: parsed.data.reason.length, nextAction: parsed.data.nextAction, dueDate }), ipAddress: '', userAgent: '' } });
      await tx.timelineEvent.create({ data: { studentId: access.document.studentId, stage: 'VISA_DOCUMENT_NEEDS_UPDATE', title: 'A visa document replacement was requested.', description: 'Student-safe guidance is available in the authenticated portal. Previous file versions remain retained.', actor: auth.actorUserId } });
      return document;
    });
    return NextResponse.json({ success: true, data: updated, externalDelivery: false, note: 'The uploaded file remains retained; any replacement creates a new version.' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_CHANGED') return NextResponse.json({ success: false, code: 'CONCURRENT_UPDATE', error: 'The document changed during review. Reload and retry.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Document review could not be completed; audit failure rolled back.' }, { status: 503 });
  }
});
