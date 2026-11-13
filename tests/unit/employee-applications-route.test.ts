import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), employeeFindUnique: vi.fn(), studentsFindMany: vi.fn(), applicationsFindMany: vi.fn(), applicationsCount: vi.fn(),
  applicationFindFirst: vi.fn(), applicationUpdateMany: vi.fn(), applicationFindUnique: vi.fn(), timelineCreate: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn(),
}));
const tx = {
  portalStudentApplication: {
    updateMany: (...args: unknown[]) => mocks.applicationUpdateMany(...args),
    findUnique: (...args: unknown[]) => mocks.applicationFindUnique(...args),
  },
  portalTimelineEvent: { create: (...args: unknown[]) => mocks.timelineCreate(...args) },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args) },
    portalStudentProfile: { findMany: (...args: unknown[]) => mocks.studentsFindMany(...args) },
    portalStudentApplication: {
      findMany: (...args: unknown[]) => mocks.applicationsFindMany(...args),
      count: (...args: unknown[]) => mocks.applicationsCount(...args),
      findFirst: (...args: unknown[]) => mocks.applicationFindFirst(...args),
    },
    $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
  },
}));

import { GET, PUT } from '@/app/api/employee/applications/route';

const employee = { id: 'emp-db', userId: 'user-1', employeeId: 'ALO-EMP-1', status: 'active' };
const auth = { userId: 'user-1', userType: 'EMPLOYEE', roles: ['APPLICATION_TEAM'], permissions: ['a1', 'a3'], name: 'Officer', actorUserId: 'user-1' };
const origin = new URL(process.env.NEXTAUTH_URL || 'https://alo.test').origin;
const getRequest = (query = '') => new Request(`${origin}/api/employee/applications${query}`);
const putRequest = (body: unknown, requestOrigin = origin) => new Request(`${origin}/api/employee/applications`, {
  method: 'PUT', headers: { 'content-type': 'application/json', origin: requestOrigin }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(auth);
  mocks.employeeFindUnique.mockResolvedValue(employee);
  mocks.studentsFindMany.mockResolvedValue([{ id: 'profile-1' }]);
  mocks.applicationsFindMany.mockResolvedValue([{ id: 'app-1', studentProfileId: 'profile-1', stage: 'submitted', studentProfile: { fullName: 'Student', studentId: 'AE-20260001' } }]);
  mocks.applicationsCount.mockResolvedValue(1);
  mocks.applicationFindFirst.mockResolvedValue({ id: 'app-1', studentProfileId: 'profile-1', stage: 'submitted', university: 'Example University' });
  mocks.applicationUpdateMany.mockResolvedValue({ count: 1 });
  mocks.applicationFindUnique.mockResolvedValue({ id: 'app-1', stage: 'offer_received' });
  mocks.timelineCreate.mockResolvedValue({ id: 'timeline-1' });
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
  mocks.transaction.mockImplementation((callback) => callback(tx));
});

describe('employee application authorization and workflow', () => {
  it('requires active employee and assigned application-view permission', async () => {
    mocks.employeeFindUnique.mockResolvedValue(null);
    expect((await GET(getRequest())).status).toBe(403);
    expect(mocks.studentsFindMany).not.toHaveBeenCalled();

    mocks.employeeFindUnique.mockResolvedValue(employee);
    mocks.auth.mockReturnValue({ ...auth, permissions: [] });
    expect((await GET(getRequest())).status).toBe(403);
    expect(mocks.studentsFindMany).not.toHaveBeenCalled();
  });

  it('scopes list to employee aliases and returns allowed transitions from actual stage', async () => {
    const response = await GET(getRequest('?page=1&limit=20&sortBy=deadline'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.studentsFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { counselorId: { in: ['emp-db', 'user-1', 'ALO-EMP-1'] } } }));
    expect(mocks.applicationsFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { studentProfileId: { in: ['profile-1'] } },
      orderBy: { updatedAt: 'desc' },
    }));
    expect(body.data[0].allowedNextStages).toEqual(['under_review', 'offer_received', 'rejected', 'withdrawn']);
    expect(body.data[0]).not.toHaveProperty('counselorNote');
  });

  it('rejects updates without same-origin request or exact stage permission', async () => {
    expect((await PUT(putRequest({ id: 'app-1', stage: 'offer_received' }, 'https://evil.test'))).status).toBe(403);
    mocks.auth.mockReturnValue({ ...auth, permissions: ['a1'] });
    expect((await PUT(putRequest({ id: 'app-1', stage: 'offer_received' }))).status).toBe(403);
    expect(mocks.applicationFindFirst).not.toHaveBeenCalled();
  });

  it('rejects unapproved stage jumps and unassigned application IDs', async () => {
    expect((await PUT(putRequest({ id: 'app-1', stage: 'enrolled' }))).status).toBe(409);
    mocks.applicationFindFirst.mockResolvedValue(null);
    expect((await PUT(putRequest({ id: 'other-app', stage: 'offer_received' }))).status).toBe(404);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('updates an allowed stage with timeline and audit in one transaction', async () => {
    const response = await PUT(putRequest({ id: 'app-1', stage: 'offer_received' }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.stage).toBe('offer_received');
    expect(mocks.applicationUpdateMany).toHaveBeenCalledWith({ where: { id: 'app-1', stage: 'submitted' }, data: { stage: 'offer_received' } });
    expect(mocks.timelineCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ visibility: 'internal_only' }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EMPLOYEE_APPLICATION_STAGE_UPDATED' }) }));
  });
});
