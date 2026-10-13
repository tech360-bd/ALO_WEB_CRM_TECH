/**
 * POST /api/ai/agents/[id]/action
 * Agent control actions: start, pause, resume, restart, disable, enable, test.
 * Requires SUPER_ADMIN role.
 *
 * Body: { action: 'start' | 'pause' | 'resume' | 'restart' | 'disable' | 'enable' | 'test' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { orchestrate } from '@/lib/ai/orchestrator';

type RouteContext = { params: Promise<{ id: string }> };

/** Valid agent control actions */
const VALID_ACTIONS = ['start', 'pause', 'resume', 'restart', 'disable', 'enable', 'test'] as const;
type AgentAction = (typeof VALID_ACTIONS)[number];

/** Map action to resulting agent status */
const ACTION_STATUS_MAP: Record<AgentAction, string> = {
  start: 'ACTIVE',
  pause: 'PAUSED',
  resume: 'ACTIVE',
  restart: 'ACTIVE',
  disable: 'DISABLED',
  enable: 'ACTIVE',
  test: 'ACTIVE',
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { error } = await requireRole(request, ['SUPER_ADMIN']);
    if (error) return error;

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body as { action?: string };

    if (!action || !VALID_ACTIONS.includes(action as AgentAction)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agent = await db.aiAgent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const typedAction = action as AgentAction;

    // For 'test' action, run a test task via orchestrator
    if (typedAction === 'test') {
      const result = await orchestrate({
        taskType: 'health_check',
        input: { testAgentId: id, testAgentCode: agent.code },
        agentCode: agent.code ?? undefined,
        priority: 'low',
      });

      return NextResponse.json({
        action: 'test',
        agentId: id,
        taskId: result.taskId,
        status: result.status,
        success: result.success,
        error: result.error,
        latencyMs: result.latencyMs,
      });
    }

    // Update agent status in DB
    const newStatus = ACTION_STATUS_MAP[typedAction];
    const updated = await db.aiAgent.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      action: typedAction,
      agentId: id,
      previousStatus: agent.status,
      newStatus,
      agent: updated,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
