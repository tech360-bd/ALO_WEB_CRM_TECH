import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/auth-middleware';
const m = vi.hoisted(() => ({ count: vi.fn(), findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { marketingLead: { count: m.count, findMany: m.findMany }, $transaction: m.transaction } }));
import { createLead, listLeads, updateLead } from '@/lib/crm/lead-handlers';
import { leadAccess, boundedPage } from '@/lib/crm/lead-access';
const auth = { identityDomain: 'user', authenticationMethod: 'cookie', userId: 'owner', actorUserId: 'actor', userType: 'MARKETING', roles: [], permissions: [] } as unknown as AuthContext;
function req(body: unknown) { return new Request('https://alo.test/api/crm/leads', { method: 'POST', headers: { origin: 'https://alo.test', 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
  m.count.mockResolvedValue(30); m.findMany.mockResolvedValue([]); m.create.mockResolvedValue({ id: 'lead' }); m.updateMany.mockResolvedValue({ count: 1 }); m.findFirst.mockResolvedValue({ id: 'lead' }); m.audit.mockResolvedValue({});
  m.transaction.mockImplementation(fn => fn({ marketingLead: { create: m.create, updateMany: m.updateMany, findFirst: m.findFirst }, portalAuditLog: { create: m.audit } }));
});
describe('CRM lead security and persistence contracts', () => {
  it('denies student/partner, missing namespace and PortalUser ID collisions', () => {
    for (const change of [{ userType: 'STUDENT' }, { userType: 'PARTNER' }, { identityDomain: undefined }, { identityDomain: 'portal' }]) expect(leadAccess({ ...auth, ...change } as AuthContext)).toBeNull();
    expect(leadAccess({ ...auth, identityDomain: 'portal', userType: 'ADMIN' })).toBeNull();
    for (const userType of ['STUDENT', 'PARTNER', 'UNKNOWN']) expect(leadAccess({ ...auth, userType, permissions: ['s8', 's9'] })).toBeNull();
  });
  it('uses effective owner, not impersonating actor, and no counselor ID match', () => {
    expect(leadAccess(auth)?.where).toEqual({ createdById: 'owner' });
  });
  it('bounds malformed pagination', () => { expect(boundedPage('nan', 20, 100)).toBe(20); expect(boundedPage('999', 20, 100)).toBe(100); });
  it('intersects search/tab filters with ownership for records and counts', async () => {
    const res = await listLeads(new Request('https://alo.test/api/crm/leads?search=hello&tab=hot&page=2'), auth);
    expect(res.status).toBe(200); expect(await res.json()).toMatchObject({ total: 30, page: 2, counts: { all: 30 }, capabilities: { delete: false, assign: false } });
    expect(JSON.stringify(m.findMany.mock.calls[0][0].where)).toContain('createdById');
    expect(JSON.stringify(m.findMany.mock.calls[0][0].where)).toContain('notIn');
    expect(m.findMany.mock.calls[0][0].skip).toBe(20);
    for (const [arg] of m.count.mock.calls) expect(JSON.stringify(arg.where)).toContain('owner');
  });
  it('does not mask database failure as an empty success', async () => { m.count.mockRejectedValue(new Error('offline')); expect((await listLeads(new Request('https://alo.test/api/crm/leads'), auth)).status).toBe(500); });
  it('rejects spoofed ownership, consent, assignments and conversion', async () => {
    for (const body of [{ name: 'x', createdById: 'other' }, { name: 'x', consent: 'true' }, { name: 'x', counselorId: 'other' }, { name: 'x', status: 'converted' }, { name: ' ' }]) expect((await createLead(req(body), auth)).status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });
  it('creates with consent false, owner from session, and atomic namespace-aware audit', async () => {
    expect((await createLead(req({ name: 'Test' }), auth)).status).toBe(201);
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ createdById: 'owner', consent: false, status: 'new' }) });
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: 'actor', action: 'LEAD_CREATE' }) });
    m.audit.mockRejectedValue(new Error('audit unavailable'));
    expect((await createLead(req({ name: 'Test' }), auth)).status).toBe(500);
  });
  it('rejects foreign/missing cookie origins and portal writes before transaction', async () => {
    const foreign = new Request('https://alo.test/api/crm/leads', { method: 'POST', headers: { origin: 'https://evil.test' }, body: '{"name":"Test"}' });
    expect((await createLead(foreign, auth)).status).toBe(403);
    expect((await createLead(new Request('https://alo.test/api/crm/leads', { method: 'POST', body: '{"name":"Test"}' }), auth)).status).toBe(403);
    expect((await createLead(req({ name: 'x' }), { ...auth, identityDomain: 'portal', userType: 'ADMIN' })).status).toBe(403);
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it('requires version and rejects assignment/fake conversion', async () => {
    for (const body of [{ id: 'x', status: 'qualified' }, { id: 'x', expectedUpdatedAt: '2026-10-10T00:00:00Z', status: 'converted' }]) expect((await updateLead(req(body), auth)).status).toBe(400);
  });
  it('updates by owner and version, protects terminal stages and returns conflict/missing honestly', async () => {
    const body = { id: 'lead', expectedUpdatedAt: '2026-10-10T00:00:00Z', status: 'qualified' };
    expect((await updateLead(req(body), auth)).status).toBe(200);
    const where = m.updateMany.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain('owner'); expect(JSON.stringify(where)).toContain('updatedAt'); expect(JSON.stringify(where)).not.toContain('converted');
    m.updateMany.mockResolvedValue({ count: 0 });
    expect((await updateLead(req(body), auth)).status).toBe(409);
    m.findFirst.mockResolvedValue(null); expect((await updateLead(req(body), auth)).status).toBe(404);
  });
});
