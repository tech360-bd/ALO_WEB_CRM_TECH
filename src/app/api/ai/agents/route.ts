import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  departmentId: z.string().min(1, 'Department ID is required'),
  role: z.enum(['AGENT', 'SUPERVISOR', 'SPECIALIST']).default('AGENT'),
  description: z.string().max(1000).optional(),
  provider: z.enum(['groq', 'local', 'fallback']).default('groq'),
  model: z.string().max(100).optional(),
  prompt: z.string().max(5000).optional(),
  skills: z.string().default('[]'),
  tools: z.string().default('[]'),
  knowledge: z.string().max(2000).optional(),
  memoryScope: z.enum(['CONVERSATION', 'STUDENT', 'LEAD', 'TASK', 'LONG_TERM']).default('CONVERSATION'),
  maxSteps: z.number().int().min(1).max(100).default(10),
  maxRuntime: z.number().int().min(1000).max(600000).default(60000),
  maxToolCalls: z.number().int().min(1).max(200).default(20),
  maxRetries: z.number().int().min(0).max(10).default(3),
  maxTokenBudget: z.number().int().min(256).max(128000).default(4096),
  approvalPolicy: z.enum(['AUTO', 'REVIEW', 'HUMAN_REQUIRED', 'NEVER']).default('AUTO'),
});

async function generateAgentId(): Promise<string> {
  const lastAgent = await db.aiAgent.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { agentId: true },
  });
  let nextNum = 1;
  if (lastAgent) {
    const match = lastAgent.agentId.match(/ALO-AGENT-(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `ALO-AGENT-${String(nextNum).padStart(4, '0')}`;
}

// GET /api/ai/agents — list agents with pagination & filters
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const departmentId = req.nextUrl.searchParams.get('departmentId');
    const status = req.nextUrl.searchParams.get('status');
    const role = req.nextUrl.searchParams.get('role');

    const where: Record<string, unknown> = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (role) where.role = role;

    const [agents, total] = await Promise.all([
      db.aiAgent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { department: true },
        skip,
        take: limit,
      }),
      db.aiAgent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      agents,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List agents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list agents.' },
      { status: 500 },
    );
  }
}

// POST /api/ai/agents — create agent with auto-generated agentId
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Validate department exists
    const department = await db.aiDepartment.findUnique({ where: { id: data.departmentId } });
    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found.' },
        { status: 404 },
      );
    }

    const agentId = await generateAgentId();

    const agent = await db.aiAgent.create({
      data: {
        agentId,
        name: data.name,
        departmentId: data.departmentId,
        role: data.role,
        description: data.description,
        provider: data.provider,
        model: data.model,
        prompt: data.prompt,
        skills: data.skills,
        tools: data.tools,
        knowledge: data.knowledge,
        memoryScope: data.memoryScope,
        maxSteps: data.maxSteps,
        maxRuntime: data.maxRuntime,
        maxToolCalls: data.maxToolCalls,
        maxRetries: data.maxRetries,
        maxTokenBudget: data.maxTokenBudget,
        approvalPolicy: data.approvalPolicy,
      },
      include: { department: true },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE_AI_AGENT',
      resource: 'AiAgent',
      resourceId: agent.id,
      details: { agentId, name: agent.name, departmentId: agent.departmentId },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true, agent }, { status: 201 });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent.' },
      { status: 500 },
    );
  }
}
