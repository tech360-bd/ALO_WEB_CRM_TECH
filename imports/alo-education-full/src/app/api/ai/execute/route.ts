/**
 * POST /api/ai/execute
 * Execute an AI task via the orchestrator.
 * Requires authenticated user.
 *
 * Body: { taskType, input, departmentCode?, agentCode?, priority? }
 * Returns: { taskId, status, result? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { orchestrate } from '@/lib/ai/orchestrator';
import type { RequestPriority } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { taskType, input, departmentCode, agentCode, priority } = body as {
      taskType?: string;
      input?: Record<string, unknown>;
      departmentCode?: string;
      agentCode?: string;
      priority?: string;
    };

    if (!taskType || !input) {
      return NextResponse.json(
        { error: 'taskType and input are required' },
        { status: 400 }
      );
    }

    const userId = user?.id;

    const result = await orchestrate({
      taskType,
      input,
      departmentCode,
      agentCode,
      priority: (priority as RequestPriority) ?? 'normal',
      userId,
    });

    return NextResponse.json({
      taskId: result.taskId,
      status: result.status,
      result: result.success ? result.result : undefined,
      error: result.error,
      requiresApproval: result.requiresApproval,
      approvalStatus: result.approvalStatus,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
