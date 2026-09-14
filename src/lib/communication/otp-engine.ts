/**
 * OTP Engine — Before showing private student data, send OTP, verify, log, block after retries
 */
import { db } from '@/lib/db';
import crypto from 'crypto';

const OTP_EXPIRY_MIN = 10;
const MAX_ATTEMPTS = 5;
const BLOCK_MIN = 30;

export async function generateOtp(params: { ownerType: string; ownerId: string; phone: string; purpose?: string }) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

  // Rate limit: check recent OTPs for same phone
  const recent = await db.otpLog.findMany({
    where: { phone: params.phone, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  }).catch(()=>[]) as any[];
  if (recent && recent.length >= 5) {
    throw new Error('Too many OTP requests. Please try after 60 minutes.');
  }

  await db.otpLog.create({
    data: {
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      phone: params.phone,
      otpHash,
      purpose: params.purpose || 'verification',
      status: 'pending',
      attemptCount: 0,
      expiresAt,
    }
  });

  // In production, integrate SMS gateway here (placeholder if not configured)
  // Placeholder: log OTP for dev (in prod, never log raw OTP)
  console.log(`[OTP] ${params.phone} -> ${otp} (expires ${expiresAt.toISOString()})`);

  // Also create OtpCode for portal auth compatibility
  try {
    await db.otpCode.create({
      data: {
        identifier: params.phone,
        code: otpHash,
        purpose: params.purpose || 'verification',
        expiresAt,
      }
    });
  } catch {}

  return { otpHash, expiresAt, otpForDevOnly: process.env.NODE_ENV !== 'production' ? otp : undefined };
}

export async function verifyOtp(params: { phone: string; otp: string; purpose?: string }) {
  const otpHash = crypto.createHash('sha256').update(params.otp).digest('hex');
  const log = await db.otpLog.findFirst({
    where: { phone: params.phone, otpHash, status: 'pending', expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
  }).catch(()=>null) as any;

  if (!log) {
    // Increment attempt count for latest pending OTP for this phone
    const latest = await db.otpLog.findFirst({
      where: { phone: params.phone, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    }).catch(()=>null) as any;
    if (latest) {
      await db.otpLog.update({
        where: { id: latest.id },
        data: { attemptCount: { increment: 1 } }
      }).catch(()=>{});
      if ((latest.attemptCount || 0) + 1 >= MAX_ATTEMPTS) {
        await db.otpLog.update({ where: { id: latest.id }, data: { status: 'blocked' } }).catch(()=>{});
        throw new Error(`OTP blocked after ${MAX_ATTEMPTS} failed attempts. Try after ${BLOCK_MIN} minutes.`);
      }
    }
    throw new Error('Invalid or expired OTP');
  }

  await db.otpLog.update({
    where: { id: log.id },
    data: { status: 'verified', verifiedAt: new Date() }
  }).catch(()=>{});

  try {
    await db.crmAuditLog.create({
      data: {
        actorUserId: log.ownerId || 'system',
        actorRole: log.ownerType || 'student',
        action: 'OTP_VERIFIED',
        targetCollection: 'OtpLog',
        targetId: log.id,
        afterData: JSON.stringify({ phone: params.phone, purpose: params.purpose || 'verification' }),
      }
    });
  } catch {}

  return { success: true, ownerId: log.ownerId, ownerType: log.ownerType };
}

// Check if phone is blocked due to too many failures
export async function isPhoneBlocked(phone: string): Promise<boolean> {
  const blocked = await db.otpLog.findFirst({
    where: { phone, status: 'blocked', createdAt: { gte: new Date(Date.now() - BLOCK_MIN * 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
  }).catch(()=>null);
  return !!blocked;
}
