import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  studentAuth: { studentId: 'student-1', studentCode: 'AE-2026000001', name: 'Test Student', email: '', phone: '', sessionId: 's', sessionToken: 't' },
  counselorAuth: vi.fn(),
  windowFindUnique: vi.fn(),
  windowUpsert: vi.fn(),
  windowFindMany: vi.fn(),
  windowUpdate: vi.fn(),
  applicationFindFirst: vi.fn(),
  applicationFindMany: vi.fn(),
  studentFindMany: vi.fn(),
  studentFindFirst: vi.fn(),
  sessionCount: vi.fn(),
  canViewB2B: vi.fn(),
}));

vi.mock('@/lib/student-auth', () => ({
  withStudentAuth: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
    (request: Request) => handler(request, m.studentAuth),
}));
vi.mock('@/lib/counselor/student-access', () => ({
  requireCanonicalCounselor: m.counselorAuth,
  counselorStudentScope: (auth: { userType: string; userId: string }) =>
    ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase()) ? {} : { counselorId: auth.userId },
}));
vi.mock('@/lib/ucc/document-access', () => ({ canViewUccB2B: m.canViewB2B }));
vi.mock('@/lib/db', () => ({
  db: {
    interviewPracticeWindow: {
      findUnique: m.windowFindUnique,
      findMany: m.windowFindMany,
      upsert: m.windowUpsert,
      update: m.windowUpdate,
    },
    application: { findFirst: m.applicationFindFirst, findMany: m.applicationFindMany },
    student: { findMany: m.studentFindMany, findFirst: m.studentFindFirst },
    aiInterviewSession: { count: m.sessionCount },
  },
}));

import { GET as studentGet, POST as studentPost } from '@/app/api/student/interview-practice/window/route';
import { GET as crmGet, POST as crmPost } from '@/app/api/crm/interview-practice/route';

const HOURS = 3_600_000;
const now = () => Date.now();
const studentRequest = (query = '') => new Request(`https://alo.test/api/student/interview-practice/window${query}`);
const studentBody = (body: unknown) => new Request('https://alo.test/api/student/interview-practice/window', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const crmBody = (body: unknown) => new Request('https://alo.test/api/crm/interview-practice', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks();
  m.counselorAuth.mockResolvedValue({ userId: 'counselor-1', userType: 'COUNSELOR', roles: ['COUNSELOR'], permissions: [] });
  m.canViewB2B.mockReturnValue(false);
  m.windowFindUnique.mockResolvedValue(null);
  m.sessionCount.mockResolvedValue(0);
  m.applicationFindFirst.mockResolvedValue({ id: 'app-1' });
  m.applicationFindMany.mockResolvedValue([]);
  m.studentFindMany.mockResolvedValue([{ id: 'student-1', studentId: 'AE-2026000001', name: 'Test Student' }]);
  m.studentFindFirst.mockResolvedValue({ id: 'student-1', studentId: 'AE-2026000001', name: 'Test Student' });
  m.windowUpsert.mockImplementation(async (args: { create: Record<string, unknown> }) => ({
    id: 'window-1', ...args.create, extensionCount: 0,
  }));
  m.windowUpdate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
    id: 'window-1', studentId: 'student-1', applicationId: '',
    startsAt: new Date(now() - 10 * HOURS), expiresAt: new Date(now() + 62 * HOURS),
    extensionCount: 1, ...args.data,
  }));
});

