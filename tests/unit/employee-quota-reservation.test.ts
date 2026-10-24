import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ access: vi.fn(), transaction: vi.fn(), employee: vi.fn(), rules: vi.fn(), history: vi.fn(), create: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { $transaction: m.transaction } }));
vi.mock('@/lib/access-control/central-security-engine', () => ({ validateRequestAccess: m.access }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
import { reserveEmployeeQuota } from '@/lib/employee-access-engine';
import type { AuthContext } from '@/lib/auth-middleware';
const auth = { userId: 'staff', actorUserId: 'master', userType: 'EMPLOYEE', roles: ['EMPLOYEE'], permissions: [], actingAsSessionId: 'acting' } as AuthContext;
beforeEach(() => {
  vi.resetAllMocks(); m.access.mockResolvedValue({ allowed: true, scope: 'OWN' }); m.employee.mockResolvedValue({ id: 'emp', status: 'active' }); m.rules.mockResolvedValue([{ featureKey: 'images.use', isEnabled: true, requiresApproval: false, limitValue: 2 }]); m.history.mockResolvedValue([]); m.create.mockResolvedValue({ id: 'usage' });
  m.transaction.mockImplementation(async callback => callback({ employee: { findUnique: m.employee }, featureAccessRule: { findMany: m.rules }, featureUsageLog: { findMany: m.history, create: m.create } }));
});
describe('central atomic employee quota reservation', () => {
  it('denies missing permission before database mutation', async () => { m.access.mockResolvedValue({ allowed: false }); expect((await reserveEmployeeQuota(auth, 'images')).allowed).toBe(false); expect(m.transaction).not.toHaveBeenCalled(); });
  it('never invents a default limit when no rule is configured', async () => { m.rules.mockResolvedValue([]); expect(await reserveEmployeeQuota(auth, 'images')).toMatchObject({ allowed: false, limit: 0, usage: null }); expect(m.create).not.toHaveBeenCalled(); });
  it.each([{ isEnabled: false, requiresApproval: false, limitValue: 20 }, { isEnabled: true, requiresApproval: true, limitValue: 20 }, { isEnabled: true, requiresApproval: false, limitValue: 0 }])('rejects revoked, approval-gated or zero quota rules', async rule => { m.rules.mockResolvedValue([{ featureKey: 'images.use', ...rule }]); expect((await reserveEmployeeQuota(auth, 'images')).allowed).toBe(false); expect(m.create).not.toHaveBeenCalled(); });
  it('counts recorded amounts and denies an overspend', async () => { m.history.mockResolvedValue([{ metadata: '{"amount":2}' }]); expect(await reserveEmployeeQuota(auth, 'images')).toMatchObject({ allowed: false, currentUsage: 2, limit: 2 }); expect(m.create).not.toHaveBeenCalled(); });
  it('reserves and audits inside Serializable isolation, retaining the actual actor context', async () => { expect(await reserveEmployeeQuota(auth, 'images')).toMatchObject({ allowed: true, currentUsage: 1, limit: 2, usage: { id: 'usage' } }); expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' }); expect(m.audit).toHaveBeenCalledWith(expect.any(Object), auth, 'QUOTA_USED', 'FeatureUsageLog', 'usage', expect.objectContaining({ amount: 1, previousUsage: 0 })); });
  it('does not reserve for a suspended employee', async () => { m.employee.mockResolvedValue({ id: 'emp', status: 'suspended' }); expect((await reserveEmployeeQuota(auth, 'images')).allowed).toBe(false); expect(m.create).not.toHaveBeenCalled(); });
  it('rejects invalid amounts before checking authority', async () => { await expect(reserveEmployeeQuota(auth, 'images', -1)).rejects.toThrow('Invalid usage amount'); expect(m.access).not.toHaveBeenCalled(); });
  it('propagates required audit failure so the transaction rolls back', async () => { m.audit.mockRejectedValue(new Error('audit down')); await expect(reserveEmployeeQuota(auth, 'images')).rejects.toThrow('audit down'); });
});
