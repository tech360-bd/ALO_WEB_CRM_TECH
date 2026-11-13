import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), applicationDocumentFindUnique: vi.fn(), applicationFindUnique: vi.fn(),
  applicationDocumentUpdate: vi.fn(), studentDocumentFindFirst: vi.fn(), studentDocumentUpdate: vi.fn(),
  documentAuditCreate: vi.fn(), applicationStatusLogCreate: vi.fn(), auditLogCreate: vi.fn(),
}));

const tx = {
  applicationDocument: {
    findUnique: (...args: unknown[]) => mocks.applicationDocumentFindUnique(...args),
    update: (...args: unknown[]) => mocks.applicationDocumentUpdate(...args),
  },
  application: { findUnique: (...args: unknown[]) => mocks.applicationFindUnique(...args) },
  studentDocument: {
    findFirst: (...args: unknown[]) => mocks.studentDocumentFindFirst(...args),
    update: (...args: unknown[]) => mocks.studentDocumentUpdate(...args),
  },
  documentAudit: { create: (...args: unknown[]) => mocks.documentAuditCreate(...args) },
  applicationStatusLog: { create: (...args: unknown[]) => mocks.applicationStatusLogCreate(...args) },
  auditLog: { create: (...args: unknown[]) => mocks.auditLogCreate(...args) },
};

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>, context?: any) => Promise<Response>) =>
    (request: Request, context?: any) => handler(request, mocks.auth(), context),
}));
vi.mock('@/lib/application-manager/document-readiness', () => ({
  refreshApplicationDocumentStatus: vi.fn(),
  syncStudentDocumentReadiness: vi.fn(),
}));

import { POST } from '@/app/api/application-documents/[id]/approve/route';

const b2bApplication = { id: 'app-b2b', isB2b: true, isB2bConfidential: true, applicationSource: 'B2B_INBOUND_APPLICATION' };
const b2bDocument = {
  id: 'doc-1', applicationId: 'app-b2b', studentId: 'student-1', documentId: 'private-storage-id',
  documentType: 'Passport', fileName: 'passport.pdf', status: 'UPLOADED', visibility: 'B2B_CONFIDENTIAL',
  version: 1, isB2bConfidential: true, fileUrl: '/private/storage/path', storagePath: 'private/key',
};

function request() {
  return new Request('https://alo.test/api/application-documents/doc-1/approve', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reviewerNote: 'Verified' }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'app-team-1', userType: 'EMPLOYEE', roles: ['application_team'], permissions: [], partnerId: undefined, name: 'Reviewer', email: 'reviewer@example.test' });
  mocks.applicationDocumentFindUnique.mockResolvedValue(b2bDocument);
  mocks.applicationFindUnique.mockResolvedValue(b2bApplication);
  mocks.applicationDocumentUpdate.mockResolvedValue({});
  mocks.studentDocumentFindFirst.mockResolvedValue(null);
  mocks.studentDocumentUpdate.mockResolvedValue({});
  mocks.documentAuditCreate.mockResolvedValue({});
  mocks.applicationStatusLogCreate.mockResolvedValue({});
  mocks.auditLogCreate.mockResolvedValue({});
});

describe('application document review B2B security', () => {
  it('denies the default Application Team role access to B2B-confidential documents', async () => {
    const response = await POST(request(), { params: { id: 'doc-1' } } as any);
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error).toMatch(/outside your review scope/i);
    expect(mocks.applicationDocumentUpdate).not.toHaveBeenCalled();
    expect(mocks.applicationStatusLogCreate).not.toHaveBeenCalled();
  });

  it('requires both document-review access and explicit B2B access, then omits storage identifiers from success responses', async () => {
    mocks.auth.mockReturnValue({ userId: 'app-manager-1', userType: 'EMPLOYEE', roles: ['application_manager'], permissions: [], partnerId: undefined, name: 'Manager', email: 'manager@example.test' });
    mocks.applicationDocumentFindUnique
      .mockResolvedValueOnce(b2bDocument)
      .mockResolvedValueOnce({ ...b2bDocument, status: 'VERIFIED', reviewerId: 'app-manager-1', reviewerNote: 'Verified' });
    mocks.applicationDocumentUpdate.mockResolvedValue({ count: 1 });
    const response = await POST(request(), { params: { id: 'doc-1' } } as any);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ id: 'doc-1', status: 'VERIFIED' });
    expect(body.data).not.toHaveProperty('fileUrl');
    expect(body.data).not.toHaveProperty('storagePath');
    expect(body.data).not.toHaveProperty('documentId');
    expect(JSON.stringify(body)).not.toContain('/private/storage/path');
    expect(mocks.applicationStatusLogCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ visibility: 'B2B_CONFIDENTIAL' }) }));
  });
});
