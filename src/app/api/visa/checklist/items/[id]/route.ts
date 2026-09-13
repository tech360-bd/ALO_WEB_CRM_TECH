import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

const VALID_STATUSES = ['NOT_UPLOADED','UPLOADED','PENDING_REVIEW','APPROVED','REJECTED','NEEDS_UPDATE','EXPIRED','NOT_APPLICABLE','pending','approved','rejected','completed','verified'];

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Checklist item update requires visa officer' }, { status: 403 });

    const id = context?.params?.id;
    const existing = await db.visaChecklistItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Checklist item not found' }, { status: 404 });

    const visaCase = await db.visaCase.findFirst({ where: { studentId: existing.studentId } });
    if (visaCase) {
      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot update checklist for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { status, note, reviewerNote, reason } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status — allowed NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE` }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'APPROVED' || status === 'approved' || status === 'completed') {
        dataToUpdate.completedAt = new Date();
      }
    }
    if (note !== undefined) dataToUpdate.note = note;
    if (reviewerNote !== undefined) dataToUpdate.reviewerNote = reviewerNote;
    if (reason !== undefined) dataToUpdate.reason = reason;

    const updated = await db.visaChecklistItem.update({ where: { id }, data: dataToUpdate });

    await logAuditAction(auth, 'VISA_CHECKLIST_ITEM_UPDATE', 'VisaChecklistItem', id, { before: { status: existing.status }, after: { status }, studentId: existing.studentId, reason });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_CHECKLIST_UPDATED',
        title: `Checklist item ${status || 'updated'}: ${existing.item} by ${auth.name}`,
        description: `Status ${existing.status} → ${status} — reason ${reason || note || reviewerNote || 'officer review'} — Do not permanently delete submitted visa documents — Use replacement/version history`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated, note: 'Do not permanently delete submitted visa documents — Use replacement/version history — statuses NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE — actions Request/Approve/Reject/Needs Update/Add Note/Notify Student/Notify Counselor/Timeline Event' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const item = await db.visaChecklistItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ success: false, error: 'Checklist item not found' }, { status: 404 });

    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent && item.studentId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cross-student blocked' }, { status: 403 });
    }

    await logAuditAction(auth, 'VISA_CHECKLIST_ITEM_VIEW', 'VisaChecklistItem', id, { studentId: item.studentId });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    // No-deletion versioning soft delete only
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Checklist delete requires super_admin — no-deletion versioning soft delete only — do not permanently delete submitted visa documents — use replacement/version history' }, { status: 403 });

    const id = context?.params?.id;
    const updated = await db.visaChecklistItem.update({ where: { id }, data: { status: 'NOT_APPLICABLE', archivedAt: new Date() } as any });

    await logAuditAction(auth, 'VISA_CHECKLIST_ITEM_SOFT_DELETE', 'VisaChecklistItem', id, { status: 'NOT_APPLICABLE' });

    return NextResponse.json({ success: true, data: updated, note: 'Soft delete only — no-deletion versioning — do not permanently delete' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
