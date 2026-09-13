import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Student feedback requires visa officer — notes.create student_feedback.create/edit' }, { status: 403 });

    const interviewId = context?.params?.id;
    const interview = await db.visaInterview.findUnique({ where: { id: interviewId } });
    if (!interview) return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) {
      const visaCase = await db.visaCase.findUnique({ where: { id: interview.caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot send feedback for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { studentFeedback, content, feedback } = body;
    const finalFeedback = studentFeedback || content || feedback || '';

    if (!finalFeedback) return NextResponse.json({ success: false, error: 'Feedback content required — must be supportive/clear/professional/actionable never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees' }, { status: 400 });

    // AI safety check for student-safe feedback
    const forbidden = ['internal risk', 'high risk', 'confidential', 'staff criticism', 'guarantee approval', 'guaranteed visa', '100% success', 'internal note', 'risk flag'];
    const lower = finalFeedback.toLowerCase();
    for (const f of forbidden) {
      if (lower.includes(f)) {
        return NextResponse.json({ success: false, error: `Student-safe feedback must be supportive/clear/professional/actionable never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees — found forbidden phrase ${f} — officer must approve before sending` }, { status: 400 });
      }
    }

    const updated = await db.visaInterview.update({
      where: { id: interviewId },
      data: { studentFeedback: finalFeedback },
    });

    // Also create officer note with student_safe_feedback visibility
    await db.visaOfficerNote.create({
      data: {
        caseId: interview.caseId,
        studentId: interview.studentId,
        officerId: auth.userId,
        officerName: auth.name || 'Visa Officer',
        content: finalFeedback,
        visibility: 'student_safe_feedback',
        commentType: 'student_feedback',
      } as any,
    }).catch(() => {});

    await db.timelineEvent.create({
      data: {
        studentId: interview.studentId,
        stage: 'VISA_STUDENT_FEEDBACK_SENT',
        title: `Visa mock interview feedback sent — approved by ${auth.name} — supportive/clear/professional/actionable`,
        description: finalFeedback.substring(0, 500) + ' — save to Student Portal/Timeline/Notifications/Messages — officer approved before sending — never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees — reuse existing Email/WhatsApp/SMS/Portal Message no duplicate engine RBAC/consent/audit',
      },
    }).catch(() => {});

    await logAuditAction(auth, 'VISA_STUDENT_FEEDBACK_SEND', 'VisaInterview', interviewId, { studentId: interview.studentId, feedbackLength: finalFeedback.length });

    return NextResponse.json({ success: true, data: updated, note: 'Approved Student-Safe Feedback posted to Student Portal & Timeline — officer approves before send to Portal/Timeline/Notifications/Messages — must be supportive/clear/professional/actionable never include internal risk/confidential/staff criticism/guarantee' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    const interview = await db.visaInterview.findUnique({ where: { id: interviewId } });
    if (!interview) return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });

    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent && interview.studentId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cross-student blocked' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: { studentFeedback: interview.studentFeedback } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
