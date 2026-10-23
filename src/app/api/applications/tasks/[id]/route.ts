import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canManageB2B, canViewB2B } from '@/lib/application-manager/service';
import { applicationTaskScope, applicationTaskWhere, canManageTasks, canReadTasks, isTaskApplicationB2B } from '@/lib/application-manager/task-security';

const taskPatchSchema = z.object({
  taskTitle: z.string().trim().min(1).max(250).optional(),
  taskDescription: z.string().trim().max(5000).optional(),
  assignedTo: z.string().trim().max(191).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).nullable().optional(),
}).strict();

function taskResponse(task: any) {
  if (!task) return task;
  const { application, ...safe } = task;
  return { ...safe, ...(application ? { application: {
    applicationCode: application.applicationCode,
    studentId: application.studentId,
    universityName: application.universityName,
    courseName: application.courseName,
  } } : {}) };
}

async function loadTask(id: string) {
  return db.applicationTask.findUnique({
    where: { id },
    include: { application: { select: {
      id: true, applicationCode: true, studentId: true, universityName: true, courseName: true,
      isB2b: true, isB2bConfidential: true, applicationSource: true, stage: true,
      counselorId: true, applicationOfficer: true, appTeamOfficerId: true, visaOfficerId: true,
    } } },
  });
}

async function authorizeTask(task: any, actor: any, needsWrite: boolean): Promise<{ ok: boolean; status: number; error?: string }> {
  if (!task) return { ok: false, status: 404, error: 'Task not found.' };
  const roles = actor.roles.map((role: string) => role.toLowerCase());
  const manager = canManageTasks(actor);
  const canSeeB2B = canViewB2B(actor.roles, actor.permissions);
  if (isTaskApplicationB2B(task.application) && !canSeeB2B) return { ok: false, status: 403, error: 'Forbidden: B2B task access requires explicit permission.' };
  const scope = applicationTaskScope(actor);
  if (scope === null && !actor.permissions.includes('application.view_tasks') && !actor.permissions.includes('application.create_task')) {
    return { ok: false, status: 403, error: 'Forbidden: application task scope required.' };
  }
  const appScope = applicationTaskWhere(scope || {}, canSeeB2B);
  const inScope = await db.application.findFirst({ where: { AND: [{ id: task.applicationId }, appScope] }, select: { id: true } });
  if (!inScope) return { ok: false, status: 403, error: 'Forbidden: application is outside your task scope.' };
  if (!manager && task.assignedTo !== actor.userId) return { ok: false, status: 403, error: 'Forbidden: task is not assigned to you.' };
  if (needsWrite && isTaskApplicationB2B(task.application) && !canManageB2B(actor.roles, actor.permissions)) {
    return { ok: false, status: 403, error: 'Forbidden: B2B task changes require management permission.' };
  }
  return { ok: true, status: 200 };
}

export const GET = withAuth(async (_req, auth, { params }: any) => {
  if (!canReadTasks(auth)) return NextResponse.json({ success: false, error: 'Forbidden: application task view permission required.' }, { status: 403 });
  const task = await loadTask(params.id);
  const access = await authorizeTask(task, auth, false);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  if (task && canViewB2B(auth.roles, auth.permissions)) await logAuditAction(auth, 'VIEW_APPLICATION_TASK', 'ApplicationTask', task.id, { applicationId: task.applicationId, b2b: isTaskApplicationB2B(task.application) });
  return NextResponse.json({ success: true, data: taskResponse(task), task: taskResponse(task) });
});

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const parsed = taskPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid task update.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const existing = await loadTask(params.id);
  const access = await authorizeTask(existing, auth, true);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  if (!existing) return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
  const manager = canManageTasks(auth);
  if (!manager && (body.taskTitle !== undefined || body.assignedTo !== undefined || body.priority !== undefined || body.dueDate !== undefined)) {
    return NextResponse.json({ success: false, error: 'Only task managers may change title, assignee, priority, or due date.' }, { status: 403 });
  }
  if (body.assignedTo !== undefined) {
    const assignee = await db.user.findFirst({ where: { id: body.assignedTo, status: { in: ['ACTIVE', 'active'] } }, select: { id: true, name: true } });
    if (!assignee) return NextResponse.json({ success: false, error: 'Task assignee is invalid or inactive.' }, { status: 400 });
  }
  const dueDate = body.dueDate === undefined ? existing.dueDate : body.dueDate === null ? null : new Date(body.dueDate);
  if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ success: false, error: 'Invalid dueDate.' }, { status: 400 });
  try {
    const data: Record<string, any> = {
      ...(body.taskDescription !== undefined ? { taskDescription: body.taskDescription } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(manager && body.taskTitle !== undefined ? { taskTitle: body.taskTitle } : {}),
      ...(manager && body.assignedTo !== undefined ? { assignedTo: body.assignedTo, assignedToName: (await db.user.findUnique({ where: { id: body.assignedTo }, select: { name: true } }))?.name || '' } : {}),
      ...(manager && body.priority !== undefined ? { priority: body.priority } : {}),
      ...(manager && body.dueDate !== undefined ? { dueDate } : {}),
    };
    const updated = await db.applicationTask.update({ where: { id: params.id }, data });
    await logAuditAction(auth, 'UPDATE_TASK', 'ApplicationTask', params.id, { changedFields: Object.keys(data), status: updated.status });
    await db.auditLog.create({ data: {
      userId: auth.userId,
      action: 'UPDATE_TASK',
      resource: 'ApplicationTask',
      resourceId: params.id,
      details: JSON.stringify({ changedFields: Object.keys(data), status: updated.status }),
      actorRole: auth.roles[0] || '',
      studentId: existing.application.studentId,
    } });
    return NextResponse.json({ success: true, data: taskResponse(updated), task: taskResponse(updated) });
  } catch (error) {
    console.error('[application-task.patch] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to update application task.' }, { status: 503 });
  }
});

export const DELETE = withAuth(async (_req, auth, { params }: any) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const canDelete = roles.some((role) => ['super_admin', 'application_manager'].includes(role)) || auth.permissions.includes('application.delete_task') || auth.permissions.includes('application.delete');
  if (!canDelete) return NextResponse.json({ success: false, error: 'Forbidden: application task delete permission required.' }, { status: 403 });
  const existing = await loadTask(params.id);
  const access = await authorizeTask(existing, auth, true);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  if (!existing) return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
  try {
    await db.applicationTask.delete({ where: { id: params.id } });
    await logAuditAction(auth, 'DELETE_TASK', 'ApplicationTask', params.id, { applicationId: existing.applicationId });
    await db.auditLog.create({ data: {
      userId: auth.userId,
      action: 'DELETE_TASK',
      resource: 'ApplicationTask',
      resourceId: params.id,
      details: JSON.stringify({ applicationId: existing.applicationId }),
      actorRole: auth.roles[0] || '',
      studentId: existing.application.studentId,
    } });
    return NextResponse.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    console.error('[application-task.delete] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to delete application task.' }, { status: 503 });
  }
});
