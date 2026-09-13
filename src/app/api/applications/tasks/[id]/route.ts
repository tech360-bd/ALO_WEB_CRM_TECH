import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth, { params }: any) => {
  const task = await db.applicationTask.findUnique({ where: { id: params.id }, include: { application: true } });
  if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

  const roles = auth.roles.map(r => r.toLowerCase());
  const isManager = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team');
  if (!isManager && task.assignedTo !== auth.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden: not assigned to you' }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: task, task });
});

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const existing = await db.applicationTask.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

  const roles = auth.roles.map(r => r.toLowerCase());
  const isManager = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team');
  if (!isManager && existing.assignedTo !== auth.userId && existing.createdBy !== auth.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden: cannot update task not assigned to you' }, { status: 403 });
  }

  const task = await db.applicationTask.update({
    where: { id: params.id },
    data: {
      taskTitle: body.taskTitle ?? existing.taskTitle,
      taskDescription: body.taskDescription ?? existing.taskDescription,
      assignedTo: body.assignedTo ?? existing.assignedTo,
      assignedToName: body.assignedToName ?? existing.assignedToName,
      priority: body.priority ?? existing.priority,
      status: body.status ?? existing.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
    },
  });

  await logAuditAction(auth, 'UPDATE_TASK', 'ApplicationTask', params.id, { status: body.status });
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'UPDATE_TASK',
      resource: 'ApplicationTask',
      resourceId: params.id,
      details: JSON.stringify({ status: body.status }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: task, task });
});

export const DELETE = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canDelete = roles.includes('super_admin') || roles.includes('application_manager') || auth.permissions.includes('application.delete');
  if (!canDelete) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const existing = await db.applicationTask.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

  await db.applicationTask.delete({ where: { id: params.id } });
  await logAuditAction(auth, 'DELETE_TASK', 'ApplicationTask', params.id);

  return NextResponse.json({ success: true, message: 'Task deleted' });
});
