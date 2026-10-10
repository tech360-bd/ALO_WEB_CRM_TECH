import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: { userId: 'partner-user', actorUserId: 'partner-user', userType: 'PARTNER', partnerId: 'partner-1', sessionId: 'current-session', email: 'partner@example.com' },
  authenticateRequest: vi.fn(),
  bcryptCompare: vi.fn(),
  bcryptHash: vi.fn(),
  db: {
    partnerProfile: { findUnique: vi.fn(), update: vi.fn() },
    portalUser: { findUnique: vi.fn(), update: vi.fn() },
    communicationPreference: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    portalSession: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock('bcryptjs', () => ({ default: { compare: mocks.bcryptCompare, hash: mocks.bcryptHash } }));

import { GET, PUT } from '@/app/api/partner/settings/route';

function request(body?: unknown, origin = 'https://portal.example.test') {
  return new Request('https://portal.example.test/api/partner/settings', {
    method: body === undefined ? 'GET' : 'PUT',
    headers: body === undefined ? {} : { origin, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(mocks.auth, { userId: 'partner-user', actorUserId: 'partner-user', userType: 'PARTNER', partnerId: 'partner-1', sessionId: 'current-session', email: 'partner@example.com' });
  mocks.authenticateRequest.mockResolvedValue(mocks.auth);
  mocks.db.partnerProfile.findUnique.mockResolvedValue({
    userId: 'partner-user', partnerId: 'partner-1', companyName: 'Northbridge Education', contactPerson: 'Partner User',
    businessType: 'Agency', city: 'Dhaka', address: 'Dhaka, Bangladesh', approvalStatus: 'approved',
  });
  mocks.db.portalUser.findUnique.mockResolvedValue({ id: 'partner-user', email: 'partner@example.com', phone: '+8801700000000', passwordHash: 'stored-hash' });
  mocks.db.communicationPreference.findFirst.mockResolvedValue(null);
  mocks.db.partnerProfile.update.mockResolvedValue({ companyName: 'Updated Agency' });
  mocks.db.portalUser.update.mockResolvedValue({ email: 'partner@example.com', phone: '+8801800000000' });
  mocks.db.communicationPreference.create.mockResolvedValue({ ownerType: 'partner', ownerId: 'partner-user', emailAllowed: false });
  mocks.db.communicationPreference.update.mockResolvedValue({ id: 'pref-1', emailAllowed: false });
  mocks.db.portalSession.updateMany.mockResolvedValue({ count: 2 });
  mocks.db.$transaction.mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations));
  mocks.bcryptCompare.mockResolvedValue(true);
  mocks.bcryptHash.mockResolvedValue('new-password-hash');
});

describe('partner settings persistence and verified account boundaries', () => {
  it('loads persisted profile, contact details, and communication preferences', async () => {
    mocks.db.communicationPreference.findFirst.mockResolvedValue({ emailAllowed: false, smsAllowed: true, whatsappAllowed: true, phoneAllowed: false, marketingAllowed: false, transactionalAllowed: true });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: {
      profile: { partnerId: 'partner-1', companyName: 'Northbridge Education', city: 'Dhaka' },
      user: { email: 'partner@example.com', phone: '+8801700000000' },
      preferences: { emailAllowed: false, whatsappAllowed: true, marketingAllowed: false },
    } });
  });

  it('persists account profile and phone in one transaction without changing sign-in email', async () => {
    const response = await PUT(request({ section: 'account', data: {
      companyName: 'Updated Agency', contactPerson: 'New Contact', address: 'Updated address',
      email: 'PARTNER@example.com', phone: '+8801800000000',
    } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(mocks.db.partnerProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'partner-user' }, data: expect.objectContaining({ companyName: 'Updated Agency', contactPerson: 'New Contact', address: 'Updated address' }),
    }));
    expect(mocks.db.portalUser.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'partner-user' }, data: expect.objectContaining({ phone: '+8801800000000' }) }));
    expect(mocks.db.$transaction).toHaveBeenCalledOnce();
  });

  it('requires email verification before accepting a new sign-in address', async () => {
    const response = await PUT(request({ section: 'account', data: {
      companyName: 'Updated Agency', email: 'attacker@example.com', phone: '+8801800000000',
    } }));
    expect(response.status).toBe(409);
    expect(mocks.db.partnerProfile.update).not.toHaveBeenCalled();
    expect(mocks.db.portalUser.update).not.toHaveBeenCalled();
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it('persists complete boolean communication preferences and rejects malformed preferences', async () => {
    const preferences = { emailAllowed: false, smsAllowed: false, whatsappAllowed: true, phoneAllowed: true, marketingAllowed: false, transactionalAllowed: true };
    const response = await PUT(request({ section: 'notifications', data: preferences }));
    expect(response.status).toBe(200);
    expect(mocks.db.communicationPreference.create).toHaveBeenCalledWith({ data: {
      ownerType: 'partner', ownerId: 'partner-user', ...preferences, consentSource: 'partner_portal_settings',
    } });

    const invalid = await PUT(request({ section: 'notifications', data: { ...preferences, marketingAllowed: 'yes' } }));
    expect(invalid.status).toBe(400);
    expect(mocks.db.communicationPreference.create).toHaveBeenCalledOnce();
  });

  it('checks the current password, hashes the replacement, and revokes other sessions', async () => {
    const response = await PUT(request({ section: 'password', data: { currentPassword: 'Current123', newPassword: 'NewPassword123' } }));
    expect(response.status).toBe(200);
    expect(mocks.bcryptCompare).toHaveBeenCalledWith('Current123', 'stored-hash');
    expect(mocks.bcryptHash).toHaveBeenCalledWith('NewPassword123', 12);
    expect(mocks.db.portalUser.update).toHaveBeenCalledWith({ where: { id: 'partner-user' }, data: { passwordHash: 'new-password-hash', firstLoginRequired: false } });
    expect(mocks.db.portalSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'partner-user', id: { not: 'current-session' }, revokedAt: null }, data: { revokedAt: expect.any(Date) },
    });
    expect(mocks.db.$transaction).toHaveBeenCalledOnce();
  });

  it('rejects unauthenticated and cross-origin changes before persistence', async () => {
    mocks.authenticateRequest.mockResolvedValueOnce(NextResponse.json({ success: false }, { status: 401 }));
    expect((await PUT(request({ section: 'notifications', data: { emailAllowed: true } }))).status).toBe(401);
    expect((await PUT(request({ section: 'notifications', data: { emailAllowed: true } }, 'https://attacker.example'))).status).toBe(403);
    expect(mocks.db.partnerProfile.update).not.toHaveBeenCalled();
    expect(mocks.db.communicationPreference.create).not.toHaveBeenCalled();
  });
});
