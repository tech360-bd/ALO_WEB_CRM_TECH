import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const TASK_TYPES = [
  'LEAD_CLASSIFICATION', 'COURSE_MATCHING', 'SCHOLARSHIP_CHECK',
  'DOCUMENT_VERIFICATION', 'FOLLOW_UP', 'EMAIL_DRAFT', 'DATA_ENTRY',
  'REPORT_GENERATION', 'SCHEDULE_MANAGEMENT', 'OTHER',
] as const;

const AUTOMATION_CLASSES = [
  'AI_AUTOMATABLE', 'AI_ASSISTED', 'HUMAN_REQUIRED',
  'HUMAN_APPROVAL_REQUIRED', 'ESCALATED',
] as const;

const createTaskSchema = z.object({
  agentId: z.string().optional(),
  departmentId: z.string().optional(),
  type: z.enum(TASK_TYPES),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  automationClass: z.enum(AUTOMATION_CLASSES).default('AI_AUTOMATABLE'),
  confidence: z.number().min(0).max(1).optional(),
  input: z.string().max(10000).optional(),
  output: z.string().max(10000).optional(),
  result: z.string().max(10000).optional(),
  requiresApproval: z.boolean().default(false),
  studentId: z.string().optional(),
  leadId: z.string().optional(),
  applicationId: z.string().optional(),
  entityId: z.string().optional(),
  entityType: z.string().max(50).optional(),
  provider: z.string().max(50).optional(),
  model: z.string().max(100).optional(),
});

async function generateTaskId(): Promise<string> {
  const lastTask = await db.aiTask.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { taskId: true },
  });
  let nextNum = 1;
  if (lastTask) {
    const match = lastTask.taskId.match(/ALO-TASK-(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `ALO-TASK-${String(nextNum).padStart(5, '0')}`;
}

// GET /api/ai/tasks — list tasks with pagination & filters
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get('status');
    const agentId = req.nextUrl.searchParams.get('agentId');
    const departmentId = req.nextUrl.searchParams.get('departmentId');
    const type = req.nextUrl.searchParams.get('type');
    const automationClass = req.nextUrl.searchParams.get('automationClass');
    const priority = req.nextUrl.searchParams.get('priority');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;
    if (departmentId) where.departmentId = departmentId;
    if (type) where.type = type;
    if (automationClass) where.automationClass = automationClass;
    if (priority) where.priority = priority;

    const [tasks, total] = await Promise.all([
      db.aiTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { include: { department: true } },
        },
        skip,
        take: limit,
      }),
      db.aiTask.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list tasks.' },
      { status: 500 },
    );
  }
}

// POST /api/ai/tasks — create task
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
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

    const data = parsed.data;

    // Validate agentId if provided
    if (data.agentId) {
      const agent = await db.aiAgent.findUnique({ where: { id: data.agentId } });
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Agent not found.' },
          { status: 404 },
        );
      }
    }

    const taskId = await generateTaskId();

    const task = await db.aiTask.create({
      data: {
        taskId,
        agentId: data.agentId ?? null,
        departmentId: data.departmentId ?? null,
        type: data.type,
        priority: data.priority,
        automationClass: data.automationClass,
        confidence: data.confidence ?? null,
        input: data.input ?? null,
        output: data.output ?? null,
        result: data.result ?? null,
        requiresApproval: data.requiresApproval,
        approvalState: data.requiresApproval ? 'PENDING' : null,
        studentId: data.studentId ?? null,
        leadId: data.leadId ?? null,
        applicationId: data.applicationId ?? null,
        entityId: data.entityId ?? null,
        entityType: data.entityType ?? null,
        provider: data.provider ?? null,
        model: data.model ?? null,
      },
      include: {
        agent: { include: { department: true } },
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE_AI_TASK',
      resource: 'AiTask',
      resourceId: task.id,
      details: { taskId, type: task.type, agentId: task.agentId },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task.' },
      { status: 500 },
    );
  }
}
