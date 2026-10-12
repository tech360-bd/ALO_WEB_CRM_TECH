import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ auth: vi.fn(), conversation: vi.fn(), claim: vi.fn(), link: vi.fn(), lead: vi.fn(), create: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/db', () => ({ db: { uccConversation: { findUnique: m.conversation }, marketingLead: { findUnique: m.lead }, $transaction: m.transaction } }));
import { GET, POST } from '@/app/api/crm/ucc/conversations/[id]/lead/route';
const auth = { identityDomain: 'user', authenticationMethod: 'cookie', userId: 'admin', actorUserId: 'admin', userType: 'ADMIN', roles: ['ADMIN'], permissions: [] };
const ctx = { params: Promise.resolve({ id: 'thread' }) };
const req = (body = { createNew: true }) => new Request('https://alo.test/api/crm/ucc/conversations/thread/lead', { method: 'POST', headers: { origin: 'https://alo.test' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXTAUTH_URL', 'https://alo.test'); m.auth.mockResolvedValue(auth);
  m.conversation.mockResolvedValue({ id: 'thread', leadId: null, updatedAt: new Date('2026-10-10T00:00:00Z'), participantName: 'Contact', channel: 'email' });
  m.claim.mockResolvedValue({ count: 1 }); m.create.mockResolvedValue({ id: 'lead' }); m.lead.mockResolvedValue({ id: 'lead' });
  m.transaction.mockImplementation(fn => fn({ uccConversation: { findUnique: m.conversation, updateMany: m.claim, update: m.link }, marketingLead: { findUnique: m.lead, create: m.create }, portalAuditLog: { create: m.audit } }));
});
it('denies Portal administrators and staff rather than trusting matching untyped assignee IDs', async () => {
  for (const override of [{ identityDomain: 'portal' }, { userType: 'STAFF' }, { userType: 'STUDENT' }]) {
    m.auth.mockResolvedValue({ ...auth, ...override });
    expect((await GET(req(), ctx)).status).toBe(403); expect((await POST(req(), ctx)).status).toBe(403);
  }
  expect(m.conversation).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled();
});
it('blocks cross-origin writes and spoofed ownership or assignment fields', async () => {
  const cross = req(); cross.headers.set('origin', 'https://attacker.test');
  expect((await POST(cross, ctx)).status).toBe(403);
  for (const field of ['createdById', 'counselorId', 'consent']) {
    const request = new Request(req().url, { method: 'POST', headers: { origin: 'https://alo.test' }, body: JSON.stringify({ createNew: true, leadData: { [field]: 'forged' } }) });
    expect((await POST(request, ctx)).status).toBe(400);
  }
  expect(m.transaction).not.toHaveBeenCalled();
});
it('serializes linking and commits new lead + conversation link + namespace audit together', async () => {
  expect((await POST(req(), ctx)).status).toBe(201);
  expect(m.claim).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'thread', updatedAt: new Date('2026-10-10T00:00:00Z') }) }));
  expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ createdById: 'admin', consent: false }) }));
  expect(m.create.mock.calls[0][0].data).not.toHaveProperty('counselorId');
  expect(m.audit).toHaveBeenCalledOnce(); expect(m.link).toHaveBeenCalledOnce();
});
it('does not overwrite an existing link or create a lead when a concurrent claim loses', async () => {
  m.conversation.mockResolvedValueOnce({ id: 'thread', leadId: 'already-linked' });
  expect((await POST(req(), ctx)).status).toBe(409);
  m.claim.mockResolvedValue({ count: 0 }); expect((await POST(req(), ctx)).status).toBe(409);
  expect(m.create).not.toHaveBeenCalled(); expect(m.link).not.toHaveBeenCalled();
});
it('does not report success on audit failure', async () => {
  m.audit.mockRejectedValue(new Error('private driver failure'));
  const res = await POST(req(), ctx); expect(res.status).toBe(503); expect(await res.text()).not.toContain('driver');
});
