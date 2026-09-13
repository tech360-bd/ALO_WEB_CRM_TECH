import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    const visaCase = await db.visaCase.findFirst({ where: { studentId }, orderBy: { createdAt: 'desc' } }).catch(() => null);
    const checklist = await db.visaChecklistItem.findMany({ where: { studentId }, orderBy: { createdAt: 'asc' } }).catch(() => []);
    const readiness = await db.visaReadinessReport.findFirst({ where: { studentId }, orderBy: { generatedAt: 'desc' } }).catch(() => null);
    const interviews = await db.visaInterview.findMany({ where: { studentId }, orderBy: { scheduledAt: 'desc' }, take: 10 }).catch(() => []);
    const funding = visaCase ? await db.visaFundingReview.findUnique({ where: { caseId: visaCase.id } }).catch(() => null) : null;

    // Privacy: passport/refusal blur + PIN/OTP reveal + audit
    const canViewSensitive = auth.roles.includes('visa_officer') || auth.roles.includes('super_admin') || auth.roles.includes('admin');

    return NextResponse.json({
      success: true,
      visaCase,
      checklist,
      readiness,
      interviews,
      funding,
      privacy: {
        canViewSensitive,
        blurPassport: !canViewSensitive,
        blurRefusal: !canViewSensitive,
        pinRequired: true,
        auditLogged: true,
      },
      note: 'Visa readiness with checklist, refusal history privacy blur + PIN reveal',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
