import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn(), legacyList: vi.fn(), findFirst: vi.fn(), create: vi.fn(), mirror: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/db', () => ({ db: {
  weeklyUpdateRequest: { findMany: m.findMany }, universityUpdateRequest: { findMany: m.legacyList }, $transaction: m.transaction,
} }));
import { GET, POST } from '@/app/api/weekly-updates/route';
const auth = { identityDomain: 'user', authenticationMethod: 'cookie', userType: 'ADMIN', userId: 'admin', actorUserId: 'admin', roles: ['ADMIN'], permissions: [] };
const proposal = { targetType: 'course', targetId: 'CRS-1', targetName: 'Programme', fieldName: 'courseTitle', newValue: 'Programme title', sourceUrl: 'https://example.edu/course', evidence: 'Official page heading, recorded for human review' };
const req = (body: unknown = proposal, origin = 'https://alo.test') => new NextRequest('https://alo.test/api/weekly-updates', { method: 'POST', headers: { origin }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
  m.auth.mockResolvedValue(auth); m.findMany.mockResolvedValue([]); m.legacyList.mockResolvedValue([]);
  m.findFirst.mockResolvedValue(null); m.create.mockResolvedValue({ id: 'proposal', status: 'PENDING_REVIEW' });
  m.transaction.mockImplementation(fn => fn({ weeklyUpdateRequest: { findFirst: m.findFirst, create: m.create }, universityUpdateRequest: { create: m.mirror }, portalAuditLog: { create: m.audit } }));
});
it('rejects anonymous proposal writes before database work', async () => {
  m.auth.mockResolvedValue(NextResponse.json({ error: 'Login required' }, { status: 401 }));
  expect((await POST(req())).status).toBe(401); expect(m.transaction).not.toHaveBeenCalled();
});
it('rejects students/partners/staff and unknown namespaces on both methods', async () => {
  for (const override of [{ userType: 'STUDENT' }, { userType: 'PARTNER' }, { userType: 'STAFF' }, { identityDomain: undefined }]) {
    m.auth.mockResolvedValue({ ...auth, ...override });
    expect((await POST(req())).status).toBe(403);
    expect((await GET(new NextRequest('https://alo.test/api/weekly-updates'))).status).toBe(403);
  }
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.findMany).not.toHaveBeenCalled();
});
it('enforces origin using resolved authentication, not fabricated headers', async () => {
  expect((await POST(req(proposal, 'https://attacker.test'))).status).toBe(403);
  const fabricated = req(); fabricated.headers.delete('origin'); fabricated.headers.set('authorization', 'Bearer fabricated');
  expect((await POST(fabricated)).status).toBe(403); expect(m.transaction).not.toHaveBeenCalled();
});
it('requires bounded typed inputs/evidence and rejects status injection', async () => {
  for (const override of [{ aiConfidence: 2 }, { aiConfidence: '0.9' }, { evidence: '' }, { sourceUrl: 'javascript:alert(1)' }, { newValue: 'x'.repeat(192) }, { fieldName: 'verificationStatus' }, { status: 'APPROVED' }]) {
    expect((await POST(req({ ...proposal, ...override }))).status).toBe(400);
  }
  expect(m.transaction).not.toHaveBeenCalled();
});
it('atomically stages pending proposal, legacy mirror and real-actor audit without publishing', async () => {
  expect((await POST(req())).status).toBe(201);
  expect(m.transaction).toHaveBeenCalledOnce();
  expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'PENDING_REVIEW', aiConfidence: 0 }) });
  expect(m.mirror).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'pending_approval' }) });
  expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: 'admin', action: 'CATALOG_UPDATE_PROPOSED', metadata: expect.stringContaining('"identityDomain":"user"') }) });
});
it('propagates audit/mirror failure without a false success or private driver details', async () => {
  m.audit.mockRejectedValue(new Error('private database secret'));
  const response = await POST(req()); expect(response.status).toBe(500); expect(await response.text()).not.toContain('secret');
  m.audit.mockResolvedValue({}); m.mirror.mockRejectedValue(new Error('private database secret'));
  expect((await POST(req())).status).toBe(500);
});
it('bounds listing and applies all/target filters consistently to both queues', async () => {
  for (const limit of ['NaN', '-1', '0', '201']) expect((await GET(new NextRequest(`https://alo.test/api/weekly-updates?limit=${limit}`))).status).toBe(400);
  expect((await GET(new NextRequest('https://alo.test/api/weekly-updates?status=all&targetType=course'))).status).toBe(200);
  expect(m.legacyList).toHaveBeenCalledWith(expect.objectContaining({ where: { entityType: 'course' }, take: 50 }));
  m.findMany.mockRejectedValue(new Error('offline')); expect((await GET(new NextRequest('https://alo.test/api/weekly-updates'))).status).toBe(500);
});
