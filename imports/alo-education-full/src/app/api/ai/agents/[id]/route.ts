import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const VALID_STATUSES = ['ACTIVE', 'IDLE', 'BUSY', 'PAUSED', 'FAILED', 'WAITING_APPROVAL', 'ESCALATED', 'MAINTENANCE'];
const PATCHABLE_FIELDS = [
  'name', 'description', 'role', 'provider', 'model', 'prompt',
  'skills', 'tools', 'knowledge', 'memoryScope',
  'maxSteps', 'maxRuntime', 'maxToolCalls', 'maxRetries', 'maxTokenBudget',
  'approvalPolicy', 'departmentId', 'status',
] as const;

const patchAgentSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(1000).nullable().optional(),
  role: z.enum(['AGENT', 'SUPERVISOR', 'SPECIALIST']).optional(),
  provider: z.enum(['groq', 'local', 'fallback']).optional(),
  model: z.string().max(100).nullable().optional(),
  prompt: z.string().max(5000).nullable().optional(),
  skills: z.string().max(5000).optional(),
  tools: z.string().max(5000).optional(),
  knowledge: z.string().max(2000).nullable().optional(),
  memoryScope: z.enum(['CONVERSATION', 'STUDENT', 'LEAD', 'TASK', 'LONG_TERM']).optional(),
  maxSteps: z.number().int().min(1).max(100).optional(),
  maxRuntime: z.number().int().min(1000).max(600000).optional(),
  maxToolCalls: z.number().int().min(1).max(200).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  maxTokenBudget: z.number().int().min(256).max(128000).optional(),
  approvalPolicy: z.enum(['AUTO', 'REVIEW', 'HUMAN_REQUIRED', 'NEVER']).optional(),
  departmentId: z.string().min(1).optional(),
  status: z.enum(VALID_STATUSES).optional(),
});

// GET /api/ai/agents/[id] — single agent detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const agent = await db.aiAgent.findUnique({
      where: { id },
      include: {
        department: true,
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { tasks: true, auditLogs: true } },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get agent.' },
      { status: 500 },
    );
  }
}

// PATCH /api/ai/agents/[id] — update agent fields, pause/resume/disable
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const existing = await db.aiAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Agent not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = patchAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Validate departmentId if changing
    if (data.departmentId) {
      const dept = await db.aiDepartment.findUnique({ where: { id: data.departmentId } });
      if (!dept) {
        return NextResponse.json(
          { success: false, error: 'Department not found.' },
          { status: 404 },
        );
      }
    }

    // Build update payload — only include fields that were provided
    const updateData: Record<string, unknown> = {};
    for (const key of PATCHABLE_FIELDS) {
      if (key in data && data[key as keyof typeof data] !== undefined) {
        (updateData as Record<string, unknown>)[key] = data[key as keyof typeof data];
      }
    }

    const agent = await db.aiAgent.update({
      where: { id },
      data: updateData,
      include: { department: true },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE_AI_AGENT',
      resource: 'AiAgent',
      resourceId: agent.id,
      details: { agentId: agent.agentId, changedFields: Object.keys(updateData) },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent.' },
      { status: 500 },
    );
  }
}

// DELETE /api/ai/agents/[id] — soft disable (set status to PAUSED)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const existing = await db.aiAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Agent not found.' },
        { status: 404 },
      );
    }

    if (existing.status === 'PAUSED') {
      return NextResponse.json(
        { success: false, error: 'Agent is already disabled/paused.' },
        { status: 409 },
      );
    }

    const agent = await db.aiAgent.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: { department: true },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'DISABLE_AI_AGENT',
      resource: 'AiAgent',
      resourceId: agent.id,
      details: { agentId: agent.agentId, previousStatus: existing.status },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({
      success: true,
      agent,
      message: 'Agent has been disabled (paused). It is not hard-deleted.',
    });
  } catch (error) {
    console.error('Disable agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disable agent.' },
      { status: 500 },
    );
  }
}
