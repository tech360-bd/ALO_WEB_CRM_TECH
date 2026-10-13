import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-Cron-Secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const expired = await db.otpVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const expiredOtpLogs = await db.otpLog.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => ({ count: 0 }));
    return NextResponse.json({ deletedOtpVerifications: expired.count, deletedOtpLogs: expiredOtpLogs.count, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('OTP cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
