import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), employeeFindUnique: vi.fn(), profileFindUnique: vi.fn(), salaryFindMany: vi.fn(), payrollFindMany: vi.fn(), commissionFindMany: vi.fn(), bonusFindMany: vi.fn(), incrementFindMany: vi.fn(), auditCreate: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) => (request: Request) => handler(request, mocks.auth()) }));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args) },
    employeeProfile: { findUnique: (...args: unknown[]) => mocks.profileFindUnique(...args) },
    employeePayroll: { findMany: (...args: unknown[]) => mocks.payrollFindMany(...args) },
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
const salary = { id: 'approved-payroll-1', period: '2026-10', basicSalary: 50000, allowances: 2000, grossSalary: 52000, netSalary: 50000, status: 'approved', paidAt: null };
const request = () => new Request('https://alo.test/api/employee/salary');

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(auth);
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.profileFindUnique.mockResolvedValue({ employeeId: 'ALO-EMP-PROFILE' });
  mocks.salaryFindMany.mockResolvedValue([{ id: "unapproved-salary-secret" }]);
  mocks.payrollFindMany.mockResolvedValue([salary]);
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

  it('returns only scoped approved payroll, never raw compensation or unapproved increments', async () => {
    const response = await GET(request()); const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.payrollFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: 'emp-db', status: { in: ['approved', 'paid'] } } }));
    expect(mocks.salaryFindMany).not.toHaveBeenCalled(); expect(mocks.incrementFindMany).not.toHaveBeenCalled();
    expect(body.data.salary.current.id).toBe('approved-payroll-1'); expect(body.payslips[0].id).toBe('approved-payroll-1');
    expect(JSON.stringify(body)).not.toContain('unapproved-salary-secret');
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'SALARY_VIEWED' }) }));
  });

  it('rejects draft, unrelated or nonexistent payslip identifiers', async () => {
    mocks.payrollFindMany.mockResolvedValue([]);
    const response = await GET(new Request('https://alo.test/api/employee/salary?download=foreign-draft'));
    expect(response.status).toBe(404);
    expect(mocks.payrollFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: 'emp-db', status: { in: ['approved', 'paid'] }, id: 'foreign-draft' } }));
  });

  it('downloads an approved stored payslip on the official letterhead and audits the download', async () => {
    const response = await GET(new Request('https://alo.test/api/employee/salary?download=approved-payroll-1'));
    expect(response.status).toBe(200); expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const html = await response.text();
    // Official documents are always produced on the ALO letterhead, and the
    // letterhead is inlined so a downloaded copy still renders it.
    expect(html).toContain('Official document');
    expect(html).toContain('data:image/jpeg;base64,');
    expect(html).toContain('50,000.00');
    // An employee's own copy is issued without Super Admin authority, so the
    // seal is explicitly withheld rather than silently omitted.
    expect(html).toContain('Official seal withheld');
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'SALARY_DOWNLOADED' }) }));
  });

  it('applies the official seal only when a Super Admin issues the payslip', async () => {
    mocks.auth.mockReturnValue({ ...auth, userType: 'SUPER_ADMIN', roles: ['super_admin'] });
    const response = await GET(new Request('https://alo.test/api/employee/salary?download=approved-payroll-1'));
    const html = await response.text();
    expect(html).toContain('data:image/png;base64,');
    expect(html).not.toContain('Official seal withheld');
  });

  it('does not disclose salary when the private-view audit cannot be saved', async () => {
    mocks.auditCreate.mockRejectedValue(new Error('audit unavailable'));
    expect((await GET(request())).status).toBe(503);
  });
});
