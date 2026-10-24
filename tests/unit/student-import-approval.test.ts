import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn(),
}));

const tx = {
  importBatch: {
    updateMany: (...args: unknown[]) => mocks.updateMany(...args),
    findUnique: (...args: unknown[]) => mocks.findUnique(...args),
  },
  crmAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, unknown>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));

import { POST } from '@/app/api/admin/import/batches/[id]/approve/route';

const request = () => new Request('https://alo.test/api/admin/import/batches/batch-1/approve', { method: 'POST' });
const superAdmin = { userId: 'admin-1', roles: ['SUPER_ADMIN'] };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(superAdmin);
  mocks.transaction.mockImplementation((callback) => callback(tx));
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.findUnique.mockResolvedValue({ id: 'batch-1', status: 'approved' });
  mocks.auditCreate.mockResolvedValue({});
});

describe('old-CRM import approval gate', () => {
  it('denies ordinary admins before touching batch data', async () => {
    mocks.auth.mockReturnValue({ userId: 'admin-2', roles: ['ADMIN', 'admin'] });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it('atomically approves only a ready-for-review batch and audits the approver', async () => {
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true, batch: { id: 'batch-1', status: 'approved' } });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 'batch-1', status: 'ready_for_review' },
      data: { status: 'approved' },
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ actorUserId: 'admin-1', action: 'STUDENT_IMPORT_APPROVED', batchId: 'batch-1' }),
    }));
  });

  it('returns a conflict when the compare-and-set finds a batch in another state', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.findUnique.mockResolvedValue({ status: 'processing' });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
