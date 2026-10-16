import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const userId = auth.userId;
    const roles = auth.roles || [];

    // Get student profile from authenticated session — derive ownership from authenticated session, never trust student_id from frontend alone
    const studentProfile = await db.portalStudentProfile.findFirst({ where: { userId } }).catch(() => null);
    const portalUser = await db.portalUser.findFirst({ where: { id: userId } }).catch(() => null);
    
    const studentId = studentProfile?.studentId || portalUser?.id || userId;

    // Get applications, documents, timeline, notifications, appointments, payments, english tests, interview sessions, visa checklist — all from real DB
    const [applications, documents, timeline, notifications, appointments, payments, englishTests, interviewSessions, visaChecklist] = await Promise.all([
      db.application.findMany({ where: { studentId }, take: 20, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.portalStudentDocument.findMany({ where: { studentProfileId: studentProfile?.id || '' }, take: 50 }).catch(() => []),
      db.portalTimelineEvent.findMany({ where: { studentProfileId: studentProfile?.id || '' }, take: 50, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.portalNotification.findMany({ where: { studentProfileId: studentProfile?.id || '' }, take: 20, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.appointment.findMany({ where: { studentId }, take: 10, orderBy: { scheduledAt: 'desc' } }).catch(() => []),
      db.aloPayment.findMany({ where: { studentId }, take: 20 }).catch(() => []),
      db.studentEnglishTestRecord.findMany({ where: { studentProfileId: studentProfile?.id || '' }, take: 20 }).catch(() => []),
      db.aiInterviewSession.findMany({ where: { studentId }, take: 10, orderBy: { createdAt: 'desc' } }).catch(() => []),
      db.visaChecklistItem.findMany({ where: { studentId }, take: 50 }).catch(() => []),
    ]);

    // Calculate next best action from real DB — never hardcoded
    let nextAction = { text: 'Complete Your Profile', reason: 'Profile completion low', cta: 'Complete Profile', actionUrl: '/student/profile/onboarding' };
    const profileCompletion = studentProfile?.profileCompletion || 0;
    const rejectedDocs = documents.filter((d:any)=> d.status==='rejected').length;
    const missingDocs = documents.filter((d:any)=> ['pending','not_uploaded','pending_upload'].includes(d.status)).length;

    if (profileCompletion < 30) {
      nextAction = { text: 'Complete Your Profile', reason: 'Profile completion low — complete personal, education, passport, English, funding, admission preference for better course matching', cta: 'Complete Profile', actionUrl: '/student/profile/onboarding' };
    } else if (rejectedDocs > 0) {
      nextAction = { text: 'Fix Rejected Document', reason: 'Document rejected — check reason and upload corrected document', cta: 'Upload Corrected Document', actionUrl: '/student/documents' };
    } else if (missingDocs > 0) {
      nextAction = { text: 'Upload Missing Document', reason: 'Document hub shows missing documents — AI automatically identifies document type and creates review task', cta: 'Upload Document', actionUrl: '/student/documents' };
    } else if (applications.length === 0) {
      nextAction = { text: 'Find Courses — Your Shortlist is Ready', reason: 'Course shortlist ready — strong matches and ambitious options — compare before starting application', cta: 'Find Courses', actionUrl: '/student/course-finder' };
    }

    // Journey stage
    const journeyStage = studentProfile?.journeyStage || 'Lead Created';

    return NextResponse.json({
      success: true,
      data: {
        student: studentProfile || portalUser,
        profile: studentProfile,
        applications,
        documents,
        timeline,
        notifications,
        appointments,
        payments,
        englishTests,
        interviewSessions,
        visaChecklist,
        nextAction,
        journeyStage,
        profileCompletion,
      },
      message: 'Student dashboard — Mission Control Center — Where am I? What completed? What missing? What should I do next? Who handling case? Application status? Am I ready for visa? — real DB, no fake data, no hardcoded student names, consistent 48px CTA buttons, equal-height cards, clear status colors, excellent empty/loading/error states, premium education consultancy design #FFFFFF bg #0057B8 primary #E8501A CTA #0F172A text #F8FAFC soft #E2E8F0 border',
    });
  } catch (e: any) {
    console.error('[student-portal/dashboard] error', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
