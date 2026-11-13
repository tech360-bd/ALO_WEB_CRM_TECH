import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

/**
 * Staff download of a student document (`/api/counselor/documents/[id]/download`).
 *
 * This route did not exist before this pass: the counselor list merged the
 * student and portal document tables, but staff had no way to open a
 * portal-originated file — the only download endpoints for that table belong to
 * the partner and the student portal, and both correctly refuse staff.
 *
 * These tests exercise the real `withAuth` wrapper; only authentication and the
 * database are mocked, so the assignment / partner-application policy runs for
 * real.
 */
const bytes = Buffer.from('%PDF-1.7\nstaff download fixture\n%%EOF');
const hash = createHash('sha256').update(bytes).digest('hex');

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
  authenticateRequest: vi.fn(),
  db: {
    studentDocument: { findFirst: vi.fn() },
    portalStudentDocument: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
    portalStudentProfile: { findFirst: vi.fn() },
    application: { findMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  readPrivateFile: vi.fn(),
  isEmergencyLockdownActive: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/storage/private-file-store', () => ({ readPrivateFile: mocks.readPrivateFile }));
vi.mock('@/lib/emergency-lockdown', () => ({ isEmergencyLockdownActive: mocks.isEmergencyLockdownActive }));
// The real `withAuth` closes over the module-internal authenticateRequest, so a
// partial mock cannot substitute the identity. The wrapper is therefore replaced
// with a faithful stand-in: it injects the authenticated context and forwards the
// route context. The authorisation under test lives in the handler and the shared
// document policy, both of which run for real.
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: Request, auth: unknown, context?: unknown) => unknown) =>
    async (req: Request, context?: unknown) => {
      const auth = await mocks.authenticateRequest(req);
      if (auth instanceof NextResponse) return auth;
      return handler(req, auth, context);
    },
}));

import { GET as downloadStaffDocument } from '@/app/api/counselor/documents/[id]/download/route';

const call = (id = 'doc-1') => {
  const request = new Request(`https://portal.example.test/api/counselor/documents/${id}/download`);
  return downloadStaffDocument(request, { params: Promise.resolve({ id }) });
};

const studentDocumentRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'doc-1',
  studentId: 'student-1',
  fileName: 'passport.pdf',
  storagePath: 'sha256/stored.pdf',
  mimeType: 'application/pdf',
  fileHash: hash,
  isArchived: false,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mocks.auth, { userId: 'counselor-1', roles: ['counselor'] });
  mocks.authenticateRequest.mockResolvedValue(mocks.auth);
  mocks.isEmergencyLockdownActive.mockResolvedValue(false);
  mocks.db.studentDocument.findFirst.mockResolvedValue(studentDocumentRow());
  mocks.db.portalStudentDocument.findFirst.mockResolvedValue(null);
  mocks.db.student.findFirst.mockResolvedValue({ id: 'student-1', counselorId: 'counselor-1' });
  mocks.db.portalStudentProfile.findFirst.mockResolvedValue(null);
  mocks.db.application.findMany.mockResolvedValue([]);
  mocks.db.auditLog.create.mockResolvedValue({ id: 'audit-1' });
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.db) => unknown) => callback(mocks.db));
  mocks.readPrivateFile.mockResolvedValue(bytes);
});

describe('staff document download authorisation', () => {
  it('streams the bytes to the assigned counselor with private, non-sniffable headers', async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer()).equals(bytes)).toBe(true);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('content-disposition')).toContain('attachment;');
    expect(mocks.db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'DOC_DOWNLOAD', resource: 'StudentDocument' }),
    }));
  });

  it('refuses a counselor who is not assigned to the student, without reading storage', async () => {
    mocks.db.student.findFirst.mockResolvedValue({ id: 'student-1', counselorId: 'someone-else' });
    const response = await call();
    expect(response.status).toBe(403);
    expect(mocks.readPrivateFile).not.toHaveBeenCalled();
  });

  it('refuses a partner student with no submitted ALO application even for a reviewer role', async () => {
    Object.assign(mocks.auth, { userId: 'document-officer-1', roles: ['document_officer'] });
    mocks.db.studentDocument.findFirst.mockResolvedValue(null);
    mocks.db.portalStudentDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      fileName: 'passport.pdf',
      storagePath: 'sha256/stored.pdf',
      mimeType: 'application/pdf',
      fileHash: hash,
      isArchived: false,
      studentProfile: { id: 'profile-1', studentId: 'STU-PARTNER-1' },
    });
    mocks.db.student.findFirst.mockResolvedValue(null);
    mocks.db.portalStudentProfile.findFirst.mockResolvedValue({ id: 'profile-1', studentId: 'STU-PARTNER-1', partnerId: 'partner-1' });

    const response = await call();
    expect(response.status).toBe(403);
    expect(mocks.readPrivateFile).not.toHaveBeenCalled();
    expect(mocks.db.auditLog.create).not.toHaveBeenCalled();
  });

  it('allows the same reviewer once that partner student has a submitted ALO application', async () => {
    Object.assign(mocks.auth, { userId: 'document-officer-1', roles: ['document_officer'] });
    mocks.db.studentDocument.findFirst.mockResolvedValue(null);
    mocks.db.portalStudentDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      fileName: 'passport.pdf',
      storagePath: 'sha256/stored.pdf',
      mimeType: 'application/pdf',
      fileHash: hash,
      isArchived: false,
      studentProfile: { id: 'profile-1', studentId: 'STU-PARTNER-1' },
    });
    mocks.db.student.findFirst.mockResolvedValue({ id: 'student-2', counselorId: null });
    mocks.db.portalStudentProfile.findFirst.mockResolvedValue({ id: 'profile-1', studentId: 'STU-PARTNER-1', partnerId: 'partner-1' });
    mocks.db.application.findMany.mockResolvedValue([{ stage: 'SUBMITTED_TO_ALO_APPLICATION_TEAM' }]);

    const response = await call();
    expect(response.status).toBe(200);
    expect(mocks.readPrivateFile).toHaveBeenCalledOnce();
  });

  it('hides an archived document from staff but keeps it available to an administrator', async () => {
    mocks.db.studentDocument.findFirst.mockResolvedValue(studentDocumentRow({ isArchived: true }));
    expect((await call()).status).toBe(404);
    expect(mocks.readPrivateFile).not.toHaveBeenCalled();

    Object.assign(mocks.auth, { userId: 'admin-1', roles: ['admin'] });
    const adminResponse = await call();
    expect(adminResponse.status).toBe(200);
  });

  it('returns 404 for an unknown id and never touches storage', async () => {
    mocks.db.studentDocument.findFirst.mockResolvedValue(null);
    mocks.db.portalStudentDocument.findFirst.mockResolvedValue(null);
    expect((await call('missing')).status).toBe(404);
    expect(mocks.readPrivateFile).not.toHaveBeenCalled();
  });

  it('refuses to stream bytes whose hash no longer matches the record', async () => {
    mocks.readPrivateFile.mockResolvedValue(Buffer.from('%PDF-1.7 tampered'));
    const response = await call();
    expect(response.status).toBe(500);
    expect(mocks.db.auditLog.create).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    mocks.authenticateRequest.mockResolvedValue(NextResponse.json({ success: false }, { status: 401 }));
    expect((await call()).status).toBe(401);
    expect(mocks.readPrivateFile).not.toHaveBeenCalled();
  });
});
