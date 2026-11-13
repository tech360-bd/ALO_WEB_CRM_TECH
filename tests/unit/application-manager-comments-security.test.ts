import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), applicationFindUnique: vi.fn(), commentFindMany: vi.fn(), commentCreate: vi.fn(), auditLogCreate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    application: { findUnique: (...args: unknown[]) => mocks.applicationFindUnique(...args) },
    applicationComment: {
      findMany: (...args: unknown[]) => mocks.commentFindMany(...args),
      create: (...args: unknown[]) => mocks.commentCreate(...args),
    },
    auditLog: { create: (...args: unknown[]) => mocks.auditLogCreate(...args) },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...args: unknown[]) => mocks.auth(...args),
}));

import { GET, POST } from '@/app/api/app-manager/comments/route';

function getRequest(applicationId = 'app-1') {
  return new NextRequest(`https://alo.test/api/app-manager/comments?applicationId=${applicationId}`);
}
function postRequest(body: unknown) {
  return new NextRequest('https://alo.test/api/app-manager/comments', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: 'team-1', userType: 'EMPLOYEE', roles: ['application_team'], permissions: [], partnerId: undefined, name: 'Team member', email: 'team@example.test' });
  mocks.applicationFindUnique.mockResolvedValue({ id: 'app-1', studentId: 'student-1', isB2b: true, isB2bConfidential: true, applicationSource: 'B2B_INBOUND_APPLICATION' });
  mocks.commentFindMany.mockResolvedValue([]);
  mocks.commentCreate.mockResolvedValue({ id: 'comment-1', applicationId: 'app-1', commentText: 'Internal note', visibility: 'internal', isB2bConfidential: false, attachmentPath: '/private/attachment' });
  mocks.auditLogCreate.mockResolvedValue({});
});

describe('Application Manager comments API security', () => {
  it('denies partner access before application lookup', async () => {
    mocks.auth.mockResolvedValue({ userId: 'partner-user', userType: 'PARTNER', roles: ['partner'], permissions: [], partnerId: 'partner-1' });
    const response = await GET(getRequest());
    expect(response.status).toBe(403);
    expect(mocks.applicationFindUnique).not.toHaveBeenCalled();
  });

  it('does not expose B2B-confidential comments or hidden-comment counts to an unprivileged team member', async () => {
    mocks.commentFindMany.mockResolvedValue([
      { id: 'safe', applicationId: 'app-1', commentText: 'Student-visible status', visibility: 'student_visible', isB2bConfidential: false, attachmentPath: '' },
      { id: 'secret', applicationId: 'app-1', commentText: 'Provider portal reference: REF-SECRET', visibility: 'B2B_CONFIDENTIAL', isB2bConfidential: true, attachmentPath: '/private/b2b' },
    ]);
    const response = await GET(getRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.map((comment: any) => comment.id)).toEqual(['safe']);
    expect(body).not.toHaveProperty('hiddenComments');
    expect(body).not.toHaveProperty('totalComments');
    expect(JSON.stringify(body)).not.toContain('REF-SECRET');
    expect(JSON.stringify(body)).not.toContain('/private/b2b');
  });

  it('rejects B2B-confidential comment writes without explicit B2B access', async () => {
    const response = await POST(postRequest({
      applicationId: 'app-1', commentType: 'B2B_CONFIDENTIAL', visibility: 'B2B_CONFIDENTIAL',
      commentText: 'Internal provider follow-up', isB2bConfidential: true,
    }));
    expect(response.status).toBe(403);
    expect(mocks.commentCreate).not.toHaveBeenCalled();
  });

  it('rejects client attachment paths instead of persisting arbitrary storage references', async () => {
    const response = await POST(postRequest({ applicationId: 'app-1', commentText: 'Please review', attachmentPath: 'https://attacker.invalid/file' }));
    expect(response.status).toBe(400);
    expect(mocks.commentCreate).not.toHaveBeenCalled();
  });
});
