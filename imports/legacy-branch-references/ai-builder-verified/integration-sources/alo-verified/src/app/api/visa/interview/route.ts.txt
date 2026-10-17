import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appendTimeline } from '@/lib/visa-readiness';
import { verifyAuth } from '@/lib/auth';

export const INTERVIEW_CATEGORIES = [
  'why_country',
  'why_university',
  'why_course',
  'why_not_bangladesh',
  'sponsor',
  'future_plan',
  'academic_gap',
  'previous_refusal',
  'tuition_fee',
  'accommodation',
  'after_graduation',
];

export const DEFAULT_QUESTIONS = [
  { category: 'why_country', question: 'Why did you choose to study in this country instead of Bangladesh?' },
  { category: 'why_university', question: 'Why did you choose this particular university?' },
  { category: 'why_course', question: 'Why did you select this course? How does it align with your career?' },
  { category: 'why_not_bangladesh', question: 'Why are you not studying this course in Bangladesh?' },
  { category: 'sponsor', question: 'Who is sponsoring your studies? What is their income source?' },
  { category: 'future_plan', question: 'What are your plans after graduation?' },
  { category: 'academic_gap', question: 'Can you explain the gap in your academic history?' },
  { category: 'previous_refusal', question: 'Have you ever been refused a visa before? If yes, please explain.' },
  { category: 'tuition_fee', question: 'What is your tuition fee and how will you pay it?' },
  { category: 'accommodation', question: 'Where will you stay during your studies?' },
  { category: 'after_graduation', question: 'What will you do after returning to Bangladesh?' },
];

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }
    const sessions = await db.interviewSession.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: true,
        feedbacks: true,
      },
    });
    const completedCount = sessions.filter(s => s.status === 'completed').length;
    const readinessScore = completedCount >= 2 ? 100 : completedCount === 1 ? 50 : 0;
    return NextResponse.json({ sessions, readinessScore, categories: INTERVIEW_CATEGORIES, defaultQuestions: DEFAULT_QUESTIONS });
  } catch (error) {
    console.error('Interview GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }
    const session = await db.interviewSession.create({
      data: {
        studentId: body.studentId,
        counselorId: body.counselorId || null,
        interviewType: body.interviewType || 'mock', // credibility, university, visa, mock, practice
        country: body.country || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
        status: body.status || 'scheduled',
        score: body.score || null,
        feedback: body.feedback || null,
        notes: body.notes || null,
        meetingType: body.meetingType || 'manual',
        meetingLink: body.meetingLink || null,
        aiGenerated: body.aiGenerated || false,
      },
    });
    if (body.questions && Array.isArray(body.questions)) {
      for (const q of body.questions) {
        const question = await db.interviewQuestion.create({
          data: {
            sessionId: session.id,
            interviewType: session.interviewType,
            country: session.country || null,
            question: q.question,
            category: q.category || null,
            suggestedAnswer: q.suggestedAnswer || null,
            difficulty: q.difficulty || 'medium',
            aiGenerated: q.aiGenerated || false,
          },
        });
        if (q.candidateAnswer) {
          await db.interviewAnswer.create({
            data: {
              sessionId: session.id,
              questionId: question.id,
              questionText: q.question,
              category: q.category || null,
              studentAnswer: q.candidateAnswer,
              aiFeedback: q.aiFeedback || null,
              counselorFeedback: q.counselorFeedback || null,
              visaOfficerFeedback: q.visaOfficerFeedback || null,
              score: q.score || null,
            },
          });
        }
      }
    }
    await appendTimeline({
      studentId: body.studentId,
      eventType: 'interview_session',
      title: `Interview session created (${session.interviewType})`,
      actorType: 'employee',
      metadata: { sessionId: session.id },
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Interview POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
