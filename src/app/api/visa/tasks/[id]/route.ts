import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Task update requires visa officer — tasks.update' }, { status: 403 });

    const id = context?.params?.id;
    const existing = await db.visaTask.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    if (existing.caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: existing.caseId } });
      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      if (!isSuper && visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot update task for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { status, title, description, assignedTo, dueDate, priority, owner } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (assignedTo !== undefined) dataToUpdate.assignedTo = assignedTo;
    if (owner !== undefined) dataToUpdate.assignedTo = owner;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) dataToUpdate.priority = priority;

    const updated = await db.visaTask.update({ where: { id }, data: dataToUpdate });

    await logAuditAction(auth, 'VISA_TASK_UPDATE', 'VisaTask', id, { before: existing, after: dataToUpdate, studentId: existing.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_TASK_UPDATED',
        title: `Task updated: ${title || existing.title} — status ${status || existing.status} — by ${auth.name}`,
        description: `Task system — owner/priority/deadline/status/createdBy/caseId/studentId — overdue appears in dashboard`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const task = await db.visaTask.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isSuper && isVisa && task.caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: task.caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot view task for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    await logAuditAction(auth, 'VISA_TASK_VIEW', 'VisaTask', id, { studentId: task.studentId });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    // No-deletion versioning soft delete only — do not permanently delete
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Task delete requires super_admin — no-deletion versioning soft delete only — do not permanently delete submitted visa documents — use replacement/version history' }, { status: 403 });

    const id = context?.params?.id;
    const updated = await db.visaTask.update({ where: { id }, data: { status: 'archived', archivedAt: new Date() } as any });

    await logAuditAction(auth, 'VISA_TASK_SOFT_DELETE', 'VisaTask', id, { status: 'archived' });

    return NextResponse.json({ success: true, data: updated, note: 'Soft delete only — no-deletion versioning — do not permanently delete' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
