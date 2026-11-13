import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { db, getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  db: {
    employee: { findFirst: vi.fn() }, user: { findUnique: vi.fn() }, aloPayment: { aggregate: vi.fn() },
    portalStudentApplication: { count: vi.fn() }, marketingLead: { count: vi.fn() },
    portalStudentProfile: { count: vi.fn() }, portalUser: { findMany: vi.fn() }, visaCase: { findMany: vi.fn() },
  },
}));
vi.mock('@/lib/db', () => ({ db }));
vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
import { GET } from '@/app/api/crm/ceo/dashboard/route';
const request = () => new NextRequest('https://example.com/api/crm/ceo/dashboard');
beforeEach(() => {
  vi.resetAllMocks(); getServerSession.mockResolvedValue({ user: { identityDomain: 'user', id: 'unit-ceo' } });
  db.user.findUnique.mockResolvedValue({ id: 'unit-ceo', role: 'CEO', status: 'ACTIVE', emailVerified: true, permissions: '[]' });
  db.aloPayment.aggregate.mockResolvedValue({ _sum: { amount: null } });
  db.portalStudentApplication.count.mockResolvedValue(0); db.marketingLead.count.mockResolvedValue(0);
  db.portalStudentProfile.count.mockResolvedValue(0); db.portalUser.findMany.mockResolvedValue([]); db.visaCase.findMany.mockResolvedValue([]);
});
describe('CEO dashboard actual aggregate vs unavailable metric contract', () => {
  it('never replaces zero/missing data with invented revenue, conversion, growth or ROI', async () => {
    const res = await GET(request()); expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.kpis).toHaveLength(3);
    expect(data.kpis.map(k => k.value)).toEqual(['0','0','0']);
    expect(data.kpis.every(k => k.change === null && k.up === null)).toBe(true);
    expect(data.marketingRoi).toEqual([]); expect(data.topCounselors).toEqual([]);
    expect(data.unavailableMetrics).toContain('Revenue and settlement reconciliation');
    expect(db.aloPayment.aggregate).not.toHaveBeenCalled();
  });
  it('uses actual counts without relabeling total records as enrolled/active/conversion', async () => {
    db.portalStudentApplication.count.mockResolvedValue(7); db.marketingLead.count.mockResolvedValue(11); db.portalStudentProfile.count.mockResolvedValue(5);
    const { data } = await (await GET(request())).json();
    expect(data.kpis.map(k => [k.label, k.value])).toEqual([['Application records','7'],['Lead records','11'],['Student profiles','5']]);
  });
  it.each(['STUDENT','PARTNER','COUNSELOR','EMPLOYEE','FINANCE'])('denies unrelated executive access to %s', async role => {
    db.user.findUnique.mockResolvedValue({ id: 'other', role, status: 'ACTIVE', permissions: '[]' });
    expect((await GET(request())).status).toBe(403); expect(db.visaCase.findMany).not.toHaveBeenCalled();
  });
  it('propagates high-risk query failure rather than claiming no risk cases', async () => {
    db.visaCase.findMany.mockRejectedValue(new Error('private-data'));
    const res = await GET(request()); expect(res.status).toBe(500); expect(await res.text()).not.toContain('private-data');
  });
});
