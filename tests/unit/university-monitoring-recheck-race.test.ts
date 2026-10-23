import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ guard: vi.fn(), find: vi.fn(), claim: vi.fn(), update: vi.fn(), recheck: vi.fn(), actions: vi.fn(), audit: vi.fn(), log: vi.fn(), queue: vi.fn(), valueCreate: vi.fn(), valueUpdate: vi.fn() }));
vi.mock('@/lib/university-monitoring-auth', () => ({ requireMonitoringAdmin: m.guard }));
vi.mock('@/lib/university-monitoring-engine', () => ({ recheckSource: m.recheck }));
vi.mock('@/lib/db', () => ({ db: {
  dataChange: { findUnique: m.find },
  $transaction: async (callback: (tx: unknown) => unknown) => callback({
    dataChange: { updateMany: m.claim, update: m.update }, approvalAction: { create: m.actions },
    approvalQueueItem: { updateMany: m.queue }, auditLog: { create: m.audit }, monitoringLog: { create: m.log },
    dataChangeValue: { create: m.valueCreate, update: m.valueUpdate },
  }),
} }));
import { POST } from '@/app/api/university-monitoring/recheck/route';
const change = { id: 'synthetic-change', status: 'PENDING', changeType: 'COURSE_UPDATED', fieldName: 'course_title', oldValue: 'Synthetic old title', newValue: 'Synthetic candidate title', sourceId: 'synthetic-source', sourceUrl: 'https://synthetic-university.edu/course', snapshotId: 'prior-evidence', updatedAt: new Date('2026-10-01'), values: [], source: {} };
const request = (body: unknown = { changeId: change.id }) => new NextRequest('https://alo.test/api/university-monitoring/recheck', { method: 'POST', headers: { origin: 'https://alo.test' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  m.guard.mockResolvedValue({ ok: true, actor: { userId: 'super-admin', email: 'synthetic@example.test', auth: { userId: 'super-admin' } } });
  m.find.mockResolvedValue(change); m.claim.mockResolvedValue({ count: 1 });
  m.update.mockImplementation(async ({ data }) => ({ ...change, ...data }));
  m.recheck.mockResolvedValue({ newValue: 'Synthetic refreshed title', confidence: 0.65, snapshotId: 'fresh-evidence', sourceUrl: change.sourceUrl, evidenceQuote: 'Synthetic refreshed title', extractedField: 'course_title' });
});
describe('monitoring recheck atomic ownership and evidence history', () => {
  it('fails closed with a safe response when the initial transaction is unavailable', async () => {
    m.claim.mockRejectedValue(new Error('Synthetic internal database error'));
    const response = await POST(request());
    expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain('Synthetic internal');
  });
  it('rejects an unauthenticated request before reading a change', async () => {
    m.guard.mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 401 }) });
    expect((await POST(request())).status).toBe(401); expect(m.find).not.toHaveBeenCalled();
  });
  it('never reopens an approved change', async () => {
    m.find.mockResolvedValue({ ...change, status: 'APPROVED' });
    expect((await POST(request())).status).toBe(409); expect(m.claim).not.toHaveBeenCalled(); expect(m.recheck).not.toHaveBeenCalled();
  });
  it('cannot overwrite approval that raced between the initial read and claim', async () => {
    m.claim.mockResolvedValue({ count: 0 });
    expect((await POST(request())).status).toBe(409);
    expect(m.claim).toHaveBeenCalledWith({ where: { id: change.id, status: { in: ['PENDING', 'NEEDS_REVIEW'] }, updatedAt: change.updatedAt }, data: { status: 'RECHECK_REQUESTED' } });
    expect(m.recheck).not.toHaveBeenCalled(); expect(m.actions).not.toHaveBeenCalled();
  });
  it('preserves prior evidence in an immutable action before refreshing candidate values', async () => {
    expect((await POST(request())).status).toBe(200);
    const requestAction = m.actions.mock.calls[0][0].data;
    expect(JSON.parse(requestAction.metadata).previousEvidence).toMatchObject({ oldValue: change.oldValue, newValue: change.newValue, snapshotId: change.snapshotId });
    expect(m.update.mock.calls[0][0].data).toMatchObject({ status: 'PENDING', newValue: 'Synthetic refreshed title', appliedAt: null });
    expect(m.valueCreate).toHaveBeenCalled();
  });
  it('failed research returns to manual review without changing production records', async () => {
    m.recheck.mockRejectedValue(new Error('Synthetic source unavailable'));
    expect((await POST(request())).status).toBe(422);
    expect(m.claim.mock.calls[1][0]).toMatchObject({ where: { id: change.id, status: 'RECHECK_REQUESTED' }, data: { status: 'NEEDS_REVIEW' } });
    expect(m.update).not.toHaveBeenCalled(); expect(m.valueCreate).not.toHaveBeenCalled();
  });
  it('a stale completion/failure callback cannot overwrite a newer decision', async () => {
    m.claim.mockResolvedValueOnce({ count: 1 }).mockResolvedValue({ count: 0 });
    expect((await POST(request())).status).toBe(422);
    expect(m.update).not.toHaveBeenCalled();
    expect(m.actions).toHaveBeenCalledTimes(1); // request only, no stale completion/failure history
  });
});
