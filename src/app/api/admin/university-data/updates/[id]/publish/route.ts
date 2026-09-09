import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 2];
    
    const updateReq = await db.universityUpdateRequest.findUnique({ where: { id } });
    if (!updateReq || updateReq.status !== 'approved') {
      return NextResponse.json({ success: false, error: 'Not approved' }, { status: 400 });
    }

    if (updateReq.entityType === 'university' && updateReq.universityId) {
      await db.crmUniversity.update({
        where: { universityId: updateReq.universityId },
        data: { [updateReq.fieldName]: updateReq.newValue }
      });
    } else if (updateReq.entityType === 'course' && updateReq.courseId) {
      await db.crmCourse.update({
        where: { courseId: updateReq.courseId },
        data: { [updateReq.fieldName]: updateReq.newValue }
      });
    }

    const update = await db.universityUpdateRequest.update({
      where: { id },
      data: { status: 'published' }
    });

    await db.crmSourceLog.create({
      data: {
        universityId: updateReq.universityId,
        courseId: updateReq.courseId,
        sourceUrl: updateReq.evidenceUrl,
        verifiedBy: auth.userId,
        verifiedAt: new Date().toISOString(),
        status: 'verified'
      }
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'UNIVERSITY_DATA_PUBLISHED',
        targetCollection: 'UniversityUpdateRequest',
        targetId: update.id,
      }
    });

    return NextResponse.json({ success: true, data: update });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
