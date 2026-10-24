import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  employeeFindUnique: vi.fn(),
  employeeFindFirst: vi.fn(),
  grantFindMany: vi.fn(),
  grantFindUnique: vi.fn(),
  grantFindFirst: vi.fn(),
  grantCreate: vi.fn(),
  grantUpdateMany: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
}));
const tx = {
  employee: { findFirst: (...args: unknown[]) => mocks.employeeFindFirst(...args) },
  employeeTemporaryPermission: {
    findUnique: (...args: unknown[]) => mocks.grantFindUnique(...args),
    findFirst: (...args: unknown[]) => mocks.grantFindFirst(...args),
    create: (...args: unknown[]) => mocks.grantCreate(...args),
    updateMany: (...args: unknown[]) => mocks.grantUpdateMany(...args),
  },
  portalAuditLog: { create: (...args: unknown[]) => mocks.audit(...args) },
};
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: (request: Request) => mocks.auth(request) }));
vi.mock('@/lib/db', () => ({ db: {
  employee: {
    findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args),
    findFirst: (...args: unknown[]) => mocks.employeeFindFirst(...args),
  },
  employeeTemporaryPermission: {
    findMany: (...args: unknown[]) => mocks.grantFindMany(...args),
    findUnique: (...args: unknown[]) => mocks.grantFindUnique(...args),
    findFirst: (...args: unknown[]) => mocks.grantFindFirst(...args),
  },
  $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
} }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: (...args: unknown[]) => mocks.audit(...args) }));

import { DELETE, GET, POST } from '@/app/api/employee-access/temporary-permissions/route';

const origin = 'https://alo.test';
const employee = { id: 'emp-1', userId: 'user-1', employeeId: 'ALO-1', status: 'active' };
const grant = {
  id: 'grant-1', employeeId: 'emp-1', featureKey: 'employee.documents', action: 'view', scopeType: 'own', scopeId: '',
  grantedBy: 'manager-1', approvedBy: 'manager-1', reason: 'Temporary cover during approved staff leave',
  startDate: new Date('2026-01-01T00:00:00Z'), endDate: new Date('2026-01-02T00:00:00Z'), expiresAt: new Date('2026-01-02T00:00:00Z'),
  active: true, isActive: true, createdAt: new Date('2026-01-01T00:00:00Z'),
};
const auth = { identityDomain: 'portal', authenticationMethod: 'cookie', userId: 'user-1', userType: 'EMPLOYEE', roles: ['EMPLOYEE'], permissions: [], actorUserId: 'user-1' };
const req = (path = '/api/employee-access/temporary-permissions', init?: RequestInit) => new NextRequest(new URL(path, origin), init);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(auth);
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.employeeFindFirst.mockResolvedValue(employee);
  mocks.grantFindMany.mockResolvedValue([grant]);
  mocks.grantFindUnique.mockResolvedValue(grant);
  mocks.grantFindFirst.mockResolvedValue(null);
  mocks.grantCreate.mockResolvedValue({ ...grant, id: 'grant-new', startDate: new Date(), endDate: new Date(Date.now() + 86_400_000) });
  mocks.grantUpdateMany.mockResolvedValue({ count: 1 });
  mocks.audit.mockResolvedValue({ id: 'audit-1' });
  mocks.transaction.mockImplementation((callback) => callback(tx));
});

describe('temporary employee permission expiry and revocation', () => {
  it('reports an expired row as ineffective even if its persisted active flags remain true', async () => {
    const response = await GET(req());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.permissions[0]).toMatchObject({ id: 'grant-1', active: false, isActive: false, effectiveStatus: 'EXPIRED' });
    expect(mocks.grantFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { employeeId: { in: ['emp-1', 'user-1', 'ALO-1'] }, active: true, isActive: true },
      select: expect.objectContaining({ expiresAt: true, endDate: true }),
    }));
    expect(mocks.audit).toHaveBeenCalled();
  });

  it('does not disclose another employee grant without independent HR review authority', async () => {
    const response = await GET(req('/api/employee-access/temporary-permissions?employeeId=other-user'));
    expect(response.status).toBe(403);
    expect(mocks.grantFindMany).not.toHaveBeenCalled();
  });

  it('fails closed for a cross-origin grant mutation', async () => {
    mocks.auth.mockResolvedValue({ ...auth, roles: ['HR_MANAGER'], permissions: ['employee.permission_requests.approve'] });
    const response = await POST(req('/api/employee-access/temporary-permissions', {
      method: 'POST', headers: { origin: 'https://attacker.test', 'content-type': 'application/json' },
      body: JSON.stringify({ employeeId: 'target-user', featureKey: 'employee.documents', endDate: new Date(Date.now() + 86_400_000).toISOString(), reason: 'Temporary cover during approved staff leave' }),
    }));
    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects direct broad or long-lived grants before writing', async () => {
    mocks.auth.mockResolvedValue({ ...auth, roles: ['HR_MANAGER'], permissions: ['employee.permission_requests.approve'] });
    const response = await POST(req('/api/employee-access/temporary-permissions', {
      method: 'POST', headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ employeeId: 'target-user', featureKey: 'employee.payroll', action: 'manage', scopeType: 'GLOBAL', endDate: new Date(Date.now() + 90 * 86_400_000).toISOString(), reason: 'Urgent temporary cover for payroll operations' }),
    }));
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('creates only a whitelisted, scoped, view-only grant for another active employee and audits it', async () => {
    mocks.auth.mockResolvedValue({ ...auth, roles: ['HR_MANAGER'], permissions: ['employee.permission_requests.approve'] });
    mocks.employeeFindFirst.mockResolvedValue({ ...employee, id: 'emp-2', userId: 'user-2', employeeId: 'ALO-2' });
    const response = await POST(req('/api/employee-access/temporary-permissions', {
      method: 'POST', headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ employeeId: 'user-2', featureKey: 'employee.documents', action: 'view', scopeType: 'OWN', endDate: new Date(Date.now() + 86_400_000).toISOString(), reason: 'Temporary cover during approved staff leave' }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.grantCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ employeeId: 'emp-2', featureKey: 'employee.documents', action: 'view', scopeType: 'own' }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'TEMPORARY_PERMISSION_GRANTED', 'EmployeeTemporaryPermission', 'grant-new', expect.anything(), expect.anything());
  });

  it('immediately revokes own access with compare-and-set flags and an audit record', async () => {
    const response = await DELETE(req('/api/employee-access/temporary-permissions', {
      method: 'DELETE', headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'grant-1', reason: 'I no longer need this temporary access' }),
    }));
    expect(response.status).toBe(200);
    expect(mocks.grantUpdateMany).toHaveBeenCalledWith({ where: { id: 'grant-1', employeeId: 'emp-1', active: true, isActive: true }, data: { active: false, isActive: false } });
    expect(mocks.audit).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'TEMPORARY_PERMISSION_REVOKED', 'EmployeeTemporaryPermission', 'grant-1', expect.objectContaining({ immediate: true }), expect.anything());
  });

  it('denies revoking another employee grant without reviewer authority', async () => {
    mocks.grantFindUnique.mockResolvedValue({ ...grant, employeeId: 'other-employee' });
    mocks.employeeFindFirst.mockResolvedValue({ id: 'other-employee', userId: 'other-user', employeeId: 'ALO-2' });
    const response = await DELETE(req('/api/employee-access/temporary-permissions', {
      method: 'DELETE', headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'grant-1', reason: 'The employee no longer requires this access' }),
    }));
    expect(response.status).toBe(403);
    expect(mocks.grantUpdateMany).not.toHaveBeenCalled();
  });
});
