import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const visaCase = await db.visaCase.create({
    data: {
      applicationId: params.id,
      studentId: app.studentId,
      currentStage: 'not_started'
    }
  });
  await logAuditAction(auth, 'VISA_HANDOVER', 'Application', params.id);
  return NextResponse.json({ success: true, data: visaCase });
});
