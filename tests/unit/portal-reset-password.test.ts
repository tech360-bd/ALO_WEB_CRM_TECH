import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const { db } = vi.hoisted(() => ({
  db: {
    passwordResetToken: { findUnique: vi.fn(), updateMany: vi.fn() },
    portalUser: { update: vi.fn() },
    portalSession: { updateMany: vi.fn() },
  },
}));
vi.mock('@/lib/db', () => ({ db }));

import { POST as reset } from '@/app/api/portal-auth/reset-password/route';

const request = (body: unknown) =>
  new Request('https://example.com/api', { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  db.portalSession.updateMany.mockResolvedValue({ count: 0 });
});

describe('portal reset-password (token flow)', () => {
  it('rejects a request without a token', async () => {
    const res = await reset(request({ newPassword: 'longenough1' }));
    expect(res.status).toBe(400);
    expect(db.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it('looks the token up by SHA-256 hash, never by raw value', async () => {
    db.passwordResetToken.findUnique.mockResolvedValue(null);
    const res = await reset(request({ token: 'raw-token-value', newPassword: 'longenough1' }));
    expect(res.status).toBe(400);
    const expectedHash = createHash('sha256').update('raw-token-value').digest('hex');
    expect(db.passwordResetToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash: expectedHash } });
  });

  it('rejects an expired token', async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({ id: 't1', userId: 'u1', used: false, expiresAt: new Date(Date.now() - 1000) });
    const res = await reset(request({ token: 'x', newPassword: 'longenough1' }));
    expect(res.status).toBe(400);
    expect(db.portalUser.update).not.toHaveBeenCalled();
  });

  it('rejects a token that was already consumed by a concurrent request', async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({ id: 't1', userId: 'u1', used: false, expiresAt: new Date(Date.now() + 60_000) });
    db.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    const res = await reset(request({ token: 'x', newPassword: 'longenough1' }));
    expect(res.status).toBe(400);
    expect(db.portalUser.update).not.toHaveBeenCalled();
  });

  it('sets the new password once, revokes sessions, and invalidates other tokens', async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({ id: 't1', userId: 'u1', used: false, expiresAt: new Date(Date.now() + 60_000) });
    db.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    db.portalUser.update.mockResolvedValue({});
    const res = await reset(request({ token: 'x', newPassword: 'longenough1' }));
    expect(res.status).toBe(200);
    const call = db.portalUser.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'u1' });
    expect(call.data.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(db.portalSession.updateMany).toHaveBeenCalled();
    expect(db.passwordResetToken.updateMany).toHaveBeenCalledTimes(2);
  });
});
