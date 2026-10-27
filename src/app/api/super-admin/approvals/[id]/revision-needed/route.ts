// PATCH /api/super-admin/approvals/{id}/revision-needed
//
// Third outcome, distinct from approve/reject: the request is sent back for
// changes. Status becomes `revision_needed` and the change list is stored as
// both the rejection reason (so existing readers see it) and in the payload.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, actorLabel, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, conflict, notFound, unavailable, jsonObject } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  changesNeeded: z.string().trim().min(10, 'List the changes needed (10+ characters).').max(2000),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Changes needed are required.');

  try {
    const approval = await db.approvalRequest.findUnique({ where: { id } });
    if (!approval) return notFound('Approval not found.');
    if (approval.status !== 'pending') return conflict(`This approval is already ${approval.status}.`);

    const reviewer = await db.portalUser.findUnique({
      where: { id: auth.actorUserId },
      select: { name: true, email: true },
    }).catch(() => null);
    const reviewerName = reviewer?.name || reviewer?.email || actorLabel(auth) || 'Super Admin';

    const payload = {
      ...jsonObject(approval.payload),
      revision: {
        requestedBy: reviewerName,
        requestedById: auth.actorUserId,
        requestedAt: new Date().toISOString(),
        changesNeeded: parsed.data.changesNeeded,
      },
    };

    await db.$transaction(async (tx) => {
      const fresh = await tx.approvalRequest.findUnique({ where: { id }, select: { status: true } });
      if (!fresh || fresh.status !== 'pending') throw new Error('ALREADY_DECIDED');
      await tx.approvalRequest.update({
        where: { id },
        data: {
          status: 'revision_needed',
          rejectionReason: parsed.data.changesNeeded,
          payload: JSON.stringify(payload),
        },
      });
      await writePortalAudit(tx, auth, 'APPROVAL_REVISION_REQUESTED', 'ApprovalRequest', id, {
        changesNeeded: parsed.data.changesNeeded,
        type: approval.type,
        title: approval.title,
        requestedByName: reviewerName,
      }, request);
    });

    return NextResponse.json({
      success: true,
      approvalId: id,
      status: 'revision_needed',
      requestedByName: reviewerName,
      changesNeeded: parsed.data.changesNeeded,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_DECIDED') {
      return conflict('This approval was decided by another session.');
    }
    return unavailable('super-admin/approvals/{id}/revision-needed', error);
  }
}

export const PATCH = withAuth(handlePatch);
