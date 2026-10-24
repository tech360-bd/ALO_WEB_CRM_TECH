import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ user: vi.fn(), portal: vi.fn(), employee: vi.fn(), hr: vi.fn(), grants: vi.fn(), assignments: vi.fn(), packages: vi.fn(), rules: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  user: { findUnique: mock.user }, portalUser: { findUnique: mock.portal }, employee: { findFirst: mock.employee }, employeeHR: { findUnique: mock.hr },
  employeeTemporaryPermission: { findMany: mock.grants }, employeePermissionPackageAssignment: { findMany: mock.assignments }, permissionPackage: { findMany: mock.packages },
  featureAccessRule: { findMany: mock.rules }, integrationAuditLog: { create: mock.audit },
} }));
import { logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';

describe('central record scope isolation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mock.user.mockResolvedValue({ id: 'staff', role: 'EMPLOYEE', status: 'ACTIVE', emailVerified: true });
    mock.employee.mockResolvedValue({ id: 'emp', userId: 'staff', employeeId: 'ALO-1', status: 'active', branch: 'Dhaka', department: 'admission', destinationFocus: '["UK"]', offices: [{ id: 'office-1', status: 'ACTIVE' }] });
    mock.grants.mockResolvedValue([]); mock.assignments.mockResolvedValue([]); mock.packages.mockResolvedValue([]); mock.rules.mockResolvedValue([]);
  });
  const check = (target: Parameters<typeof validateRequestAccess>[3]) => validateRequestAccess({ userId: 'staff', branchId: 'London' }, 'records', 'view', target);
  it.each([
    ['BRANCH', 'Dhaka', { branchId: 'Dhaka' }, { branchId: 'London' }],
    ['DEPARTMENT', 'admission', { departmentId: 'admission' }, { departmentId: 'finance' }],
    ['OFFICE', 'office-1', { officeId: 'office-1' }, { officeId: 'office-2' }],
    ['COUNTRY', 'UK', { country: 'uk' }, { country: 'Canada' }],
    ['RECORD', 'Student:one', { recordType: 'Student', recordId: 'one' }, { recordType: 'Payment', recordId: 'one' }],
    ['OWN', '', { ownerId: 'ALO-1' }, { assigneeId: 'staff' }],
    ['ASSIGNED', '', { assigneeId: 'staff' }, { ownerId: 'staff' }],
  ])('%s grant allows its record and denies unrelated records in temporary and package paths', async (scopeType, scopeId, allowed, denied) => {
    const permission = { featureKey: 'records', action: 'view', scopeType, scopeId };
    mock.grants.mockResolvedValue([permission]);
    expect((await check(allowed)).allowed).toBe(true);
    expect((await check(denied)).allowed).toBe(false);
    mock.grants.mockResolvedValue([]); mock.assignments.mockResolvedValue([{ packageId: 'pkg' }]); mock.packages.mockResolvedValue([{ permissions: JSON.stringify([permission]) }]);
    expect((await check(allowed)).allowed).toBe(true);
    expect((await check(denied)).allowed).toBe(false);
  });
  it.each(['BRANCH', 'DEPARTMENT', 'OFFICE', 'COUNTRY', 'RECORD', 'TEAM'])('rejects unbounded %s grants', async scopeType => {
    mock.grants.mockResolvedValue([{ scopeType, scopeId: '' }]);
    expect((await check({ branchId: 'Dhaka', departmentId: 'admission', officeId: 'office-1', country: 'UK', ownerId: 'staff' })).allowed).toBe(false);
  });
  it('requires the current reporting manager for TEAM rather than a claimed title', async () => {
    mock.grants.mockResolvedValue([{ scopeType: 'TEAM', scopeId: 'emp' }]);
    mock.employee.mockResolvedValueOnce({ id: 'emp', userId: 'staff', employeeId: 'ALO-1', status: 'active' }).mockResolvedValueOnce({ id: 'report', userId: 'report-user', employeeId: 'ALO-2', status: 'active' });
    mock.hr.mockResolvedValue({ reportingManagerId: 'emp' });
    expect((await check({ assigneeId: 'report-user' })).allowed).toBe(true);
    mock.hr.mockResolvedValue({ reportingManagerId: 'another-manager' });
    mock.employee.mockResolvedValueOnce({ id: 'emp', userId: 'staff', employeeId: 'ALO-1', status: 'active' }).mockResolvedValueOnce({ id: 'report', userId: 'report-user', employeeId: 'ALO-2', status: 'active' });
    expect((await check({ assigneeId: 'report-user' })).allowed).toBe(false);
  });
  it('a student portal account cannot inherit an attached master role', async () => {
    mock.user.mockResolvedValue(null); mock.portal.mockResolvedValue({ id: 'staff', userType: 'STUDENT', status: 'ACTIVE', emailVerified: true, roles: [{ role: { name: 'SUPER_ADMIN' } }] });
    expect((await check({ ownerId: 'staff' })).allowed).toBe(false);
  });
  it('does not deliver sensitive data when its audit cannot persist', async () => {
    mock.audit.mockRejectedValue(new Error('storage unavailable'));
    await expect(logSecurityAudit({ actorId: 'staff', actorRole: 'EMPLOYEE', action: 'SALARY_VIEWED', targetType: 'Employee', targetId: 'emp' })).rejects.toThrow('storage unavailable');
  });
});
