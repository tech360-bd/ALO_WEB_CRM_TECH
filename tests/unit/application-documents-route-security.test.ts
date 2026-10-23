import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), applicationFindFirst: vi.fn(), studentFindFirst: vi.fn(), studentFindUnique: vi.fn(),
  profileFindFirst: vi.fn(), visaCaseFindFirst: vi.fn(), documentFindMany: vi.fn(),
  studentDocumentFindFirst: vi.fn(), documentCreate: vi.fn(), documentUpdateMany: vi.fn(),
  applicationUpdate: vi.fn(), auditCreate: vi.fn(),
}));

const tx = {
  applicationDocument: {
    findMany: (...args: unknown[]) => mocks.documentFindMany(...args),
    create: (...args: unknown[]) => mocks.documentCreate(...args),
    updateMany: (...args: unknown[]) => mocks.documentUpdateMany(...args),
  },
  studentDocument: { findFirst: (...args: unknown[]) => mocks.studentDocumentFindFirst(...args) },
  application: { update: (...args: unknown[]) => mocks.applicationUpdate(...args) },
  auditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};

vi.mock('@/lib/db', () => ({
  db: {
    application: { findFirst: (...args: unknown[]) => mocks.applicationFindFirst(...args) },
    student: {
      findFirst: (...args: unknown[]) => mocks.studentFindFirst(...args),
      findUnique: (...args: unknown[]) => mocks.studentFindUnique(...args),
    },
    portalStudentProfile: { findFirst: (...args: unknown[]) => mocks.profileFindFirst(...args) },
    visaCase: { findFirst: (...args: unknown[]) => mocks.visaCaseFindFirst(...args) },
    applicationDocument: { findMany: (...args: unknown[]) => mocks.documentFindMany(...args) },
    studentDocument: { findFirst: (...args: unknown[]) => mocks.studentDocumentFindFirst(...args) },
    auditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>, context?: any) => Promise<Response>) =>
    (request: Request, context?: any) => handler(request, mocks.auth(), context),
}));

import { GET, POST } from '@/app/api/applications/[id]/documents/route';

const application = { id: 'app-1', studentId: 'student-1', partnerId: 'partner-1', counselorId: 'counselor-1', applicationOfficer: '', appTeamOfficerId: '', visaOfficerId: '' };

function request(method: 'GET' | 'POST', body?: unknown): Request {
  return new Request('https://alo.test/api/applications/app-1/documents', {
    method,
    ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'student-user', userType: 'STUDENT', roles: ['STUDENT', 'student'], permissions: [], partnerId: undefined, name: 'Student', email: 'student@example.test' });
  mocks.applicationFindFirst.mockResolvedValue(application);
  mocks.studentFindFirst.mockResolvedValue({ id: 'student-1' });
  mocks.studentFindUnique.mockResolvedValue(null);
  mocks.profileFindFirst.mockResolvedValue(null);
  mocks.visaCaseFindFirst.mockResolvedValue(null);
  mocks.documentFindMany.mockResolvedValue([]);
  mocks.studentDocumentFindFirst.mockResolvedValue({ id: 'student-doc-1', fileName: 'passport.pdf', status: 'pending_review', reviewedBy: '', reviewerNote: 'internal reviewer text', storagePath: '/private/documents/file', mimeType: 'application/pdf', fileHash: 'valid-hash' });
  mocks.documentCreate.mockResolvedValue({ id: 'application-doc-1', applicationId: 'app-1', studentId: 'student-1', documentId: 'student-doc-1', documentType: 'Passport', fileName: 'passport.pdf', status: 'UPLOADED', reviewerId: '', reviewerNote: '', visibility: 'partner_visible', version: 1, isB2bConfidential: false });
  mocks.documentUpdateMany.mockResolvedValue({ count: 0 });
  mocks.applicationUpdate.mockResolvedValue({});
  mocks.auditCreate.mockResolvedValue({});
});

