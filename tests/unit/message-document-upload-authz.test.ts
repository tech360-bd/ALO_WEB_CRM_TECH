import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * `POST /api/messages/document-auto-upload` used to accept any `studentId` and
 * any `fileUrl` from any signed-in account, including partner and student portal
 * identities, and then wrote both a StudentDocument and a PortalStudentDocument
 * for that student. These tests pin the three needed properties:
 *
 *   1. a non-staff role is refused before any write;
 *   2. a caller who is not authorised for that student (policy: assignment,
 *      reviewer role, and the partner-application rule) is refused;
 *   3. only a relative storage path or an https URL is accepted, so a
 *      `javascript:`/`data:` link can never be stored on a student record.
 */
const mocks = vi.hoisted(() => ({
  auth: {
    userId: 'counselor-1',
    userType: 'EMPLOYEE',
    identityDomain: 'user',
    roles: ['counselor'] as string[],
    permissions: [] as string[],
    name: 'Counselor One',
    email: 'counselor@aloeducation.dev',
  },
  db: {
    studentDocument: { create: vi.fn() },
    portalStudentProfile: { findFirst: vi.fn() },
    portalStudentDocument: { create: vi.fn() },
    communicationMessage: { update: vi.fn() },
    documentAudit: { create: vi.fn() },
    timelineEvent: { create: vi.fn() },
    student: { findFirst: vi.fn() },
    application: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: NextRequest, auth: unknown) => unknown) => async (req: NextRequest) =>
    handler(req, mocks.auth),
}));

import { POST as autoUpload } from '@/app/api/messages/document-auto-upload/route';

const request = (body: Record<string, unknown>) =>
  new NextRequest('https://portal.example.test/api/messages/document-auto-upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const validBody = {
  studentId: 'student-1',
  fileName: 'passport.pdf',
  fileUrl: '/private/sha256/document.pdf',
  mimeType: 'application/pdf',
  source: 'whatsapp',
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mocks.auth, { userId: 'counselor-1', roles: ['counselor'] });
  mocks.db.student.findFirst.mockResolvedValue({ id: 'student-1', counselorId: 'counselor-1' });
  mocks.db.portalStudentProfile.findFirst.mockResolvedValue(null);
  mocks.db.application.findMany.mockResolvedValue([]);
  mocks.db.studentDocument.create.mockResolvedValue({ id: 'doc-1' });
  mocks.db.documentAudit.create.mockResolvedValue({ id: 'audit-1' });
  mocks.db.timelineEvent.create.mockResolvedValue({ id: 'timeline-1' });
});

describe('message document auto-upload authorisation', () => {
  it('refuses a partner identity before writing anything', async () => {
    Object.assign(mocks.auth, { roles: ['partner'] });
    const response = await autoUpload(request(validBody));
    expect(response.status).toBe(403);
    expect(mocks.db.studentDocument.create).not.toHaveBeenCalled();
  });

  it('refuses a student identity', async () => {
    Object.assign(mocks.auth, { roles: ['student'] });
    expect((await autoUpload(request(validBody))).status).toBe(403);
    expect(mocks.db.studentDocument.create).not.toHaveBeenCalled();
  });

  it('refuses a staff member who is not assigned to the student', async () => {
    mocks.db.student.findFirst.mockResolvedValue({ id: 'student-1', counselorId: 'another-counselor' });
    const response = await autoUpload(request(validBody));
    expect(response.status).toBe(403);
    expect(mocks.db.studentDocument.create).not.toHaveBeenCalled();
    expect(mocks.db.documentAudit.create).not.toHaveBeenCalled();
  });

  it('rejects a javascript: or data: fileUrl', async () => {
    for (const fileUrl of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', '//evil.example.com/x.pdf']) {
      const response = await autoUpload(request({ ...validBody, fileUrl }));
      expect(response.status).toBe(400);
    }
    expect(mocks.db.studentDocument.create).not.toHaveBeenCalled();
  });

  it('accepts the assigned counselor attaching an https URL', async () => {
    const response = await autoUpload(request({ ...validBody, fileUrl: 'https://storage.aloeducation.dev/private/a.pdf' }));
    expect(response.status).toBe(200);
    expect(mocks.db.studentDocument.create).toHaveBeenCalledOnce();
    expect(mocks.db.studentDocument.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ studentId: 'student-1', status: 'pending_review' }),
    }));
  });
});
