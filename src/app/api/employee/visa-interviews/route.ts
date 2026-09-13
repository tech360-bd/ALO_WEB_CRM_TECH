import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const interviews = await db.visaInterview.findMany({
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    }).catch(() => []);

    return NextResponse.json({ success: true, interviews, count: interviews.length, note: 'AI output educational/practice only, no visa guarantee' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
