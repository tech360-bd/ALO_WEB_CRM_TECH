import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { sendEmail } from '@/lib/email-service';

const OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL_PER_HOUR = 3;
const MAX_PER_IP_PER_HOUR = 10;
const MAX_VERIFY_ATTEMPTS = 5;

export type OtpPurpose = 'email_verification' | 'account_activation' | 'email_change';

function otpPepper(): string {
  const pepper = process.env.OTP_PEPPER || process.env.NEXTAUTH_SECRET;
  if (!pepper || pepper.length < 32) {
    throw new Error('OTP_PEPPER or NEXTAUTH_SECRET must contain at least 32 characters');
  }
  return pepper;
}

function otpDigest(email: string, purpose: OtpPurpose, code: string): string {
  return createHmac('sha256', otpPepper())
    .update(`${email}\n${purpose}\n${code}`)
    .digest('hex');
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 191) || 'unknown';
  return (request.headers.get('x-real-ip') || 'unknown').slice(0, 191);
}

export async function issueEmailOtp(input: {
  userId: string;
  email: string;
  purpose?: OtpPurpose;
  ipAddress?: string;
}): Promise<{ ok: true; expiresAt: Date } | { ok: false; reason: 'rate_limited' | 'delivery_failed' }> {
  const email = input.email.trim().toLowerCase();
  const purpose = input.purpose || 'email_verification';
  const ipAddress = (input.ipAddress || 'unknown').slice(0, 191);
  const cutoff = new Date(Date.now() - EMAIL_WINDOW_MS);

  const [emailCount, ipCount] = await Promise.all([
    db.otpCode.count({ where: { email, purpose, createdAt: { gte: cutoff } } }),
    ipAddress === 'unknown' ? Promise.resolve(0) : db.otpCode.count({ where: { ipAddress, createdAt: { gte: cutoff } } }),
  ]);
  if (emailCount >= MAX_PER_EMAIL_PER_HOUR || ipCount >= MAX_PER_IP_PER_HOUR) {
    return { ok: false, reason: 'rate_limited' };
  }

  // Retire prior challenges before issuing another. A failed delivery is also
  // retired, so an undelivered code can never be used.
  await db.otpCode.updateMany({ where: { email, purpose, used: false }, data: { used: true } });
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const record = await db.otpCode.create({
    data: {
      userId: input.userId,
      email,
      ipAddress,
      code: '',
      codeHash: otpDigest(email, purpose, code),
      purpose,
      type: purpose,
      expiresAt,
      used: false,
      attempts: 0,
    },
  });

  const delivery = await sendEmail({
    to: email,
    subject: 'Verify your ALO Education email address',
    text: `Your ALO Education verification code is ${code}. It expires in 10 minutes and can be used once. If you did not request this, ignore this email.`,
    html: `<p>Your ALO Education verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes and can be used once. If you did not request this, ignore this email.</p>`,
  });

  if (!delivery.success) {
    await db.otpCode.update({ where: { id: record.id }, data: { used: true } });
    return { ok: false, reason: 'delivery_failed' };
  }
  return { ok: true, expiresAt };
}

export async function consumeEmailOtp(input: {
  userId: string;
  email: string;
  code: string;
  purpose?: OtpPurpose;
}, client: Pick<Prisma.TransactionClient, 'otpCode'> = db): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  const purpose = input.purpose || 'email_verification';
  if (!/^\d{6}$/.test(input.code)) return false;
  const now = new Date();
  const record = await client.otpCode.findFirst({
    where: {
      userId: input.userId,
      email,
      purpose,
      used: false,
      attempts: { lt: MAX_VERIFY_ATTEMPTS },
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return false;

  const actual = Buffer.from(record.codeHash || '', 'hex');
  const expected = Buffer.from(otpDigest(email, purpose, input.code), 'hex');
  const matches = actual.length === expected.length && timingSafeEqual(actual, expected);
  if (!matches) {
    // Bounded atomic increment counts concurrent wrong guesses against the
    // current row, rather than discarding those with a stale snapshot.
    const incremented = await client.otpCode.updateMany({
      where: { id: record.id, used: false, attempts: { lt: MAX_VERIFY_ATTEMPTS }, expiresAt: { gt: now } },
      data: { attempts: { increment: 1 } },
    });
    if (incremented.count === 1) {
      await client.otpCode.updateMany({
        where: { id: record.id, used: false, attempts: { gte: MAX_VERIFY_ATTEMPTS } },
        data: { used: true },
      });
    }
    return false;
  }

  // Conditional update makes a challenge single-use even when two verification
  // requests race. Legacy plaintext OTPs are not accepted.
  const consumed = await client.otpCode.updateMany({
    where: { id: record.id, used: false, attempts: { lt: MAX_VERIFY_ATTEMPTS }, expiresAt: { gt: now } },
    data: { used: true, verifiedAt: now },
  });
  return consumed.count === 1;
}
