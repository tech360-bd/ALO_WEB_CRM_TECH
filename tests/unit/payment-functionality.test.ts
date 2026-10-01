import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { db, getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  db: {
    user: { findUnique: vi.fn() }, portalSession: { findUnique: vi.fn() }, portalStudentProfile: { findUnique: vi.fn() },
    aloPayment: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    student: { findMany: vi.fn() }, portalAuditLog: { create: vi.fn() }, $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/db', () => ({ db }));
vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
import { GET as crmGet, POST as crmPost } from '@/app/api/crm/finance/route';
import { GET as studentGet, POST as studentPost } from '@/app/api/student-portal/payments/route';
const req = (url: string, body?: unknown) => new NextRequest(`https://example.com${url}`, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
function actor(role: string) {
  getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
  db.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', role, permissions: '[]', status: 'ACTIVE' });
}
beforeEach(() => {
  vi.resetAllMocks(); actor('STUDENT');
  db.portalStudentProfile.findUnique.mockResolvedValue({ id: 'own-profile' });
  db.aloPayment.findMany.mockResolvedValue([]); db.aloPayment.count.mockResolvedValue(0);
  db.aloPayment.create.mockImplementation(async ({ data }) => ({ id: 'p-1', ...data }));
  db.$transaction.mockImplementation(async fn => fn(Object.fromEntries(Object.entries(db).filter(([key]) => key !== '$transaction'))));
});
describe('payment paths with real authorization middleware', () => {
  it('rejects anonymous finance requests', async () => {
    getServerSession.mockResolvedValue(null);
    expect((await crmGet(req('/api/crm/finance'))).status).toBe(401);
    expect(db.aloPayment.findMany).not.toHaveBeenCalled();
  });
  it.each(['STUDENT','PARTNER','EMPLOYEE','COUNSELOR'])('denies %s access to organization-wide finance', async role => {
    actor(role);
    expect((await crmGet(req('/api/crm/finance'))).status).toBe(403);
    expect((await crmPost(req('/api/crm/finance', { studentId: 'other', amount: 50 }))).status).toBe(403);
    expect(db.aloPayment.create).not.toHaveBeenCalled(); expect(db.aloPayment.findMany).not.toHaveBeenCalled();
  });
  it.each(['FINANCE','CEO','ADMIN','SUPER_ADMIN'])('preserves established finance access for %s', async role => {
    actor(role); expect((await crmGet(req('/api/crm/finance'))).status).toBe(200);
  });
  it.each(['finance', 'finance_officer', 'ceo'])('allows seeded EMPLOYEE role %s, not just legacy user types', async role => {
    db.portalSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60000), revokedAt: null,
      user: { id: 'staff-1', userType: 'EMPLOYEE', status: 'active', email: 'staff@example.com', name: 'Staff', roles: [{ role: { name: role, permissions: [] } }] },
    });
    const request = req('/api/crm/finance'); request.headers.set('Authorization', 'Bearer isolated-test-session');
    expect((await crmGet(request)).status).toBe(200);
  });
  it.each(['counselor', 'partner_manager', 'branch_manager', 'hr', 'student'])('denies seeded non-finance role %s', async role => {
    db.portalSession.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60000), revokedAt: null,
      user: { id: 'staff-1', userType: 'EMPLOYEE', status: 'active', roles: [{ role: { name: role, permissions: [] } }] },
    });
    const request = req('/api/crm/finance'); request.headers.set('Authorization', 'Bearer isolated-test-session');
    expect((await crmGet(request)).status).toBe(403); expect(db.aloPayment.findMany).not.toHaveBeenCalled();
  });
  it('does not allow a student to attest settlement', async () => {
    const res = await studentPost(req('/api/student-portal/payments', { amount: 50, status: 'paid' }));
    expect(res.status).toBe(400); expect(db.aloPayment.create).not.toHaveBeenCalled();
  });
  it('creates only an own-profile pending entry with required audit in transaction', async () => {
    const res = await studentPost(req('/api/student-portal/payments', { amount: 50, description: 'Request' }));
    expect(res.status).toBe(201); expect(db.$transaction).toHaveBeenCalledOnce();
    expect(db.aloPayment.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: 'own-profile', status: 'pending', paidAt: null }) });
    expect(db.portalAuditLog.create).toHaveBeenCalledOnce();
  });
  it.each([0,-1,'50junk',null,{},'Infinity'])('rejects invalid amount %o', async amount => {
    expect((await studentPost(req('/api/student-portal/payments', { amount }))).status).toBe(400);
    expect(db.aloPayment.create).not.toHaveBeenCalled();
  });
  it('does not accept another student identifier in request input', async () => {
    expect((await studentPost(req('/api/student-portal/payments', { amount: 50, studentId: 'other' }))).status).toBe(400);
  });
  it('rolls back pending entry when required audit persistence fails', async () => {
    const committed: unknown[] = [];
    db.$transaction.mockImplementation(async fn => {
      const staged: unknown[] = [];
      const result = await fn({ aloPayment: { create: async ({ data }) => { staged.push(data); return { id: 'p-1', ...data }; } }, portalAuditLog: { create: async () => { throw new Error('private-database-detail'); } } });
      committed.push(...staged); return result;
    });
    const res = await studentPost(req('/api/student-portal/payments', { amount: 50 }));
    expect(res.status).toBe(500); expect(await res.text()).not.toContain('private-database-detail'); expect(committed).toEqual([]);
  });
  it('finance creates its existing record and required audit in one transaction', async () => {
    actor('FINANCE');
    const res = await crmPost(req('/api/crm/finance', { studentId: 'unit-student', amount: 50 }));
    expect(res.status).toBe(201); expect(db.$transaction).toHaveBeenCalledOnce();
    expect(db.portalAuditLog.create).toHaveBeenCalledOnce();
  });
  it.each(['50junk', {}, null, -1, 0])('finance rejects invalid amount %o before mutation', async amount => {
    actor('FINANCE');
    const res = await crmPost(req('/api/crm/finance', { studentId: 'unit-student', amount }));
    expect(res.status).toBe(400); expect(db.aloPayment.create).not.toHaveBeenCalled();
  });
  it('finance audit failure rejects the transaction rather than claiming creation', async () => {
    actor('FINANCE'); db.portalAuditLog.create.mockRejectedValue(new Error('private-audit-error'));
    const res = await crmPost(req('/api/crm/finance', { studentId: 'unit-student', amount: 50 }));
    expect(res.status).toBe(500); expect(db.$transaction).toHaveBeenCalledOnce();
    expect(await res.text()).not.toContain('private-audit-error');
  });
  it('database failure is failure, not successful empty finance', async () => {
    actor('FINANCE'); db.aloPayment.count.mockRejectedValue(new Error('Unknown table private-db'));
    const res = await crmGet(req('/api/crm/finance'));
    expect(res.status).toBe(500); expect(await res.json()).toMatchObject({ success: false });
  });
  it.each(['page=NaN','page=-1','limit=0','limit=101','sortBy=passwordHash','sortOrder=sideways'])('rejects invalid pagination/sort %s before payment query', async query => {
    const res = await studentGet(req(`/api/student-portal/payments?${query}`));
    expect(res.status).toBe(400); expect(db.aloPayment.findMany).not.toHaveBeenCalled();
  });
  it('own-list scope cannot be overridden by an ID query parameter', async () => {
    expect((await studentGet(req('/api/student-portal/payments?studentId=other&page=2&limit=5&sortBy=amount&sortOrder=asc'))).status).toBe(200);
    expect(db.aloPayment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'own-profile' }, skip: 5, take: 5, orderBy: { amount: 'asc' } }));
  });
});
