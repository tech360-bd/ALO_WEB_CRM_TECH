// PATCH /api/super-admin/approvals/{id}
//
// Approve / reject / request revision / hold. Requires the real non-acting
// Super Admin plus a written reason. The decision and its audit row are
// written in one transaction.
//
// AI-task approvals are routed to the AI task table (status WAITING -> QUEUED
// or CANCELLED) so an approved agent action can actually proceed and a
// rejected one can never run.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';

const Body = z.object({
  decision: z.enum(['approve', 'reject', 'revision_needed', 'hold']),
  note: z.string().trim().min(8, 'A note of at least 8 characters is required.').max(1000),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body.' },
      { status: 400 },
    );
  }
  const { decision, note } = parsed.data;

  try {
    if (id.startsWith('ai-task:')) {
      const taskId = id.slice('ai-task:'.length);
      const task = await db.aiTask.findUnique({ where: { id: taskId } });
      if (!task) {
        return NextResponse.json({ success: false, error: 'AI task not found.' }, { status: 404 });
      }
      if (task.status !== 'WAITING') {
        return NextResponse.json(
          { success: false, error: `AI task is ${task.status}, not waiting for approval.` },
          { status: 409 },
        );
      }
      const nextStatus = decision === 'approve' ? 'QUEUED' : decision === 'reject' ? 'CANCELLED' : 'WAITING';
      await db.$transaction(async (tx) => {
        await tx.aiTask.update({
          where: { id: taskId },
          data: { status: nextStatus, ...(decision === 'reject' ? { errorMessage: `Rejected by Super Admin: ${note}` } : {}) },
        });
        await writePortalAudit(tx, auth, `AI_TASK_${decision.toUpperCase()}`, 'AiTask', taskId, {
          note,
          before: { status: task.status },
          after: { status: nextStatus },
          action: task.action,
          agentName: task.agentName,
        }, request);
      });
      return NextResponse.json({ success: true, entity: 'AiTask', status: nextStatus });
    }

    const approval = await db.approvalRequest.findUnique({ where: { id } });
    if (!approval) {
      return NextResponse.json({ success: false, error: 'Approval request not found.' }, { status: 404 });
    }
    if (approval.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `This request is already ${approval.status}.` },
        { status: 409 },
      );
    }

    const nextStatus = decision === 'approve'
      ? 'approved'
      : decision === 'reject'
        ? 'rejected'
        : decision === 'revision_needed'
          ? 'revision_needed'
          : 'escalated';

    await db.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(decision === 'approve'
            ? { approvedById: auth.actorUserId, approvedByName: auth.actorName, approvedAt: new Date() }
            : {}),
          ...(decision === 'reject'
            ? {
                rejectedById: auth.actorUserId,
                rejectedByName: auth.actorName,
                rejectedAt: new Date(),
                rejectionReason: note,
              }
            : {}),
        },
      });
      await writePortalAudit(tx, auth, `APPROVAL_${decision.toUpperCase()}`, 'ApprovalRequest', id, {
        note,
        before: { status: approval.status },
        after: { status: nextStatus },
        type: approval.type,
        entityType: approval.entityType,
        entityId: approval.entityId,
      }, request);
    });

    return NextResponse.json({ success: true, entity: 'ApprovalRequest', status: nextStatus });
  } catch (error) {
    console.error('[super-admin/approvals PATCH] failed', error);
    return NextResponse.json({ success: false, error: 'Decision could not be applied and audited.' }, { status: 503 });
  }
}

export const PATCH = withAuth(handlePatch);
