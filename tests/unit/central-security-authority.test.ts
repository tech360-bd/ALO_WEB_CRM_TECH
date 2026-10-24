import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  assignments: vi.fn(), packages: vi.fn(), user: vi.fn(), portal: vi.fn(), employee: vi.fn(), grants: vi.fn(), rules: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: {
  user: { findUnique: mocks.user }, portalUser: { findUnique: mocks.portal },
  employee: { findFirst: mocks.employee },
  employeeTemporaryPermission: { findMany: mocks.grants },
  featureAccessRule: { findMany: mocks.rules },
  employeePermissionPackageAssignment: { findMany: mocks.assignments }, permissionPackage: { findMany: mocks.packages },
} }));
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';

describe('current database authority and bounded grants', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({ id: 'staff', role: 'EMPLOYEE', status: 'ACTIVE', emailVerified: true });
    mocks.portal.mockResolvedValue(null);
    mocks.employee.mockResolvedValue({ id: 'emp', userId: 'staff', status: 'active', branch: 'Dhaka' });
    mocks.assignments.mockResolvedValue([]); mocks.packages.mockResolvedValue([]);
    mocks.grants.mockResolvedValue([]); mocks.rules.mockResolvedValue([]);
  });
  it('denies by default even when caller claims admin', async () => {
    expect((await validateRequestAccess({ userId: 'staff', userRole: 'SUPER_ADMIN' }, 'payroll', 'create')).allowed).toBe(false);
  });
  it.each(['admin', 'super-admin'])('rejects synthetic account %s', async userId => {
    mocks.user.mockResolvedValue(null);
    expect((await validateRequestAccess({ userId, userRole: 'SUPER_ADMIN' }, 'payroll', 'create')).allowed).toBe(false);
  });
  it.each(['INACTIVE', 'SUSPENDED', 'TERMINATED'])('blocks %s super admin before override', async status => {
    mocks.user.mockResolvedValue({ id: 'staff', role: 'SUPER_ADMIN', status, emailVerified: true });
    expect((await validateRequestAccess({ userId: 'staff' }, 'payroll', 'create')).allowed).toBe(false);
  });
  it('blocks suspended employee associated with active admin', async () => {
    mocks.user.mockResolvedValue({ id: 'staff', role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true });
    mocks.employee.mockResolvedValue({ status: 'SUSPENDED' });
    expect((await validateRequestAccess({ userId: 'staff' }, 'payroll', 'create')).allowed).toBe(false);
  });
  it('permits active verified exact super admin', async () => {
    mocks.user.mockResolvedValue({ id: 'staff', role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true });
    expect(await validateRequestAccess({ userId: 'staff' }, 'payroll', 'create')).toEqual({ allowed: true, scope: 'GLOBAL' });
  });
  it('does not treat partner admin substring as master authority', async () => {
    mocks.user.mockResolvedValue({ id: 'staff', role: 'PARTNER_SUPER_ADMIN', status: 'ACTIVE', emailVerified: true });
    expect((await validateRequestAccess({ userId: 'staff' }, 'payroll', 'create')).allowed).toBe(false);
  });
  it('checks action, start date, both expiries, and both revocation flags', async () => {
    await validateRequestAccess({ userId: 'staff' }, 'documents', 'download');
    expect(mocks.grants.mock.calls[0][0].where).toMatchObject({ action: 'download', active: true, isActive: true,
      startDate: { lte: expect.any(Date) }, endDate: { gt: expect.any(Date) }, expiresAt: { gt: expect.any(Date) } });
  });
  it('own temporary grant cannot authorize another record', async () => {
    mocks.grants.mockResolvedValue([{ scopeType: 'own' }]);
    expect((await validateRequestAccess({ userId: 'staff' }, 'documents', 'view', { ownerId: 'other' })).allowed).toBe(false);
    expect((await validateRequestAccess({ userId: 'staff' }, 'documents', 'view', { ownerId: 'staff' })).scope).toBe('OWN');
  });
  it('branch grant uses stored assignment rather than caller branch', async () => {
    mocks.grants.mockResolvedValue([{ scopeType: 'branch', scopeId: 'London' }]);
    expect((await validateRequestAccess({ userId: 'staff', branchId: 'London' }, 'documents', 'view', { branchId: 'London' })).allowed).toBe(false);
  });
  it('legacy rule stays bounded to owned records', async () => {
    mocks.rules.mockResolvedValue([{ isEnabled: true, requiresApproval: false }]);
    expect((await validateRequestAccess({ userId: 'staff' }, 'documents', 'view', { ownerId: 'other' })).allowed).toBe(false);
    expect((await validateRequestAccess({ userId: 'staff' }, 'documents', 'view', { ownerId: 'staff' })).allowed).toBe(true);
  });
  it.each([false, true])('explicit denial/approval gate overrides a global temporary grant (approval=%s)', async requiresApproval => {
    mocks.rules.mockResolvedValue([{ isEnabled: requiresApproval, requiresApproval }]);
    mocks.grants.mockResolvedValue([{ scopeType: 'GLOBAL' }]);
    expect((await validateRequestAccess({ userId: 'staff' }, 'documents', 'download', { ownerId: 'staff' })).allowed).toBe(false);
    expect(mocks.grants).not.toHaveBeenCalled();
  });
  it('revoked private-field permission overrides the default own-record view', async () => {
    mocks.rules.mockResolvedValue([{ isEnabled: false, requiresApproval: false }]);
    expect((await validateRequestAccess({ userId: 'staff' }, 'employee.fields.salary', 'view', { ownerId: 'staff' })).allowed).toBe(false);
  });

});
