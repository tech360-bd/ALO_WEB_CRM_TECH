import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT') || auth.userType === 'student';
    const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR');
    const isApplicationTeam = auth.roles.includes('application_team') || auth.roles.includes('APPLICATION_TEAM');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('admin') || auth.roles.includes('ADMIN');

    if (isStudent && visaCase.studentId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });
    }

    let visibilityFilter: any = {};
    if (isStudent) {
      visibilityFilter = { visibility: { in: ['student_safe_feedback', 'student_visible', 'STUDENT_SAFE_FEEDBACK', 'student_safe'] } };
    } else if (isCounselor) {
      visibilityFilter = { visibility: { in: ['counselor_visible', 'student_safe_feedback', 'visa_team_only', 'application_team_visible', 'COUNSELOR_VISIBLE', 'STUDENT_SAFE_FEEDBACK'] } };
    } else if (isApplicationTeam) {
      visibilityFilter = { visibility: { in: ['application_team_visible', 'student_safe_feedback', 'APPLICATION_TEAM_VISIBLE', 'STUDENT_SAFE_FEEDBACK'] } };
    } else if (isVisa || isSuper) {
      visibilityFilter = {};
    } else {
      return NextResponse.json({ success: false, error: 'No permission to view visa notes — marketing no visa notes — partner no visa cases' }, { status: 403 });
    }

    if (!isSuper && !isStudent && isVisa && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot access unassigned case notes — IDOR blocked' }, { status: 403 });
    }

    const where: any = { caseId, ...visibilityFilter };
    const notes = await db.visaOfficerNote.findMany({ where, orderBy: { createdAt: 'desc' } });

    await logAuditAction(auth, 'VISA_NOTES_VIEW', 'VisaOfficerNote', caseId, { count: notes.length, studentId: visaCase.studentId });

    return NextResponse.json({
      success: true,
      data: notes,
      notes,
      emptyState: notes.length === 0 ? 'No notes — proper empty state — visibility INTERNAL_ONLY/VISA_TEAM_ONLY/COUNSELOR_VISIBLE/APPLICATION_TEAM_VISIBLE/STUDENT_SAFE_FEEDBACK/SUPER_ADMIN_ONLY — student never sees internal — partner never sees visa — marketing never sees' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
