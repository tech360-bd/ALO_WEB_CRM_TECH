import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (category) where.category = category;
    if (status) where.status = status;

    const documents = await db.studentDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
