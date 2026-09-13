import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const reports = await db.weeklyReport.findMany({
      where: { employeeId: auth.userId },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
