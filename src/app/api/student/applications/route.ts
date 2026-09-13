import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const GET = withStudentAuth(async (_request, auth) => {
  try {
    const applications = await db.application.findMany({ where: { studentId: auth.studentId } });
    const data = await Promise.all(applications.map(async (application) => {
      const [offer, serial, checklist, payments] = await Promise.all([
        db.applicationOffer.findFirst({ where: { applicationId: application.id } }),
        db.applicationSerial.findUnique({ where: { applicationId: application.id } }),
        db.documentChecklist.findUnique({ where: { applicationId: application.id } }),
        db.applicationPaymentInstruction.findMany({ where: { applicationId: application.id } }),
      ]);
      let required: unknown[] = []; let completed: unknown[] = [];
      try { required = JSON.parse(checklist?.requiredDocuments || '[]'); completed = JSON.parse(checklist?.completedDocuments || '[]'); } catch { /* preserve malformed legacy data */ }
      return { ...application, applicationSerial: serial?.serialNumber || null, offer, checklist: checklist ? { id: checklist.id, totalItems: required.length, completedItems: completed.length } : null, payments };
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) { console.error('Applications GET Error:', error); return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 }); }
});

export const POST = withStudentAuth(async () => NextResponse.json({ success: false, error: 'Students cannot create applications' }, { status: 403 }));
