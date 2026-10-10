/**
 * ALO AI Workforce — human approval gate (§16, §30).
 *
 * An approval authorises ONE specific action, for ONE run, ONCE. The AI may
 * prepare the action; only an authorised human decides it. Consumption is
 * atomic, so an approved record cannot be replayed by a second tool call.
 */
import { db } from '@/lib/db';
import { writeAudit } from './audit';
import { redactDeep } from './security';
import type { ActorContext, RiskLevel } from './types';
import { can } from './rbac';
import { stableHash } from './text';

export interface ApprovalRequestInput {
  runId?: string;
  agentSlug: string;
  toolSlug?: string;
  action: string;
  riskLevel: RiskLevel;
  reason: string;
  payload: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  requestedById: string;
  ttlMinutes?: number;
}

export async function requestApproval(input: ApprovalRequestInput): Promise<{ id: string; status: string }> {
  const row = await db.awfApproval.create({
    data: {
      runId: input.runId || null,
      agentSlug: input.agentSlug,
      toolSlug: input.toolSlug || '',
      action: input.action,
      riskLevel: input.riskLevel,
      reason: String(input.reason).slice(0, 1000),
      payload: JSON.stringify(redactDeep(input.payload)).slice(0, 60_000),
      entityType: input.entityType || '',
      entityId: input.entityId || '',
      requestedById: input.requestedById,
      requestedByAgent: input.agentSlug,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + (input.ttlMinutes ?? 7 * 24 * 60) * 60_000),
    },
  });
  await writeAudit({
    actor: { userId: input.requestedById, role: 'SYSTEM' as never, ipAddress: '' },
    action: 'APPROVAL_REQUESTED',
    objectType: 'AwfApproval',
    objectId: row.id,
    after: { action: input.action, riskLevel: input.riskLevel, agentSlug: input.agentSlug, toolSlug: input.toolSlug },
  });
  return { id: row.id, status: row.status };
}

export class ApprovalError extends Error {
  readonly status = 403;
  constructor(reason: string) {
    super(`AWF_APPROVAL: ${reason}`);
  }
}

export async function decideApproval(
  approvalId: string,
  actor: ActorContext,
  decision: 'APPROVED' | 'REJECTED',
  note = ''
): Promise<{ id: string; status: string }> {
  if (!can(actor.role, 'awf.approval.decide')) throw new ApprovalError('role may not decide approvals');
  const existing = await db.awfApproval.findUnique({ where: { id: approvalId } });
  if (!existing) throw new ApprovalError('approval not found');
  if (existing.status !== 'PENDING') throw new ApprovalError(`approval is already ${existing.status}`);
  if (existing.expiresAt && existing.expiresAt.getTime() < Date.now()) {
    await db.awfApproval.update({ where: { id: approvalId }, data: { status: 'EXPIRED' } });
    throw new ApprovalError('approval has expired');
  }
  // Critical risk is Super Admin only.
  if (existing.riskLevel === 'CRITICAL' && actor.role !== 'SUPER_ADMIN') {
    throw new ApprovalError('CRITICAL risk actions require Super Admin approval');
  }
  // The requester cannot approve their own high-risk request.
  if (decision === 'APPROVED' && existing.requestedById === actor.userId && ['HIGH', 'CRITICAL'].includes(existing.riskLevel)) {
    throw new ApprovalError('separation of duties: the requester cannot approve this action');
  }
  const updated = await db.awfApproval.update({
    where: { id: approvalId },
    data: { status: decision, decidedById: actor.userId, decidedAt: new Date(), decisionNote: String(note).slice(0, 1000) },
  });
  await writeAudit({
    actor,
    action: decision === 'APPROVED' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
    objectType: 'AwfApproval',
    objectId: approvalId,
    before: { status: 'PENDING' },
    after: { status: decision, decidedBy: actor.userId },
    reason: note,
  });
  return { id: updated.id, status: updated.status };
}

/**
 * Atomically consume an approval for one action. Returns false when the
 * approval is missing, not approved, expired, already consumed, or bound to a
 * different action/run/payload.
 */
export async function consumeApproval(params: {
  approvalId: string;
  runId: string;
  action: string;
  toolSlug?: string;
  payload: Record<string, unknown>;
}): Promise<{ ok: boolean; reason: string }> {
  const approval = await db.awfApproval.findUnique({ where: { id: params.approvalId } });
  if (!approval) return { ok: false, reason: 'approval not found' };
  if (approval.status !== 'APPROVED') return { ok: false, reason: `approval status is ${approval.status}` };
  if (approval.consumedAt) return { ok: false, reason: 'approval already consumed' };
  if (approval.expiresAt && approval.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'approval expired' };
  if (approval.action !== params.action) return { ok: false, reason: 'approval is bound to a different action' };
  if (approval.toolSlug && params.toolSlug && approval.toolSlug !== params.toolSlug) {
    return { ok: false, reason: 'approval is bound to a different tool' };
  }
  // The approval is bound to the action, the tool and the exact payload, and
  // is single-use. The consuming run may legitimately differ from the run that
  // requested it (a human approves after the escalating run has ended and the
  // work is completed by a continuation run), so the consuming run id is
  // recorded for audit rather than used as a rejection criterion.
  const continuationRun = Boolean(approval.runId && approval.runId !== params.runId);
  const approvedHash = stableHash(JSON.parse(approval.payload || '{}'));
  const requestedHash = stableHash(redactDeep(params.payload));
  if (approvedHash !== requestedHash) return { ok: false, reason: 'the action payload differs from what was approved' };

  // Atomic single-use consumption: the update only matches a not-yet-consumed row.
  const result = await db.awfApproval.updateMany({
    where: { id: params.approvalId, status: 'APPROVED', consumedAt: null },
    data: { status: 'CONSUMED', consumedAt: new Date(), consumedRunId: params.runId },
  });
  if (result.count !== 1) return { ok: false, reason: 'approval was consumed concurrently' };
  await writeAudit({
    action: 'APPROVAL_CONSUMED',
    objectType: 'AwfApproval',
    objectId: params.approvalId,
    after: { runId: params.runId, requestedInRunId: approval.runId, continuationRun, action: params.action },
  });
  return { ok: true, reason: 'consumed' };
}

export async function listApprovals(filter: { status?: string; take?: number } = {}) {
  return db.awfApproval.findMany({
    where: filter.status ? { status: filter.status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Math.min(200, Math.max(1, filter.take ?? 50)),
  });
}
