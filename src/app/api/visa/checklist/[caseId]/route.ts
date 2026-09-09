import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const items = await db.visaChecklistItem.findMany({
      where: { studentId: visaCase.studentId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
