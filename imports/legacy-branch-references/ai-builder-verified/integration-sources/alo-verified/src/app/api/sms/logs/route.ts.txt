import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const partnerId = searchParams.get('partnerId');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (partnerId) where.partnerId = partnerId;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      db.smsLog.findMany({ where, skip, take: limit, orderBy: { sentAt: 'desc' } }),
      db.smsLog.count({ where }),
    ]);
    return NextResponse.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('SMS logs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
