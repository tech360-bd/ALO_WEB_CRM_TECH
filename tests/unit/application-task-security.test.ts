import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), applicationFindFirst: vi.fn(), userFindFirst: vi.fn(), employeeFindFirst: vi.fn(),
  taskCreate: vi.fn(), auditLogCreate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    application: { findFirst: (...args: unknown[]) => mocks.applicationFindFirst(...args) },
    user: { findFirst: (...args: unknown[]) => mocks.userFindFirst(...args) },
    employee: { findFirst: (...args: unknown[]) => mocks.employeeFindFirst(...args) },
    applicationTask: { create: (...args: unknown[]) => mocks.taskCreate(...args) },
    auditLog: { create: (...args: unknown[]) => mocks.auditLogCreate(...args) },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
  logAuditAction: vi.fn(),
}));

import { POST } from '@/app/api/applications/tasks/route';

function request(body: unknown) {
  return new Request('https://alo.test/api/applications/tasks', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'team-1', userType: 'EMPLOYEE', roles: ['application_team'], permissions: ['application.view_b2b'], partnerId: undefined, name: 'Team Member' });
  mocks.applicationFindFirst.mockResolvedValue({ id: 'app-b2b', studentId: 'student-1', isB2b: true, isB2bConfidential: true, applicationSource: 'B2B_INBOUND_APPLICATION', stage: 'APPLICATION_DRAFT' });
  mocks.userFindFirst.mockResolvedValue({ id: 'team-1', name: 'Team Member' });
  mocks.employeeFindFirst.mockResolvedValue({ name: 'Team Member' });
  mocks.taskCreate.mockResolvedValue({ id: 'task-1', applicationId: 'app-b2b', taskTitle: 'Review', assignedTo: 'team-1' });
  mocks.auditLogCreate.mockResolvedValue({});
});

describe('application task API security', () => {
  it('does not let B2B view permission alone authorize task changes', async () => {
    const response = await POST(request({ applicationId: 'app-b2b', taskTitle: 'Call provider' }));
    expect(response.status).toBe(403);
    expect(mocks.taskCreate).not.toHaveBeenCalled();
  });

  it('does not allow an assigned counselor to create a task for another user', async () => {
    mocks.auth.mockReturnValue({ userId: 'counselor-1', userType: 'COUNSELOR', roles: ['counselor'], permissions: ['application.create_task'], partnerId: undefined, name: 'Counselor' });
    mocks.applicationFindFirst.mockResolvedValue({ id: 'app-1', studentId: 'student-1', counselorId: 'counselor-1', isB2b: false, isB2bConfidential: false, applicationSource: 'DIRECT_ALO_APPLICATION', stage: 'APPLICATION_DRAFT' });
    const response = await POST(request({ applicationId: 'app-1', taskTitle: 'Follow up', assignedTo: 'other-user' }));
    expect(response.status).toBe(403);
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
    expect(mocks.taskCreate).not.toHaveBeenCalled();
  });
});
