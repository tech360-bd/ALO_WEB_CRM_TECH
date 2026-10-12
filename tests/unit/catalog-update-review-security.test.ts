import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), list: vi.fn(), claim: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/db', () => ({ db: { universityUpdateRequest: { findMany: m.list }, $transaction: m.transaction } }));
import { listCatalogUpdates, reviewCatalogUpdate, unavailableCatalogAction } from '@/lib/crm/catalog-update-review';
import { PATCH } from '@/app/api/admin/university-updates/route';
import { POST as emptyScan } from '@/app/api/admin/university-data/run-scan/route';
import { POST as oldScan } from '@/app/api/admin/university-data-updates/route';
import { POST as oldPublish } from '@/app/api/admin/university-data/publish/route';
import { POST as publish } from '@/app/api/admin/university-data/updates/[id]/publish/route';
import { POST as rollback } from '@/app/api/admin/university-data/updates/[id]/rollback/route';
const auth = { userId: 'admin', actorUserId: 'actor', userType: 'ADMIN', identityDomain: 'portal', authenticationMethod: 'cookie' };
const req = (body: unknown = { requestId: 'proposal', action: 'approve' }) => new Request('https://alo.test/api/admin/university-updates', { method: 'POST', headers: { origin: 'https://alo.test' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXTAUTH_URL', 'https://alo.test'); m.auth.mockResolvedValue(auth);
  m.find.mockResolvedValue({ id: 'proposal', status: 'pending_approval', newValue: 'Proposed value', evidenceUrl: 'https://official.test', reviewedBy: '' });
  m.claim.mockResolvedValue({ count: 1 }); m.list.mockResolvedValue([]);
  // Only proposal and audit delegates: any live catalogue/fee/verification write fails.
  m.transaction.mockImplementation(fn => fn({ universityUpdateRequest: { findUnique: m.find, updateMany: m.claim }, portalAuditLog: { create: m.audit } }));
});
it('requires verified administrator domains and origin independently of caller role claims', async () => {
  for (const override of [{ identityDomain: undefined }, { userType: 'STUDENT', roles: ['ADMIN'] }]) {
    m.auth.mockResolvedValue({ ...auth, ...override });
    expect((await listCatalogUpdates(req())).status).toBe(403);
    expect((await reviewCatalogUpdate(req())).status).toBe(403);
    expect((await unavailableCatalogAction(req())).status).toBe(403);
  }
  m.auth.mockResolvedValue(auth); const cross = req(); cross.headers.set('origin', 'https://attacker.test');
  expect((await reviewCatalogUpdate(cross)).status).toBe(403);
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled();
});
it('lists bounded proposals without invented successful scans or publication claims', async () => {
  const res = await listCatalogUpdates(new Request('https://alo.test/api/updates?status=pending_approval&confidence=0.5&limit=5'));
  expect(await res.json()).toMatchObject({ updates: [], publicationAvailable: false, scannerStatus: 'NOT_VERIFIED', lastScanAt: null, nextScanAt: null });
  expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ take: 5, where: { status: 'pending_approval', aiConfidence: { gte: 0.5 } } }));
  expect((await listCatalogUpdates(new Request('https://alo.test/api/updates?confidence=NaN'))).status).toBe(400);
});
it('approval records human review and namespace audit, not live catalogue publication or verification', async () => {
  const res = await PATCH(req()); expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ verified: false, published: false });
  expect(m.claim).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'reviewed_unverified', reviewedBy: 'portal:actor' } }));
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actorUserId: 'actor', metadata: expect.stringContaining('"published":false') }) }));
});
it('rejects unknown actions, control fields and invalid evidence before a transaction', async () => {
  for (const body of [{ requestId: 'proposal', action: 'publish' }, { requestId: 'proposal', action: 'approve', status: 'VERIFIED' }, { requestId: 'proposal', action: 'edit', newValue: 'value', evidenceUrl: 'http://official.test' }]) {
    expect((await reviewCatalogUpdate(req(body))).status).toBe(400);
  }
  expect(m.transaction).not.toHaveBeenCalled();
});
it('legacy synthetic scan, arbitrary publish and unsnapshotted rollback paths fail closed without DB operations', async () => {
  for (const handler of [emptyScan, oldScan, oldPublish, publish, rollback]) expect((await handler(req())).status).toBe(409);
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled();
});
it('does not overwrite changed/published proposals or claim success if audit fails', async () => {
  m.find.mockResolvedValueOnce({ id: 'proposal', status: 'published' }); expect((await reviewCatalogUpdate(req())).status).toBe(409);
  m.claim.mockResolvedValueOnce({ count: 0 }); expect((await reviewCatalogUpdate(req())).status).toBe(409);
  expect(m.audit).not.toHaveBeenCalled();
  m.audit.mockRejectedValue(new Error('private driver failure'));
  const res = await reviewCatalogUpdate(req()); expect(res.status).toBe(503); expect(await res.text()).not.toContain('driver');
});
