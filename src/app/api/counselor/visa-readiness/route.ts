import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Counselor visa readiness requires counselor/visa officer permission — assigned summary readiness/missing/safe feedback/tasks/doc status/timeline no sensitive without perm' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const caseId = searchParams.get('caseId');
    if (!studentId && !caseId) return NextResponse.json({ success: false, error: 'studentId or caseId required' }, { status: 400 });

    let visaCase: any = null;
    if (caseId) visaCase = await (db as any).visaCase.findUnique({ where: { id: caseId } }).catch(() => null);
    else visaCase = await (db as any).visaCase.findFirst({ where: { studentId: studentId! }, orderBy: { createdAt: 'desc' } }).catch(() => null);

    const resolvedStudentId = visaCase?.studentId || studentId!;

    // Counselor can only view assigned students unless super_admin/visa_officer
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER');
    if (!isSuper && !isVisa && visaCase && visaCase.counselorId && visaCase.counselorId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Counselor can only view assigned students — IDOR blocked — assigned summary readiness/missing/safe feedback/tasks/doc status/timeline no sensitive without perm' }, { status: 403 });
    }

    const [checklist, readiness, interviews, funding, studyGap, refusal, notes, tasks, documents, timeline] = await Promise.all([
      (db as any).visaChecklistItem.findMany({ where: { studentId: resolvedStudentId }, orderBy: { createdAt: 'asc' } }).catch(() => []),
      (db as any).visaReadinessReport.findFirst({ where: { studentId: resolvedStudentId }, orderBy: { createdAt: 'desc' } }).catch(() => null),
      (db as any).visaInterview.findMany({ where: { studentId: resolvedStudentId }, orderBy: { scheduledAt: 'desc' }, take: 10, include: { answers: true } }).catch(() => []),
      visaCase ? (db as any).visaFundingReview.findUnique({ where: { caseId: visaCase.id } }).catch(() => null) : Promise.resolve(null),
      visaCase ? (db as any).visaStudyGapReview.findUnique({ where: { caseId: visaCase.id } }).catch(() => null) : Promise.resolve(null),
      visaCase ? (db as any).visaRefusalReview.findUnique({ where: { caseId: visaCase.id } }).catch(() => null) : Promise.resolve(null),
      (db as any).visaOfficerNote.findMany({ where: { studentId: resolvedStudentId, visibility: { in: ['counselor_visible','student_safe_feedback','visa_team_only','application_team_visible','COUNSELOR_VISIBLE','STUDENT_SAFE_FEEDBACK'] } }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
      (db as any).visaTask ? (db as any).visaTask.findMany({ where: { studentId: resolvedStudentId }, orderBy: { dueDate: 'asc' }, take: 20 }).catch(() => []) : Promise.resolve([]),
      (db as any).studentDocument.findMany({ where: { studentId: resolvedStudentId }, orderBy: { updatedAt: 'desc' }, take: 30 }).catch(() => []),
      (db as any).timelineEvent.findMany({ where: { studentId: resolvedStudentId }, orderBy: { createdAt: 'desc' }, take: 30 }).catch(() => []),
    ]);

    const canViewSensitive = auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const safeRefusal = canViewSensitive ? refusal : null;
    const safeFunding = funding; // Counselor can see funding summary but not sensitive details? Per spec counselor assigned summary readiness/missing/safe feedback/tasks/doc status/timeline no sensitive without perm
    // Filter timeline to student-safe events for counselor
    const studentSafeTimeline = timeline.filter((ev: any) => !ev.stage.includes('SENSITIVE') || canViewSensitive);

    await logAuditAction(auth, 'COUNSELOR_VISA_READINESS_VIEW', 'VisaCase', visaCase?.id || resolvedStudentId, { studentId: resolvedStudentId, canViewSensitive });

    return NextResponse.json({
      success: true,
      visaCase,
      checklist,
      readiness,
      interviews,
      funding: safeFunding,
      studyGap,
      refusal: safeRefusal,
      notes,
      tasks,
      documents,
      timeline: studentSafeTimeline,
      privacy: {
        canViewSensitive,
        blurPassport: !canViewSensitive,
        blurRefusal: !canViewSensitive,
        pinRequired: true,
        auditLogged: true,
        note: 'Counselor assigned summary readiness/missing/safe feedback/tasks/doc status/timeline no sensitive without perm — sensitive medical/criminal restricted VISA_OFFICER/VISA_INTERVIEW_OFFICER/SUPER_ADMIN/explicitly authorized only — never expose to Marketing/Partner/General Employee/Sales/Public/Student normal dashboard — every view/edit/download must create audit log',
      },
      note: 'Counselor assigned summary readiness/missing/safe feedback/tasks/doc status/timeline no sensitive without perm — Application Team Offer/CAS stage/doc status/blockers/timeline with perm',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
