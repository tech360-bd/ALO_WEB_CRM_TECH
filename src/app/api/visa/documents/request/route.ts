import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, canViewVisaSensitive } from '@/lib/visa/access';

const schema = z.object({
  caseId: z.string().trim().min(1).max(191),
  documentName: z.string().trim().min(1).max(191),
  category: z.string().trim().min(1).max(80).default('general'),
  reason: z.string().trim().max(1000).default(''),
  description: z.string().trim().max(1500).default(''),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  studentVisible: z.boolean().default(true),
  counselorVisible: z.boolean().default(true),
}).strict();

const unsafeStudentCopy = /\b(?:internal risk|confidential|medical condition|criminal record|staff criticism|guarantee approval|guaranteed visa|100\s*%\s*success)\b/i;

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'A case, document name, and valid request details are required.', details: parsed.error.flatten() }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: parsed.data.caseId }, select: { id: true, studentId: true, applicationId: true, visaOfficerId: true, counselorId: true, applicationOfficerId: true } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.documents.request', visaCase)) return NextResponse.json({ success: false, error: 'Assigned case and visa.documents.request permission required.' }, { status: 403 });
    if (/medical|criminal|sensitive/i.test(parsed.data.category) && !canViewVisaSensitive(auth, visaCase)) {
      return NextResponse.json({ success: false, error: 'Explicit sensitive-data permission is required for this document category.' }, { status: 403 });
    }
    if (parsed.data.studentVisible && unsafeStudentCopy.test(parsed.data.reason)) {
      return NextResponse.json({ success: false, error: 'Student-facing request reasons must not contain restricted or unsupported language.' }, { status: 400 });
    }

    const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    const created = await db.$transaction(async (tx) => {
      const duplicate = await tx.visaChecklistItem.findFirst({
        where: { caseId: visaCase.id, studentId: visaCase.studentId, item: parsed.data.documentName, status: { notIn: ['approved', 'verified', 'complete', 'APPROVED', 'VERIFIED', 'COMPLETE'] }, archivedAt: null },
        select: { id: true },
      });
      if (duplicate) throw new Error('REQUEST_ALREADY_OPEN');
      const checklist = await tx.visaChecklistItem.create({
        data: {
          caseId: visaCase.id,
          studentId: visaCase.studentId,
          applicationId: visaCase.applicationId,
          item: parsed.data.documentName,
          documentName: parsed.data.documentName,
          category: parsed.data.category,
          isRequired: true,
          status: 'NOT_UPLOADED',
          priority: parsed.data.priority,
          deadline: dueDate,
          reason: parsed.data.studentVisible ? parsed.data.reason : '',
          note: '',
          reviewerNote: '',
          studentVisible: parsed.data.studentVisible,
          counselorVisible: parsed.data.counselorVisible,
        },
      });
      const task = await tx.visaTask.create({
        data: {
          caseId: visaCase.id,
          studentId: visaCase.studentId,
          taskType: 'DOCUMENT_REQUEST',
          title: `Document request: ${parsed.data.documentName}`,
          description: parsed.data.studentVisible ? (parsed.data.description || parsed.data.reason) : 'Restricted document request; details are visible only in the authorized visa workflow.',
          assignedTo: 'student',
          priority: parsed.data.priority,
          createdBy: auth.actorUserId,
          dueDate,
          status: 'pending',
        },
      });
      if (parsed.data.studentVisible) {
        const messageParts = [`The visa team requested: ${parsed.data.documentName}.`, parsed.data.reason && `Reason: ${parsed.data.reason}`, dueDate && `Requested by: ${dueDate.toISOString().slice(0, 10)}`].filter(Boolean);
        await tx.studentMessage.create({ data: { studentId: visaCase.studentId, senderType: 'visa_team', senderName: auth.actorName || auth.name || 'Visa Team', message: messageParts.join(' '), channel: 'portal', isRead: false } });
      }
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_DOCUMENT_REQUEST', entityType: 'VisaChecklistItem', entityId: checklist.id, metadata: JSON.stringify({ caseId: visaCase.id, studentId: visaCase.studentId, documentName: parsed.data.documentName, category: parsed.data.category, priority: parsed.data.priority, studentVisible: parsed.data.studentVisible, dueDate }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({ data: { studentId: visaCase.studentId, stage: 'VISA_DOCUMENT_REQUESTED', title: 'Visa checklist updated with a document request.', description: 'The request is available through the authenticated student portal. No external message delivery is represented.', actor: auth.actorUserId } });
      return { checklist, task };
    });
    return NextResponse.json({ success: true, data: created, externalDelivery: false }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_ALREADY_OPEN') return NextResponse.json({ success: false, error: 'An open checklist request already exists for this document.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Document request could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
