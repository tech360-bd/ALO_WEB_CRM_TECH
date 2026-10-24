import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  students: vi.fn(),
  applicationFindMany: vi.fn(),
  actions: vi.fn(),
  documents: vi.fn(),
  approvals: vi.fn(),
  canViewB2B: vi.fn(),
}));

vi.mock('@/lib/counselor/student-access', () => ({
  requireCanonicalCounselor: m.auth,
  counselorStudentScope: (auth: { userType: string; userId: string }) =>
    ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase()) ? {} : { counselorId: auth.userId },
  safeStudentSelect: { id: true, studentId: true, name: true },
}));
vi.mock('@/lib/ucc/document-access', () => ({ canViewUccB2B: m.canViewB2B }));
vi.mock('@/lib/db', () => ({
  db: {
    student: { findMany: m.students },
    // The route uses the same delegate for the confidentiality probe and the
    // application list, so the tests inspect calls by their `where` shape.
    application: { findMany: m.applicationFindMany },
    studentNextBestAction: { findMany: m.actions },
    studentDocument: { findMany: m.documents },
    approvalRequest: { findMany: m.approvals },
  },
}));

import { GET } from '@/app/api/crm/ai-command-center/route';

const counselor = {
  userId: 'counselor-1',
  identityDomain: 'user',
  userType: 'COUNSELOR',
  roles: ['COUNSELOR'],
  permissions: [],
  name: 'Counselor One',
};

const request = () => new Request('https://alo.test/api/crm/ai-command-center');
const callsTo = (predicate: (where: Record<string, unknown>) => boolean) =>
  m.applicationFindMany.mock.calls.filter((call) => predicate((call[0]?.where ?? {}) as Record<string, unknown>));

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue(counselor);
  m.canViewB2B.mockReturnValue(false);
  m.students.mockResolvedValue([
    { id: 's1', studentId: 'AE-2026000001', name: 'Student One' },
    { id: 's2', studentId: 'AE-2026000002', name: 'Student Two' },
  ]);
  m.applicationFindMany.mockResolvedValue([]);
  m.actions.mockResolvedValue([]);
  m.documents.mockResolvedValue([]);
  m.approvals.mockResolvedValue([]);
});

