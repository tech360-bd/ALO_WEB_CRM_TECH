import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const GET = withStudentAuth(async (request, auth) => {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1];

    if (!id) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }

    const application = await db.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.studentId !== auth.studentId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const [
      stageHistory,
      offer,
      paymentInstructions,
      documentChecklist,
      comments
    ] = await Promise.all([
      db.applicationStageHistory.findMany({ where: { applicationId: id }, orderBy: { createdAt: 'desc' } }),
      db.applicationOffer.findFirst({ where: { applicationId: id } }),
      db.applicationPaymentInstruction.findMany({ where: { applicationId: id } }),
      db.documentChecklist.findUnique({ where: { applicationId: id } }),
      db.applicationComment.findMany({
        where: { applicationId: id, commentType: 'student_visible' },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const interviewProgram = {
      sessionsCount: 0,
      sessions: []
    };

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        stageHistory,
        offer,
        paymentInstructions,
        documentChecklist,
        comments,
        interviewProgram
      }
    });

  } catch (error) {
    console.error('Application Detail GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch application' }, { status: 500 });
  }
});

export const PATCH = withStudentAuth(async (request, auth) => {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1];

    if (!id) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }

    const application = await db.application.findUnique({ where: { id } });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.studentId !== auth.studentId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { notes } = body;

    if (notes === undefined) {
      return NextResponse.json({ success: false, error: 'Only notes can be updated' }, { status: 400 });
    }

    const updatedApplication = await db.application.update({
      where: { id },
      data: { notes }
    });

    return NextResponse.json({ success: true, data: updatedApplication });
  } catch (error) {
    console.error('Application PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
  }
});
