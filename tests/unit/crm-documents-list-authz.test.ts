import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for the staff document queue, `GET /api/crm/documents`.
 *
 * The route previously ran under `withAuth` alone. Any authenticated account —
 * including a partner or student portal identity — could page through every
 * student's documents together with the student's email and phone number. These
 * tests pin the three properties that fix introduced:
 *
 *   1. a role outside DOCUMENT_READ_ROLES gets 403 and never queries;
 *   2. a counselor (read-only role) only sees students assigned to them;
 *   3. an administrator sees the whole queue, without contact PII in the payload.
 */
const mocks = vi.hoisted(() => ({
  auth: {
    userId: 'staff-user',
    userType: 'EMPLOYEE',
    identityDomain: 'user',
    roles: [] as string[],
    permissions: [] as string[],
    name: 'Staff User',
    email: 'staff@aloeducation.dev',
  },
  db: {
    portalStudentDocument: { findMany: vi.fn(), count: vi.fn() },
  },
  logAuditAction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/auth-middleware', () => ({
  // The real wrapper authenticates; here the identity is injected per test.
  withAuth: (handler: (req: NextRequest, auth: unknown) => unknown) => (req: NextRequest) => handler(req, mocks.auth),
  logAuditAction: mocks.logAuditAction,
}));

import { GET as listDocuments } from '@/app/api/crm/documents/route';

const request = (query = '') => new NextRequest(`https://portal.example.test/api/crm/documents${query}`);

function setRoles(...roles: string[]) {
  mocks.auth.roles = roles;
}

beforeEach(() => {
  vi.clearAllMocks();
  setRoles('counselor');
  mocks.auth.userId = 'staff-user';
  mocks.db.portalStudentDocument.findMany.mockResolvedValue([]);
  mocks.db.portalStudentDocument.count.mockResolvedValue(0);
});

describe('CRM document queue authorisation', () => {
  it('refuses a partner identity and never touches the document table', async () => {
    setRoles('partner');
    const response = await listDocuments(request());
    expect(response.status).toBe(403);
    expect(mocks.db.portalStudentDocument.findMany).not.toHaveBeenCalled();
    expect(mocks.db.portalStudentDocument.count).not.toHaveBeenCalled();
  });

  it('refuses a student identity', async () => {
    setRoles('student');
    expect((await listDocuments(request())).status).toBe(403);
    expect(mocks.db.portalStudentDocument.findMany).not.toHaveBeenCalled();
  });

  it('refuses a role with no document-read entitlement (e.g. marketing)', async () => {
    setRoles('marketing_manager');
    expect((await listDocuments(request())).status).toBe(403);
    expect(mocks.db.portalStudentDocument.findMany).not.toHaveBeenCalled();
  });

  it('scopes a counselor to the students assigned to them', async () => {
    setRoles('counselor');
    const response = await listDocuments(request('?limit=10&page=1'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.scope).toBe('assigned_students');
    expect(mocks.db.portalStudentDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isArchived: false,
          studentProfile: { counselorId: 'staff-user' },
        }),
      }),
    );
  });

  it('lets a document reviewer read the whole queue, still excluding archived rows', async () => {
    setRoles('document_officer');
    const response = await listDocuments(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.scope).toBe('all_students');
    const call = mocks.db.portalStudentDocument.findMany.mock.calls[0][0];
    expect(call.where.isArchived).toBe(false);
    expect(call.where.studentProfile).toBeUndefined();
  });

  it('lets an administrator read the whole queue', async () => {
    setRoles('admin');
    expect((await listDocuments(request())).status).toBe(200);
    const call = mocks.db.portalStudentDocument.findMany.mock.calls[0][0];
    expect(call.where.studentProfile).toBeUndefined();
  });

  it('never selects student contact details in the queue payload', async () => {
    setRoles('admin');
    await listDocuments(request());
    const call = mocks.db.portalStudentDocument.findMany.mock.calls[0][0];
    const studentProfileSelect = call.include?.studentProfile?.select;
    expect(studentProfileSelect).toEqual({ id: true, studentId: true, fullName: true, city: true });
    expect(JSON.stringify(call)).not.toContain('email');
    expect(JSON.stringify(call)).not.toContain('phone');
  });
});
