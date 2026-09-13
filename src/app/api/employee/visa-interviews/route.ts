import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_INTERVIEW_OFFICER');

    if (!isSuper && !isVisa) {
      return NextResponse.json({ success: false, error: 'Visa interview officer permission required — interviews.view — marketing no visa — partner no visa' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const interviewType = searchParams.get('interviewType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100')));

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (interviewType) where.interviewType = interviewType;

    if (!isSuper && isVisa && caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: caseId } }).catch(() => null);
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot view interviews for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const [interviews, total] = await Promise.all([
      db.visaInterview.findMany({ where, orderBy: { scheduledAt: 'desc' }, take: limit, skip: (page-1)*limit, include: { answers: true } }).catch(() => []),
      db.visaInterview.count({ where }).catch(() => 0),
    ]);

    await logAuditAction(auth, 'EMPLOYEE_VISA_INTERVIEWS_VIEW', 'VisaInterview', caseId || 'list', { count: interviews.length, total });

    return NextResponse.json({
      success: true,
      interviews,
      data: interviews,
      count: interviews.length,
      total,
      pagination: { page, limit, total, pages: Math.ceil(total/limit) },
      emptyState: interviews.length === 0 ? 'No interviews — proper empty state — AI interview 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness one Q at a time detect incomplete/contradictions/memorized/weak — real DB' : null,
      note: 'AI output educational/practice only, no visa guarantee — Scorecard 12 scores AI preliminary only human final — Final result internal workflow status NOT visa decision — AI preliminary only human final — human responsible',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
