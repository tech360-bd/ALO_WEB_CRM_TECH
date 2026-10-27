// GET /api/super-admin/ai/agents — ALO 2000 Protected Agent Network
//
// The 2000 logical agents are definitional (40 departments × 50). Runtime
// state is read from `ai_agents` and `ai_tasks`; when a department has no
// persisted agents the response says so instead of implying they are live.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { getAgentNetworkSummary, logicalAgentCode, AGENT_DEPARTMENTS } from '@/lib/super-admin/agent-network';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const department = (url.searchParams.get('department') || '').trim().toUpperCase();
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);

  try {
    const summary = await getAgentNetworkSummary();

    // Real agent rows for the requested (or first) department.
    const target = department
      ? AGENT_DEPARTMENTS.find((entry) => entry.key === department)
      : AGENT_DEPARTMENTS[0];

    const agents = await db.aiAgent.findMany({
      where: target ? { OR: [{ department: target.key }, { department: target.name }] } : {},
      orderBy: { agentCode: 'asc' },
      take: limit,
    }).catch(() => []);

    return NextResponse.json({
      ...summary,
      selectedDepartment: target?.key || null,
      agents: agents.map((agent) => ({
        id: agent.id,
        code: agent.agentCode || logicalAgentCode(agent.department, 1),
        name: agent.agentName,
        type: agent.agentType,
        department: agent.department,
        status: agent.status,
        jobsProcessed: agent.jobsProcessed,
        pendingApprovals: agent.pendingApprovals,
        lastRunAt: agent.lastRunAt?.toISOString() || null,
        protectionMode: 'protected' as const,
      })),
    });
  } catch (error) {
    console.error('[super-admin/ai/agents] failed', error);
    return NextResponse.json({ success: false, error: 'Agent registry is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