describe('CRM AI command center feed', () => {
  it('returns the auth error untouched when the caller is not a canonical counselor', async () => {
    m.auth.mockResolvedValue(NextResponse.json({ error: 'Canonical User counselor access required.' }, { status: 403 }));
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(m.students).not.toHaveBeenCalled();
  });

  it('scopes every list to the caller\'s assigned students', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(m.students).toHaveBeenCalledWith(expect.objectContaining({ where: { counselorId: 'counselor-1' } }));
    expect(m.actions).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: { in: ['s1', 's2'] }, status: 'PENDING' } }));
    expect(m.documents).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ studentId: { in: ['s1', 's2'] } }) }));
    expect(callsTo((where) => where.isB2bConfidential === false).length).toBe(1);
    expect(callsTo((where) => where.isB2bConfidential === true).length).toBe(1);
    expect(m.approvals).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ OR: [{ assignedToId: 'counselor-1' }, { requestedById: 'counselor-1' }] }),
    }));
  });

  it('hides B2B-confidential students from a counselor without the B2B permission', async () => {
    m.applicationFindMany.mockImplementation(async (args: { where?: Record<string, unknown> }) =>
      args?.where?.isB2bConfidential === true ? [{ studentId: 's2' }] : []);
    const body = await (await GET(request())).json();
    expect(m.actions).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ studentId: { in: ['s1'] } }) }));
    expect(body.counts.students).toBe(1);
    expect(body.scope.mode).toBe('OWN');
  });

  it('lets an admin see all students and skips the B2B confidentiality probe', async () => {
    m.auth.mockResolvedValue({ ...counselor, userType: 'ADMIN', roles: ['ADMIN'] });
    m.canViewB2B.mockReturnValue(true);
    const body = await (await GET(request())).json();
    expect(m.students).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(callsTo((where) => where.isB2bConfidential === true)).toHaveLength(0);
    expect(callsTo((where) => where.isB2bConfidential === false)).toHaveLength(0);
    expect(body.scope.mode).toBe('ALL');
  });

  it('ranks next-best actions by priority and keeps the student label attached', async () => {
    m.actions.mockResolvedValue([
      { id: 'a1', studentId: 's1', title: 'Low one', description: '', priority: 'LOW', dueDate: null },
      { id: 'a2', studentId: 's2', title: 'Urgent one', description: '', priority: 'URGENT', dueDate: null },
    ]);
    const body = await (await GET(request())).json();
    expect(body.lists.nextBestActions.map((a: { id: string }) => a.id)).toEqual(['a2', 'a1']);
    expect(body.lists.nextBestActions[0].student).toEqual({ studentId: 'AE-2026000002', name: 'Student Two' });
  });

  it('returns real zero-counts and empty lists instead of invented metrics', async () => {
    const body = await (await GET(request())).json();
    expect(body.counts).toMatchObject({
      students: 2,
      activeApplications: 0,
      documentsAwaitingReview: 0,
      pendingApprovals: 0,
      upcomingDeadlines: 0,
    });
    expect(body.lists.nextBestActions).toEqual([]);
    expect(body.lists.upcomingDeadlines).toEqual([]);
  });

  it('only lists deadlines inside the 30-day horizon, soonest first', async () => {
    const soon = new Date(Date.now() + 2 * 86_400_000);
    const later = new Date(Date.now() + 20 * 86_400_000);
    const outside = new Date(Date.now() + 90 * 86_400_000);
    const rows = [
      { id: 'app-later', studentId: 's1', applicationCode: 'C1', applicationId: 'AE-1-02', universityName: 'U2', courseName: 'C2', stage: 'SUBMITTED', safeStatus: 'SUBMITTED', documentStatus: 'PENDING', offerStatus: 'PENDING', paymentStatus: 'PENDING', visaHandoverStatus: 'NOT_READY', deadlineDate: later, updatedAt: new Date() },
      { id: 'app-soon', studentId: 's1', applicationCode: 'C2', applicationId: 'AE-1-01', universityName: 'U1', courseName: 'C1', stage: 'SUBMITTED', safeStatus: 'SUBMITTED', documentStatus: 'PENDING', offerStatus: 'PENDING', paymentStatus: 'PAID', visaHandoverStatus: 'NOT_READY', deadlineDate: soon, updatedAt: new Date() },
      { id: 'app-outside', studentId: 's1', applicationCode: 'C3', applicationId: 'AE-1-03', universityName: 'U3', courseName: 'C3', stage: 'SUBMITTED', safeStatus: 'SUBMITTED', documentStatus: 'PENDING', offerStatus: 'PENDING', paymentStatus: 'PENDING', visaHandoverStatus: 'NOT_READY', deadlineDate: outside, updatedAt: new Date() },
    ];
    m.applicationFindMany.mockImplementation(async (args: { where?: Record<string, unknown> }) =>
      args?.where?.isB2bConfidential === true ? [] : rows);
    const body = await (await GET(request())).json();
    expect(body.lists.upcomingDeadlines.map((d: { applicationRecordId: string }) => d.applicationRecordId)).toEqual(['app-soon', 'app-later']);
    expect(body.counts.activeApplications).toBe(3);
    expect(body.counts.paymentsOutstanding).toBe(2);
    expect(body.counts.offersAwaitingVerification).toBe(3);
  });

  it('fails closed with a sanitized message when the database throws', async () => {
    m.students.mockRejectedValue(new Error('mysql://user:password@host/db refused'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text).not.toContain('mysql://');
    expect(JSON.parse(text).error).toBe('The AI command center data is temporarily unavailable.');
  });
});
