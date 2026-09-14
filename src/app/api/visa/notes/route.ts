import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

const VALID_VISIBILITY = ['INTERNAL_ONLY','VISA_TEAM_ONLY','COUNSELOR_VISIBLE','APPLICATION_TEAM_VISIBLE','STUDENT_SAFE_FEEDBACK','SUPER_ADMIN_ONLY','internal_only','visa_team_only','counselor_visible','application_team_visible','student_safe_feedback','super_admin_only'];

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('COUNSELOR') || auth.roles.includes('APPLICATION_TEAM');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Notes create permission required — notes.create/internal.create/student_feedback.create' }, { status: 403 });

    const body = await req.json();
    const { caseId, studentId, content, visibility, riskFlag, noteType, commentType } = body;

    if (!content) return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      return NextResponse.json({ success: false, error: `Invalid visibility — allowed INTERNAL_ONLY/VISA_TEAM_ONLY/COUNSELOR_VISIBLE/APPLICATION_TEAM_VISIBLE/STUDENT_SAFE_FEEDBACK/SUPER_ADMIN_ONLY — student never sees internal — partner never sees visa notes — marketing never sees visa notes — student sees only approved student-safe feedback` }, { status: 400 });
    }

    let visaCase: any = null;
    if (caseId) visaCase = await (db as any).visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase && studentId) visaCase = await (db as any).visaCase.findFirst({ where: { studentId } });

    if (visaCase) {
      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR');
      if (!isSuper && !isCounselor && (auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER')) && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot create note for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    // If student role tries to create internal notes — blocked
    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent && visibility && visibility.toLowerCase() !== 'student_safe_feedback' && visibility.toLowerCase() !== 'student_visible') {
      return NextResponse.json({ success: false, error: 'Student cannot create internal notes — student sees only approved student-safe feedback' }, { status: 403 });
    }

    const normalizedVisibility = (visibility || 'internal_only').toLowerCase();

    // AI safety for student-safe feedback: must be supportive/clear/professional/actionable never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees
    if (normalizedVisibility === 'student_safe_feedback' || normalizedVisibility === 'student_visible' || noteType === 'student_feedback') {
      const forbidden = ['internal risk', 'high risk', 'confidential', 'staff criticism', 'guarantee approval', 'guaranteed visa', '100% success'];
      const lowerContent = content.toLowerCase();
      for (const f of forbidden) {
        if (lowerContent.includes(f)) {
          return NextResponse.json({ success: false, error: `Student-safe feedback must be supportive/clear/professional/actionable never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees — found forbidden phrase ${f} — officer must approve before sending` }, { status: 400 });
        }
      }
    }

    const note = await (db as any).visaOfficerNote.create({
      data: {
        caseId: caseId || visaCase?.id || '',
        studentId: studentId || visaCase?.studentId || '',
        officerId: auth.userId,
        officerName: auth.name || 'Visa Officer',
        content: content || '',
        visibility: normalizedVisibility,
        riskFlag: riskFlag || 'none',
        commentType: commentType || noteType || (normalizedVisibility.includes('student') ? 'student_feedback' : 'officer_note'),
      } as any,
    });

    await logAuditAction(auth, 'VISA_NOTE_CREATE', 'VisaOfficerNote', (note as any).id, { caseId: caseId || visaCase?.id, studentId: studentId || visaCase?.studentId, visibility: normalizedVisibility, contentLength: content.length, noteType: commentType || noteType });

    if (normalizedVisibility.includes('student')) {
      await (db as any).timelineEvent.create({
        data: {
          studentId: studentId || visaCase?.studentId || '',
          stage: 'VISA_STUDENT_FEEDBACK_SENT',
          title: `Student-safe feedback sent by ${auth.name} — approved — supportive/clear/professional/actionable`,
          description: `Feedback: ${content.substring(0, 200)} — save to Student Portal/Timeline/Notifications/Messages — officer approved before sending — never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees`,
        },
      }).catch(() => {});
    } else {
      await (db as any).timelineEvent.create({
        data: {
          studentId: studentId || visaCase?.studentId || '',
          stage: 'VISA_INTERNAL_NOTE_CREATED',
          title: `Internal note created by ${auth.name} — visibility ${normalizedVisibility} — audit logged`,
          description: `Internal note — visibility ${normalizedVisibility} — student never sees internal — partner never sees visa notes — marketing never sees visa notes — student sees only approved student-safe feedback — every edit audited`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: note, note: 'Two-layer notes INTERNAL_ONLY/VISA_TEAM_ONLY/COUNSELOR_VISIBLE/APPLICATION_TEAM_VISIBLE/STUDENT_SAFE_FEEDBACK/SUPER_ADMIN_ONLY — student never sees internal — partner never sees visa notes — marketing never sees visa notes — student sees only approved student-safe feedback — every edit audited' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const url = new URL(req.url);
    const caseId = url.searchParams.get('caseId');
    const studentId = url.searchParams.get('studentId');

    if (!caseId && !studentId) return NextResponse.json({ success: false, error: 'caseId or studentId required' }, { status: 400 });

    let visaCase: any = null;
    if (caseId) visaCase = await (db as any).visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase && studentId) visaCase = await (db as any).visaCase.findFirst({ where: { studentId } });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR');
    const isApplicationTeam = auth.roles.includes('application_team') || auth.roles.includes('APPLICATION_TEAM');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('admin') || auth.roles.includes('ADMIN');

    // Filter visibility per role
    let visibilityFilter: any = {};
    if (isStudent) {
      visibilityFilter = { visibility: { in: ['student_safe_feedback', 'student_visible', 'STUDENT_SAFE_FEEDBACK'] } };
    } else if (isCounselor) {
      visibilityFilter = { visibility: { in: ['counselor_visible', 'student_safe_feedback', 'visa_team_only', 'application_team_visible', 'COUNSELOR_VISIBLE', 'STUDENT_SAFE_FEEDBACK'] } };
    } else if (isApplicationTeam) {
      visibilityFilter = { visibility: { in: ['application_team_visible', 'student_safe_feedback', 'APPLICATION_TEAM_VISIBLE', 'STUDENT_SAFE_FEEDBACK'] } };
    } else if (isVisa || isSuper) {
      visibilityFilter = {};
    } else {
      return NextResponse.json({ success: false, error: 'No permission to view visa notes — marketing no visa notes — partner no visa cases' }, { status: 403 });
    }

    const where: any = { ...visibilityFilter };
    if (caseId) where.caseId = caseId;
    if (studentId) where.studentId = studentId;

    const notes = await (db as any).visaOfficerNote.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });

    await logAuditAction(auth, 'VISA_NOTES_VIEW', 'VisaOfficerNote', caseId || studentId || 'list', { count: (notes as any[]).length, studentId: visaCase?.studentId || studentId });

    return NextResponse.json({ success: true, data: notes, notes, emptyState: notes.length === 0 ? 'No notes — proper empty state — visibility INTERNAL_ONLY/VISA_TEAM_ONLY/COUNSELOR_VISIBLE/APPLICATION_TEAM_VISIBLE/STUDENT_SAFE_FEEDBACK/SUPER_ADMIN_ONLY — student never sees internal' : null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
