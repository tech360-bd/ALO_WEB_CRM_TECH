import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), stagedFindUnique: vi.fn(), batchFindUnique: vi.fn(), studentFindUnique: vi.fn(),
  stagedUpdateMany: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn(),
}));

const tx = {
  importBatch: { findUnique: (...args: unknown[]) => mocks.batchFindUnique(...args) },
  importStagingStudent: { updateMany: (...args: unknown[]) => mocks.stagedUpdateMany(...args) },
  crmAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};

vi.mock('@/lib/db', () => ({
  db: {
    importStagingStudent: { findUnique: (...args: unknown[]) => mocks.stagedFindUnique(...args) },
    importBatch: { findUnique: (...args: unknown[]) => mocks.batchFindUnique(...args) },
    student: { findUnique: (...args: unknown[]) => mocks.studentFindUnique(...args) },
    $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, unknown>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));

import { POST } from '@/app/api/admin/import/merge/route';

const body = {
  stagedId: 'stage-1',
  matchedStudentId: 'student-1',
  decisions: { studentName: 'KEEP_EXISTING', email: 'USE_IMPORTED', phone: 'KEEP_EXISTING', countryInterest: 'SKIP' },
};
const request = (payload: unknown = body) => new Request('https://alo.test/api/admin/import/merge', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'super-1', roles: ['SUPER_ADMIN'] });
  mocks.stagedFindUnique.mockResolvedValue({
    id: 'stage-1', batchId: 'batch-1', status: 'possible_duplicate', matchedStudentId: 'student-1',
    studentName: 'Imported Name', email: 'new@example.test', phone: '+8801700000000', countryInterest: 'Australia',
  });
  mocks.batchFindUnique.mockResolvedValue({ id: 'batch-1', status: 'ready_for_review' });
  mocks.studentFindUnique.mockResolvedValue({ id: 'student-1', name: 'Existing Name', email: 'old@example.test', phone: '+8801800000000', currentCountry: 'Bangladesh', updatedAt: new Date() });
  mocks.stagedUpdateMany.mockResolvedValue({ count: 1 });
  mocks.auditCreate.mockResolvedValue({});
  mocks.transaction.mockImplementation((callback) => callback(tx));
});

describe('student import duplicate field decisions', () => {
  it('denies non-Super-Admin decisions before reading import records', async () => {
    mocks.auth.mockReturnValue({ userId: 'admin-2', roles: ['ADMIN'] });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.stagedFindUnique).not.toHaveBeenCalled();
  });

  it('saves allowlisted decisions and an audit event atomically', async () => {
    const response = await POST(request());
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(mocks.stagedUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'stage-1', status: 'possible_duplicate', matchedStudentId: 'student-1' },
      data: expect.objectContaining({ status: 'merged' }),
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'STUDENT_IMPORT_MERGE_DECIDED', targetId: 'student-1', batchId: 'batch-1' }),
    }));
  });

  it('rejects fields the executor does not support, including passport replacement', async () => {
    const response = await POST(request({ ...body, decisions: { passportNumber: 'USE_IMPORTED' } }));
    expect(response.status).toBe(400);
    expect(mocks.stagedUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects a merge target that differs from the stored duplicate suggestion', async () => {
    const response = await POST(request({ ...body, matchedStudentId: 'other-student' }));
    expect(response.status).toBe(409);
    expect(mocks.stagedUpdateMany).not.toHaveBeenCalled();
  });
});
