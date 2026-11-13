import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), applicationFindFirst: vi.fn(), studentFindFirst: vi.fn(), profileFindFirst: vi.fn(),
  commentFindMany: vi.fn(), commentCreate: vi.fn(), auditLogCreate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    application: { findFirst: (...args: unknown[]) => mocks.applicationFindFirst(...args) },
    student: { findFirst: (...args: unknown[]) => mocks.studentFindFirst(...args) },
    portalStudentProfile: { findFirst: (...args: unknown[]) => mocks.profileFindFirst(...args) },
    applicationComment: {
      findMany: (...args: unknown[]) => mocks.commentFindMany(...args),
      create: (...args: unknown[]) => mocks.commentCreate(...args),
    },
    auditLog: { create: (...args: unknown[]) => mocks.auditLogCreate(...args) },
  },
}));
vi.mock('@/lib/unified-auth', () => ({ authenticateUnified: (...args: unknown[]) => mocks.auth(...args) }));
vi.mock('@/lib/auth-middleware', () => ({ logAuditAction: vi.fn() }));

import { GET, POST } from '@/app/api/applications/[id]/comments/route';

function request(method: 'GET' | 'POST', body?: unknown) {
  return new Request('https://alo.test/api/applications/app-1/comments', {
    method,
    ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ type: 'student', data: { studentId: 'student-own', studentCode: 'AE-2026000001', email: 'student@example.test', name: 'Student' } });
  mocks.applicationFindFirst.mockResolvedValue({ id: 'app-1', studentId: 'student-own', partnerId: '', isB2b: true, isB2bConfidential: true, applicationSource: 'B2B_INBOUND_APPLICATION' });
  mocks.studentFindFirst.mockResolvedValue(null);
  mocks.profileFindFirst.mockResolvedValue(null);
  mocks.commentFindMany.mockResolvedValue([]);
  mocks.commentCreate.mockResolvedValue({ id: 'comment-1', applicationId: 'app-1', commentText: 'Question about my application', visibility: 'student_visible', role: 'STUDENT', userId: 'student-own', attachmentPath: '' });
  mocks.auditLogCreate.mockResolvedValue({});
});

describe('application comments ownership and confidentiality', () => {
  it('returns not found for a student requesting another student application', async () => {
    mocks.applicationFindFirst.mockResolvedValue(null);
    const response = await GET(request('GET'), { params: { id: 'someone-elses-app' } } as any);
    expect(response.status).toBe(404);
    expect(mocks.applicationFindFirst).toHaveBeenCalledWith({ where: { id: 'someone-elses-app', studentId: 'student-own' } });
    expect(mocks.commentFindMany).not.toHaveBeenCalled();
  });

  it('hides B2B comments and internal fields from the owning student', async () => {
    mocks.commentFindMany.mockResolvedValue([
      { id: 'student-safe', applicationId: 'app-1', commentText: 'Your application is under review.', visibility: 'student_visible', isB2bConfidential: false, attachmentPath: '/private/path', userId: 'staff-1', role: 'APPLICATION_TEAM' },
      { id: 'secret', applicationId: 'app-1', commentText: 'Provider portal reference REF-SECRET', visibility: 'B2B_CONFIDENTIAL', isB2bConfidential: true, attachmentPath: '/private/b2b' },
    ]);
    const response = await GET(request('GET'), { params: { id: 'app-1' } } as any);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ id: 'student-safe', commentText: 'Your application is under review.' });
    expect(body.data[0]).not.toHaveProperty('userId');
    expect(body.data[0]).not.toHaveProperty('attachmentPath');
    expect(JSON.stringify(body)).not.toContain('REF-SECRET');
    expect(JSON.stringify(body)).not.toContain('/private');
  });

  it('forces a student B2B-application comment to student-visible and rejects confidential comment requests', async () => {
    const response = await POST(request('POST', { commentText: 'Please update me', isB2bConfidential: true }), { params: { id: 'app-1' } } as any);
    expect(response.status).toBe(403);
    expect(mocks.commentCreate).not.toHaveBeenCalled();
  });

  it('allows a student to add an ordinary safe comment to their own B2B application without exposing B2B fields', async () => {
    const response = await POST(request('POST', { commentText: 'Please update me' }), { params: { id: 'app-1' } } as any);
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(mocks.commentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'student-own', role: 'STUDENT', visibility: 'student_visible', isB2bConfidential: false }) }));
    expect(body.data).toMatchObject({ id: 'comment-1', commentText: 'Question about my application', visibility: 'student_visible' });
    expect(body.data).not.toHaveProperty('attachmentPath');
    expect(body.data).not.toHaveProperty('userId');
  });
});
