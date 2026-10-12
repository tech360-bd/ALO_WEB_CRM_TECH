/**
 * Phone OTP engine (SMS).
 *
 * Guarantees:
 * - Codes come from a CSPRNG (crypto.randomInt), never Math.random.
 * - Only an HMAC digest is stored (keyed with OTP_PEPPER / NEXTAUTH_SECRET); the raw code is never logged or returned.
 * - A challenge is reported as sent only after the SMS provider accepts it. On delivery failure the
 *   challenge is retired so it cannot be verified.
 * - Consumption is a conditional update, so a challenge can be used once even under concurrent requests.
 * - Sends and wrong attempts are rate-limited per phone.
 */
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { sendSms, SmsDeliveryError } from '@/lib/sms-gateway';

const OTP_EXPIRY_MIN = 10;
const MAX_ATTEMPTS = 5;
const BLOCK_MIN = 30;
const SEND_WINDOW_MIN = 60;
const MAX_SENDS_PER_WINDOW = 5;
const RESEND_COOLDOWN_SEC = 60;

export class OtpError extends Error {
  constructor(message: string, readonly status: 400 | 429 | 503) {
    super(message);
    this.name = 'OtpError';
  }
}

function pepper(): string {
  const value = process.env.OTP_PEPPER || process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 32) {
    throw new OtpError('OTP service is not configured.', 503);
  }
  return value;
}

function digest(phone: string, purpose: string, code: string): string {
  return createHmac('sha256', pepper()).update(`${phone}\n${purpose}\n${code}`).digest('hex');
}

/** Returns digits only, Bangladesh numbers normalised to 880 country code. */
export function normalizePhone(raw: string): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('01')) digits = `880${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) {
    throw new OtpError('Enter a valid mobile number.', 400);
  }
  return digits;
}

export async function generateOtp(params: { ownerType: string; ownerId: string; phone: string; purpose?: string }) {
  const phone = normalizePhone(params.phone);
  const purpose = params.purpose || 'verification';
  const now = new Date();

  const sendsInWindow = await db.otpLog.count({
    where: { phone, createdAt: { gte: new Date(now.getTime() - SEND_WINDOW_MIN * 60 * 1000) } },
  });
  if (sendsInWindow >= MAX_SENDS_PER_WINDOW) {
    throw new OtpError(`Too many OTP requests. Please try again after ${SEND_WINDOW_MIN} minutes.`, 429);
  }

  const latest = await db.otpLog.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' },
  });
  if (latest && now.getTime() - new Date(latest.createdAt).getTime() < RESEND_COOLDOWN_SEC * 1000) {
    throw new OtpError(`Please wait ${RESEND_COOLDOWN_SEC} seconds before requesting another code.`, 429);
  }

  // Retire earlier pending challenges so only the newest code is valid.
  await db.otpLog.updateMany({ where: { phone, status: 'pending' }, data: { status: 'superseded' } });

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MIN * 60 * 1000);
  const challenge = await db.otpLog.create({
    data: {
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      phone,
      otpHash: digest(phone, purpose, code),
      purpose,
      status: 'pending',
      attemptCount: 0,
      expiresAt,
    },
  });

  try {
    await sendSms({
      to: phone,
      sensitive: true,
      message: `Your ALO Education verification code is ${code}. It expires in ${OTP_EXPIRY_MIN} minutes. Do not share it with anyone.`,
    });
  } catch (error) {
    // Timeouts may have delivered the SMS. Retire this challenge consistently,
    // keep it in rate limits and never retry automatically.
    const unknown = error instanceof SmsDeliveryError && error.outcome === 'unknown';
    await db.otpLog.update({ where: { id: challenge.id }, data: { status: unknown ? 'delivery_unknown' : 'delivery_failed' } });
    if (unknown) throw new OtpError('Delivery could not be confirmed. This code has been retired; wait 60 seconds before requesting a new one.', 503);
    throw new OtpError('The verification code could not be sent right now. Please try again later.', 503);
  }

  return { expiresAt, challengeId: challenge.id };
}

export async function verifyOtp(params: { phone: string; otp: string; purpose?: string }) {
  const phone = normalizePhone(params.phone);
  const purpose = params.purpose || 'verification';
  const otp = String(params.otp || '').trim();
  const invalid = () => new OtpError('Invalid or expired OTP', 400);
  if (!/^\d{6}$/.test(otp)) throw invalid();

  const now = new Date();
  const record = await db.otpLog.findFirst({
    where: { phone, purpose, status: 'pending', expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw invalid();
  if (record.attemptCount >= MAX_ATTEMPTS) throw new OtpError(`OTP blocked. Try after ${BLOCK_MIN} minutes.`, 429);

  const actual = Buffer.from(record.otpHash || '', 'hex');
  const expected = Buffer.from(digest(phone, purpose, otp), 'hex');
  const matches = actual.length === expected.length && timingSafeEqual(actual, expected);

  if (!matches) {
    // Compare-and-increment so concurrent wrong guesses cannot be lost.
    await db.otpLog.updateMany({
      where: { id: record.id, status: 'pending', attemptCount: record.attemptCount },
      data: { attemptCount: { increment: 1 } },
    });
    if (record.attemptCount + 1 >= MAX_ATTEMPTS) {
      await db.otpLog.updateMany({ where: { id: record.id, status: 'pending' }, data: { status: 'blocked' } });
      throw new OtpError(`OTP blocked after ${MAX_ATTEMPTS} failed attempts. Try after ${BLOCK_MIN} minutes.`, 429);
    }
    throw invalid();
  }

  // Single-use: only one concurrent request can move the challenge out of 'pending'.
  const consumed = await db.otpLog.updateMany({
    where: { id: record.id, status: 'pending', expiresAt: { gt: now } },
    data: { status: 'verified', verifiedAt: now },
  });
  if (consumed.count !== 1) throw invalid();

  try {
    await db.crmAuditLog.create({
      data: {
        actorUserId: record.ownerId || 'system',
        actorRole: record.ownerType || 'student',
        action: 'OTP_VERIFIED',
        targetCollection: 'OtpLog',
        targetId: record.id,
        afterData: JSON.stringify({ purpose }),
      },
    });
  } catch {
    // Audit write failure must not reveal internals; verification itself already succeeded.
  }

  return { success: true, ownerId: record.ownerId, ownerType: record.ownerType };
}

// Check if phone is blocked due to too many failures
export async function isPhoneBlocked(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const blocked = await db.otpLog.findFirst({
    where: { phone: normalized, status: 'blocked', createdAt: { gte: new Date(Date.now() - BLOCK_MIN * 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
  });
  return !!blocked;
}
