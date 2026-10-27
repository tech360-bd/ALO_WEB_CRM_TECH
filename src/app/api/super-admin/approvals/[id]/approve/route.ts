// PATCH /api/super-admin/approvals/{id}/approve
//
// Approves an Approval Center item. Double approval is impossible: the row must
// still be `pending`, and the transaction re-checks that before writing.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, actorLabel, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, conflict, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  note: z.string().trim().max(1000).default(''),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');

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
          status: 'approved',
          approvedById: auth.actorUserId,
          approvedByName: reviewerName,
          approvedAt: new Date(),
        },
      });
      await writePortalAudit(tx, auth, 'APPROVAL_APPROVED', 'ApprovalRequest', id, {
        note: parsed.data.note,
        type: approval.type,
        title: approval.title,
        entityType: approval.entityType,
        entityId: approval.entityId,
        approvedByName: reviewerName,
      }, request);
    });

    return NextResponse.json({ success: true, approvalId: id, status: 'approved', approvedByName: reviewerName });
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_DECIDED') {
      return conflict('This approval was decided by another session.');
    }
    return unavailable('super-admin/approvals/{id}/approve', error);
  }
}

export const PATCH = withAuth(handlePatch);
