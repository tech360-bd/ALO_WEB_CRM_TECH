import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ db: { $transaction: vi.fn(), lead: { findMany: vi.fn() } }, auth: vi.fn(), rateLimit: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/rate-limiter', () => ({ rateLimitMiddleware: m.rateLimit }));
import { GET, POST } from '@/app/api/leads/route';
let tx: any;
const input = { fullName: 'Synthetic Enquiry', phone: '01700000000', email: 'synthetic@example.test' };
function req(body?: unknown) { return new NextRequest('https://alo.example.test/api/leads', body ? { method: 'POST', body: JSON.stringify(body) } : undefined); }
beforeEach(() => {
  vi.resetAllMocks();
  tx = { lead: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({ id: 'internal-new', leadId: 'public-receipt' }) }, portalAuditLog: { create: vi.fn() } };
  m.db.$transaction.mockImplementation(cb => cb(tx)); m.db.lead.findMany.mockResolvedValue([]);
});
describe('public Lead endpoint security contract', () => {
  it('unauthenticated GET never queries Lead', async () => {
    m.auth.mockResolvedValue(NextResponse.json({ error: 'unauthorized' }, { status: 401 }));
    expect((await GET(req())).status).toBe(401); expect(m.db.lead.findMany).not.toHaveBeenCalled();
  });
  it.each([['user','STUDENT'],['user','PARTNER'],['portal','ADMIN'],['portal','COUNSELOR']])('denies %s %s GET', async (domain, role) => {
    m.auth.mockResolvedValue({ identityDomain: domain, userType: role, userId: 'synthetic' });
    expect((await GET(req())).status).toBe(403); expect(m.db.lead.findMany).not.toHaveBeenCalled();
  });
  it('independently scopes a User counselor to their assigned Lead rows', async () => {
    m.auth.mockResolvedValue({ identityDomain: 'user', userType: 'COUNSELOR', userId: 'counselor-A' });
    expect((await GET(req())).status).toBe(200);
    expect(m.db.lead.findMany.mock.calls[0][0].where).toEqual({ counselorId: 'counselor-A' });
  });
  it('User admin has global read scope, independently of counselor case', async () => {
    m.auth.mockResolvedValue({ identityDomain: 'user', userType: 'ADMIN', userId: 'admin-A' });
    expect((await GET(req())).status).toBe(200); expect(m.db.lead.findMany.mock.calls[0][0].where).toEqual({});
  });
  it.each([{ ...input, counselorId: 'attacker' }, { ...input, status: 'CONVERTED' }, { ...input, studentId: 'victim' }])('rejects public control fields', async body => {
    expect((await POST(req(body))).status).toBe(400); expect(m.db.$transaction).not.toHaveBeenCalled();
  });
  it('rate limited intake never writes', async () => {
    m.rateLimit.mockReturnValue(new Response('', { status: 429 })); expect((await POST(req(input))).status).toBe(429); expect(m.db.$transaction).not.toHaveBeenCalled();
  });
  it('preserves public intake but returns only a new receipt, even for matching contacts', async () => {
    tx.lead.findMany.mockResolvedValue([{ id: 'private-victim-lead' }]);
    const res = await POST(req({ ...input, source: 'WHATSAPP' })); expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ lead: { leadId: 'public-receipt' }, message: 'Enquiry received for staff review.' });
    expect(tx.lead.create.mock.calls[0][0].data).toMatchObject({ phone: '8801700000000', source: 'WEBSITE', status: 'NEW', welcomeSent: false });
    expect(tx.lead.create.mock.calls[0][0].data).not.toHaveProperty('duplicateOfId');
    expect(JSON.parse(tx.portalAuditLog.create.mock.calls[0][0].data.metadata)).toMatchObject({ duplicateReviewRequired: true, externalNotificationSent: false });
  });
  it('audit failure is not hidden behind a success response', async () => {
    tx.portalAuditLog.create.mockRejectedValue(new Error('synthetic audit failure'));
    expect((await POST(req(input))).status).toBe(503);
  });
});
