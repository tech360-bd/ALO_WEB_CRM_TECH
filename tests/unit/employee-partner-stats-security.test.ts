import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), access: vi.fn(), employee: vi.fn(), groups: vi.fn(), count: vi.fn(), transaction: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/access-control/central-security-engine', () => ({ validateRequestAccess: m.access }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({ db: { employee: { findUnique: m.employee }, partnerProfile: { groupBy: m.groups }, partnerLead: { count: m.count }, partnerUserSeatRequest: { count: m.count }, extraQuotaRequest: { count: m.count }, $transaction: m.transaction } }));
import { GET } from '@/app/api/employee/partner-stats/route';
const req = () => new NextRequest('https://alo.test/api/employee/partner-stats?partnerId=foreign');
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', userType: 'EMPLOYEE', roles: ['PARTNER_MANAGER'] }); m.access.mockResolvedValue({ allowed: true, scope: 'ASSIGNED' }); m.employee.mockResolvedValue({ partnerGroups: '["own-company"]' }); m.groups.mockResolvedValue([{ partnerId: 'own-company' }]); m.count.mockResolvedValue(0); m.transaction.mockImplementation(async callback => callback({}));
});
describe('real scoped partner dashboard statistics', () => {
  it('a Partner Manager title does not replace explicit permission', async () => { m.access.mockResolvedValue({ allowed: false }); expect((await GET(req())).status).toBe(403); expect(m.groups).not.toHaveBeenCalled(); });
  it('filters every query by stored partner assignments, ignoring a client partnerId', async () => {
    const response = await GET(req()); expect(response.status).toBe(200);
    for (const [query] of [...m.groups.mock.calls, ...m.count.mock.calls]) expect(query.where.partnerId).toEqual({ in: ['own-company'] });
    expect((await response.json()).stats).toEqual({ totalPartners: 1, pendingPartners: 1, activePartners: 1, partnerLeads: 0, pendingSeatRequests: 0, pendingQuotaRequests: 0 });
    expect(m.audit.mock.calls[0][2]).toBe('PARTNER_REPORT_VIEWED');
  });
  it('unassigned staff get actual empty-scope results rather than global counts', async () => { m.employee.mockResolvedValue({ partnerGroups: '[]' }); m.groups.mockResolvedValue([]); const response = await GET(req()); expect((await response.json()).stats.totalPartners).toBe(0); expect(m.groups.mock.calls[0][0].where).toEqual({ partnerId: { in: [] } }); });
  it.each(['not-json','{}','[42]'])('fails closed on malformed stored assignment %s', async partnerGroups => { m.employee.mockResolvedValue({ partnerGroups }); expect((await GET(req())).status).toBe(403); expect(m.groups).not.toHaveBeenCalled(); });
  it('allows global aggregation only when the central engine resolves GLOBAL', async () => { m.access.mockResolvedValue({ allowed: true, scope: 'GLOBAL' }); expect((await GET(req())).status).toBe(200); expect(m.groups.mock.calls[0][0].where).toEqual({}); });
  it('database failures return unavailable without fictional success metrics', async () => { m.groups.mockRejectedValue(new Error('private database detail')); const response = await GET(req()); expect(response.status).toBe(503); const text = await response.text(); expect(text).not.toContain('private database detail'); expect(text).not.toContain('totalPartners'); });
  it('audit failures prevent report delivery', async () => { m.audit.mockRejectedValue(new Error('audit down')); expect((await GET(req())).status).toBe(503); });
});
