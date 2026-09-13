import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const GET = withStudentAuth(async (request, auth) => {
  try {
    const [studentMessages, applicationComments] = await Promise.all([
      db.studentMessage.findMany({
        where: { studentId: auth.studentId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.applicationComment.findMany({
        where: { applicationId: { in: (await db.application.findMany({ where: { studentId: auth.studentId }, select: { id: true } })).map((application) => application.id) }, commentType: 'student_visible' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    ]);

    // Map to a common format
    const allMessages = [
      ...studentMessages.map(m => ({
        id: m.id,
        type: 'message',
        senderType: m.senderType,
        senderName: m.senderName,
        content: m.message,
        isRead: m.isRead,
        createdAt: m.createdAt,
        applicationId: null,
      })),
      ...applicationComments.map(c => ({
        id: c.id,
        type: 'application_comment',
        senderType: c.role || "counselor",
        senderName: c.role || "ALO Education",
        content: c.commentText,
        isRead: false,
        createdAt: c.createdAt,
        applicationId: c.applicationId,
      }))
    ];

    allMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const top50 = allMessages.slice(0, 50);

    // Mark unread messages as read
    const unreadStudentMessages = top50.filter(m => m.type === 'message' && !m.isRead).map(m => m.id);


    return NextResponse.json({ success: true, data: top50 });
  } catch (error) {
    console.error('Messages GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
});

export const POST = withStudentAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
    }

    const newMessage = await db.studentMessage.create({
      data: {
        studentId: auth.studentId,
        senderType: 'student',
        senderName: auth.name,
        message,
        channel: 'portal',
        isRead: true, // sender is student, so it's read by student
      }
    });

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Messages POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
});
