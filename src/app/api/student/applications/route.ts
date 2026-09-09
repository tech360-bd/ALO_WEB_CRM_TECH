import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const GET = withStudentAuth(async (request, auth) => {
  try {
    const applications = await db.application.findMany({
      where: { studentId: auth.studentId },
    });

    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const [offer, serial, checklist, payments] = await Promise.all([
          db.applicationOffer.findUnique({ where: { applicationId: app.id } }),
          db.applicationSerial.findUnique({ where: { applicationId: app.id } }),
          db.documentChecklist.findUnique({ 
            where: { applicationId: app.id },
            include: { items: true }
          }),
          db.applicationPaymentInstruction.findMany({ where: { applicationId: app.id } })
        ]);

        return {
          ...app,
          applicationSerial: serial?.serialCode || null,
          offer,
          checklist: checklist ? {
            id: checklist.id,
            totalItems: checklist.items.length,
            completedItems: checklist.items.filter(i => i.status === 'verified').length
          } : null,
          payments
        };
      })
    );

    return NextResponse.json({ success: true, data: enrichedApplications });
  } catch (error) {
    console.error('Applications GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
  }
});

export const POST = withStudentAuth(async () => {
  return NextResponse.json({ success: false, error: 'Students cannot create applications' }, { status: 403 });
});
