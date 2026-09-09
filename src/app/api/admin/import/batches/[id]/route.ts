import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: Request, context: any) => {
  try {
    const params = await context.params;
    const { id } = params;

    const batch = await db.importBatch.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, batch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
