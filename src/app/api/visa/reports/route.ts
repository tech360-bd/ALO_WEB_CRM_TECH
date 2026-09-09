import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const reports = await db.visaReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
