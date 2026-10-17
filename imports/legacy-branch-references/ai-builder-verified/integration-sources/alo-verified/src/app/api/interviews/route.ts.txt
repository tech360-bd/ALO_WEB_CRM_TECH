import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const counselorId = searchParams.get('counselorId') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (counselorId) where.counselorId = counselorId;
    if (type) where.interviewType = type;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.scheduledAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      db.interviewSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.interviewSession.count({ where }),
    ]);

    // Fetch questions and feedbacks separately since no relation is defined on InterviewSession
    const sessionIds = sessions.map(s => s.id);
    const [questions, feedbacks] = await Promise.all([
      db.interviewQuestion.findMany({
        where: { sessionId: { in: sessionIds } },
        orderBy: { createdAt: 'asc' },
      }),
      db.interviewFeedback.findMany({
        where: { sessionId: { in: sessionIds } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Attach questions and feedbacks to sessions manually
    const sessionsWithRelations = sessions.map(session => ({
      ...session,
      questions: questions.filter(q => q.sessionId === session.id),
      feedbacks: feedbacks.filter(f => f.sessionId === session.id),
    }));

    const [students, counselors] = await Promise.all([
      db.student.findMany({
        select: { id: true, firstName: true, lastName: true, email: true },
        take: 100,
        orderBy: { firstName: 'asc' },
      }),
      db.employee.findMany({
        where: { role: { in: ['counselor', 'junior_counselor'] } },
        select: { id: true, firstName: true, lastName: true, email: true },
        take: 50,
        orderBy: { firstName: 'asc' },
      }),
    ]);

    return NextResponse.json({
      sessions: sessionsWithRelations,
      students,
      counselors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Interviews GET error:', error);
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

    if (!body.studentId || !body.interviewType) {
      return NextResponse.json(
        { error: 'Student ID and interview type are required' },
        { status: 400 }
      );
    }

    const session = await db.interviewSession.create({
      data: {
        studentId: body.studentId,
        counselorId: body.counselorId || null,
        interviewType: body.interviewType,
        country: body.country || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        meetingLink: body.meetingLink || null,
        meetingType: body.meetingType || 'manual',
        notes: body.notes || null,
        status: body.status || 'scheduled',
      } as any,
    });

    // Fetch related questions and feedbacks separately
    const [questions, feedbacks] = await Promise.all([
      db.interviewQuestion.findMany({ where: { sessionId: session.id } }),
      db.interviewFeedback.findMany({ where: { sessionId: session.id } }),
    ]);

    return NextResponse.json({ ...session, questions, feedbacks }, { status: 201 });
  } catch (error) {
    console.error('Interviews POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.counselorId !== undefined) updateData.counselorId = body.counselorId;
    if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (body.meetingLink !== undefined) updateData.meetingLink = body.meetingLink;
    if (body.meetingType) updateData.meetingType = body.meetingType;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.feedback !== undefined) updateData.feedback = body.feedback;
    if (body.score !== undefined) updateData.score = body.score;
    if (body.completedAt) updateData.completedAt = new Date(body.completedAt);

    const session = await db.interviewSession.update({
      where: { id: body.id },
      data: updateData,
    });

    if (body.feedbackEntries && Array.isArray(body.feedbackEntries)) {
      for (const entry of body.feedbackEntries) {
        await db.interviewFeedback.create({
          data: {
            sessionId: body.id,
            questionId: entry.questionId || null,
            answer: entry.answer || null,
            rating: entry.rating || null,
            feedback: entry.feedback || null,
            improvementTips: entry.improvementTips || null,
          } as any,
        });
      }
    }

    // Fetch related questions and feedbacks separately
    const [questions, feedbacks] = await Promise.all([
      db.interviewQuestion.findMany({ where: { sessionId: body.id }, orderBy: { createdAt: 'asc' } }),
      db.interviewFeedback.findMany({ where: { sessionId: body.id }, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({ ...session, questions, feedbacks });
  } catch (error) {
    console.error('Interviews PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await db.interviewSession.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Interviews DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
