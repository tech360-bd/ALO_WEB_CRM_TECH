import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const body = await req.json().catch(() => ({}));
    const { reviewerNote } = body;

    const updated = await db.studentDocument.update({
      where: { id },
      data: {
        status: 'approved',
        reviewerNote: reviewerNote || '',
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
