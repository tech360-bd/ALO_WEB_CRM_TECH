// PATCH /api/super-admin/ai/system-builder/requests/{id}/approve
//
// Approves (or rejects) a build request. Approval moves it to APPROVED, which
// is the only precondition for /apply. A high-risk request can never skip this
// step, and the decision is audited with the reviewer's note.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().trim().min(8, 'A note of at least 8 characters is required.').max(2000),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { decision, note } = parsed.data;

  try {
    const row = await db.moduleBuildRequest.findUnique({ where: { id } });
    if (!row) return notFound('Build request not found.');
    if (!['PLAN_READY', 'PLAN_REQUESTED', 'SANDBOX_VALIDATED'].includes(row.status)) {
      return badRequest(`Request is ${row.status}; it cannot be reviewed now.`);
    }
    if (row.requestedBy === auth.actorUserId && row.riskLevel === 'high') {
      return badRequest('A high-risk build request must be reviewed by a different Super Admin than the requester.');
    }

    const nextStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED';

    await db.$transaction(async (tx) => {
      await tx.moduleBuildRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          reviewedBy: auth.actorUserId,
          reviewedAt: new Date(),
          decisionNote: note,
        },
      });
      await writePortalAudit(tx, auth, decision === 'approve' ? 'AI_BUILD_APPROVED' : 'AI_BUILD_REJECTED', 'ModuleBuildRequest', id, {
        note,
        requestCode: row.requestCode,
        riskLevel: row.riskLevel,
        before: { status: row.status },
        after: { status: nextStatus },
      }, request);
    });

    return NextResponse.json({ success: true, requestId: id, status: nextStatus });
  } catch (error) {
    return unavailable('super-admin/ai/system-builder/requests/{id}/approve', error);
  }
}

export const PATCH = withAuth(handlePatch);