describe('application document endpoint authorization and visibility', () => {
  it('scopes a student read to the server-linked Student and returns only student-visible safe fields', async () => {
    mocks.documentFindMany.mockResolvedValueOnce([
      { id: 'visible-1', applicationId: 'app-1', studentId: 'student-1', documentId: 'student-doc-1', documentType: 'Passport', fileName: 'passport.pdf', status: 'UPLOADED', visibility: 'student_visible', version: 1, reviewerId: 'staff-1', reviewerNote: 'private reviewer note', isB2bConfidential: false, fileUrl: '/private/path' },
      { id: 'internal-1', applicationId: 'app-1', documentType: 'Bank', fileName: 'bank.pdf', status: 'UPLOADED', visibility: 'internal', isB2bConfidential: false },
      { id: 'confidential-1', applicationId: 'app-1', documentType: 'B2B', fileName: 'private.pdf', status: 'UPLOADED', visibility: 'student_visible', isB2bConfidential: true },
    ]);
    const response = await GET(request('GET'), { params: { id: 'app-1' } } as any);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.applicationFindFirst).toHaveBeenCalledWith({ where: { id: 'app-1', studentId: 'student-1' } });
    expect(body.data).toHaveLength(1);
    expect(body.data[0].downloadUrl).toBe('/api/student/documents/student-doc-1/download');
    expect(body.data[0]).not.toHaveProperty('reviewerNote');
    expect(body.data[0]).not.toHaveProperty('documentId');
    expect(JSON.stringify(body)).not.toContain('private reviewer note');
    expect(JSON.stringify(body)).not.toContain('/private/path');
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'VIEW_APPLICATION_DOCUMENTS' }) }));
  });

  it('returns not found when a student requests another student’s application ID', async () => {
    mocks.applicationFindFirst.mockResolvedValueOnce(null);
    const response = await GET(request('GET'), { params: { id: 'someone-elses-app' } } as any);
    expect(response.status).toBe(404);
    expect(mocks.documentFindMany).not.toHaveBeenCalled();
  });

  it('limits a partner to partner-visible metadata and never exposes private document links', async () => {
    mocks.auth.mockReturnValue({ userId: 'partner-user', userType: 'PARTNER', roles: ['PARTNER', 'partner'], permissions: [], partnerId: 'partner-1' });
    mocks.documentFindMany.mockResolvedValueOnce([
      { id: 'partner-visible', applicationId: 'app-1', documentId: 'student-doc-1', documentType: 'Transcript', fileName: 'transcript.pdf', status: 'UPLOADED', visibility: 'partner_visible', reviewerNote: 'internal' },
      { id: 'internal', applicationId: 'app-1', documentType: 'Passport', fileName: 'passport.pdf', status: 'UPLOADED', visibility: 'internal' },
      { id: 'b2b', applicationId: 'app-1', documentType: 'Private', fileName: 'private.pdf', status: 'UPLOADED', visibility: 'b2b_confidential', isB2bConfidential: false },
    ]);
    const response = await GET(request('GET'), { params: { id: 'app-1' } } as any);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.applicationFindFirst).toHaveBeenCalledWith({ where: { id: 'app-1', partnerId: 'partner-1' } });
    expect(body.data).toHaveLength(1);
    expect(body.data[0].downloadUrl).toBeNull();
    expect(body.data[0]).not.toHaveProperty('documentId');
    expect(JSON.stringify(body)).not.toContain('passport.pdf');
    expect(JSON.stringify(body)).not.toContain('private.pdf');
    expect(JSON.stringify(body)).not.toContain('internal');
  });

  it('denies unrelated roles before looking up an application', async () => {
    mocks.auth.mockReturnValue({ userId: 'marketing-1', userType: 'MARKETING', roles: ['MARKETING', 'marketing'], permissions: [], partnerId: undefined });
    const response = await GET(request('GET'), { params: { id: 'app-1' } } as any);
    expect(response.status).toBe(403);
    expect(mocks.applicationFindFirst).not.toHaveBeenCalled();
  });

  it('forces partner-created links to partner-visible and returns no private record identifiers', async () => {
    mocks.auth.mockReturnValue({ userId: 'partner-user', userType: 'PARTNER', roles: ['PARTNER', 'partner'], permissions: [], partnerId: 'partner-1' });
    const response = await POST(request('POST', { documentType: 'Passport', documentId: 'student-doc-1', status: 'UPLOADED', visibility: 'internal' }), { params: { id: 'app-1' } } as any);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.documentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ visibility: 'partner_visible', isB2bConfidential: false }) }));
    expect(body.data.visibility).toBe('partner_visible');
    expect(body.data).not.toHaveProperty('documentId');
    expect(body.data).not.toHaveProperty('reviewerNote');
  });

  it('requires server permission to create B2B-confidential visibility', async () => {
    mocks.auth.mockReturnValue({ userId: 'partner-user', userType: 'PARTNER', roles: ['PARTNER', 'partner'], permissions: [], partnerId: 'partner-1' });
    const response = await POST(request('POST', { documentType: 'Passport', documentId: 'student-doc-1', status: 'UPLOADED', visibility: 'b2b_confidential' }), { params: { id: 'app-1' } } as any);
    expect(response.status).toBe(403);
    expect(mocks.documentCreate).not.toHaveBeenCalled();
  });
});
