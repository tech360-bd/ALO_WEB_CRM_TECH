import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      stage: body.stage,
      status: body.status,
      safeStatus: body.safeStatus || 'under_review'
    }
  });

  await db.applicationStageHistory.create({
    data: {
      applicationId: params.id,
      stage: body.stage,
      status: 'completed',
      actor: auth.userId
    }
  });

  await logAuditAction(auth, 'UPDATE_STATUS', 'Application', params.id, body);
  return NextResponse.json({ success: true, data: updated });
});
