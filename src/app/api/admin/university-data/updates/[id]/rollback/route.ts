import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 2];
    
    const updateReq = await db.universityUpdateRequest.findUnique({ where: { id } });
    if (!updateReq || updateReq.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Cannot rollback' }, { status: 400 });
    }

    if (updateReq.entityType === 'university' && updateReq.universityId) {
      await db.crmUniversity.update({
        where: { universityId: updateReq.universityId },
        data: { [updateReq.fieldName]: updateReq.oldValue }
      });
    } else if (updateReq.entityType === 'course' && updateReq.courseId) {
      await db.crmCourse.update({
        where: { courseId: updateReq.courseId },
        data: { [updateReq.fieldName]: updateReq.oldValue }
      });
    }

    await db.universityUpdateRequest.update({
      where: { id },
      data: { status: 'rolled_back' }
    });

    return NextResponse.json({ success: true, data: updateReq });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
