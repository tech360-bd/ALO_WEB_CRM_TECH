import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, isVisaSuperAdmin } from '@/lib/visa/access';

const ASSIGNEES = ['student', 'visa_officer', 'counselor', 'application_officer'] as const;
const updateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  title: z.string().trim().min(1).max(191).optional(),
  description: z.string().trim().max(2000).optional(),
  assignee: z.enum(ASSIGNEES).optional(),
  dueDate: z.string().trim().max(40).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
}).strict();

function resolveAssignee(visaCase: any, studentId: string, assignee: (typeof ASSIGNEES)[number]) {
  const id = assignee === 'student'
    ? studentId
    : assignee === 'visa_officer'
      ? visaCase.visaOfficerId
      : assignee === 'counselor'
        ? visaCase.counselorId
        : visaCase.applicationOfficerId;
  return typeof id === 'string' && id.trim() ? id : null;
}

function auditData(auth: AuthContext, action: string, entityId: string, caseId: string, studentId: string, metadata: Record<string, unknown>) {
  return {
    actorUserId: auth.actorUserId,
    action,
    entityType: 'VisaTask',
    entityId,
    metadata: JSON.stringify({ caseId, studentId, ...metadata }),
    ipAddress: '',
    userAgent: '',
  };
}

type ScopedTaskResult =
  | { ok: false; response: NextResponse }
  | { ok: true; task: NonNullable<Awaited<ReturnType<typeof db.visaTask.findUnique>>>; visaCase: NonNullable<Awaited<ReturnType<typeof db.visaCase.findUnique>>> };

async function loadScopedTask(auth: AuthContext, taskId: unknown): Promise<ScopedTaskResult> {
  if (typeof taskId !== 'string' || !taskId.trim()) return { ok: false, response: NextResponse.json({ success: false, error: 'Task ID required.' }, { status: 400 }) };
  const task = await db.visaTask.findUnique({ where: { id: taskId } });
  if (!task || !task.caseId) return { ok: false, response: NextResponse.json({ success: false, error: 'Visa task not found.' }, { status: 404 }) };
  const visaCase = await db.visaCase.findUnique({ where: { id: task.caseId } });
  if (!visaCase || visaCase.studentId !== task.studentId) return { ok: false, response: NextResponse.json({ success: false, error: 'Visa task not found.' }, { status: 404 }) };
  if (!canManageVisaPermission(auth, 'visa.tasks.view', visaCase)) return { ok: false, response: NextResponse.json({ success: false, error: 'Assigned case and visa.tasks.view permission required.' }, { status: 403 }) };
  return { ok: true, task, visaCase };
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const result = await loadScopedTask(auth, context?.params?.id);
    if (!result.ok) return result.response;
    const { task, visaCase } = result;
    await db.portalAuditLog.create({
      data: auditData(auth, 'VISA_TASK_VIEW', task.id, visaCase.id, visaCase.studentId, { status: task.status }),
    });
    return NextResponse.json({ success: true, data: task }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa task could not be audited or loaded.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const result = await loadScopedTask(auth, context?.params?.id);
    if (!result.ok) return result.response;
    const { task, visaCase } = result;
    if (!canManageVisaPermission(auth, 'visa.tasks.update', visaCase)) {
      return NextResponse.json({ success: false, error: 'Assigned case and visa.tasks.update permission required.' }, { status: 403 });
    }
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid task update.', details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });
    }

    const { assignee, dueDate: dueDateInput, ...fields } = parsed.data;
    const update: Record<string, any> = { ...fields };
    if (assignee) {
      const assignedTo = resolveAssignee(visaCase, visaCase.studentId, assignee);
      if (!assignedTo) return NextResponse.json({ success: false, error: 'The selected owner is not assigned to this case.' }, { status: 400 });
      update.assignedTo = assignedTo;
    }
    if (dueDateInput !== undefined) {
      const dueDate = dueDateInput ? new Date(dueDateInput) : null;
      if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ success: false, error: 'A valid task due date is required.' }, { status: 400 });
      update.dueDate = dueDate;
    }

    const updated = await db.$transaction(async (tx) => {
      const saved = await tx.visaTask.update({ where: { id: task.id }, data: update });
      await tx.portalAuditLog.create({
        data: auditData(auth, 'VISA_TASK_UPDATE', task.id, visaCase.id, visaCase.studentId, {
          changedFields: Object.keys(parsed.data),
          before: { status: task.status, priority: task.priority, dueDate: task.dueDate },
          after: { status: saved.status, priority: saved.priority, dueDate: saved.dueDate },
          descriptionLength: typeof parsed.data.description === 'string' ? parsed.data.description.length : undefined,
        }),
      });
      await tx.timelineEvent.create({
        data: {
          studentId: visaCase.studentId,
          stage: 'VISA_TASK_UPDATED',
          title: 'A visa case task was updated.',
          description: 'Task details remain in the authorized visa case workspace.',
          actor: auth.actorUserId,
        },
      });
      return saved;
    });
    return NextResponse.json({ success: true, data: updated }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa task could not be updated; any audit failure rolled back.' }, { status: 503 });
  }
});

export const DELETE = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    if (!isVisaSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Only SUPER_ADMIN may archive a task.' }, { status: 403 });
    const result = await loadScopedTask(auth, context?.params?.id);
    if (!result.ok) return result.response;
    const { task, visaCase } = result;
    const archived = await db.$transaction(async (tx) => {
      const saved = await tx.visaTask.update({ where: { id: task.id }, data: { status: 'cancelled', archivedAt: new Date() } });
      await tx.portalAuditLog.create({
        data: auditData(auth, 'VISA_TASK_ARCHIVE', task.id, visaCase.id, visaCase.studentId, { previousStatus: task.status }),
      });
      return saved;
    });
    return NextResponse.json({ success: true, data: archived }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa task could not be archived; any audit failure rolled back.' }, { status: 503 });
  }
});
