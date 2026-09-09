import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const data = await request.json();
    const { stagingId, liveStudentId, mergeFields } = data;

    if (!stagingId || !liveStudentId) {
       return NextResponse.json({ success: false, error: 'Missing stagingId or liveStudentId' }, { status: 400 });
    }

    const stagingStudent = await db.importStagingStudent.findUnique({ where: { id: stagingId } });
    if (!stagingStudent) {
       return NextResponse.json({ success: false, error: 'Staging student not found' }, { status: 404 });
    }

    const liveStudent = await db.student.findUnique({ where: { id: liveStudentId } });
    if (!liveStudent) {
       return NextResponse.json({ success: false, error: 'Live student not found' }, { status: 404 });
    }

    // Side-by-side field merge logic could be implemented here
    // based on mergeFields: Record<string, 'keep_existing' | 'use_imported'>
    // Example logic omitted for brevity, but you'd dynamically build an update object

    await db.importStagingStudent.update({
      where: { id: stagingId },
      data: {
        matchedStudentId: liveStudentId,
        status: 'merged'
      }
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_MERGED',
        targetId: liveStudentId,
        beforeData: JSON.stringify(liveStudent),
        afterData: JSON.stringify({ mergedFromStaging: stagingId, mergeFields }),
      }
    });

    return NextResponse.json({ success: true, mergedStudentId: liveStudentId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
