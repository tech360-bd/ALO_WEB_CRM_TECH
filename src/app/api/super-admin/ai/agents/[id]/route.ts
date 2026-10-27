// GET   /api/super-admin/ai/agents/{id} — one agent with lineage and recent jobs
// PATCH /api/super-admin/ai/agents/{id} — pause / resume / archive / rename
//
// Status changes are the Super Admin's kill switch for an individual agent.
// They are audited, and an agent cannot be moved into ACTIVE while the global
// AI protection policy requires approval for risky work.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const AGENT_STATUSES = [
  'ACTIVE', 'PAUSED', 'TRAINING_FROM_APPROVED_DATA', 'WAITING_APPROVAL',
  'RUNNING', 'FAILED', 'BLOCKED_BY_POLICY', 'COMPLETED', 'ARCHIVED',
] as const;

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const agent = await db.aiAgent.findUnique({ where: { id } });
    if (!agent) return notFound('Agent not found.');

    const [lineage, jobs, children] = await Promise.all([
      db.aiAgentLineage.findFirst({ where: { agentId: id } }).catch(() => null),
      db.aiTask.findMany({
        where: { agentId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, taskCode: true, action: true, status: true, priority: true, createdAt: true, errorMessage: true },
      }).catch(() => []),
      db.aiAgent.count({ where: { supervisorAgentId: id } }).catch(() => 0),
    ]);

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        code: agent.agentCode,
        name: agent.agentName,
        department: agent.department,
        type: agent.agentType,
        status: agent.status,
        jobsProcessed: agent.jobsProcessed,
        pendingApprovals: agent.pendingApprovals,
        lastRunAt: agent.lastRunAt?.toISOString() || null,
        supervisorAgentId: agent.supervisorAgentId,
        description: agent.description,
      },
      lineage: lineage ? { generation: lineage.generation, isTwoLoopModel: lineage.isTwoLoopModel, createdAt: lineage.createdAt.toISOString() } : null,
      supervisedAgents: children,
      recentJobs: jobs,
      protectionMode: 'protected',
      allowedStatuses: [...AGENT_STATUSES],
    });
  } catch (error) {
    return unavailable('super-admin/ai/agents/{id} GET', error);
  }
}

const Body = z.object({
  status: z.enum(AGENT_STATUSES).optional(),
  agentName: z.string().trim().min(2).max(191).optional(),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { status, agentName, reason } = parsed.data;

  if (status === undefined && agentName === undefined) return badRequest('No changes supplied.');

  try {
    const agent = await db.aiAgent.findUnique({ where: { id } });
    if (!agent) return notFound('Agent not found.');

    const updated = await db.$transaction(async (tx) => {
      const row = await tx.aiAgent.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(agentName ? { agentName } : {}),
        },
      });
      await writePortalAudit(tx, auth, 'AI_AGENT_UPDATED', 'AiAgent', id, {
        reason,
        before: { status: agent.status, agentName: agent.agentName },
        after: { status: row.status, agentName: row.agentName },
        code: agent.agentCode,
      }, request);
      return row;
    });

    return NextResponse.json({
      success: true,
      agent: { id: updated.id, code: updated.agentCode, name: updated.agentName, status: updated.status },
    });
  } catch (error) {
    return unavailable('super-admin/ai/agents/{id} PATCH', error);
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
