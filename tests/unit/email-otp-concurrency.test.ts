import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';

const mocks = vi.hoisted(() => ({
  db: {
    otpCode: { findFirst: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/email-service', () => ({ sendEmail: vi.fn() }));

import { consumeEmailOtp } from '@/lib/auth/email-otp';

const email = 'student@example.com';
const secret = 'otp-test-secret-with-at-least-32-characters';
const digest = (code: string) => createHmac('sha256', secret)
  .update(`${email}\nemail_verification\n${code}`)
  .digest('hex');

function challenge(attempts: number, code = '123456') {
  return {
    id: 'otp-id',
    userId: 'user-id',
    email,
    purpose: 'email_verification',
    codeHash: digest(code),
    attempts,
    used: false,
    expiresAt: new Date(Date.now() + 60_000),
  };
}

describe('email OTP concurrent attempt accounting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OTP_PEPPER = secret;
  });

  it('uses a bounded atomic increment for a wrong code', async () => {
    mocks.db.otpCode.findFirst.mockResolvedValue(challenge(2));
    mocks.db.otpCode.updateMany.mockResolvedValue({ count: 1 });

    const consumed = await consumeEmailOtp({ userId: 'user-id', email, code: '000000' });

    expect(consumed).toBe(false);
    expect(mocks.db.otpCode.updateMany).toHaveBeenCalledWith({
      where: { id: 'otp-id', used: false, attempts: { lt: 5 }, expiresAt: expect.objectContaining({ gt: expect.any(Date) }) },
      data: { attempts: { increment: 1 } },
    });
  });

  it('locks the challenge after the fifth failed attempt', async () => {
    mocks.db.otpCode.findFirst.mockResolvedValue(challenge(4));
    mocks.db.otpCode.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    await consumeEmailOtp({ userId: 'user-id', email, code: '000000' });

    expect(mocks.db.otpCode.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({ attempts: { lt: 5 } }),
      data: { attempts: { increment: 1 } },
    }));
    expect(mocks.db.otpCode.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'otp-id', used: false, attempts: { gte: 5 } },
      data: { used: true },
    });
  });

  it('does not overwrite a locked or consumed challenge', async () => {
    mocks.db.otpCode.findFirst.mockResolvedValue(challenge(1));
    mocks.db.otpCode.updateMany.mockResolvedValue({ count: 0 });

    await consumeEmailOtp({ userId: 'user-id', email, code: '000000' });

    expect(mocks.db.otpCode.updateMany).toHaveBeenCalledTimes(1);
    expect(mocks.db.otpCode.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ attempts: { lt: 5 } }),
      data: { attempts: { increment: 1 } },
    }));
  });
});
