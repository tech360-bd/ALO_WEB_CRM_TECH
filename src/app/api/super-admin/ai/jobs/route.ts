// GET  /api/super-admin/ai/jobs — AI job queue (real `ai_tasks` rows)
// POST /api/super-admin/ai/jobs — queue a job for an agent
//
// A job is created in WAITING when the requested action is on the
// risky-action list, and QUEUED otherwise. That is the enforcement point for
// "AI agents cannot publish / delete / change RBAC without approval": the job
// simply cannot start until a human approves it.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable, safeRows, jsonObject } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

/** Actions that may never run without an explicit human approval. */
const RISKY_ACTIONS = [
  'delete_student_data', 'delete_employee_data', 'change_rbac', 'publish_website_content',
  'publish_social_content', 'bulk_whatsapp', 'approve_commission', 'view_salary',
  'export_sensitive_documents', 'apply_module_patch', 'deploy',
] as const;

const JOB_STATUSES = ['QUEUED', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'ESCALATED', 'CANCELLED'] as const;

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const status = (url.searchParams.get('status') || '').toUpperCase().slice(0, 30);
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 300);

  try {
    const jobs = await safeRows<{
      id: string; taskCode: string; agentId: string | null; agentName: string; department: string;
      action: string; status: string; priority: string; crmId: string | null; crmType: string | null;
      errorMessage: string | null; retryCount: number; createdAt: Date; input: string | null; result: string | null;
    }>(
      () => db.aiTask.findMany({
        where: JOB_STATUSES.includes(status as (typeof JOB_STATUSES)[number]) ? { status } : {},
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, taskCode: true, agentId: true, agentName: true, department: true, action: true,
          status: true, priority: true, crmId: true, crmType: true, errorMessage: true, retryCount: true,
          createdAt: true, input: true, result: true,
        },
      }),
    );

    const counts: Record<string, number> = {};
    for (const job of jobs) counts[job.status] = (counts[job.status] || 0) + 1;

    return NextResponse.json({
      success: true,
      riskyActions: [...RISKY_ACTIONS],
      statuses: [...JOB_STATUSES],
      counts,
      jobs: jobs.map((job) => ({
        id: job.id,
        code: job.taskCode,
        agentId: job.agentId,
        agentName: job.agentName,
        department: job.department,
        action: job.action,
        status: job.status,
        priority: job.priority,
        entity: job.crmId ? { type: job.crmType, id: job.crmId } : null,
        errorMessage: job.errorMessage,
        retryCount: job.retryCount,
        createdAt: job.createdAt.toISOString(),
        input: jsonObject(job.input),
        requiresApproval: RISKY_ACTIONS.includes(job.action as (typeof RISKY_ACTIONS)[number]),
      })),
    });
  } catch (error) {
    return unavailable('super-admin/ai/jobs GET', error);
  }
}

const Body = z.object({
  agentId: z.string().trim().max(191).optional(),
  agentCode: z.string().trim().max(80).optional(),
  action: z.string().trim().min(2).max(80).regex(/^[a-z0-9_]+$/),
  entityType: z.enum(['LEAD', 'STUDENT', 'APPLICATION']).optional(),
  entityId: z.string().trim().max(191).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const input = parsed.data;

  if (!input.agentId && !input.agentCode) return badRequest('Provide agentId or agentCode.');

  try {
    const agent = input.agentId
      ? await db.aiAgent.findUnique({ where: { id: input.agentId } })
      : await db.aiAgent.findFirst({ where: { agentCode: input.agentCode } });
    if (!agent) return notFound('Agent not found.');
    if (agent.status === 'PAUSED' || agent.status === 'ARCHIVED' || agent.status === 'BLOCKED_BY_POLICY') {
      return badRequest(`Agent ${agent.agentCode} is ${agent.status} and cannot accept jobs.`);
    }

    const requiresApproval = RISKY_ACTIONS.includes(input.action as (typeof RISKY_ACTIONS)[number]);
    const status = requiresApproval ? 'WAITING' : 'QUEUED';

    const job = await db.$transaction(async (tx) => {
      const created = await tx.aiTask.create({
        data: {
          taskCode: `ALO-AITASK-${Date.now().toString(36).toUpperCase()}`,
          agentId: agent.id,
          agentName: agent.agentName,
          department: agent.department,
          action: input.action,
          priority: input.priority,
          status,
          crmType: input.entityType || null,
          crmId: input.entityId || null,
          input: JSON.stringify(input.payload),
        },
      });
      if (requiresApproval) {
        await tx.aiAgent.update({ where: { id: agent.id }, data: { pendingApprovals: { increment: 1 } } });
      }
      await writePortalAudit(tx, auth, 'AI_JOB_QUEUED', 'AiTask', created.id, {
        reason: input.reason,
        agentCode: agent.agentCode,
        action: input.action,
        status,
        requiresApproval,
      }, request);
      return created;
    });

    return NextResponse.json({
      success: true,
      job: { id: job.id, code: job.taskCode, status: job.status, requiresApproval },
      note: requiresApproval
        ? 'This action is on the protected list and is held in WAITING until a Super Admin approves it.'
        : 'Job queued for the agent worker.',
    }, { status: 201 });
  } catch (error) {
    return unavailable('super-admin/ai/jobs POST', error);
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
