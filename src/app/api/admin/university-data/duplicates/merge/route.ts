import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const body = await request.json();
    const { masterId, duplicateId, type } = body;

    if (type === 'university') {
      await db.crmCourse.updateMany({
        where: { universityId: duplicateId },
        data: { universityId: masterId }
      });
      await db.crmUniversity.update({
        where: { universityId: duplicateId },
        data: { status: 'ARCHIVED' }
      });
    } else if (type === 'course') {
      await db.crmCourse.update({
        where: { courseId: duplicateId },
        data: { status: 'ARCHIVED' }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
