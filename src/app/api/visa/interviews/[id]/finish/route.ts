import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const body = await req.json();
    const { overallScore, verdict, officerNotes } = body;

    const updated = await db.visaInterview.update({
      where: { id },
      data: {
        overallScore: overallScore || 0,
        verdict: verdict || 'needs_practice',
        officerNotes: officerNotes || '',
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
