import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';

export class ApprovalConflict extends Error {}
export class ApprovalForbidden extends Error {}
export function canDecideApproval(auth: AuthContext): boolean {
  return auth.actorUserId === auth.userId && (
    auth.userType.toUpperCase() === 'SUPER_ADMIN' || auth.roles.some(role => role.toUpperCase() === 'SUPER_ADMIN')
  );
}

export async function processApproval(
  approvalId: string, decision: 'approved' | 'rejected', auth: AuthContext, notes?: string,
) {
  if (!canDecideApproval(auth)) throw new ApprovalForbidden('SUPER_ADMIN required');
  if (!approvalId || !['approved', 'rejected'].includes(decision)) throw new Error('Invalid decision');
  return db.$transaction(async tx => {
    const changed = await tx.agentApprovalQueue.updateMany({
      where: { id: approvalId, status: 'pending' },
      data: {
        status: decision,
        ...(decision === 'approved' ? { approvedById: auth.actorUserId, approvedAt: new Date() }
          : { rejectedById: auth.actorUserId, rejectedAt: new Date() }),
      },
    });
    if (changed.count !== 1) throw new ApprovalConflict('Approval is missing or already decided');
    const updated = await tx.agentApprovalQueue.findUniqueOrThrow({ where: { id: approvalId } });
    await tx.agentAuditLog.create({ data: {
      agentId: updated.agentId, actorId: auth.actorUserId,
      action: `APPROVAL_${decision.toUpperCase()}`, before: 'pending', after: decision,
      metadata: JSON.stringify({ approvalId, notes: notes || '' }), ipAddress: '',
    } });
    return updated;
  });
}
