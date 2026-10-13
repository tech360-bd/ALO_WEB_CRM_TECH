import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const VALID_STATUSES = [
  'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING',
  'WAITING_APPROVAL', 'ESCALATED', 'CANCELLED',
] as const;

const VALID_APPROVAL_STATES = ['PENDING', 'APPROVED', 'REJECTED', 'EDITED'] as const;

const patchTaskSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  result: z.string().max(10000).nullable().optional(),
  output: z.string().max(10000).nullable().optional(),
  error: z.string().max(5000).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  // Approval actions
  approvalState: z.enum(VALID_APPROVAL_STATES).nullable().optional(),
  approverId: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  approvalNote: z.string().max(2000).nullable().optional(),
  // Agent assignment
  agentId: z.string().nullable().optional(),
  // Metadata
  provider: z.string().max(50).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  tokenUsage: z.number().int().min(0).optional(),
  latency: z.number().int().min(0).optional(),
  toolCalls: z.number().int().min(0).optional(),
  retryCount: z.number().int().min(0).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
});

// GET /api/ai/tasks/[id] — single task detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const task = await db.aiTask.findUnique({
      where: { id },
      include: {
        agent: { include: { department: true } },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get task.' },
      { status: 500 },
    );
  }
}

// PATCH /api/ai/tasks/[id] — update task status, result, approval actions
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const existing = await db.aiTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Task not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = patchTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Validate agentId if being assigned
    if (data.agentId) {
      const agent = await db.aiAgent.findUnique({ where: { id: data.agentId } });
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Agent not found.' },
          { status: 404 },
        );
      }
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.output !== undefined) updateData.output = data.output;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.confidence !== undefined) updateData.confidence = data.confidence;
    if (data.approvalState !== undefined) updateData.approvalState = data.approvalState;
    if (data.approverId !== undefined) updateData.approverId = data.approverId;
    if (data.approvedAt !== undefined) {
      updateData.approvedAt = data.approvedAt ? new Date(data.approvedAt) : null;
    }
    if (data.approvalNote !== undefined) updateData.approvalNote = data.approvalNote;
    if (data.agentId !== undefined) updateData.agentId = data.agentId;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.tokenUsage !== undefined) updateData.tokenUsage = data.tokenUsage;
    if (data.latency !== undefined) updateData.latency = data.latency;
    if (data.toolCalls !== undefined) updateData.toolCalls = data.toolCalls;
    if (data.retryCount !== undefined) updateData.retryCount = data.retryCount;
    if (data.priority !== undefined) updateData.priority = data.priority;

    // Auto-set timestamps based on status transitions
    if (data.status === 'RUNNING' && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
      if (!existing.completedAt) updateData.completedAt = new Date();
    }

    const task = await db.aiTask.update({
      where: { id },
      data: updateData,
      include: {
        agent: { include: { department: true } },
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE_AI_TASK',
      resource: 'AiTask',
      resourceId: task.id,
      details: {
        taskId: task.taskId,
        changedFields: Object.keys(updateData),
        previousStatus: existing.status,
        newStatus: task.status,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task.' },
      { status: 500 },
    );
  }
}
