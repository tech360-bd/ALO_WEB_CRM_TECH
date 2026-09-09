import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const isStudent = auth.roles.length === 0 || auth.userType === 'student';

    const where: any = { caseId };
    if (isStudent) {
      where.visibility = 'student_safe';
    }

    const notes = await db.visaOfficerNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
