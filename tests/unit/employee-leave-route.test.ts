import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), employeeFindUnique: vi.fn(), employeeFindFirst: vi.fn(), employeeFindMany: vi.fn(), profileFindUnique: vi.fn(), profileFindMany: vi.fn(), leaveFindMany: vi.fn(), leaveCount: vi.fn(), balanceFindFirst: vi.fn(), leaveCreate: vi.fn(), leaveUpdateMany: vi.fn(), leaveFindUnique: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn() }));
const tx = {
  employeeLeave: {
    create: (...args: unknown[]) => mocks.leaveCreate(...args),
    updateMany: (...args: unknown[]) => mocks.leaveUpdateMany(...args),
    findUnique: (...args: unknown[]) => mocks.leaveFindUnique(...args),
  },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: (request: Request) => mocks.auth(request) }));
vi.mock('@/lib/db', () => ({ db: {
  employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args), findFirst: (...args: unknown[]) => mocks.employeeFindFirst(...args), findMany: (...args: unknown[]) => mocks.employeeFindMany(...args) },
  employeeProfile: { findUnique: (...args: unknown[]) => mocks.profileFindUnique(...args), findMany: (...args: unknown[]) => mocks.profileFindMany(...args) },
  employeeLeave: { findMany: (...args: unknown[]) => mocks.leaveFindMany(...args), count: (...args: unknown[]) => mocks.leaveCount(...args), findUnique: (...args: unknown[]) => mocks.leaveFindUnique(...args) },
  employeeLeaveBalance: { findFirst: (...args: unknown[]) => mocks.balanceFindFirst(...args) },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
} }));

import { GET, PATCH, POST } from '@/app/api/employee-access/leave/route';

const origin = new URL(process.env.NEXTAUTH_URL || 'https://alo.test').origin;
const employee = { id: 'emp-db', userId: 'user-1', employeeId: 'ALO-EMP-1', status: 'active', branch: 'Dhaka' };
const auth = { identityDomain: 'user', userId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], permissions: ['employee.leave.view', 'employee.leave.create'], actorUserId: 'user-1' };
const req = (path = '/api/employee-access/leave', init?: RequestInit) => new NextRequest(new URL(path, origin), init);
const mutate = (method: string, body: unknown, requestOrigin = origin) => req('/api/employee-access/leave', { method, headers: { origin: requestOrigin, 'content-type': 'application/json' }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(auth);
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.employeeFindFirst.mockResolvedValue({ ...employee, id: 'employee-target', userId: 'target-user', employeeId: 'EMP-2' });
  mocks.employeeFindMany.mockResolvedValue([employee]);
  mocks.profileFindUnique.mockResolvedValue(null);
  mocks.profileFindMany.mockResolvedValue([]);
  mocks.leaveFindMany.mockResolvedValue([]);
  mocks.leaveCount.mockResolvedValue(0);
  mocks.balanceFindFirst.mockResolvedValue(null);
  mocks.leaveCreate.mockResolvedValue({ id: 'leave-1', employeeId: employee.id, leaveType: 'annual', status: 'pending' });
  mocks.leaveUpdateMany.mockResolvedValue({ count: 1 });
  mocks.leaveFindUnique.mockResolvedValue({ id: 'leave-1', status: 'approved' });
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
  mocks.transaction.mockImplementation((callback) => callback(tx));
});

describe('employee leave authorization, scope, and workflow', () => {
  it('requires an active employee and explicit self-leave permission', async () => {
    mocks.employeeFindUnique.mockResolvedValue(null);
    expect((await GET(req())).status).toBe(403);
    expect(mocks.leaveFindMany).not.toHaveBeenCalled();
    mocks.employeeFindUnique.mockResolvedValue(employee);
    mocks.auth.mockResolvedValue({ ...auth, permissions: [] });
    expect((await GET(req())).status).toBe(403);
    expect(mocks.leaveFindMany).not.toHaveBeenCalled();
  });

  it('scopes read to authenticated employee aliases, minimizes fields, and audits the view', async () => {
    const response = await GET(req());
    expect(response.status).toBe(200);
    expect(mocks.leaveFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: { in: ['emp-db', 'user-1', 'ALO-EMP-1'] } }, select: expect.not.objectContaining({ documentUrl: true }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_LEAVE_VIEWED' }) }));
  });

  it('rejects cross-origin or forged leave ownership and writes valid requests with an audit transaction', async () => {
    expect((await POST(mutate('POST', { leaveType: 'annual', startDate: '2026-11-01', endDate: '2026-11-02', reason: 'Family' }, 'https://attacker.test'))).status).toBe(403);
    expect((await POST(mutate('POST', { leaveType: 'annual', startDate: '2026-11-01', endDate: '2026-11-02', reason: 'Family', employeeId: 'other' }))).status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
    const response = await POST(mutate('POST', { leaveType: 'annual', startDate: '2026-11-01', endDate: '2026-11-02', reason: 'Family' }));
    expect(response.status).toBe(201);
    expect(mocks.leaveCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ employeeId: employee.id, leaveType: 'annual', totalDays: 2, status: 'pending' }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_LEAVE_REQUESTED' }) }));
  });

  it('requires approval permission and blocks self-approval with separation of duties', async () => {
    const denied = await PATCH(mutate('PATCH', { id: 'leave-1', status: 'approved' }));
    expect(denied.status).toBe(403);
    mocks.auth.mockResolvedValue({ ...auth, roles: ['BRANCH_MANAGER'], permissions: ['employee.leave.approve'] });
    mocks.employeeFindFirst.mockResolvedValue({ ...employee, id: 'emp-db', userId: 'user-1' });
    const selfApproval = await PATCH(mutate('PATCH', { id: 'leave-1', status: 'approved' }));
    expect(selfApproval.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
