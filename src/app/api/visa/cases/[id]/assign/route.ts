import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission } from '@/lib/visa/access';

const schema = z.object({ visaOfficerId: z.string().trim().min(1).max(191), reason: z.string().trim().min(3).max(180) }).strict();

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Visa officer ID and assignment reason required.', details: parsed.error.flatten() }, { status: 400 });

    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.cases.assign', existing)) {
      return NextResponse.json({ success: false, error: 'visa.cases.assign permission required.' }, { status: 403 });
    }

    const employee = await db.employee.findUnique({ where: { userId: parsed.data.visaOfficerId }, select: { userId: true, name: true, role: true, status: true } });
    const officerRole = String(employee?.role || '').toLowerCase();
    if (!employee || employee.status?.toLowerCase() !== 'active' || !['visa_officer', 'visa_interview_officer', 'visa_team'].includes(officerRole)) {
      return NextResponse.json({ success: false, error: 'Target must be an active Visa Officer, Visa Interview Officer, or Visa Team member.' }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.visaCase.update({ where: { id }, data: { visaOfficerId: employee.userId, visaOfficerName: employee.name, lastUpdated: new Date() } });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_CASE_ASSIGNED', entityType: 'VisaCase', entityId: id, metadata: JSON.stringify({ studentId: existing.studentId, before: { visaOfficerId: existing.visaOfficerId }, after: { visaOfficerId: employee.userId }, reason: parsed.data.reason }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({
        data: { studentId: existing.studentId, stage: 'VISA_CASE_ASSIGNED', title: 'Visa officer assignment updated.', description: 'Case ownership changed by an authorized administrator; audit record created.', actor: auth.actorUserId },
      });
      return result;
    });
    return NextResponse.json({ success: true, data: { id: updated.id, caseCode: updated.caseCode, visaOfficerId: updated.visaOfficerId, visaOfficerName: updated.visaOfficerName, updatedAt: updated.updatedAt, lastUpdated: updated.lastUpdated } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[visa-case-assign] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to assign visa officer.' }, { status: 500 });
  }
});
