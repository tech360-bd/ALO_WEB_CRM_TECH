import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => {
  const auth = {
    userId: 'partner-user',
    actorUserId: 'partner-user',
    actorEmail: 'current@example.com',
    actorName: 'Partner User',
    email: 'current@example.com',
    name: 'Partner User',
    userType: 'PARTNER',
    partnerId: 'partner-1',
    partnerRole: 'PARTNER_SUPER_ADMIN',
    roles: [],
    permissions: [],
    sessionId: 'current-session',
  };
  return {
    auth,
    requirePartnerContext: vi.fn(),
    db: {
      portalUser: { findUnique: vi.fn() },
      $transaction: vi.fn(),
    },
    issueEmailOtp: vi.fn(),
    consumeEmailOtp: vi.fn(),
    getRequestIp: vi.fn(() => '203.0.113.10'),
    tx: {
      portalUser: { update: vi.fn() },
      portalSession: { updateMany: vi.fn() },
      portalAuditLog: { create: vi.fn() },
    },
  };
});

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/partner-tenant-guard', () => ({ requirePartnerContext: mocks.requirePartnerContext }));
vi.mock('@/lib/auth/email-otp', () => ({
  issueEmailOtp: mocks.issueEmailOtp,
  consumeEmailOtp: mocks.consumeEmailOtp,
  getRequestIp: mocks.getRequestIp,
}));

import { PATCH, POST } from '@/app/api/partner/settings/email/route';

function request(method: 'POST' | 'PATCH', body: unknown, origin = 'https://portal.example.test') {
  return new Request('https://portal.example.test/api/partner/settings/email', {
    method,
    headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(mocks.auth, {
    userId: 'partner-user', actorUserId: 'partner-user', partnerId: 'partner-1',
    partnerRole: 'PARTNER_SUPER_ADMIN', userType: 'PARTNER', sessionId: 'current-session',
  });
  mocks.requirePartnerContext.mockResolvedValue(mocks.auth);
  mocks.db.portalUser.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) =>
    Promise.resolve(where.id
      ? { id: 'partner-user', email: 'current@example.com' }
      : null),
  );
  mocks.issueEmailOtp.mockResolvedValue({ ok: true, expiresAt: new Date('2026-10-10T01:00:00.000Z') });
  mocks.consumeEmailOtp.mockResolvedValue(true);
  mocks.tx.portalUser.update.mockResolvedValue({ id: 'partner-user', email: 'next@example.com', phone: '+8801700000000' });
  mocks.tx.portalSession.updateMany.mockResolvedValue({ count: 2 });
  mocks.tx.portalAuditLog.create.mockResolvedValue({ id: 'audit-1' });
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => Promise<unknown>) => callback(mocks.tx));
});

describe('partner verified email change', () => {
  it('requires a partner session and refuses impersonated/cross-origin requests', async () => {
    mocks.requirePartnerContext.mockResolvedValueOnce(NextResponse.json({ error: 'Partner required' }, { status: 403 }));
    expect((await POST(request('POST', { email: 'next@example.com' }))).status).toBe(403);

    mocks.requirePartnerContext.mockResolvedValueOnce({ ...mocks.auth, actorUserId: 'alo-admin' });
    expect((await POST(request('POST', { email: 'next@example.com' }))).status).toBe(403);

    expect((await PATCH(request('PATCH', { email: 'next@example.com', otp: '123456' }, 'https://attacker.example'))).status).toBe(403);
    expect(mocks.issueEmailOtp).not.toHaveBeenCalled();
    expect(mocks.consumeEmailOtp).not.toHaveBeenCalled();
  });

  it('issues an OTP only for a valid, unused new address', async () => {
    const response = await POST(request('POST', { email: '  NEXT@example.com  ' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(mocks.issueEmailOtp).toHaveBeenCalledWith({
      userId: 'partner-user', email: 'next@example.com', purpose: 'email_change', ipAddress: '203.0.113.10',
    });

    mocks.db.portalUser.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) =>
      Promise.resolve(where.id ? { id: 'partner-user', email: 'current@example.com' } : { id: 'other-user' }),
    );
    expect((await POST(request('POST', { email: 'taken@example.com' }))).status).toBe(409);
  });

  it('atomically updates the verified email, revokes other sessions, and omits email values from audit metadata', async () => {
    const response = await PATCH(request('PATCH', { email: 'next@example.com', otp: '123456' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: { user: { email: 'next@example.com' } } });
    expect(mocks.consumeEmailOtp).toHaveBeenCalledWith({ userId: 'partner-user', email: 'next@example.com', code: '123456', purpose: 'email_change' });
    expect(mocks.tx.portalUser.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'partner-user' }, data: { email: 'next@example.com', emailVerified: true, updatedAt: expect.any(Date) },
    }));
    expect(mocks.tx.portalSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'partner-user', id: { not: 'current-session' }, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    const audit = mocks.tx.portalAuditLog.create.mock.calls[0][0].data;
    expect(audit.metadata).not.toContain('current@example.com');
    expect(audit.metadata).not.toContain('next@example.com');
    expect(JSON.parse(audit.metadata)).toEqual({ previousEmailChanged: true, newEmailVerifiedWithOtp: true });
    expect(audit.action).toBe('PARTNER_EMAIL_CHANGED');
  });

  it('does not update an account when the OTP is invalid or expired', async () => {
    mocks.consumeEmailOtp.mockResolvedValue(false);
    const response = await PATCH(request('PATCH', { email: 'next@example.com', otp: '123456' }));
    expect(response.status).toBe(400);
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
});
