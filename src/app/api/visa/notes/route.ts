import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const body = await req.json();
    const { caseId, studentId, content, visibility, riskFlag } = body;

    const note = await db.visaOfficerNote.create({
      data: {
        caseId: caseId || '',
        studentId: studentId || '',
        officerId: auth.userId,
        officerName: auth.name || 'Visa Officer',
        content: content || '',
        visibility: visibility || 'internal_only',
        riskFlag: riskFlag || 'none',
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
