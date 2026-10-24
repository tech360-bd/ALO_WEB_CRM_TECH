import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), employeeFindUnique: vi.fn(), profileFindUnique: vi.fn(), taskCount: vi.fn(), taskGroupBy: vi.fn(),
  studentCount: vi.fn(), studentGroupBy: vi.fn(), studentFindMany: vi.fn(), applicationGroupBy: vi.fn(), applicationCount: vi.fn(),
  documentGroupBy: vi.fn(), attendanceFindMany: vi.fn(), performanceFindFirst: vi.fn(), auditCreate: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args) },
    employeeProfile: { findUnique: (...args: unknown[]) => mocks.profileFindUnique(...args) },
    counselorTask: { count: (...args: unknown[]) => mocks.taskCount(...args), groupBy: (...args: unknown[]) => mocks.taskGroupBy(...args) },
    portalStudentProfile: { count: (...args: unknown[]) => mocks.studentCount(...args), groupBy: (...args: unknown[]) => mocks.studentGroupBy(...args), findMany: (...args: unknown[]) => mocks.studentFindMany(...args) },
    portalStudentApplication: { groupBy: (...args: unknown[]) => mocks.applicationGroupBy(...args), count: (...args: unknown[]) => mocks.applicationCount(...args) },
    portalStudentDocument: { groupBy: (...args: unknown[]) => mocks.documentGroupBy(...args) },
    employeeAttendance: { findMany: (...args: unknown[]) => mocks.attendanceFindMany(...args) },
    employeePerformance: { findFirst: (...args: unknown[]) => mocks.performanceFindFirst(...args) },
    portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  },
}));

import { GET } from '@/app/api/employee/reports/route';

const employee = { id: 'emp-1', userId: 'user-1', employeeId: 'ALO-EMP-1', status: 'active' };
const request = () => new Request('https://alo.test/api/employee/reports');

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'user-1', actorUserId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], permissions: ['employee.dashboard.view'] });
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.profileFindUnique.mockResolvedValue({ employeeId: 'EMP-LEGACY-1' });
  mocks.taskCount.mockResolvedValue(0);
  mocks.taskGroupBy.mockResolvedValue([]);
  mocks.studentCount.mockResolvedValue(0);
  mocks.studentGroupBy.mockResolvedValue([]);
  mocks.studentFindMany.mockResolvedValue([]);
  mocks.applicationGroupBy.mockResolvedValue([]);
  mocks.applicationCount.mockResolvedValue(0);
  mocks.documentGroupBy.mockResolvedValue([]);
  mocks.attendanceFindMany.mockResolvedValue([]);
  mocks.performanceFindFirst.mockResolvedValue(null);
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
});

describe('employee reports authorization and scope', () => {
  it('rejects inactive or missing employee records before querying reports', async () => {
    mocks.employeeFindUnique.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(403);
    expect(mocks.taskCount).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it('requires explicit employee dashboard/report permission', async () => {
    mocks.auth.mockReturnValue({ userId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], permissions: [] });
    expect((await GET(request())).status).toBe(403);
    expect(mocks.taskCount).not.toHaveBeenCalled();
  });

  it('scopes report queries to the authenticated employee ID aliases and audits the read', async () => {
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.taskCount).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: { in: ['emp-1', 'user-1', 'ALO-EMP-1', 'EMP-LEGACY-1'] } } }));
    expect(mocks.studentCount).toHaveBeenCalledWith({ where: { counselorId: { in: ['emp-1', 'user-1', 'ALO-EMP-1', 'EMP-LEGACY-1'] } } });
    expect(body.data.studentStats.total).toBe(0);
    expect(body.data.applicationStats.total).toBe(0);
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_REPORTS_VIEWED', entityId: 'emp-1' }) }));
  });

  it('fails closed when report audit persistence fails', async () => {
    mocks.auditCreate.mockRejectedValue(new Error('audit unavailable'));
    const response = await GET(request());
    expect(response.status).toBe(500);
  });
});
