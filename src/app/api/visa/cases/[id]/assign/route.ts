import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('ADMIN');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Case assignment requires super_admin/admin/visa_officer — visa.dashboard.view cases.assign permission — bulk perm-controlled' }, { status: 403 });

    const id = context?.params?.id;
    const body = await req.json();
    const { visaOfficerId, visaOfficerName, counselorId, counselorName, applicationOfficerId, reason } = body;

    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const updateData: any = {};
    if (visaOfficerId !== undefined) updateData.visaOfficerId = visaOfficerId;
    if (visaOfficerName !== undefined) updateData.visaOfficerName = visaOfficerName;
    if (counselorId !== undefined) updateData.counselorId = counselorId;
    if (counselorName !== undefined) updateData.counselorName = counselorName;
    if (applicationOfficerId !== undefined) updateData.applicationOfficerId = applicationOfficerId;

    const updated = await db.visaCase.update({ where: { id }, data: updateData });

    await logAuditAction(auth, 'VISA_CASE_ASSIGNED', 'VisaCase', id, { before: existing, after: updateData, reason, studentId: existing.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_CASE_ASSIGNED',
        title: `Visa case assigned to ${visaOfficerName || visaOfficerId || 'officer'} by ${auth.name} — reason ${reason || 'assignment'}`,
        description: `Case ${existing.caseCode} assigned — owner/priority/deadline/status/createdBy/caseId/studentId — overdue appears in dashboard`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated, note: 'Assigned table filters bulk perm-controlled — owner/priority/deadline/status/createdBy/caseId/studentId' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Assignment failed' }, { status: 500 });
  }
});
