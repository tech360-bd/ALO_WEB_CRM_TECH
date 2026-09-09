import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const report = await db.visaReadinessReport.findFirst({
      where: { visaCaseId: caseId },
      orderBy: { generatedAt: 'desc' },
    });

    if (!report) {
      return NextResponse.json({ success: false, error: 'Readiness report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
