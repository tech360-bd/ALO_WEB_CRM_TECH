import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { generateStudentCode } from '@/lib/student-auth';

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

    let importedCount = 0;

    for (const staged of batch.students) {
      if (staged.status === 'merged') {
        const matchedId = staged.matchedStudentId;
        if (matchedId) {
          await db.student.update({
            where: { id: matchedId },
            data: {
              updatedAt: new Date()
            }
          });
        }
      } else if (staged.status === 'staging' || staged.status === 'new' || staged.status === 'ready') {
        const studentCode = await generateStudentCode();

        const student = await db.student.create({
          data: {
            studentId: studentCode,
            name: staged.studentName,
            email: staged.email,
            phone: staged.phone,
            journeyStage: 'lead_created',
            status: 'active'
          }
        });

        const profileCount = await db.portalStudentProfile.count({ where: { studentId: student.id } });
        if (profileCount === 0) {
          await db.portalStudentProfile.create({
            data: {
              userId: student.id,
              studentId: student.id,
              fullName: staged.studentName,
              preferredCountry: staged.countryInterest,
              preferredSubject: staged.courseInterest,
              passportNumber: staged.passportNumber,
              dateOfBirth: staged.dateOfBirth,
            }
          });
        }

        await db.studentEvent.create({
          data: {
            studentId: student.id,
            eventType: 'STUDENT_IMPORTED_FROM_OLD_CRM',
            payload: JSON.stringify({ batchId: batch.id, oldCrmId: staged.oldCrmId, actorId: auth.userId, actorType: 'system' })
          }
        });

        importedCount++;
      }
    }

    await db.importBatch.update({
      where: { id },
      data: { status: 'completed' },
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_IMPORT_EXECUTED',
        batchId: id,
        afterData: JSON.stringify({ importedCount }),
      }
    });

    return NextResponse.json({ success: true, importedCount, message: 'Students successfully imported to live database' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
