import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/cas
 *
 * Returns the CAS / I-20 / CoE / offer-visa-letter records attached to the
 * caller's own applications. Scoped by the session's studentId, so a student
 * can never read another student's confirmation documents.
 */
export const GET = withStudentAuth(async (_request, auth) => {
  try {
    const applications = await db.application.findMany({
      where: { studentId: auth.studentId },
      select: {
        id: true,
        applicationCode: true,
        universityName: true,
        courseName: true,
        casI20Coe: {
          select: {
            id: true,
            documentType: true,
            status: true,
            requestedDate: true,
            receivedDate: true,
            referenceNumber: true,
            fileUrl: true,
            conditionNote: true,
            nextStep: true,
            visaHandoverStatus: true,
            updatedAt: true,
          },
        },
      },
    });

    const records = applications
      .filter((application) => application.casI20Coe)
      .map((application) => ({
        applicationId: application.id,
        applicationCode: application.applicationCode,
        universityName: application.universityName,
        courseName: application.courseName,
        record: application.casI20Coe!,
      }));

    return NextResponse.json({ success: true, records, total: records.length });
  } catch (error) {
    console.error('Student CAS GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load your confirmation documents' },
      { status: 500 },
    );
  }
});
