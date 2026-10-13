import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-Cron-Secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const expired = await db.userSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return NextResponse.json({ deletedSessions: expired.count, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
