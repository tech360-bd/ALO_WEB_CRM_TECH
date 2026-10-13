import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth as requireAuthApi } from '@/lib/api-auth';
import { requireAuth, isErrorResponse, parsePagination, auditLog, requirePermission } from '@/lib/access-control';
import { generateTaskId } from '@/lib/id-generator';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  assigneeId: z.string().optional(),
  department: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  dueDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  caseId: z.string().optional(),
  studentId: z.string().optional(),
  applicationId: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — List tasks with filters, search, pagination                    */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  // Build filters
  const filters: Record<string, unknown>[] = [];

  if (sp.get('entityType')) filters.push({ entityType: sp.get('entityType') });
  if (sp.get('entityId')) filters.push({ entityId: sp.get('entityId') });
  if (sp.get('status')) filters.push({ status: sp.get('status') });
  if (sp.get('priority')) filters.push({ priority: sp.get('priority') });
  if (sp.get('assigneeId')) filters.push({ assigneeId: sp.get('assigneeId') });
  if (sp.get('ownerId')) filters.push({ ownerId: sp.get('ownerId') });
  if (sp.get('caseId')) filters.push({ caseId: sp.get('caseId') });
  if (sp.get('studentId')) filters.push({ studentId: sp.get('studentId') });

  // Non-admin: show own tasks + assigned tasks
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && !sp.get('ownerId') && !sp.get('assigneeId')) {
    filters.push({
      OR: [
        { ownerId: auth.user.id },
        { assigneeId: auth.user.id },
      ],
    });
  }

  // Search
  if (sp.get('search')) {
    filters.push({
      OR: [
        { taskId: { contains: sp.get('search')! } },
        { title: { contains: sp.get('search')! } },
      ],
    });
  }

  const where = filters.length > 0 ? { AND: filters } : {};

  // Sort
  const sortField = sp.get('sortBy') || 'createdAt';
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc';
  const orderBy: Record<string, string> = { [sortField]: sortDir };

  try {
    const [data, total] = await Promise.all([
      db.task.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      db.task.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create task with notification for assignee                       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requirePermission(req, 'employee.task.create');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const taskId = await generateTaskId();

    const taskData = await db.task.create({
      data: {
        taskId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        ownerId: auth.user.id,
        assigneeId: parsed.data.assigneeId || null,
        department: parsed.data.department || null,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate || null,
        caseId: parsed.data.caseId || null,
        studentId: parsed.data.studentId || null,
        applicationId: parsed.data.applicationId || null,
      },
    });

    // Notify assignee if different from owner
    if (parsed.data.assigneeId && parsed.data.assigneeId !== auth.user.id) {
      try {
        await db.notification.create({
          data: {
            userId: parsed.data.assigneeId,
            type: 'TASK_ASSIGNED',
            title: `New Task: ${taskId}`,
            message: `A new task "${parsed.data.title}" has been assigned to you.`,
            data: JSON.stringify({ taskId: taskData.id, taskNumber: taskId }),
          },
        });
      } catch {
        // Notification failure should not break task creation
      }
    }

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'Task',
      resourceId: taskData.id,
      details: { taskId, title: parsed.data.title, entityType: parsed.data.entityType },
    });

    return NextResponse.json({ success: true, data: taskData }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task.' },
      { status: 500 },
    );
  }
}
