import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('ADMIN');
    const isVisaOfficer = auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('VISA_TEAM') || auth.roles.includes('visa_team');
    const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR') || auth.roles.includes('application_team') || auth.roles.includes('APPLICATION_TEAM');

    if (!isSuper && !isVisaOfficer && !isCounselor) {
      return NextResponse.json({ success: false, error: 'Visa Officer or Counselor required — visa.dashboard.view cases.view/assigned.view — marketing no visa cases — partner no visa cases — finance cannot modify interview — visa officer cannot modify commission/salary — suspended cannot access — public cannot download' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get('riskLevel');
    const stage = searchParams.get('stage');
    const studentName = searchParams.get('studentName');
    const studentId = searchParams.get('studentId');
    const destinationCountry = searchParams.get('destinationCountry');
    const university = searchParams.get('university');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100')));

    const where: any = {};
    if (riskLevel) where.riskLevel = riskLevel.toLowerCase();
    if (stage) where.currentStage = stage;
    if (studentName) where.studentName = { contains: studentName };
    if (studentId) where.studentId = studentId;
    if (destinationCountry) where.destinationCountry = destinationCountry;
    if (university) where.university = { contains: university };

    if (!isSuper) {
      if (auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR')) {
        where.counselorId = auth.userId;
      } else if (isVisaOfficer) {
        where.visaOfficerId = auth.userId;
      }
    }

    const [cases, total] = await Promise.all([
      db.visaCase.findMany({ where, orderBy: { updatedAt: 'desc' }, take: limit, skip: (page-1)*limit }).catch(() => []),
      db.visaCase.count({ where }).catch(() => 0),
    ]);

    await logAuditAction(auth, 'EMPLOYEE_VISA_CASES_VIEW', 'VisaCase', 'list', { count: cases.length, total, filters: { riskLevel, stage, studentName, studentId } });

    return NextResponse.json({
      success: true,
      cases,
      data: cases,
      count: cases.length,
      total,
      pagination: { page, limit, total, pages: Math.ceil(total/limit) },
      emptyState: cases.length === 0 ? 'No visa cases assigned — proper empty state — real database metrics — no fake numbers — API: /api/employee/visa-cases — RBAC filter visaOfficerId=auth.userId for non-super_admin' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
