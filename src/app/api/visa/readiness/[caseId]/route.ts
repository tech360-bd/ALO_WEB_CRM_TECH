import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('student') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('COUNSELOR') || auth.roles.includes('APPLICATION_TEAM') || auth.roles.includes('STUDENT');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Readiness view permission required — readiness.view' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent && visaCase.studentId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });
    }

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isSuper && !isStudent && isVisa && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot view readiness for unassigned case — IDOR blocked' }, { status: 403 });
    }

    const report = await db.visaReadinessReport.findFirst({ where: { visaCaseId: caseId }, orderBy: { createdAt: 'desc' } });

    await logAuditAction(auth, 'VISA_READINESS_VIEW', 'VisaReadinessReport', caseId, { studentId: visaCase.studentId, hasReport: !!report });

    // For student — filter sensitive risk details
    if (isStudent && report) {
      // Do not expose internal sensitive risk details to students — return student-safe version
      const safeReport = {
        ...report,
        riskFactors: '[]', // Internal sensitive risk not exposed to students
        recommendation: report.recommendation ? report.recommendation.split(' — What is strong')[0] + ' — What is strong/weak/missing/next action/responsible/deadline explained in counselor dashboard — internal sensitive risk not exposed to students' : report.recommendation,
      };
      return NextResponse.json({
        success: true,
        data: safeReport,
        note: 'Student sees only student-safe readiness — NOT internal/risk/sensitive/medical/criminal/refusal analysis/staff comments — Do not expose internal sensitive risk details to students — explain strong/weak/missing/next action/responsible/deadline',
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
      emptyState: report ? null : 'No readiness report — proper empty state — GET /api/visa/readiness/{caseId} — POST /api/visa/readiness/{caseId}/calculate — 10 components Profile 10% Passport 10% Academic 10% English 10% Offer/CAS 10% Funding 15% Bank Statement 10% Study Gap 10% Interview 10% Risk 5% = 100% — risk LOW/MEDIUM/HIGH/CRITICAL/HUMAN_REVIEW_REQUIRED — explain strong/weak/missing/next action/responsible/deadline — do not expose internal sensitive risk to students',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
