import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  employee: vi.fn(),
  profile: vi.fn(),
  salary: vi.fn(),
  payroll: vi.fn(),
  commission: vi.fn(),
  bonus: vi.fn(),
  increment: vi.fn(),
  audit: vi.fn(),
  auth: {
    userId: 'staff',
    actorUserId: 'staff',
    userType: 'EMPLOYEE',
    roles: ['EMPLOYEE'],
    permissions: ['h6'],
  } as Record<string, unknown>,
}));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: unknown) => (request: Request) => (handler as (r: Request, a: unknown) => unknown)(request, m.auth) }));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: m.employee },
    employeeProfile: { findUnique: m.profile },
    employeeSalary: { findMany: m.salary },
    employeePayroll: { findMany: m.payroll },
    employeeCommission: { findMany: m.commission },
    employeeBonus: { findMany: m.bonus },
    employeeIncrement: { findMany: m.increment },
    portalAuditLog: { create: m.audit },
  },
}));
import { GET } from '@/app/api/employee/salary/route';
const request = (query = '') => new Request(`https://alo.test/api/employee/salary${query}`);

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.userType = 'EMPLOYEE';
  m.auth.roles = ['EMPLOYEE'];
  m.auth.permissions = ['h6'];
  delete m.auth.actingAsSessionId;
  m.employee.mockResolvedValue({ id: 'employee-db-id', userId: 'staff', employeeId: 'EMP-1', status: 'active' });
  m.profile.mockResolvedValue({ employeeId: 'EMP-1' });
  m.salary.mockResolvedValue([]);
  m.payroll.mockResolvedValue([]);
  m.commission.mockResolvedValue([]);
  m.bonus.mockResolvedValue([]);
  m.increment.mockResolvedValue([]);
  m.audit.mockResolvedValue({ id: 'audit-1' });
});

describe('employee own-salary access', () => {
  it('scopes every read to the authenticated employee and ignores a client-supplied employeeId', async () => {
    const response = await GET(request('?employeeId=someone-else'));
    expect(response.status).toBe(200);
    expect(m.payroll).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: 'employee-db-id', status: { in: ['approved', 'paid'] } } }));
    expect(m.salary).not.toHaveBeenCalled();
    expect(m.increment).not.toHaveBeenCalled();
    for (const read of [m.commission, m.bonus]) expect(read).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: 'employee-db-id', status: { in: ['approved', 'paid'] } } }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'SALARY_VIEWED', actorUserId: 'staff' }),
    }));
  });

  it.each(['STUDENT', 'PARTNER'])('rejects %s before reading any salary data', async (type) => {
    m.auth.userType = type;
    m.auth.roles = [type];
    expect((await GET(request())).status).toBe(403);
    expect(m.salary).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it('returns no fictional payroll when no approved records exist', async () => {
    const body = await (await GET(request())).json();
    expect(body.data.salary.current).toBeNull();
    expect(body.data.salary.history).toEqual([]);
    expect(body.data.commissions.records).toEqual([]);
    expect(body.data.bonuses).toEqual([]);
    expect(body.data.increments).toEqual([]);
    expect(body.data.financialSummary.currentNetSalary).toBe(0);
  });

  it('denies the request when the own-salary permission is missing instead of throwing', async () => {
    // Regression: the handler previously read auth.permissions.includes() and
    // crashed with a TypeError (HTTP 500) on an incomplete auth context.
    m.auth.permissions = undefined;
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(m.salary).not.toHaveBeenCalled();
  });

  it('fails closed when the sensitive access audit cannot be written', async () => {
    m.audit.mockRejectedValue(new Error('private database details'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private database details');
  });

  it('records impersonation context in the audit trail when acting-as is active', async () => {
    m.auth.actingAsSessionId = 'acting-session';
    m.auth.actingAsRole = 'EMPLOYEE';
    expect((await GET(request())).status).toBe(200);
    const metadata = JSON.parse(m.audit.mock.calls[0][0].data.metadata);
    expect(metadata.actingAsSessionId).toBe('acting-session');
    expect(metadata.actingAsRole).toBe('EMPLOYEE');
  });
});
