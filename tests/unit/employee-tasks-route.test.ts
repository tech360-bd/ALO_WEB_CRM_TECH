import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(), employeeFindUnique: vi.fn(), taskFindMany: vi.fn(), taskCount: vi.fn(),
  auditCreate: vi.fn(), transaction: vi.fn(), taskFindFirst: vi.fn(), taskCreate: vi.fn(), taskUpdateMany: vi.fn(),
  taskFindUnique: vi.fn(), studentFindFirst: vi.fn(), leadFindFirst: vi.fn(),
}));
const tx = {
  counselorTask: {
    findFirst: (...args: unknown[]) => mocks.taskFindFirst(...args),
    create: (...args: unknown[]) => mocks.taskCreate(...args),
    updateMany: (...args: unknown[]) => mocks.taskUpdateMany(...args),
    findUnique: (...args: unknown[]) => mocks.taskFindUnique(...args),
  },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};

vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: (request: Request) => mocks.authenticate(request) }));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args) },
    counselorTask: {
      findMany: (...args: unknown[]) => mocks.taskFindMany(...args),
      count: (...args: unknown[]) => mocks.taskCount(...args),
    },
    portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
    student: { findFirst: (...args: unknown[]) => mocks.studentFindFirst(...args) },
    marketingLead: { findFirst: (...args: unknown[]) => mocks.leadFindFirst(...args) },
    $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
  },
}));

import { GET, POST, PUT } from '@/app/api/employee/tasks/route';

const origin = new URL(process.env.NEXTAUTH_URL || 'https://alo.test').origin;
const employee = { id: 'emp-db', userId: 'user-1', employeeId: 'ALO-EMP-1', status: 'active' };
const auth = { userId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], permissions: ['employee.tasks.view', 'employee.tasks.create', 'employee.tasks.update'], actorUserId: 'user-1' };
const request = (url = '/api/employee/tasks', init?: RequestInit) => new NextRequest(new URL(url, origin), init);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue(auth);
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.taskFindMany.mockResolvedValue([{ id: 'task-1', title: 'Follow up', status: 'pending' }]);
  mocks.taskCount.mockResolvedValue(1);
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
  mocks.transaction.mockImplementation((callback) => callback(tx));
  mocks.taskFindFirst.mockResolvedValue({ id: 'task-1', status: 'pending' });
  mocks.taskCreate.mockResolvedValue({ id: 'task-2', title: 'New task', status: 'pending' });
  mocks.taskUpdateMany.mockResolvedValue({ count: 1 });
  mocks.taskFindUnique.mockResolvedValue({ id: 'task-1', status: 'completed' });
  mocks.studentFindFirst.mockResolvedValue({ id: 'student-1' });
  mocks.leadFindFirst.mockResolvedValue({ id: 'lead-1' });
});

describe('employee task authorization and ownership', () => {
  it('requires an active employee and explicit task-view permission before reading', async () => {
    mocks.employeeFindUnique.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(403);
    expect(mocks.taskFindMany).not.toHaveBeenCalled();
    mocks.employeeFindUnique.mockResolvedValue(employee);
    mocks.authenticate.mockResolvedValue({ ...auth, permissions: [] });
    expect((await GET(request())).status).toBe(403);
    expect(mocks.taskFindMany).not.toHaveBeenCalled();
  });

  it('lists only employee-owned task aliases, uses a minimized projection, and audits reads', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(mocks.taskFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { employeeId: { in: ['emp-db', 'user-1', 'ALO-EMP-1'] } },
      select: expect.objectContaining({ id: true, title: true, status: true }),
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_TASKS_VIEWED' }) }));
  });

  it('denies task creation without create permission and ignores caller-supplied ownership', async () => {
    mocks.authenticate.mockResolvedValue({ ...auth, permissions: ['employee.tasks.view'] });
    const denied = await POST(request('/api/employee/tasks', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ title: 'New task' }) }));
    expect(denied.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();

    mocks.authenticate.mockResolvedValue(auth);
    const invalid = await POST(request('/api/employee/tasks', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ title: 'New task', employeeId: 'other-employee' }) }));
    expect(invalid.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('requires update permission and rejects cross-origin writes', async () => {
    mocks.authenticate.mockResolvedValue({ ...auth, permissions: ['employee.tasks.view'] });
    const denied = await PUT(request('/api/employee/tasks', { method: 'PUT', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ id: 'task-1', status: 'completed' }) }));
    expect(denied.status).toBe(403);
    mocks.authenticate.mockResolvedValue(auth);
    const crossOrigin = await PUT(request('/api/employee/tasks', { method: 'PUT', headers: { origin: 'https://attacker.test', 'content-type': 'application/json' }, body: JSON.stringify({ id: 'task-1', status: 'completed' }) }));
    expect(crossOrigin.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
