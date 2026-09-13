import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

const VALID_RISK = ['low','medium','high','critical','LOW','MEDIUM','HIGH','CRITICAL','HUMAN_REVIEW_REQUIRED'];

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Risk update requires visa officer — risk.view/update' }, { status: 403 });

    const id = context?.params?.id;
    const { riskLevel, reason } = await req.json();

    if (!VALID_RISK.includes(riskLevel)) {
      return NextResponse.json({ success: false, error: `Invalid risk — allowed LOW/MEDIUM/HIGH/CRITICAL/HUMAN_REVIEW_REQUIRED — explain what is strong/weak/missing/next action/responsible/deadline — do not expose internal sensitive risk details to students` }, { status: 400 });
    }

    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && existing.visaOfficerId && existing.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot update risk of unassigned case — IDOR blocked' }, { status: 403 });
    }

    const updated = await db.visaCase.update({ where: { id }, data: { riskLevel: riskLevel.toLowerCase() } });

    await logAuditAction(auth, 'VISA_RISK_UPDATE', 'VisaCase', id, { before: { riskLevel: existing.riskLevel }, after: { riskLevel }, reason, studentId: existing.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_RISK_UPDATED',
        title: `Risk updated to ${riskLevel} by ${auth.name} — reason ${reason || 'assessment'}`,
        description: `Risk ${existing.riskLevel} → ${riskLevel} — explain what is strong/weak/missing/next action/responsible/deadline — do not expose internal sensitive risk details to students`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated, note: 'Risk LOW/MEDIUM/HIGH/CRITICAL/HUMAN_REVIEW_REQUIRED — explain strong/weak/missing/next action/responsible/deadline — do not expose internal sensitive risk details to students' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});
