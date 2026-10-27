// PATCH /api/super-admin/approvals/{id}/reject
//
// Rejects an Approval Center item. A rejection reason is mandatory: a rejected
// request with no reason is useless to the person who asked.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, actorLabel, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, conflict, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  reason: z.string().trim().min(10, 'Give the requester a reason of at least 10 characters.').max(1000),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'A rejection reason is required.');

  try {
    const approval = await db.approvalRequest.findUnique({ where: { id } });
    if (!approval) return notFound('Approval not found.');
    if (approval.status !== 'pending') return conflict(`This approval is already ${approval.status}.`);

    const reviewer = await db.portalUser.findUnique({
      where: { id: auth.actorUserId },
      select: { name: true, email: true },
    }).catch(() => null);
    const reviewerName = reviewer?.name || reviewer?.email || actorLabel(auth) || 'Super Admin';

    await db.$transaction(async (tx) => {
      const fresh = await tx.approvalRequest.findUnique({ where: { id }, select: { status: true } });
      if (!fresh || fresh.status !== 'pending') throw new Error('ALREADY_DECIDED');
      await tx.approvalRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectedById: auth.actorUserId,
          rejectedByName: reviewerName,
          rejectedAt: new Date(),
          rejectionReason: parsed.data.reason,
        },
      });
      await writePortalAudit(tx, auth, 'APPROVAL_REJECTED', 'ApprovalRequest', id, {
        reason: parsed.data.reason,
        type: approval.type,
        title: approval.title,
        rejectedByName: reviewerName,
      }, request);
    });

    return NextResponse.json({ success: true, approvalId: id, status: 'rejected', rejectedByName: reviewerName });
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_DECIDED') {
      return conflict('This approval was decided by another session.');
    }
    return unavailable('super-admin/approvals/{id}/reject', error);
  }
}

export const PATCH = withAuth(handlePatch);
