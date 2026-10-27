// GET /api/super-admin/ai/agents — ALO 2000 Protected Agent Network
//
// The 2000 logical agents are definitional (40 departments × 50). Runtime
// state is read from `ai_agents` and `ai_tasks`; when a department has no
// persisted agents the response says so instead of implying they are live.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { writePortalAudit } from '@/lib/transactional-audit';
import { badRequest, unavailable } from '@/lib/super-admin/http';
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

const CreateAgent = z.object({
  department: z.string().trim().min(2).max(191),
  agentName: z.string().trim().min(2).max(191),
  agentCode: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9_-]+$/),
  agentType: z.string().trim().max(60).default('PROTECTED_MICRO_AGENT'),
  description: z.string().trim().max(1000).default(''),
  status: z.enum(['ACTIVE', 'PAUSED', 'TRAINING_FROM_APPROVED_DATA', 'WAITING_APPROVAL']).default('PAUSED'),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = CreateAgent.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { reason, ...input } = parsed.data;

  try {
    const existing = await db.aiAgent.findFirst({ where: { agentCode: input.agentCode } });
    if (existing) return badRequest(`Agent code ${input.agentCode} already exists.`);

    // New agents start PAUSED unless explicitly activated: a new agent must be
    // reviewed before it can touch real records.
    const created = await db.$transaction(async (tx) => {
      const agent = await tx.aiAgent.create({
        data: {
          department: input.department,
          agentName: input.agentName,
          agentCode: input.agentCode,
          agentType: input.agentType,
          description: input.description,
          status: input.status,
        },
      });
      await writePortalAudit(tx, auth, 'AI_AGENT_CREATED', 'AiAgent', agent.id, {
        reason,
        code: agent.agentCode,
        department: agent.department,
        status: agent.status,
      }, request);
      return agent;
    });

    return NextResponse.json({ success: true, agent: { id: created.id, code: created.agentCode, status: created.status } }, { status: 201 });
  } catch (error) {
    return unavailable('super-admin/ai/agents POST', error);
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
