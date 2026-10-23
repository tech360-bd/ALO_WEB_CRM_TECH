import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission } from '@/lib/visa/access';

const TASK_TYPES = [
  'DOCUMENT_REQUEST',
  'INTERVIEW',
  'BANK_REVIEW',
  'SPONSOR_REVIEW',
  'REFUSAL_REVIEW',
  'STUDY_GAP_REVIEW',
  'COUNSELOR_ACTION',
  'APPLICATION_ACTION',
  'STUDENT_ACTION',
  'SENIOR_REVIEW',
] as const;
const ASSIGNEES = ['student', 'visa_officer', 'counselor', 'application_officer'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const createSchema = z.object({
  caseId: z.string().trim().min(1).max(191),
  taskType: z.enum(TASK_TYPES).default('DOCUMENT_REQUEST'),
  title: z.string().trim().min(1).max(191),
  description: z.string().trim().max(2000).default(''),
  assignee: z.enum(ASSIGNEES).default('student'),
  dueDate: z.string().trim().max(40).optional(),
  priority: z.enum(PRIORITIES).default('medium'),
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

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    if (!caseId) return NextResponse.json({ success: false, error: 'An assigned case ID is required.' }, { status: 400 });
    if (searchParams.has('studentId') || searchParams.has('assignedTo')) {
      return NextResponse.json({ success: false, error: 'Task scope is derived from the assigned case; student and owner filters are not accepted.' }, { status: 400 });
    }
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.tasks.view', visaCase)) {
      return NextResponse.json({ success: false, error: 'Assigned case and visa.tasks.view permission required.' }, { status: 403 });
    }

    const tasks = await db.$transaction(async (tx) => {
      const items = await tx.visaTask.findMany({
        where: { caseId: visaCase.id, studentId: visaCase.studentId, archivedAt: null },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 200,
      });
      await tx.portalAuditLog.create({
        data: auditData(auth, 'VISA_TASKS_VIEW', 'case-list', visaCase.id, visaCase.studentId, { count: items.length }),
      });
      return items;
    });
    const now = Date.now();
    const overdue = tasks.filter((task) => task.dueDate && task.dueDate.getTime() < now && !['completed', 'cancelled'].includes(task.status.toLowerCase()));
    return NextResponse.json({
      success: true,
      data: tasks,
      tasks,
      overdue,
      emptyState: tasks.length ? null : 'No active tasks are recorded for this case.',
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa tasks could not be audited or loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'A case, task type, title, assignee, and priority are required.', details: parsed.error.flatten() }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: parsed.data.caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.tasks.create', visaCase)) {
      return NextResponse.json({ success: false, error: 'Assigned case and visa.tasks.create permission required.' }, { status: 403 });
    }
    const assignedTo = resolveAssignee(visaCase, visaCase.studentId, parsed.data.assignee);
    if (!assignedTo) return NextResponse.json({ success: false, error: 'The selected owner is not assigned to this case.' }, { status: 400 });
    const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ success: false, error: 'A valid task due date is required.' }, { status: 400 });

    const task = await db.$transaction(async (tx) => {
      const created = await tx.visaTask.create({
        data: {
          caseId: visaCase.id,
          studentId: visaCase.studentId,
          taskType: parsed.data.taskType,
          title: parsed.data.title,
          description: parsed.data.description,
          assignedTo,
          priority: parsed.data.priority,
          createdBy: auth.actorUserId,
          dueDate,
          status: 'pending',
        },
      });
      await tx.portalAuditLog.create({
        data: auditData(auth, 'VISA_TASK_CREATE', created.id, visaCase.id, visaCase.studentId, {
          taskType: created.taskType,
          title: created.title,
          assignee: parsed.data.assignee,
          priority: created.priority,
          dueDate,
          descriptionLength: parsed.data.description.length,
        }),
      });
      await tx.timelineEvent.create({
        data: {
          studentId: visaCase.studentId,
          stage: 'VISA_TASK_CREATED',
          title: 'A visa case task was created.',
          description: 'A task was added to the authorized visa case workspace. Details remain in the case task list.',
          actor: auth.actorUserId,
        },
      });
      return created;
    });

    return NextResponse.json({ success: true, data: task, externalDelivery: false }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa task could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
