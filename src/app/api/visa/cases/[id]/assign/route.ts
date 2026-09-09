import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const body = await req.json();
    const { visaOfficerId, visaOfficerName, counselorId, counselorName } = body;

    const updateData: any = {};
    if (visaOfficerId !== undefined) updateData.visaOfficerId = visaOfficerId;
    if (visaOfficerName !== undefined) updateData.visaOfficerName = visaOfficerName;
    if (counselorId !== undefined) updateData.counselorId = counselorId;
    if (counselorName !== undefined) updateData.counselorName = counselorName;

    const updated = await db.visaCase.update({
      where: { id },
      data: updateData,
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles?.[0] || 'staff',
        action: 'VISA_CASE_ASSIGNED',
        targetCollection: 'VisaCase',
        targetId: id,
        afterData: JSON.stringify(updateData),
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Assignment failed' }, { status: 500 });
  }
});
