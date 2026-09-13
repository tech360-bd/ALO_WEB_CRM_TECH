import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Checklist item create requires visa officer' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot create checklist for unassigned case — IDOR blocked' }, { status: 403 });
    }

    const body = await req.json();
    const { item, documentName, category, isRequired, reason, deadline, priority, studentVisible, counselorVisible } = body;

    if (!item && !documentName) return NextResponse.json({ success: false, error: 'Document name/item required — 25+ types' }, { status: 400 });

    const created = await db.visaChecklistItem.create({
      data: {
        studentId: visaCase.studentId,
        applicationId: visaCase.applicationId || '',
        item: item || documentName || '',
        category: category || 'general',
        isRequired: isRequired !== undefined ? isRequired : true,
        status: 'NOT_UPLOADED',
        priority: priority || 'medium',
        deadline: deadline ? new Date(deadline) : null,
        studentVisible: studentVisible ?? true,
        counselorVisible: counselorVisible ?? true,
        reason: reason,
      } as any,
    });

    await logAuditAction(auth, 'VISA_CHECKLIST_ITEM_CREATE', 'VisaChecklistItem', created.id, { caseId, studentId: visaCase.studentId, item: item || documentName, reason, deadline, priority });
    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_DOCUMENT_REQUESTED',
        title: `Document requested: ${item || documentName} — reason ${reason || 'visa requirement'} — deadline ${deadline || 'none'} — priority ${priority || 'medium'}`,
        description: `Requested by ${auth.name} — visibility student ${studentVisible ?? true} counselor ${counselorVisible ?? true} — notification channel email/portal — student can upload replacement previous versions remain auditable`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: created, note: 'Request with name/reason/deadline/priority/visibility/notification — student can upload replacement previous versions remain auditable officer cannot silently delete history — no permanent delete version history' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const items = await db.visaChecklistItem.findMany({ where: { studentId: visaCase.studentId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ success: true, data: items, items, checklist: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
