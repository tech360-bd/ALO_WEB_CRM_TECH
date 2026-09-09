import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const data = await request.json();
    const { sourceCrmName = 'Old CRM', fileName = 'import.json', students = [] } = data;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: 'No students provided for import' }, { status: 400 });
    }

    let newCount = 0;
    let matchedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const totalRows = students.length;

    const batch = await db.importBatch.create({
      data: {
        sourceCrmName,
        fileName,
        totalRows,
        newCount: 0,
        matchedCount: 0,
        duplicateCount: 0,
        errorCount: 0,
        status: 'ready_for_review',
        createdBy: auth.userId,
      },
    });

    for (const row of students) {
      try {
        const email = String(row.email || '').toLowerCase().trim();
        const phone = String(row.phone || '').replace(/\s+/g, '');
        const whatsapp = String(row.whatsapp || '').replace(/\s+/g, '');
        const passportNumber = String(row.passportNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const studentIdVal = String(row.studentId || '');
        const name = String(row.studentName || row.name || '');

        let matchFound = false;
        let matchedId = '';
        let duplicateRisk = 'none';

        if (email || phone || whatsapp || passportNumber || studentIdVal) {
          const match = await db.student.findFirst({
            where: {
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : []),
                ...(studentIdVal ? [{ studentId: studentIdVal }] : []),
              ],
            },
          });
          // Note: whatsapp and passport number aren't direct fields on Student schema, maybe check other ways if needed, or just these for now since we couldn't find them earlier.
          
          if (match) {
            matchFound = true;
            matchedId = match.id;
            duplicateRisk = 'high';
          }
        }

        if (matchFound) {
          matchedCount++;
          duplicateCount++;
        } else {
          newCount++;
        }

        await db.importStagingStudent.create({
          data: {
            batchId: batch.id,
            studentName: name,
            email,
            phone,
            whatsapp,
            passportNumber,
            dateOfBirth: String(row.dateOfBirth || ''),
            countryInterest: String(row.countryInterest || ''),
            courseInterest: String(row.courseInterest || ''),
            universityInterest: String(row.universityInterest || ''),
            applicationStatus: 'new',
            counselorName: String(row.counselorName || ''),
            oldCrmId: String(row.oldCrmId || row.id || ''),
          },
        });
      } catch (err) {
        errorCount++;
      }
    }

    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        newCount,
        matchedCount,
        duplicateCount,
        errorCount,
      }
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_IMPORT_UPLOADED',
        batchId: batch.id,
        beforeData: '{}',
        afterData: JSON.stringify({ fileName, totalRows }),
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRows,
      newCount,
      matchedCount,
      duplicateCount,
      errorCount,
      status: 'ready_for_review',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
