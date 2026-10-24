import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { writePortalAudit } from '@/lib/transactional-audit';

const TASK_STATUSES = new Set(['pending', 'in_progress', 'completed', 'cancelled']);
const TASK_PRIORITIES = new Set(['low', 'medium', 'high']);
const TASK_TYPES = new Set(['follow_up', 'document_review', 'application', 'visa', 'counselling', 'other']);
const SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title']);

async function getEmployee(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
  if (roles.has('student') || roles.has('partner')) return NextResponse.json({ success: false, error: 'Employee access only.' }, { status: 403 });
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, userId: true, employeeId: true, status: true } }).catch(() => null);
  if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
  return { auth, employee, identifiers: [...new Set([employee.id, employee.userId, employee.employeeId].filter(Boolean))] };
}

function validDate(value: unknown): value is string {
  if (value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function GET(request: NextRequest) {
  const access = await getEmployee(request);
  if (access instanceof NextResponse) return access;
  const { auth, employee, identifiers } = access;
  if (!auth.permissions.includes('employee.tasks.view')) return NextResponse.json({ success: false, error: 'Task-view permission is required.' }, { status: 403 });
  const params = request.nextUrl.searchParams;
  const pageValue = params.get('page') || '1';
  const limitValue = params.get('limit') || '20';
  if (!/^\d+$/.test(pageValue) || !/^\d+$/.test(limitValue)) return NextResponse.json({ success: false, error: 'page and limit must be positive integers.' }, { status: 400 });
  const page = Number(pageValue);
  const limit = Number(limitValue);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return NextResponse.json({ success: false, error: 'page must be positive and limit must be between 1 and 100.' }, { status: 400 });
  const sortBy = params.get('sortBy') || 'createdAt';
  const sortOrder = params.get('sortOrder') || 'desc';
  if (!SORT_FIELDS.has(sortBy) || !['asc', 'desc'].includes(sortOrder)) return NextResponse.json({ success: false, error: 'Invalid task sort.' }, { status: 400 });
  const status = params.get('status')?.toLowerCase();
  const priority = params.get('priority')?.toLowerCase();
  const type = params.get('type')?.toLowerCase();
  if (status && !TASK_STATUSES.has(status)) return NextResponse.json({ success: false, error: 'Invalid task status.' }, { status: 400 });
  if (priority && !TASK_PRIORITIES.has(priority)) return NextResponse.json({ success: false, error: 'Invalid task priority.' }, { status: 400 });
  if (type && !TASK_TYPES.has(type)) return NextResponse.json({ success: false, error: 'Invalid task type.' }, { status: 400 });
  const search = params.get('search')?.trim() || '';
  if (search.length > 100 || /[\u0000-\u001f]/.test(search)) return NextResponse.json({ success: false, error: 'Search text is invalid or too long.' }, { status: 400 });

  const where = {
    employeeId: { in: identifiers },
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(type ? { type } : {}),
    ...(search ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] } : {}),
  };
  try {
    const [tasks, total] = await Promise.all([
      db.counselorTask.findMany({ where, orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, title: true, description: true, type: true, priority: true, status: true, dueDate: true, createdAt: true, updatedAt: true } }),
      db.counselorTask.count({ where }),
    ]);
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'EMPLOYEE_TASKS_VIEWED', entityType: 'CounselorTask', entityId: employee.id, metadata: JSON.stringify({ effectiveUserId: auth.userId, total, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }) } });
    return NextResponse.json({ success: true, tasks, data: tasks, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee tasks are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: NextRequest) {
  const access = await getEmployee(request);
  if (access instanceof NextResponse) return access;
  const { auth, employee, identifiers } = access;
  if (!auth.permissions.includes('employee.tasks.create')) return NextResponse.json({ success: false, error: 'Task-create permission is required.' }, { status: 403 });
  if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid task is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const allowed = new Set(['title', 'description', 'type', 'priority', 'dueDate', 'studentId', 'leadId']);
  if (Object.keys(input).some((field) => !allowed.has(field))) return NextResponse.json({ success: false, error: 'Unsupported task fields; ownership and status are server-controlled.' }, { status: 400 });
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const type = typeof input.type === 'string' ? input.type.toLowerCase() : 'follow_up';
  const priority = typeof input.priority === 'string' ? input.priority.toLowerCase() : 'medium';
  const dueDate = input.dueDate === undefined ? '' : input.dueDate;
  const studentId = typeof input.studentId === 'string' ? input.studentId.trim() : '';
  const leadId = typeof input.leadId === 'string' ? input.leadId.trim() : '';
  if (!title || title.length > 191 || /[\u0000-\u001f]/.test(title)) return NextResponse.json({ success: false, error: 'A valid task title is required.' }, { status: 400 });
  if (description.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(description)) return NextResponse.json({ success: false, error: 'Task description is invalid or too long.' }, { status: 400 });
  if (!TASK_TYPES.has(type) || !TASK_PRIORITIES.has(priority) || !validDate(dueDate)) return NextResponse.json({ success: false, error: 'Task type, priority, or due date is invalid.' }, { status: 400 });
  if (studentId && leadId) return NextResponse.json({ success: false, error: 'A task may link to either one assigned student or one assigned lead, not both.' }, { status: 400 });
  if (studentId.length > 191 || leadId.length > 191) return NextResponse.json({ success: false, error: 'Linked record identifier is invalid.' }, { status: 400 });

  try {
    let linkedStudentId = '';
    let linkedLeadId = '';
    if (studentId) {
      const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }], counselorId: { in: identifiers } }, select: { id: true } });
      if (!student) return NextResponse.json({ success: false, error: 'The selected student is not assigned to this employee.' }, { status: 403 });
      linkedStudentId = student.id;
    }
    if (leadId) {
      const lead = await db.marketingLead.findFirst({ where: { id: leadId, counselorId: { in: identifiers } }, select: { id: true } });
      if (!lead) return NextResponse.json({ success: false, error: 'The selected lead is not assigned to this employee.' }, { status: 403 });
      linkedLeadId = lead.id;
    }
    const task = await db.$transaction(async (tx) => {
      const created = await tx.counselorTask.create({ data: { employeeId: employee.id, title, description, type, priority, status: 'pending', dueDate, studentId: linkedStudentId, leadId: linkedLeadId }, select: { id: true, title: true, description: true, type: true, priority: true, status: true, dueDate: true, createdAt: true, updatedAt: true } });
      await writePortalAudit(tx, auth, 'EMPLOYEE_TASK_CREATED', 'CounselorTask', created.id, { ownerEmployeeId: employee.id, type, priority, dueDate, studentId: linkedStudentId || null, leadId: linkedLeadId || null }, request);
      return created;
    });
    return NextResponse.json({ success: true, data: task, task, message: 'Task created.' }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Task could not be created.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const access = await getEmployee(request);
  if (access instanceof NextResponse) return access;
  const { auth, employee, identifiers } = access;
  if (!auth.permissions.includes('employee.tasks.update')) return NextResponse.json({ success: false, error: 'Task-update permission is required.' }, { status: 403 });
  if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid task update is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const allowed = new Set(['id', 'title', 'description', 'type', 'priority', 'status', 'dueDate']);
  if (Object.keys(input).some((field) => !allowed.has(field))) return NextResponse.json({ success: false, error: 'Unsupported task update field.' }, { status: 400 });
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  if (!id || id.length > 191) return NextResponse.json({ success: false, error: 'A valid task id is required.' }, { status: 400 });
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 191 || /[\u0000-\u001f]/.test(input.title)) return NextResponse.json({ success: false, error: 'Task title is invalid.' }, { status: 400 });
    updateData.title = input.title.trim();
  }
  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(input.description)) return NextResponse.json({ success: false, error: 'Task description is invalid.' }, { status: 400 });
    updateData.description = input.description.trim();
  }
  if (input.type !== undefined) {
    if (typeof input.type !== 'string' || !TASK_TYPES.has(input.type.toLowerCase())) return NextResponse.json({ success: false, error: 'Task type is invalid.' }, { status: 400 });
    updateData.type = input.type.toLowerCase();
  }
  if (input.priority !== undefined) {
    if (typeof input.priority !== 'string' || !TASK_PRIORITIES.has(input.priority.toLowerCase())) return NextResponse.json({ success: false, error: 'Task priority is invalid.' }, { status: 400 });
    updateData.priority = input.priority.toLowerCase();
  }
  if (input.dueDate !== undefined) {
    if (!validDate(input.dueDate)) return NextResponse.json({ success: false, error: 'Due date must use YYYY-MM-DD.' }, { status: 400 });
    updateData.dueDate = input.dueDate;
  }
  if (input.status !== undefined) {
    if (typeof input.status !== 'string' || !TASK_STATUSES.has(input.status.toLowerCase())) return NextResponse.json({ success: false, error: 'Task status is invalid.' }, { status: 400 });
    updateData.status = input.status.toLowerCase();
  }
  if (!Object.keys(updateData).length) return NextResponse.json({ success: false, error: 'No task changes were supplied.' }, { status: 400 });

  try {
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.counselorTask.findFirst({ where: { id, employeeId: { in: identifiers } } });
      if (!existing) throw new Error('not found');
      const currentStatus = existing.status.toLowerCase();
      const nextStatus = typeof updateData.status === 'string' ? updateData.status : currentStatus;
      if (['completed', 'cancelled'].includes(currentStatus) && nextStatus !== currentStatus) throw new Error('terminal status');
      if (nextStatus === 'completed' && currentStatus !== 'completed') updateData.completedAt = new Date();
      const result = await tx.counselorTask.updateMany({ where: { id, employeeId: { in: identifiers }, status: existing.status }, data: updateData });
      if (result.count !== 1) throw new Error('changed');
      await writePortalAudit(tx, auth, 'EMPLOYEE_TASK_UPDATED', 'CounselorTask', id, { fields: Object.keys(updateData), fromStatus: existing.status, toStatus: nextStatus }, request);
      return tx.counselorTask.findUnique({ where: { id }, select: { id: true, title: true, description: true, type: true, priority: true, status: true, dueDate: true, createdAt: true, updatedAt: true } });
    });
    return NextResponse.json({ success: true, data: updated, task: updated, message: 'Task updated.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'not found') return NextResponse.json({ success: false, error: 'Task not found in your assigned scope.' }, { status: 404 });
    if (message === 'terminal status') return NextResponse.json({ success: false, error: 'Completed or cancelled tasks are immutable.' }, { status: 409 });
    if (message === 'changed') return NextResponse.json({ success: false, error: 'Task was changed by another request; reload and retry.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Task could not be updated.' }, { status: 503 });
  }
}
