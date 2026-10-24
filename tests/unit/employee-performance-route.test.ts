import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), employeeFindUnique: vi.fn(), employeeFindFirst: vi.fn(), profileFindUnique: vi.fn(), performanceFindMany: vi.fn(), performanceCount: vi.fn(), performanceAggregate: vi.fn(), performanceFindUnique: vi.fn(), performanceCreate: vi.fn(), performanceUpdateMany: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn() }));
const tx = {
  employeePerformance: {
    create: (...args: unknown[]) => mocks.performanceCreate(...args),
    updateMany: (...args: unknown[]) => mocks.performanceUpdateMany(...args),
    findUnique: (...args: unknown[]) => mocks.performanceFindUnique(...args),
  },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: (request: Request) => mocks.auth(request) }));
vi.mock('@/lib/db', () => ({ db: {
  employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args), findFirst: (...args: unknown[]) => mocks.employeeFindFirst(...args) },
  employeeProfile: { findUnique: (...args: unknown[]) => mocks.profileFindUnique(...args) },
  employeePerformance: { findMany: (...args: unknown[]) => mocks.performanceFindMany(...args), count: (...args: unknown[]) => mocks.performanceCount(...args), aggregate: (...args: unknown[]) => mocks.performanceAggregate(...args), findUnique: (...args: unknown[]) => mocks.performanceFindUnique(...args) },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
} }));

import { GET, POST, PUT } from '@/app/api/employee/performance/route';

const origin = new URL(process.env.NEXTAUTH_URL || 'https://alo.test').origin;
const employee = { id: 'emp-db', userId: 'user-1', employeeId: 'ALO-EMP-1', status: 'active' };
const auth = { identityDomain: 'user', userId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], permissions: ['employee.performance.view'], actorUserId: 'user-1' };
const req = (path = '/api/employee/performance', init?: RequestInit) => new NextRequest(new URL(path, origin), init);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(auth);
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.employeeFindFirst.mockResolvedValue({ id: 'target-db', userId: 'target-user', employeeId: 'TARGET-1', status: 'active' });
  mocks.profileFindUnique.mockImplementation(({ where }: { where: { userId?: string } }) => Promise.resolve(where.userId === 'target-user' ? { id: 'target-profile', employeeId: 'TARGET-PROFILE' } : { id: 'profile-1', employeeId: 'PROFILE-1' }));
  mocks.performanceFindMany.mockResolvedValue([{ id: 'review-1', score: 90, feedback: 'Good' }]);
  mocks.performanceCount.mockResolvedValue(1);
  mocks.performanceAggregate.mockResolvedValue({ _avg: { score: 90, targetLeads: 10, achievedLeads: 9, targetConversion: 50, achievedConversion: 45, targetRevenue: 100, achievedRevenue: 90, managerRating: 4 } });
  mocks.performanceFindUnique.mockResolvedValue({ id: 'review-1', employeeId: 'target-db', updatedAt: new Date('2026-01-01T00:00:00Z') });
  mocks.performanceCreate.mockResolvedValue({ id: 'review-new', period: '2026-Q4' });
  mocks.performanceUpdateMany.mockResolvedValue({ count: 1 });
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
  mocks.transaction.mockImplementation((callback) => callback(tx));
});

describe('employee performance access and record workflows', () => {
  it('requires active employee status and explicit view permission', async () => {
    mocks.employeeFindUnique.mockResolvedValue(null);
    expect((await GET(req())).status).toBe(403);
    expect(mocks.performanceFindMany).not.toHaveBeenCalled();
    mocks.employeeFindUnique.mockResolvedValue(employee);
    mocks.auth.mockResolvedValue({ ...auth, permissions: [] });
    expect((await GET(req())).status).toBe(403);
    expect(mocks.performanceFindMany).not.toHaveBeenCalled();
  });

  it('scopes own reviews to employee aliases, minimizes fields, and audits reads', async () => {
    expect((await GET(req())).status).toBe(200);
    expect(mocks.performanceFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: { in: ['emp-db', 'user-1', 'ALO-EMP-1', 'profile-1', 'PROFILE-1'] } }, select: expect.not.objectContaining({ employeeId: true }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_PERFORMANCE_VIEWED' }) }));
  });

  it('requires a permission-gated manager write and rejects cross-origin create attempts', async () => {
    const body = { employeeId: 'TARGET-1', period: '2026-Q4', targetLeads: 10, achievedLeads: 9 };
    const denied = await POST(req('/api/employee/performance', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    expect(denied.status).toBe(403);
    mocks.auth.mockResolvedValue({ ...auth, permissions: ['employee.performance.manage'] });
    const crossOrigin = await POST(req('/api/employee/performance', { method: 'POST', headers: { origin: 'https://attacker.test', 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    expect(crossOrigin.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('creates a review for a different active employee with a transactional audit', async () => {
    mocks.auth.mockResolvedValue({ ...auth, permissions: ['employee.performance.manage'] });
    const response = await POST(req('/api/employee/performance', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ employeeId: 'TARGET-1', period: '2026-Q4', targetLeads: 10, achievedLeads: 9, managerRating: 4 }) }));
    expect(response.status).toBe(201);
    expect(mocks.performanceCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ employeeId: 'target-db', period: '2026-Q4', targetLeads: 10 }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_PERFORMANCE_CREATED' }) }));
  });

  it('updates an existing review with compare-and-set and audit inside one transaction', async () => {
    mocks.auth.mockResolvedValue({ ...auth, permissions: ['employee.performance.manage'] });
    const response = await PUT(req('/api/employee/performance', { method: 'PUT', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ id: 'review-1', score: 88, feedback: 'Updated review' }) }));
    expect(response.status).toBe(200);
    expect(mocks.performanceUpdateMany).toHaveBeenCalledWith({ where: { id: 'review-1', updatedAt: new Date('2026-01-01T00:00:00Z') }, data: { score: 88, feedback: 'Updated review' } });
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_PERFORMANCE_UPDATED' }) }));
  });
});
