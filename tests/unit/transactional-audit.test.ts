import { describe, expect, it, vi } from 'vitest';
import { writePortalAudit, writeHrmAudit } from '@/lib/transactional-audit';
import type { AuthContext } from '@/lib/auth-middleware';
import type { Prisma } from '@prisma/client';
const auth = { userId: 'subject', actorUserId: 'actor', roles: ['SUPER_ADMIN'], userType: 'SUPER_ADMIN' } as AuthContext;
describe('transaction-bound audit writers', () => {
  it('preserves actor, full payload and request context', async () => {
    const create = vi.fn().mockResolvedValue({});
    await writePortalAudit({ portalAuditLog: { create } } as unknown as Prisma.TransactionClient, auth, 'UPDATE', 'Employee', 'e', { detail: 'x'.repeat(1000) }, new Request('https://example.com', { headers: { 'user-agent': 'test-client' } }));
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: 'actor', userAgent: 'test-client', metadata: JSON.stringify({ detail: 'x'.repeat(1000), actingAsUser: 'subject' }) }) });
  });
  it('propagates persistence failure instead of logging success', async () => {
    const tx = { portalAuditLog: { create: vi.fn().mockRejectedValue(new Error('db failed')) } };
    await expect(writePortalAudit(tx as unknown as Prisma.TransactionClient, auth, 'UPDATE', 'Employee', 'e', {})).rejects.toThrow('db failed');
  });
  it('rejects root-client fallback outside transaction', async () => {
    await expect(writePortalAudit({ $transaction: vi.fn() } as unknown as Prisma.TransactionClient, auth, 'UPDATE', 'Employee', 'e', {})).rejects.toThrow('interactive transaction');
  });
  it('requires both HR and legacy audit writes to succeed', async () => {
    const tx = { hrmAuditLog: { create: vi.fn().mockResolvedValue({}) }, employeeAuditLog: { create: vi.fn().mockRejectedValue(new Error('mirror failed')) } };
    await expect(writeHrmAudit(tx as unknown as Prisma.TransactionClient, auth, 'PAYROLL', 'Run', 'r', {})).rejects.toThrow('mirror failed');
    expect(tx.hrmAuditLog.create).toHaveBeenCalledOnce();
  });
});
