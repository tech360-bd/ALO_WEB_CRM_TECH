/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function write(filePath, content) {
    const fullPath = path.join(process.cwd(), filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log("Wrote", filePath);
}

write('src/app/api/visa/cases/[id]/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, { params, user }) => {
  try {
    const id = params.id;
    const caseData = await db.visaCase.findUnique({
      where: { id },
      include: {
        interviews: true,
        checklistItems: true,
        fundingReviews: true,
        studyGapReviews: true,
        refusalReviews: true,
        sensitiveReviews: user.role === 'SUPER_ADMIN' || user.role === 'VISA_OFFICER' || user.role === 'VISA_INTERVIEW_OFFICER' 
          ? true 
          : false,
        officerNotes: {
          where: user.role === 'COUNSELOR' ? { visibility: { in: ['counselor_visible', 'student_safe'] } } : undefined
        },
      }
    });
    if (!caseData) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: caseData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const id = params.id;
    const body = await req.json();
    const updated = await db.visaCase.update({
      where: { id },
      data: {
        currentStage: body.currentStage,
        riskLevel: body.riskLevel,
        readinessScore: body.readinessScore,
        nextAction: body.nextAction,
        isUrgent: body.isUrgent,
        visaOfficerId: body.visaOfficerId,
        visaOfficerName: body.visaOfficerName,
        counselorId: body.counselorId
      }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/cases/[id]/assign/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const id = params.id;
    const body = await req.json();
    const { visaOfficerId, visaOfficerName, counselorId } = body;
    
    const updated = await db.visaCase.update({
      where: { id },
      data: {
        ...(visaOfficerId && { visaOfficerId }),
        ...(visaOfficerName && { visaOfficerName }),
        ...(counselorId && { counselorId })
      }
    });

    await db.crmAuditLog.create({
      data: {
        action: 'ASSIGN_VISA_CASE',
        entityType: 'VisaCase',
        entityId: id,
        actorId: user.id,
        actorName: user.name || 'Unknown',
        details: JSON.stringify({ visaOfficerId, visaOfficerName, counselorId })
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/cases/[id]/stage/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const id = params.id;
    const { stage } = await req.json();
    
    const updated = await db.visaCase.update({
      where: { id },
      data: { currentStage: stage }
    });

    await db.timelineEvent.create({
      data: {
        studentId: updated.studentId || '',
        applicationId: updated.applicationId || '',
        title: 'Visa Stage Updated',
        description: \`Stage changed to \${stage}\`,
        eventType: 'VISA_STAGE_UPDATE',
        eventGroup: 'VISA',
        actorId: user.id,
        actorName: user.name || 'Unknown',
        actorType: 'STAFF',
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/cases/[id]/risk-level/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const id = params.id;
    const { riskLevel } = await req.json();
    const updated = await db.visaCase.update({
      where: { id },
      data: { riskLevel }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/interviews/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const studentId = searchParams.get('studentId');
    const officerId = searchParams.get('officerId');
    const status = searchParams.get('status');

    const where: any = {};
    if (caseId) where.visaCaseId = caseId;
    if (studentId) where.studentId = studentId;
    if (officerId) where.officerId = officerId;
    if (status) where.status = status;

    const interviews = await db.visaInterview.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: interviews });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const interview = await db.visaInterview.create({
      data: {
        visaCaseId: body.visaCaseId,
        studentId: body.studentId,
        applicationId: body.applicationId,
        officerId: body.officerId,
        officerName: body.officerName,
        type: body.type || 'mock',
        status: body.status || 'scheduled',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      }
    });
    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/interviews/[id]/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, { params }) => {
  try {
    const id = params.id;
    const interview = await db.visaInterview.findUnique({
      where: { id },
      include: { questions: true, answers: true, mockResult: true }
    });
    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req, { params }) => {
  try {
    const id = params.id;
    const body = await req.json();
    const updated = await db.visaInterview.update({
      where: { id },
      data: {
        officerNotes: body.officerNotes,
        studentFeedback: body.studentFeedback,
        verdict: body.verdict,
        overallScore: body.overallScore,
        status: body.status
      }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/interviews/[id]/question/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, { params }) => {
  try {
    const id = params.id;
    const body = await req.json();
    const question = await db.visaInterviewQuestion.create({
      data: {
        interviewId: id,
        questionText: body.questionText,
        category: body.category,
        orderIndex: body.orderIndex || 0,
        expectedPoints: body.expectedPoints || '[]'
      }
    });
    return NextResponse.json({ success: true, data: question });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/interviews/[id]/answer/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, { params }) => {
  try {
    const id = params.id;
    const body = await req.json();
    const answer = await db.visaInterviewAnswer.create({
      data: {
        interviewId: id,
        questionId: body.questionId,
        studentAnswer: body.studentAnswer,
        score: body.score,
        feedback: body.feedback,
        followUpQuestion: body.followUpQuestion
      }
    });
    return NextResponse.json({ success: true, data: answer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/interviews/[id]/finish/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, { params }) => {
  try {
    const id = params.id;
    const body = await req.json();
    const { verdict } = body;
    
    const answers = await db.visaInterviewAnswer.findMany({ where: { interviewId: id } });
    const avgScore = answers.length > 0 
      ? Math.round(answers.reduce((acc, a) => acc + (a.score || 0), 0) / answers.length)
      : 0;

    const updated = await db.visaInterview.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        overallScore: avgScore,
        verdict: verdict
      }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

write('src/app/api/visa/interviews/[id]/student-feedback/route.ts', `
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, { params, user }) => {
  try {
    const id = params.id;
    const body = await req.json();
    
    const interview = await db.visaInterview.findUnique({ where: { id } });
    if (!interview) throw new Error('Interview not found');

    const feedback = await db.visaStudentFeedback.create({
      data: {
        visaCaseId: interview.visaCaseId,
        interviewId: id,
        studentId: interview.studentId,
        content: body.content,
        authorId: user.id,
        authorName: user.name || 'Officer'
      }
    });

    await db.timelineEvent.create({
      data: {
        studentId: interview.studentId,
        title: 'New Interview Feedback',
        description: 'Visa Officer has provided feedback for your practice interview.',
        eventType: 'VISA_FEEDBACK_ADDED',
        eventGroup: 'VISA',
        actorId: user.id,
        actorType: 'STAFF',
      }
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
`);

console.log("Done generating groups 1 and 2.");
