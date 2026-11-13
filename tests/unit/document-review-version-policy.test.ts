import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Review + deletion policy for the versioned document lifecycle.
 *
 *  • Approving a replacement supersedes the earlier versions of that slot — but
 *    only at review time, never at upload time, so an unreviewed upload can never
 *    masquerade as an approved document.
 *  • Rejecting requires a written reason and leaves other versions untouched.
 *  • Archive (the default destructive action) now uses the real `isArchived`
 *    column for portal documents instead of overwriting their review status, and
 *    remains Admin/Super-Admin only.
 */
const mocks = vi.hoisted(() => ({
  auth: {
    userId: 'reviewer-1',
    userType: 'EMPLOYEE',
    identityDomain: 'user',
    roles: ['document_officer'] as string[],
    permissions: [] as string[],
    name: 'Document Officer',
    email: 'documents@aloeducation.dev',
  },
  db: {
    portalStudentDocument: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() },
    studentDocument: { findFirst: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
  logAuditAction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: NextRequest, auth: unknown) => unknown) => async (req: NextRequest) =>
    handler(req, mocks.auth),
  logAuditAction: mocks.logAuditAction,
}));
vi.mock('@/lib/storage/private-file-store', () => ({ removePrivateFile: vi.fn() }));

import { PUT as reviewDocument } from '@/app/api/crm/documents/route';
import { POST as manageDocument } from '@/app/api/documents/manage/route';

const reviewRequest = (body: Record<string, unknown>) =>
  new NextRequest('https://portal.example.test/api/crm/documents', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const manageRequest = (body: Record<string, unknown>) =>
  new NextRequest('https://portal.example.test/api/documents/manage', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mocks.auth, { userId: 'reviewer-1', roles: ['document_officer'] });
  mocks.db.portalStudentDocument.findUnique.mockResolvedValue({
    id: 'doc-v3',
    studentProfileId: 'profile-1',
    category: 'Passport',
    status: 'pending',
    name: 'passport.pdf',
    version: 3,
    studentProfile: { studentId: 'STU-1', fullName: 'Student One' },
  });
  mocks.db.portalStudentDocument.update.mockResolvedValue({
    id: 'doc-v3', version: 3, status: 'approved', name: 'passport.pdf',
    studentProfile: { id: 'profile-1', studentId: 'STU-1', fullName: 'Student One' },
  });
  mocks.db.portalStudentDocument.updateMany.mockResolvedValue({ count: 2 });
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.db) => unknown) => callback(mocks.db));
});

describe('document review version policy', () => {
  it('supersedes earlier versions only when the replacement is approved', async () => {
    const response = await reviewDocument(reviewRequest({ id: 'doc-v3', status: 'approved' }));
    expect(response.status).toBe(200);
    expect(mocks.db.portalStudentDocument.updateMany).toHaveBeenCalledWith({
      where: {
        studentProfileId: 'profile-1',
        category: 'Passport',
        id: { not: 'doc-v3' },
        isArchived: false,
        status: { in: ['pending', 'pending_review', 'uploaded', 'needs_update', 'approved'] },
      },
      data: { status: 'superseded' },
    });
    expect(mocks.logAuditAction).toHaveBeenCalledWith(
      mocks.auth,
      'document_review',
      'PortalStudentDocument',
      'doc-v3',
      expect.objectContaining({ version: 3, supersededEarlierVersions: 2 }),
    );
  });

  it('does not supersede anything when the upload is rejected, and requires a reason', async () => {
    const missingReason = await reviewDocument(reviewRequest({ id: 'doc-v3', status: 'rejected' }));
    expect(missingReason.status).toBe(400);
    expect(mocks.db.portalStudentDocument.update).not.toHaveBeenCalled();

    mocks.db.portalStudentDocument.update.mockResolvedValue({
      id: 'doc-v3', version: 3, status: 'rejected', name: 'passport.pdf',
      studentProfile: { id: 'profile-1', studentId: 'STU-1', fullName: 'Student One' },
    });
    const rejected = await reviewDocument(reviewRequest({ id: 'doc-v3', status: 'rejected', rejectionReason: 'blurry scan' }));
    expect(rejected.status).toBe(200);
    expect(mocks.db.portalStudentDocument.updateMany).not.toHaveBeenCalled();
  });

  it('refuses review by a role without review entitlement', async () => {
    Object.assign(mocks.auth, { roles: ['partner'] });
    const response = await reviewDocument(reviewRequest({ id: 'doc-v3', status: 'approved' }));
    expect(response.status).toBe(403);
    expect(mocks.db.portalStudentDocument.update).not.toHaveBeenCalled();
  });
});

describe('document archive policy', () => {
  beforeEach(() => {
    mocks.db.portalStudentDocument.findFirst.mockResolvedValue({
      id: 'doc-v3', studentProfileId: 'profile-1', status: 'rejected',
      studentProfile: { studentId: 'STU-1' },
    });
    mocks.db.portalStudentDocument.update.mockResolvedValue({ id: 'doc-v3' });
    mocks.db.studentDocument.findFirst.mockResolvedValue(null);
  });

  it('archives a portal document through isArchived instead of rewriting its review status', async () => {
    Object.assign(mocks.auth, { userId: 'admin-1', roles: ['admin'] });
    const response = await manageDocument(manageRequest({ id: 'doc-v3', action: 'archive', reason: 'duplicate of version 2' }));
    expect(response.status).toBe(200);
    expect(mocks.db.portalStudentDocument.update).toHaveBeenCalledWith({
      where: { id: 'doc-v3' },
      data: { isArchived: true, archivedAt: expect.any(Date) },
    });
  });

  it('refuses archive and delete for every non-administrator, including document officers', async () => {
    Object.assign(mocks.auth, { roles: ['document_officer'] });
    const response = await manageDocument(manageRequest({ id: 'doc-v3', action: 'archive', reason: 'duplicate of version 2' }));
    expect(response.status).toBe(403);
    expect(mocks.db.portalStudentDocument.update).not.toHaveBeenCalled();
  });

  it('still requires a written reason for a destructive action', async () => {
    Object.assign(mocks.auth, { roles: ['super_admin'] });
    const response = await manageDocument(manageRequest({ id: 'doc-v3', action: 'archive', reason: 'short' }));
    expect(response.status).toBe(400);
    expect(mocks.db.portalStudentDocument.update).not.toHaveBeenCalled();
  });
});
