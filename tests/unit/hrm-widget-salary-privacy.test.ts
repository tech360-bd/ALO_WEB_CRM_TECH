import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  employeeFindUnique: vi.fn(),
  employeeFindMany: vi.fn(),
  employeeHrFindUnique: vi.fn(),
  employeeHrFindMany: vi.fn(),
  attendanceFindFirst: vi.fn(),
  leaveCount: vi.fn(),
  documentCount: vi.fn(),
  payrollFindFirst: vi.fn(),
  payrollCount: vi.fn(),
  payrollAggregate: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: (...args: unknown[]) => mocks.auth(...args) }));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args), findMany: (...args: unknown[]) => mocks.employeeFindMany(...args), count: vi.fn() },
    employeeHR: { findUnique: (...args: unknown[]) => mocks.employeeHrFindUnique(...args), findMany: (...args: unknown[]) => mocks.employeeHrFindMany(...args) },
    employeeAttendance: { findFirst: (...args: unknown[]) => mocks.attendanceFindFirst(...args), findMany: vi.fn() },
    leaveRequest: { count: (...args: unknown[]) => mocks.leaveCount(...args) },
    employeeDocument: { count: (...args: unknown[]) => mocks.documentCount(...args) },
    employeePayroll: { findFirst: (...args: unknown[]) => mocks.payrollFindFirst(...args), count: (...args: unknown[]) => mocks.payrollCount(...args), aggregate: (...args: unknown[]) => mocks.payrollAggregate(...args) },
    portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  },
}));

import { GET } from '@/app/api/hrm/widgets/route';

const employee = { id: 'employee-db-id', userId: 'user-7', employeeId: 'ALO-EMP-7', role: 'counselor', status: 'active', branch: 'Dhaka' };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({
    userId: 'user-7', actorUserId: 'user-7', actorName: 'Test Employee', userType: 'EMPLOYEE',
    roles: ['counselor'], permissions: [],
  });
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.employeeFindMany.mockResolvedValue([]);
  mocks.employeeHrFindUnique.mockResolvedValue(null);
  mocks.employeeHrFindMany.mockResolvedValue([]);
  mocks.attendanceFindFirst.mockResolvedValue(null);
  mocks.leaveCount.mockResolvedValue(0);
  mocks.documentCount.mockResolvedValue(0);
  mocks.payrollFindFirst.mockResolvedValue({ id: 'pay-1', status: 'paid', netSalary: 55000 });
  mocks.payrollCount.mockResolvedValue(0);
  mocks.payrollAggregate.mockResolvedValue({ _sum: { netSalary: null } });
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
});

async function readWidget() {
  const response = await GET(new NextRequest('https://alo.test/api/hrm/widgets'));
  return { response, body: await response.json() as Record<string, any> };
}

describe('HR widget salary privacy and audit', () => {
  it('does not query or return salary slip values without own-salary permission', async () => {
    const { response, body } = await readWidget();
    expect(response.status).toBe(200);
    expect(mocks.payrollFindFirst).not.toHaveBeenCalled();
    expect(body.data.own.netPay).toBeUndefined();
    expect(mocks.auditCreate).toHaveBeenCalledOnce();
    expect(mocks.auditCreate.mock.calls[0][0].data.action).toBe('EMPLOYEE_HR_WIDGETS_VIEWED');
  });

  it('returns only the employee’s salary slip after exact permission and a value-free audit', async () => {
    mocks.auth.mockResolvedValue({
      userId: 'user-7', actorUserId: 'user-7', actorName: 'Test Employee', userType: 'EMPLOYEE',
      roles: ['counselor'], permissions: ['employee.salary.view'],
    });
    const { response, body } = await readWidget();
    expect(response.status).toBe(200);
    expect(mocks.payrollFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { employeeId: { in: expect.arrayContaining(['employee-db-id', 'ALO-EMP-7', 'user-7']) }, period: expect.any(String) },
      select: { status: true, netSalary: true },
    }));
    expect(body.data.own.netPay).toBe(55000);
    expect(mocks.auditCreate).toHaveBeenCalledTimes(2);
    const salaryAudit = mocks.auditCreate.mock.calls[1][0].data;
    expect(salaryAudit.action).toBe('EMPLOYEE_OWN_SALARY_SLIP_VIEWED');
    expect(salaryAudit.metadata).not.toContain('55000');
  });

  it('fails closed when the salary access audit cannot be written', async () => {
    mocks.auth.mockResolvedValue({
      userId: 'user-7', actorUserId: 'user-7', actorName: 'Test Employee', userType: 'EMPLOYEE',
      roles: ['counselor'], permissions: ['h6'],
    });
    mocks.auditCreate.mockResolvedValueOnce({ id: 'dashboard-audit' }).mockRejectedValueOnce(new Error('audit unavailable'));
    const { response } = await readWidget();
    expect(response.status).toBe(503);
  });
});
