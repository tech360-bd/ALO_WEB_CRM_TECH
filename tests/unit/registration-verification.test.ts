/** Mocked route/assignment contracts; no real account/provider or database. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ db: { $transaction: vi.fn() }, consume: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('@/lib/auth/email-otp', () => ({ consumeEmailOtp: m.consume, issueEmailOtp: vi.fn(), getRequestIp: vi.fn() }));
import { POST as canonicalVerify } from '@/app/api/auth/verify-otp/route';
import { POST as portalVerify } from '@/app/api/portal-auth/verify-otp/route';
let tx: any;
let completed: boolean;
const request = () => new NextRequest('https://alo.example.test/api/verify', { method: 'POST', body: JSON.stringify({ email: 'synthetic@example.test', otp: '123456' }) });
beforeEach(() => {
  vi.resetAllMocks(); completed = false;
  tx = {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user', role: 'STUDENT', status: 'PENDING', emailVerified: false }), updateMany: vi.fn().mockResolvedValue({ count: 1 }), findMany: vi.fn().mockResolvedValue([{ id: 'counselor-user', name: 'Synthetic Counselor', role: 'COUNSELOR' }]) },
    portalUser: { findUnique: vi.fn().mockResolvedValue({ id: 'portal', userType: 'STUDENT', status: 'pending_verification', emailVerified: false }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    student: { findFirst: vi.fn().mockResolvedValue({ id: 'student', studentId: 'AE-2026000001', leadId: 'lead' }), update: vi.fn(), updateMany: vi.fn() },
    portalStudentProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'profile', studentId: 'AE-2026000001' }), update: vi.fn() },
    lead: { findMany: vi.fn().mockResolvedValue([{ id: 'lead' }]), findUnique: vi.fn().mockResolvedValue({ id: 'lead', status: 'NEW', studentId: 'AE-2026000001', source: 'USER_STUDENT_REGISTRATION' }), updateMany: vi.fn().mockResolvedValue({ count: 1 }), count: vi.fn().mockResolvedValue(0), update: vi.fn() },
    timelineEvent: { create: vi.fn() }, portalAuditLog: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([{ entityId: 'lead', metadata: JSON.stringify({ identityDomain: 'portal', studentId: 'AE-2026000001' }) }]) },
  };
  m.consume.mockResolvedValue(true);
  m.db.$transaction.mockImplementation(async cb => { const result = await cb(tx); completed = true; return result; });
});
for (const [domain, verify, model, active, pending] of [
  ['user', canonicalVerify, 'user', 'ACTIVE', 'PENDING'], ['portal', portalVerify, 'portalUser', 'active', 'pending_verification'],
] as const) describe(`${domain} verification`, () => {
  beforeEach(() => { if (domain === 'portal') tx.lead.findUnique.mockResolvedValue({ id: 'lead', status: 'NEW', studentId: 'AE-2026000001', source: 'PORTAL_STUDENT_REGISTRATION' }); });
  it('consumes OTP with transaction client and assigns a NEW registration only after activation claim', async () => {
    const res = await verify(request()); expect(res.status).toBe(200); expect(await res.json()).toMatchObject({ userStatus: active });
    expect(m.consume).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'email_verification' }), tx);
    expect(tx[model].updateMany).toHaveBeenCalledWith({ where: { id: domain, emailVerified: false, status: pending }, data: { emailVerified: true, status: active } });
    expect(tx.lead.updateMany).toHaveBeenCalledWith({ where: { id: 'lead', counselorId: null, status: 'NEW' }, data: expect.objectContaining({ counselorId: 'counselor-user', status: 'NEW' }) });
    expect(tx.user.findMany.mock.calls[0][0].where.emailVerified).toBe(true);
    expect(tx.portalStudentProfile.update).not.toHaveBeenCalled(); expect(completed).toBe(true);
  });
  it('invalid code returns normally so failed-attempt counters can commit, with no assignment', async () => {
    m.consume.mockResolvedValue(false); expect((await verify(request())).status).toBe(400);
    expect(tx[model].updateMany).not.toHaveBeenCalled(); expect(tx.lead.updateMany).not.toHaveBeenCalled(); expect(completed).toBe(true);
  });
  it('throws to roll back OTP/activation when assignment timeline write fails', async () => {
    tx.timelineEvent.create.mockRejectedValue(new Error('synthetic timeline failure'));
    expect((await verify(request())).status).toBe(500); expect(completed).toBe(false);
  });
  it('concurrent state claim failure rolls back and never assigns', async () => {
    tx[model].updateMany.mockResolvedValue({ count: 0 }); expect((await verify(request())).status).toBe(500);
    expect(tx.lead.updateMany).not.toHaveBeenCalled(); expect(completed).toBe(false);
  });
  it('does not reactivate a suspended account', async () => {
    tx[model].findUnique.mockResolvedValue({ id: domain, role: 'STUDENT', userType: 'STUDENT', status: 'SUSPENDED', emailVerified: false });
    expect((await verify(request())).status).toBe(400); expect(m.consume).not.toHaveBeenCalled();
  });
  it('records missing legacy lead for review without inferring contact ownership', async () => {
    tx.lead.findUnique.mockResolvedValue(null); expect((await verify(request())).status).toBe(200);
    expect(tx.lead.updateMany).not.toHaveBeenCalled();
    expect(tx.portalAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'REGISTRATION_ASSIGNMENT_REVIEW_REQUIRED' }) });
  });
  it('no available counselor is explicitly unassigned, not fake assignment', async () => {
    tx.user.findMany.mockResolvedValue([]); expect((await verify(request())).status).toBe(200);
    expect(tx.lead.updateMany).not.toHaveBeenCalled(); expect(tx.portalAuditLog.create.mock.calls[0][0].data.metadata).toContain('No active counselors available');
  });
  it('does not overwrite a concurrently assigned lead', async () => {
    tx.lead.updateMany.mockResolvedValue({ count: 0 }); expect((await verify(request())).status).toBe(500); expect(completed).toBe(false);
  });
  it('partner verification does not approve access or assign student leads', async () => {
    tx[model].findUnique.mockResolvedValue({ id: domain, role: 'PARTNER', userType: 'PARTNER', status: domain === 'user' ? 'PENDING' : 'pending', emailVerified: false });
    const res = await verify(request()); expect(res.status).toBe(200); expect(await res.json()).toMatchObject({ approvalRequired: true }); expect(tx.lead.findMany).not.toHaveBeenCalled();
  });
});
