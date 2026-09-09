import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const body = await req.json();
    const { item, category, isRequired } = body;

    const created = await db.visaChecklistItem.create({
      data: {
        studentId: visaCase.studentId,
        applicationId: visaCase.applicationId || '',
        item: item || '',
        category: category || 'general',
        isRequired: isRequired !== undefined ? isRequired : true,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
