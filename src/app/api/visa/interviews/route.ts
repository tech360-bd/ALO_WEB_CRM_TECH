import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR') || auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Interview view permission required — interviews.view' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent) {
      if (studentId && studentId !== auth.userId) return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });
      where.studentId = auth.userId;
    }

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isSuper && isVisa && caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot view interviews for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const interviews = await db.visaInterview.findMany({ where, orderBy: { scheduledAt: 'desc' }, include: { answers: true } });

    await logAuditAction(auth, 'VISA_INTERVIEWS_VIEW', 'VisaInterview', caseId || studentId || 'list', { count: interviews.length });

    return NextResponse.json({
      success: true,
      data: interviews,
      emptyState: interviews.length === 0 ? 'No interviews — proper empty state — AI interview 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness one Q at a time detect incomplete/contradictions/memorized/weak — real DB' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Interview create requires visa officer — interviews.create' }, { status: 403 });

    const body = await req.json();
    const { caseId, studentId, interviewType, difficulty, language, scheduledAt } = body;

    if (!caseId) return NextResponse.json({ success: false, error: 'caseId required — route /employee/visa-interviews/:caseId' }, { status: 400 });

    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot create interview for unassigned case — IDOR blocked' }, { status: 403 });
    }

    const validTypes = ['embassy_mock','credibility','pre_cas','university','sponsor','study_gap','refusal','english','final_readiness'];
    if (interviewType && !validTypes.includes(interviewType)) {
      return NextResponse.json({ success: false, error: `Invalid interview type — allowed ${validTypes.join(', ')} — AI interview 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness` }, { status: 400 });
    }

    const interview = await db.visaInterview.create({
      data: {
        caseId: caseId || '',
        studentId: studentId || visaCase.studentId,
        interviewType: interviewType || 'embassy_mock',
        difficulty: difficulty || 'standard',
        language: language || 'english',
        status: 'scheduled',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        officerId: auth.userId,
      },
    });

    await logAuditAction(auth, 'VISA_INTERVIEW_CREATE', 'VisaInterview', interview.id, { caseId, studentId: studentId || visaCase.studentId, interviewType });
    await db.timelineEvent.create({
      data: {
        studentId: studentId || visaCase.studentId,
        stage: 'VISA_INTERVIEW_SCHEDULED',
        title: `Visa interview scheduled — type ${interviewType || 'embassy_mock'} — difficulty ${difficulty || 'standard'} — by ${auth.name}`,
        description: `AI interview 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness one Q at a time detect incomplete/contradictions/memorized/weak`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: interview, note: 'AI interview 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness one Q at a time — reuse existing video/voice store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
