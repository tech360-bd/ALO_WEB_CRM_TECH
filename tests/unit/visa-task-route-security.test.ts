import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  visaCaseFindUnique: vi.fn(),
  taskFindMany: vi.fn(),
  taskFindUnique: vi.fn(),
  taskCreate: vi.fn(),
  taskUpdate: vi.fn(),
  auditCreate: vi.fn(),
  timelineCreate: vi.fn(),
}));

const transactionClient = {
  visaTask: {
    findMany: (...args: unknown[]) => mocks.taskFindMany(...args),
    create: (...args: unknown[]) => mocks.taskCreate(...args),
    update: (...args: unknown[]) => mocks.taskUpdate(...args),
  },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  timelineEvent: { create: (...args: unknown[]) => mocks.timelineCreate(...args) },
};

vi.mock('@/lib/db', () => ({
  db: {
    visaCase: { findUnique: (...args: unknown[]) => mocks.visaCaseFindUnique(...args) },
    visaTask: { findUnique: (...args: unknown[]) => mocks.taskFindUnique(...args) },
    portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
    $transaction: (callback: (client: typeof transactionClient) => unknown) => callback(transactionClient),
  },
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, unknown>, context?: unknown) => Promise<Response>) =>
    (request: Request, context?: unknown) => handler(request, mocks.auth(), context),
}));

import { GET as listTasks, POST as createTask } from '@/app/api/visa/tasks/route';
import { GET as getTask, PATCH as updateTask } from '@/app/api/visa/tasks/[id]/route';

const assignedCase = {
  id: 'case-1',
  studentId: 'student-1',
  visaOfficerId: 'officer-1',
  counselorId: 'counselor-1',
  applicationOfficerId: 'application-1',
};
const existingTask = {
  id: 'task-1',
  caseId: 'case-1',
  studentId: 'student-1',
  status: 'pending',
  priority: 'medium',
  dueDate: null,
  title: 'Check sponsor evidence',
  description: '',
  assignedTo: 'student-1',
  taskType: 'SPONSOR_REVIEW',
};

function makeRequest(method: string, url: string, body?: unknown) {
  return new Request(`https://alo.test${url}`, {
    method,
    ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({
    userId: 'officer-1',
    actorUserId: 'officer-1',
    userType: 'VISA_OFFICER',
    roles: ['VISA_OFFICER'],
    permissions: ['visa.cases.view', 'visa.tasks.view', 'visa.tasks.create', 'visa.tasks.update'],
  });
  mocks.visaCaseFindUnique.mockImplementation(({ where }: { where: { id: string } }) => Promise.resolve(where.id === 'case-1' ? assignedCase : { ...assignedCase, id: where.id, visaOfficerId: 'officer-2' }));
  mocks.taskFindMany.mockResolvedValue([]);
  mocks.taskFindUnique.mockResolvedValue(existingTask);
  mocks.taskCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: 'task-created', ...data }));
  mocks.taskUpdate.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ ...existingTask, ...data }));
  mocks.auditCreate.mockResolvedValue({});
  mocks.timelineCreate.mockResolvedValue({});
});

describe('Visa task endpoint authorization and scope', () => {
  it('requires a case scope and does not accept client-selected student or owner filters', async () => {
    const missingCase = await listTasks(makeRequest('GET', '/api/visa/tasks'));
    const clientStudent = await listTasks(makeRequest('GET', '/api/visa/tasks?caseId=case-1&studentId=student-2'));
    expect(missingCase.status).toBe(400);
    expect(clientStudent.status).toBe(400);
    expect(mocks.taskFindMany).not.toHaveBeenCalled();
  });

  it('blocks an unassigned officer before reading task records', async () => {
    mocks.auth.mockReturnValue({
      userId: 'officer-2', actorUserId: 'officer-2', userType: 'VISA_OFFICER', roles: ['VISA_OFFICER'],
      permissions: ['visa.cases.view', 'visa.tasks.view'],
    });
    const response = await listTasks(makeRequest('GET', '/api/visa/tasks?caseId=case-1'));
    expect(response.status).toBe(403);
    expect(mocks.taskFindMany).not.toHaveBeenCalled();
  });

  it('lists and audits only tasks associated with the authorized case and student', async () => {
    mocks.taskFindMany.mockResolvedValueOnce([existingTask]);
    const response = await listTasks(makeRequest('GET', '/api/visa/tasks?caseId=case-1'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.taskFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { caseId: 'case-1', studentId: 'student-1', archivedAt: null },
    }));
    expect(body.tasks).toEqual([existingTask]);
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'VISA_TASKS_VIEW' }),
    }));
  });

  it('derives student and creator from trusted case and auth context, not request fields', async () => {
    const malicious = await createTask(makeRequest('POST', '/api/visa/tasks', {
      caseId: 'case-1', taskType: 'SPONSOR_REVIEW', title: 'Review', studentId: 'student-2', createdBy: 'admin-2', assignedTo: 'victim-id',
    }));
    expect(malicious.status).toBe(400);
    expect(mocks.taskCreate).not.toHaveBeenCalled();

    const valid = await createTask(makeRequest('POST', '/api/visa/tasks', {
      caseId: 'case-1', taskType: 'SPONSOR_REVIEW', title: 'Review sponsor documents', assignee: 'student', priority: 'high',
    }));
    const body = await valid.json();
    expect(valid.status).toBe(201);
    expect(mocks.taskCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ caseId: 'case-1', studentId: 'student-1', createdBy: 'officer-1', assignedTo: 'student-1' }),
    }));
    expect(body.data.studentId).toBe('student-1');
  });

  it('scopes direct reads and blocks unassigned task updates and client-controlled reassignment IDs', async () => {
    const read = await getTask(makeRequest('GET', '/api/visa/tasks/task-1'), { params: { id: 'task-1' } });
    expect(read.status).toBe(200);

    const badUpdate = await updateTask(makeRequest('PATCH', '/api/visa/tasks/task-1', { status: 'completed', studentId: 'student-2', caseId: 'case-2' }), { params: { id: 'task-1' } });
    expect(badUpdate.status).toBe(400);
    expect(mocks.taskUpdate).not.toHaveBeenCalled();

    mocks.auth.mockReturnValue({
      userId: 'officer-2', actorUserId: 'officer-2', userType: 'VISA_OFFICER', roles: ['VISA_OFFICER'],
      permissions: ['visa.cases.view', 'visa.tasks.view', 'visa.tasks.update'],
    });
    const forbiddenUpdate = await updateTask(makeRequest('PATCH', '/api/visa/tasks/task-1', { status: 'completed' }), { params: { id: 'task-1' } });
    expect(forbiddenUpdate.status).toBe(403);
    expect(mocks.taskUpdate).not.toHaveBeenCalled();
  });
});
