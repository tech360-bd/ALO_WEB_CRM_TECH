// PATCH /api/super-admin/ai/jobs/{id}/approve
//
// Releases a WAITING AI job so the worker may run it. Requires the real
// non-acting Super Admin and a written note — this is the human gate that
// stands between an agent and a destructive or public action.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  note: z.string().trim().min(8, 'A note of at least 8 characters is required.').max(1000),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');

  try {
    const job = await db.aiTask.findUnique({ where: { id } });
    if (!job) return notFound('AI job not found.');
    if (job.status !== 'WAITING') return badRequest(`Job is ${job.status}, not waiting for approval.`);

    await db.$transaction(async (tx) => {
      await tx.aiTask.update({ where: { id }, data: { status: 'QUEUED' } });
      if (job.agentId) {
        await tx.aiAgent.update({
          where: { id: job.agentId },
          data: { pendingApprovals: { decrement: 1 } },
        }).catch(() => null);
      }
      await writePortalAudit(tx, auth, 'AI_JOB_APPROVED', 'AiTask', id, {
        note: parsed.data.note,
        action: job.action,
        agentName: job.agentName,
        before: { status: job.status },
        after: { status: 'QUEUED' },
      }, request);
    });

    return NextResponse.json({ success: true, jobId: id, status: 'QUEUED' });
  } catch (error) {
    return unavailable('super-admin/ai/jobs/{id}/approve', error);
  }
}

export const PATCH = withAuth(handlePatch);