describe('student practice window', () => {
  it('reports NOT_STARTED before the student opens a window', async () => {
    const body = await (await studentGet(studentRequest())).json();
    expect(body.window.status).toBe('NOT_STARTED');
    expect(body.canPractise).toBe(false);
    expect(body.windowHours).toBe(72);
  });

  it('opens a 72-hour window scoped to the authenticated student', async () => {
    const response = await studentPost(studentBody({ action: 'start' }));
    expect(response.status).toBe(201);
    const call = m.windowUpsert.mock.calls[0][0] as { where: { studentId_applicationId: { studentId: string } }; create: { studentId: string; expiresAt: Date; startsAt: Date } };
    expect(call.where.studentId_applicationId.studentId).toBe('student-1');
    expect(call.create.studentId).toBe('student-1');
    expect(call.create.expiresAt.getTime() - call.create.startsAt.getTime()).toBe(72 * HOURS);
  });

  it('does not add time when the window is already open', async () => {
    m.windowFindUnique.mockResolvedValue({
      id: 'window-1', startsAt: new Date(now() - HOURS), expiresAt: new Date(now() + 71 * HOURS), extensionCount: 0,
    });
    const response = await studentPost(studentBody({ action: 'start' }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.alreadyOpen).toBe(true);
    expect(m.windowUpsert).not.toHaveBeenCalled();
  });

  it('refuses to reopen an expired window when a counselor already extended it', async () => {
    m.windowFindUnique.mockResolvedValue({
      id: 'window-1', startsAt: new Date(now() - 200 * HOURS), expiresAt: new Date(now() - 128 * HOURS),
      extendedUntil: new Date(now() - 80 * HOURS), extensionCount: 1,
    });
    const response = await studentPost(studentBody({ action: 'restart' }));
    expect(response.status).toBe(403);
    expect(m.windowUpsert).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.canPractise).toBe(false);
  });

  it('offers a restart only for an expired window with no extension', async () => {
    m.windowFindUnique.mockResolvedValue({
      id: 'window-1', startsAt: new Date(now() - 200 * HOURS), expiresAt: new Date(now() - 128 * HOURS), extensionCount: 0,
    });
    const blocked = await studentPost(studentBody({ action: 'start' }));
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).canRestart).toBe(true);

    const restarted = await studentPost(studentBody({ action: 'restart' }));
    expect(restarted.status).toBe(200);
    expect(m.windowUpsert).toHaveBeenCalled();
  });

  it('rejects an application that is not the caller\'s', async () => {
    m.applicationFindFirst.mockResolvedValue(null);
    const response = await studentPost(studentBody({ action: 'start', applicationId: 'someone-elses' }));
    expect(response.status).toBe(404);
    expect(m.windowUpsert).not.toHaveBeenCalled();
  });

  it('rejects an unsupported action and a non-object body', async () => {
    expect((await studentPost(studentBody({ action: 'extend' }))).status).toBe(400);
    expect((await studentPost(studentBody([1, 2]))).status).toBe(400);
    expect(m.windowUpsert).not.toHaveBeenCalled();
  });
});

describe('counselor practice window control', () => {
  it('lists only windows for students in the caller\'s scope', async () => {
    m.windowFindMany.mockResolvedValue([{
      id: 'w1', studentId: 'student-1', applicationId: '', extensionCount: 0, extensionReason: '', extendedBy: '',
      startsAt: new Date(Date.now() - HOURS), expiresAt: new Date(Date.now() + 10 * HOURS),
    }]);
    const response = await crmGet(new Request('https://alo.test/api/crm/interview-practice'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(m.studentFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { counselorId: 'counselor-1' } }));
    expect(body.windows[0].student).toEqual({ studentId: 'AE-2026000001', name: 'Test Student' });
    expect(body.windows[0].state.status).toBe('EXPIRING');
  });

  it('refuses to extend a window whose student is outside the caller\'s scope', async () => {
    m.windowFindUnique.mockResolvedValue({ id: 'w1', studentId: 'other-student', expiresAt: new Date(), extensionCount: 0 });
    m.studentFindFirst.mockResolvedValue(null);
    const response = await crmPost(crmBody({ windowId: 'w1', action: 'extend', hours: 24, reason: 'Student needs more practice' }));
    expect(response.status).toBe(404);
    expect(m.windowUpdate).not.toHaveBeenCalled();
  });

  it('requires a reason and a sane extension length', async () => {
    expect((await crmPost(crmBody({ windowId: 'w1', action: 'extend', hours: 24, reason: 'short' }))).status).toBe(400);
    expect((await crmPost(crmBody({ windowId: 'w1', action: 'extend', hours: 0, reason: 'Valid reason here' }))).status).toBe(400);
    expect(m.windowUpdate).not.toHaveBeenCalled();
  });

  it('records who extended the window, the reason and the count', async () => {
    m.windowFindUnique.mockResolvedValue({ id: 'w1', studentId: 'student-1', startsAt: new Date(), expiresAt: new Date(Date.now() + HOURS), extensionCount: 0 });
    const response = await crmPost(crmBody({ windowId: 'w1', action: 'extend', hours: 48, reason: 'Embassy slot moved a week' }));
    expect(response.status).toBe(200);
    expect(m.windowUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'w1' },
      data: expect.objectContaining({
        extendedBy: 'counselor-1',
        extensionReason: 'Embassy slot moved a week',
        extensionCount: { increment: 1 },
      }),
    }));
  });

  it('closes practice early without deleting anything', async () => {
    m.windowFindUnique.mockResolvedValue({ id: 'w1', studentId: 'student-1', expiresAt: new Date(Date.now() + HOURS), extensionCount: 0 });
    const response = await crmPost(crmBody({ windowId: 'w1', action: 'close', reason: 'Student withdrew application' }));
    expect(response.status).toBe(200);
    expect(m.windowUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ closedBy: 'counselor-1' }),
    }));
    const body = await response.json();
    expect(body.note).toContain('untouched');
  });

  it('returns the auth failure untouched for a non-counselor', async () => {
    m.counselorAuth.mockResolvedValue(NextResponse.json({ error: 'Canonical User counselor access required.' }, { status: 403 }));
    expect((await crmGet(new Request('https://alo.test/api/crm/interview-practice'))).status).toBe(403);
    expect(m.studentFindMany).not.toHaveBeenCalled();
  });
});
