import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').slice(-2, -1)[0];
    
    if (!auth.roles.includes('super_admin')) {
       return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const batch = await db.importBatch.findUnique({
      where: { id },
      include: { students: true }
    });
    
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    // Identify students imported from this batch via StudentEvent
    const events = await db.studentEvent.findMany({
      where: {
        eventType: 'STUDENT_IMPORTED_FROM_OLD_CRM',
        eventData: { contains: id }, // Assuming simple JSON string search
      }
    });

    const studentIds = events.map(e => e.studentId);

    if (studentIds.length > 0) {
      // Revert profiles
      await db.portalStudentProfile.deleteMany({
        where: { studentId: { in: studentIds } }
      });
      
      // Delete events
      await db.studentEvent.deleteMany({
         where: { studentId: { in: studentIds } }
      });

      // Revert students
      await db.student.deleteMany({
        where: { id: { in: studentIds } }
      });
    }

    await db.importBatch.update({
      where: { id },
      data: { status: 'rolled_back' },
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_IMPORT_ROLLED_BACK',
        batchId: id,
        afterData: JSON.stringify({ rolledBackCount: studentIds.length }),
      }
    });

    return NextResponse.json({ success: true, message: 'Batch successfully rolled back' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
