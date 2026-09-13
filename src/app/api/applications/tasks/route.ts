import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const assignedTo = searchParams.get('assignedTo');
  const applicationId = searchParams.get('applicationId');
  const priority = searchParams.get('priority');

  const where: any = {};
  if (status) where.status = status;
  if (assignedTo) where.assignedTo = assignedTo;
  if (applicationId) where.applicationId = applicationId;
  if (priority) where.priority = priority;

  // Non-manager sees only own tasks
  const roles = auth.roles.map(r => r.toLowerCase());
  const isManager = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team');
  if (!isManager) {
    where.assignedTo = auth.userId;
  }

  const tasks = await db.applicationTask.findMany({
    where,
    include: { application: { select: { applicationCode: true, studentId: true, universityName: true, courseName: true } } },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json({ success: true, data: tasks, tasks });
});

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  if (!body.applicationId || !body.taskTitle) {
    return NextResponse.json({ success: false, error: 'applicationId and taskTitle required' }, { status: 400 });
  }

  const task = await db.applicationTask.create({
    data: {
      applicationId: body.applicationId,
      taskTitle: body.taskTitle,
      taskDescription: body.taskDescription || '',
      assignedTo: body.assignedTo || auth.userId,
      assignedToName: body.assignedToName || auth.name,
      priority: body.priority || 'MEDIUM',
      status: body.status || 'PENDING',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      createdBy: auth.userId,
    },
  });

  await logAuditAction(auth, 'CREATE_TASK', 'ApplicationTask', task.id);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'CREATE_TASK',
      resource: 'ApplicationTask',
      resourceId: task.id,
      details: JSON.stringify({ applicationId: body.applicationId, taskTitle: body.taskTitle }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: task, task });
});
