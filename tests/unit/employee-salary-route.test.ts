import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), employeeFindUnique: vi.fn(), profileFindUnique: vi.fn(), salaryFindMany: vi.fn(), commissionFindMany: vi.fn(), bonusFindMany: vi.fn(), incrementFindMany: vi.fn(), auditCreate: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) => (request: Request) => handler(request, mocks.auth()) }));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args) },
    employeeProfile: { findUnique: (...args: unknown[]) => mocks.profileFindUnique(...args) },
    employeeSalary: { findMany: (...args: unknown[]) => mocks.salaryFindMany(...args) },
    employeeCommission: { findMany: (...args: unknown[]) => mocks.commissionFindMany(...args) },
    employeeBonus: { findMany: (...args: unknown[]) => mocks.bonusFindMany(...args) },
    employeeIncrement: { findMany: (...args: unknown[]) => mocks.incrementFindMany(...args) },
    portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  },
}));

import { GET } from '@/app/api/employee/salary/route';

const employee = { id: 'emp-db', userId: 'user-1', employeeId: 'ALO-EMP-1', status: 'active' };
const auth = { userId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], permissions: ['h6'], actorUserId: 'user-1' };
const salary = { id: 'salary-1', netSalary: 50000, employeeId: 'emp-db' };
const request = () => new Request('https://alo.test/api/employee/salary');

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(auth);
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.profileFindUnique.mockResolvedValue({ employeeId: 'ALO-EMP-PROFILE' });
  mocks.salaryFindMany.mockResolvedValue([salary]);
  mocks.commissionFindMany.mockResolvedValue([]);
  mocks.bonusFindMany.mockResolvedValue([]);
  mocks.incrementFindMany.mockResolvedValue([]);
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
});

describe('employee own salary endpoint privacy', () => {
  it('requires an active employee and exact own-salary permission before reading salary', async () => {
    mocks.employeeFindUnique.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(403);
    expect(mocks.salaryFindMany).not.toHaveBeenCalled();
    mocks.employeeFindUnique.mockResolvedValue(employee);
    mocks.auth.mockReturnValue({ ...auth, permissions: [] });
    expect((await GET(request())).status).toBe(403);
    expect(mocks.salaryFindMany).not.toHaveBeenCalled();
  });

  it('scopes own compensation records to authenticated employee aliases and audits access', async () => {
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.salaryFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: { in: ['emp-db', 'user-1', 'ALO-EMP-1', 'ALO-EMP-PROFILE'] } } }));
    expect(mocks.commissionFindMany).toHaveBeenCalledWith(expect.objectContaining({ select: expect.not.objectContaining({ studentId: true, applicationId: true, note: true }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_OWN_SALARY_VIEWED' }) }));
    expect(body.data.salary.current.id).toBe('salary-1');
  });

  it('does not disclose salary when the private-view audit cannot be saved', async () => {
    mocks.auditCreate.mockRejectedValue(new Error('audit unavailable'));
    expect((await GET(request())).status).toBe(503);
  });
});
