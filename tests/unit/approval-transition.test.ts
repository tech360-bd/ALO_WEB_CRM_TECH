import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/auth-middleware';
const { db } = vi.hoisted(() => ({ db: { $transaction: vi.fn() } }));
vi.mock('@/lib/db', () => ({ db }));
import { processApproval, ApprovalConflict, ApprovalForbidden } from '@/lib/agentos/approval-transition';
const admin = { userId: 'admin', actorUserId: 'admin', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] } as AuthContext;
let status: string, audit: string[], failAudit: boolean;
beforeEach(() => {
  vi.clearAllMocks();
  status = 'pending'; audit = []; failAudit = false;
  // Serialized transaction double models commit/rollback; no claim of a real DB race test.
  let queue = Promise.resolve();
  db.$transaction.mockImplementation(callback => {
    const task = queue.then(async () => {
      let draft = status; const staged: string[] = [];
      const result = await callback({ agentApprovalQueue: {
        updateMany: async ({ where, data }) => { if (draft !== where.status) return { count: 0 }; draft = data.status; return { count: 1 }; },
        findUniqueOrThrow: async () => ({ id: 'a', agentId: 'agent', status: draft }),
      }, agentAuditLog: { create: async ({ data }) => { if (failAudit) throw new Error('audit unavailable'); staged.push(data.action); } } });
      status = draft; audit.push(...staged); return result;
    });
    queue = task.catch(() => undefined); return task;
  });
});
describe('approval transactional transition', () => {
  it('commits decision and audit together', async () => {
    expect(await processApproval('a', 'approved', admin)).toMatchObject({ status: 'approved' });
    expect(audit).toEqual(['APPROVAL_APPROVED']);
  });
  it('audit failure rolls back decision and allows a safe retry', async () => {
    failAudit = true;
    await expect(processApproval('a', 'approved', admin)).rejects.toThrow('audit unavailable');
    expect(status).toBe('pending'); expect(audit).toEqual([]);
    failAudit = false; await processApproval('a', 'rejected', admin);
    expect(status).toBe('rejected');
  });
  it('one concurrent competing decision wins; duplicate retry conflicts', async () => {
    const results = await Promise.allSettled([processApproval('a', 'approved', admin), processApproval('a', 'rejected', admin)]);
    expect(results.filter(x => x.status === 'fulfilled')).toHaveLength(1);
    expect(audit).toHaveLength(1);
    await expect(processApproval('a', 'approved', admin)).rejects.toBeInstanceOf(ApprovalConflict);
  });
  it('rejects non-super-admin and acting-as identities before database access', async () => {
    await expect(processApproval('a', 'approved', { ...admin, roles: ['ADMIN'], userType: 'ADMIN' })).rejects.toBeInstanceOf(ApprovalForbidden);
    await expect(processApproval('a', 'approved', { ...admin, actorUserId: 'someone-else' })).rejects.toBeInstanceOf(ApprovalForbidden);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
