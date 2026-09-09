import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const body = await req.json();
    const { reportType, filters } = body;

    const report = await db.visaReport.create({
      data: {
        reportType: reportType || 'daily_interview',
        generatedBy: auth.name || 'Visa Officer',
        filters: typeof filters === 'string' ? filters : JSON.stringify(filters || {}),
        status: 'ready',
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
