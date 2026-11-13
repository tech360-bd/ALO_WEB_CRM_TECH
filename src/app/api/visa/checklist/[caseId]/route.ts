import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, canViewVisaSensitive } from '@/lib/visa/access';

const createSchema = z.object({
  item: z.string().trim().max(191).optional(),
  documentName: z.string().trim().max(191).optional(),
  category: z.string().trim().max(80).default('general'),
  isRequired: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  deadline: z.string().trim().max(40).optional(),
  reason: z.string().trim().max(1000).default(''),
  studentVisible: z.boolean().default(true),
  counselorVisible: z.boolean().default(true),
}).strict().refine((value) => Boolean(value.item || value.documentName), { message: 'A document name is required.', path: ['documentName'] });

function auditData(auth: AuthContext, action: string, entityType: string, entityId: string, caseId: string, studentId: string, metadata: Record<string, unknown> = {}) {
  return {
    actorUserId: auth.actorUserId,
    action,
    entityType,
    entityId,
    metadata: JSON.stringify({ caseId, studentId, ...metadata }),
    ipAddress: '',
    userAgent: '',
  };
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.documents.view', visaCase)) {
      return NextResponse.json({ success: false, error: 'Assigned case and visa.documents.view permission required.' }, { status: 403 });
    }

    const items = await db.$transaction(async (tx) => {
      const rows = await tx.visaChecklistItem.findMany({
        where: { caseId: visaCase.id, studentId: visaCase.studentId, archivedAt: null },
        select: {
          id: true, caseId: true, studentId: true, item: true, documentName: true, category: true,
          isRequired: true, status: true, priority: true, deadline: true, studentVisible: true,
          counselorVisible: true, completedAt: true, createdAt: true, updatedAt: true,
        },
        orderBy: [{ deadline: 'asc' }, { createdAt: 'asc' }],
      });
      await tx.portalAuditLog.create({
        data: auditData(auth, 'VISA_CHECKLIST_VIEW', 'VisaChecklistItem', caseId, visaCase.id, visaCase.studentId, { count: rows.length }),
      });
      return rows;
    });

    return NextResponse.json({
      success: true,
      data: items,
      items,
      checklist: items,
      emptyState: items.length ? null : 'No checklist items are recorded for this case.',
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa checklist could not be audited or loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.documents.request', visaCase)) {
      return NextResponse.json({ success: false, error: 'Assigned case and visa.documents.request permission required.' }, { status: 403 });
    }
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid checklist request.', details: parsed.error.flatten() }, { status: 400 });
    if (/medical|criminal|sensitive/i.test(parsed.data.category) && !canViewVisaSensitive(auth, visaCase)) {
      return NextResponse.json({ success: false, error: 'Explicit sensitive-data permission is required for this document category.' }, { status: 403 });
    }
    const itemName = parsed.data.documentName || parsed.data.item || '';
    const deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
    if (deadline && Number.isNaN(deadline.getTime())) return NextResponse.json({ success: false, error: 'A valid deadline is required.' }, { status: 400 });

    const created = await db.$transaction(async (tx) => {
      const item = await tx.visaChecklistItem.create({
        data: {
          caseId: visaCase.id,
          studentId: visaCase.studentId,
          applicationId: visaCase.applicationId || '',
          item: itemName,
          documentName: itemName,
          category: parsed.data.category,
          isRequired: parsed.data.isRequired,
          status: 'NOT_UPLOADED',
          priority: parsed.data.priority,
          deadline,
          reason: parsed.data.studentVisible ? parsed.data.reason : '',
          studentVisible: parsed.data.studentVisible,
          counselorVisible: parsed.data.counselorVisible,
        },
      });
      await tx.portalAuditLog.create({
        data: auditData(auth, 'VISA_CHECKLIST_ITEM_CREATE', 'VisaChecklistItem', item.id, visaCase.id, visaCase.studentId, {
          item: itemName,
          category: parsed.data.category,
          isRequired: parsed.data.isRequired,
          priority: parsed.data.priority,
          studentVisible: parsed.data.studentVisible,
          counselorVisible: parsed.data.counselorVisible,
          deadline,
          reasonLength: parsed.data.reason.length,
        }),
      });
      await tx.timelineEvent.create({
        data: {
          studentId: visaCase.studentId,
          stage: 'VISA_DOCUMENT_REQUESTED',
          title: 'A visa checklist requirement was added.',
          description: 'The requirement is available through the authenticated visa workflow.',
          actor: auth.actorUserId,
        },
      });
      return item;
    });

    return NextResponse.json({ success: true, data: created, externalDelivery: false }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Checklist request could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
