import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), batchFindUnique: vi.fn(), stagingCount: vi.fn(), errorCount: vi.fn(), studentFindMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    importBatch: { findUnique: (...args: unknown[]) => mocks.batchFindUnique(...args) },
    importStagingStudent: { count: (...args: unknown[]) => mocks.stagingCount(...args) },
    importError: { count: (...args: unknown[]) => mocks.errorCount(...args) },
    student: { findMany: (...args: unknown[]) => mocks.studentFindMany(...args) },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, unknown>, context: unknown) => Promise<Response>) =>
    (request: Request, context: unknown) => handler(request, mocks.auth(), context),
}));

import { GET } from '@/app/api/admin/import/batches/[id]/route';

const context = { params: Promise.resolve({ id: 'batch-1' }) };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'super-1', roles: ['SUPER_ADMIN'] });
  mocks.batchFindUnique.mockResolvedValue({ id: 'batch-1', students: [{ id: 'staged-1', matchedStudentId: 'student-1' }], errors: [] });
  mocks.stagingCount.mockResolvedValue(120);
  mocks.errorCount.mockResolvedValue(2);
  mocks.studentFindMany.mockResolvedValue([{ id: 'student-1', studentId: 'AE-20260001', name: 'Example Student', email: 'example@example.test', phone: '+8801700000000', currentCountry: 'Bangladesh' }]);
});

describe('student import batch detail pagination', () => {
  it('bounds row retrieval and includes only minimized duplicate target data', async () => {
    const response = await GET(new Request('https://alo.test/api/admin/import/batches/batch-1?page=2&limit=500'), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.batchFindUnique).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({
        students: expect.objectContaining({ skip: 100, take: 100 }),
        errors: expect.objectContaining({ skip: 100, take: 100 }),
      }),
    }));
    expect(mocks.studentFindMany).toHaveBeenCalledWith(expect.objectContaining({
      select: { id: true, studentId: true, name: true, email: true, phone: true, currentCountry: true },
    }));
    expect(body.pagination).toMatchObject({ page: 2, limit: 100, totalStudents: 120, totalPages: 2 });
  });

  it('denies non-Super-Admin access before querying import records', async () => {
    mocks.auth.mockReturnValue({ userId: 'admin-2', roles: ['ADMIN'] });
    const response = await GET(new Request('https://alo.test/api/admin/import/batches/batch-1'), context);
    expect(response.status).toBe(403);
    expect(mocks.batchFindUnique).not.toHaveBeenCalled();
  });
});
