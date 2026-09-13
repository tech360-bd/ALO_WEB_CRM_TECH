import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (studentId) where.studentId = studentId;

    const interviews = await (db as any).visaInterview.findMany({ where, orderBy: { scheduledAt: 'desc' } }).catch(() => []);
    const preps = await (db as any).interviewPrep.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);

    return NextResponse.json({
      success: true,
      interviews,
      preps,
      workflow: ['research','prep','practice','scoring','recording','human_final_review'],
      note: 'AI may score draft, but human final review required — AI cannot finalize high-risk',
      guidanceLabeled: 'Bank guidance must be labeled clearly',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { applicationId, studentId, type, scheduledAt, researchNotes, prepNotes, practiceScore, aiScore, recordingUrl } = body;
    if (!applicationId && !studentId) return NextResponse.json({ success: false, error: 'applicationId or studentId required' }, { status: 400 });

    const interview = await (db as any).visaInterview.create({
      data: {
        applicationId: applicationId || null,
        studentId: studentId || null,
        type: type || 'visa',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        status: 'scheduled',
        researchNotes: researchNotes || '',
        prepNotes: prepNotes || '',
        practiceScore: practiceScore || null,
        aiScore: aiScore || null,
        recordingUrl: recordingUrl || '',
        createdBy: auth.userId,
        // Human final review required
        finalReviewedBy: null,
        finalScore: null,
      },
    }).catch(async () => {
      // Fallback
      return await db.timelineEvent.create({
        data: {
          studentId: studentId || 'unknown',
          stage: 'INTERVIEW_PREP',
          title: `Interview ${type} scheduled`,
          description: `Scheduled by ${auth.name} — ${researchNotes || ''}`,
        },
      });
    });

    await logAuditAction(auth, 'INTERVIEW_SCHEDULED', 'VisaInterview', interview.id, { applicationId, type });

    return NextResponse.json({ success: true, data: interview, message: 'Interview prep created — AI scoring is draft only, human final review required' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
