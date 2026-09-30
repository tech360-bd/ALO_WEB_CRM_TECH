import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { authenticateRequest, db } = vi.hoisted(() => ({ authenticateRequest: vi.fn(), db: { $transaction: vi.fn() } }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest }));
vi.mock('@/lib/db', () => ({ db }));
vi.mock('@/lib/agentos/agent-service', () => ({ getPendingApprovals: vi.fn() }));
import { POST } from '@/app/api/agentos/approvals/route';
const request = () => new NextRequest('https://example.com/api/agentos/approvals', { method: 'POST', body: JSON.stringify({ approvalId: 'a', decision: 'approved', reviewerId: 'forged' }) });
beforeEach(() => { vi.resetAllMocks(); });
describe('legacy approval route authorization and conflict', () => {
  it('rejects authenticated employees before transaction', async () => {
    authenticateRequest.mockResolvedValue({ userId: 'employee', actorUserId: 'employee', userType: 'EMPLOYEE', roles: [] });
    expect((await POST(request())).status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('returns 409 on concurrent loss; submitted reviewer cannot override actor', async () => {
    authenticateRequest.mockResolvedValue({ userId: 'admin', actorUserId: 'admin', userType: 'SUPER_ADMIN', roles: [] });
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    db.$transaction.mockImplementation(callback => callback({ agentApprovalQueue: { updateMany } }));
    expect((await POST(request())).status).toBe(409);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'a', status: 'pending' }, data: expect.objectContaining({ approvedById: 'admin' }) }));
  });
});
