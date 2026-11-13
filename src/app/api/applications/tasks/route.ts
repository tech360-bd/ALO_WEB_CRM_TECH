import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canManageB2B, canViewB2B } from '@/lib/application-manager/service';
import { applicationTaskScope, applicationTaskWhere, canManageTasks, canReadTasks, isTaskApplicationB2B } from '@/lib/application-manager/task-security';

const taskCreateSchema = z.object({
  applicationId: z.string().trim().min(1).max(191),
  taskTitle: z.string().trim().min(1).max(250),
  taskDescription: z.string().trim().max(5000).optional(),
  assignedTo: z.string().trim().max(191).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
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

export const GET = withAuth(async (req, auth) => {
  if (!canReadTasks(auth)) return NextResponse.json({ success: false, error: 'Forbidden: application task view permission required.' }, { status: 403 });
  const canSeeB2B = canViewB2B(auth.roles, auth.permissions);
  const scope = applicationTaskScope(auth);
  if (scope === null && !auth.permissions.includes('application.view_tasks')) return NextResponse.json({ success: false, error: 'Forbidden: application task scope required.' }, { status: 403 });
  const appScope = applicationTaskWhere(scope || {}, canSeeB2B);
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const assignedTo = url.searchParams.get('assignedTo');
  const applicationId = url.searchParams.get('applicationId');
  const priority = url.searchParams.get('priority');
  if (status && !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) return NextResponse.json({ success: false, error: 'Invalid task status.' }, { status: 400 });
  if (priority && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) return NextResponse.json({ success: false, error: 'Invalid task priority.' }, { status: 400 });
  if (applicationId && applicationId.length > 191) return NextResponse.json({ success: false, error: 'Invalid applicationId.' }, { status: 400 });
  const roles = auth.roles.map((role) => role.toLowerCase());
  const manager = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.manage_tasks');
  const where: Record<string, any> = { application: { is: appScope } };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (applicationId) where.applicationId = applicationId;
  if (manager) {
    if (assignedTo) where.assignedTo = assignedTo;
  } else {
    where.assignedTo = auth.userId;
  }
  try {
    const tasks = await db.applicationTask.findMany({
      where,
      include: { application: { select: { applicationCode: true, studentId: true, universityName: true, courseName: true } } },
      orderBy: { dueDate: 'asc' },
      take: 300,
    });
    if (canSeeB2B && applicationId) await logAuditAction(auth, 'VIEW_B2B_APPLICATION_TASKS', 'Application', applicationId, { count: tasks.length });
    const safe = tasks.map(taskResponse);
    return NextResponse.json({ success: true, data: safe, tasks: safe, meta: { canViewB2B: canSeeB2B } });
  } catch (error) {
    console.error('[application-tasks.get] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to load application tasks.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth) => {
  if (!canManageTasks(auth)) return NextResponse.json({ success: false, error: 'Forbidden: application task write permission required.' }, { status: 403 });
  const parsed = taskCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid task request.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const roles = auth.roles.map((role) => role.toLowerCase());
  const globalManager = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.view_all');
  const scope = applicationTaskScope(auth);
  if (scope === null && !auth.permissions.includes('application.create_task')) return NextResponse.json({ success: false, error: 'Forbidden: application is outside your task scope.' }, { status: 403 });
  const canSeeB2B = canViewB2B(auth.roles, auth.permissions);
  const appWhere = applicationTaskWhere(scope || {}, canSeeB2B);
  const application = await db.application.findFirst({ where: { AND: [{ id: body.applicationId }, appWhere] } });
  if (!application) return NextResponse.json({ success: false, error: 'Application not found in your authorized scope.' }, { status: 404 });
  if (isTaskApplicationB2B(application) && !canManageB2B(auth.roles, auth.permissions)) return NextResponse.json({ success: false, error: 'Forbidden: B2B task changes require management permission.' }, { status: 403 });
  const assigneeId = body.assignedTo || auth.userId;
  if (!globalManager && assigneeId !== auth.userId) return NextResponse.json({ success: false, error: 'Only managers may assign tasks to other users.' }, { status: 403 });
  const assignee = await db.user.findFirst({ where: { id: assigneeId, status: { in: ['ACTIVE', 'active'] } }, select: { id: true, name: true } });
  if (!assignee) return NextResponse.json({ success: false, error: 'Task assignee is invalid or inactive.' }, { status: 400 });
  const employee = await db.employee.findFirst({ where: { userId: assigneeId }, select: { name: true } });
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ success: false, error: 'Invalid dueDate.' }, { status: 400 });

  try {
    const task = await db.applicationTask.create({ data: {
      applicationId: body.applicationId,
      taskTitle: body.taskTitle,
      taskDescription: body.taskDescription || '',
      assignedTo: assigneeId,
      assignedToName: employee?.name || assignee.name || '',
      priority: body.priority,
      status: body.status,
      dueDate,
      createdBy: auth.userId,
    } });
    await logAuditAction(auth, 'CREATE_TASK', 'ApplicationTask', task.id, { applicationId: body.applicationId, assignedTo: assigneeId, status: task.status });
    await db.auditLog.create({ data: {
      userId: auth.userId,
      action: 'CREATE_TASK',
      resource: 'ApplicationTask',
      resourceId: task.id,
      details: JSON.stringify({ applicationId: body.applicationId, taskTitle: body.taskTitle, assignedTo: assigneeId }),
      actorRole: auth.roles[0] || '',
      studentId: application.studentId,
    } });
    return NextResponse.json({ success: true, data: taskResponse(task), task: taskResponse(task) }, { status: 201 });
  } catch (error) {
    console.error('[application-tasks.post] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to create application task.' }, { status: 503 });
  }
});
