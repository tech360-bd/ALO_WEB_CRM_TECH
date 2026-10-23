import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, isVisaSuperAdmin } from '@/lib/visa/access';

const statusValues = ['NOT_UPLOADED', 'UPLOADED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_UPDATE', 'EXPIRED', 'NOT_APPLICABLE', 'pending', 'approved', 'rejected', 'completed', 'verified'] as const;
const updateSchema = z.object({
  status: z.enum(statusValues).optional(),
  note: z.string().trim().max(1000).optional(),
  reviewerNote: z.string().trim().max(1000).optional(),
  reason: z.string().trim().max(1000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'At least one checklist field is required.' });

function auditData(auth: AuthContext, action: string, itemId: string, caseId: string, studentId: string, metadata: Record<string, unknown> = {}) {
  return {
    actorUserId: auth.actorUserId,
    action,
    entityType: 'VisaChecklistItem',
    entityId: itemId,
    metadata: JSON.stringify({ caseId, studentId, ...metadata }),
    ipAddress: '',
    userAgent: '',
  };
}

async function loadAuthorizedItem(auth: AuthContext, itemId: unknown, permission: string) {
  if (typeof itemId !== 'string' || !itemId.trim()) return { error: NextResponse.json({ success: false, error: 'Checklist item ID required.' }, { status: 400 }) };
  const item = await db.visaChecklistItem.findUnique({ where: { id: itemId } });
  if (!item || item.archivedAt || !item.caseId) return { error: NextResponse.json({ success: false, error: 'Checklist item not found.' }, { status: 404 }) };
  const visaCase = await db.visaCase.findUnique({ where: { id: item.caseId } });
  if (!visaCase || visaCase.studentId !== item.studentId) return { error: NextResponse.json({ success: false, error: 'Checklist item not found.' }, { status: 404 }) };
  if (!canManageVisaPermission(auth, permission, visaCase)) {
    return { error: NextResponse.json({ success: false, error: `Assigned case and ${permission} permission required.` }, { status: 403 }) };
  }
  return { item, visaCase };
}

function safeItem(item: any) {
  return {
    id: item.id,
    caseId: item.caseId,
    studentId: item.studentId,
    item: item.item,
    documentName: item.documentName,
    category: item.category,
    isRequired: item.isRequired,
    status: item.status,
    priority: item.priority,
    deadline: item.deadline,
    reason: item.reason,
    note: item.note,
    reviewerNote: item.reviewerNote,
    studentVisible: item.studentVisible,
    counselorVisible: item.counselorVisible,
    completedAt: item.completedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const result = await loadAuthorizedItem(auth, context?.params?.id, 'visa.documents.view');
    if ('error' in result) return result.error;
    const { item, visaCase } = result;
    await db.portalAuditLog.create({ data: auditData(auth, 'VISA_CHECKLIST_ITEM_VIEW', item.id, visaCase.id, visaCase.studentId, { status: item.status }) });
    return NextResponse.json({ success: true, data: safeItem(item) }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Checklist item could not be audited or loaded.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const result = await loadAuthorizedItem(auth, context?.params?.id, 'visa.documents.review');
    if ('error' in result) return result.error;
    const { item, visaCase } = result;
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid checklist update.', details: parsed.error.flatten() }, { status: 400 });

    const update: Record<string, any> = { ...parsed.data };
    if (['APPROVED', 'approved', 'completed', 'verified'].includes(parsed.data.status || '')) update.completedAt = new Date();
    const updated = await db.$transaction(async (tx) => {
      const saved = await tx.visaChecklistItem.update({ where: { id: item.id }, data: update });
      await tx.portalAuditLog.create({
        data: auditData(auth, 'VISA_CHECKLIST_ITEM_UPDATE', item.id, visaCase.id, visaCase.studentId, {
          changedFields: Object.keys(parsed.data),
          before: { status: item.status },
          after: { status: saved.status },
        }),
      });
      await tx.timelineEvent.create({
        data: {
          studentId: visaCase.studentId,
          stage: 'VISA_CHECKLIST_UPDATED',
          title: 'A visa checklist item was updated.',
          description: 'Checklist status and review details are available in the authorized case workspace.',
          actor: auth.actorUserId,
        },
      });
      return saved;
    });
    return NextResponse.json({ success: true, data: safeItem(updated) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Checklist item could not be updated; any audit failure rolled back.' }, { status: 503 });
  }
});

export const DELETE = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    if (!isVisaSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Only SUPER_ADMIN may archive a checklist item.' }, { status: 403 });
    const result = await loadAuthorizedItem(auth, context?.params?.id, 'visa.documents.review');
    if ('error' in result) return result.error;
    const { item, visaCase } = result;
    const archived = await db.$transaction(async (tx) => {
      const saved = await tx.visaChecklistItem.update({ where: { id: item.id }, data: { status: 'NOT_APPLICABLE', archivedAt: new Date() } });
      await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_CHECKLIST_ITEM_ARCHIVE', item.id, visaCase.id, visaCase.studentId, { previousStatus: item.status }) });
      return saved;
    });
    return NextResponse.json({ success: true, data: safeItem(archived) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Checklist item could not be archived; any audit failure rolled back.' }, { status: 503 });
  }
});
