import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE MESSAGES API
// GET  — List CommunicationThread + messages for assigned threads
// POST — Send a new message in a thread
// PUT  — Mark messages as read
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const threadId = searchParams.get('threadId') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');

      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      // Get all threads assigned to this employee
      const whereClause: Record<string, unknown> = {
        assignedToId: employeeId,
      };

      const [threads, totalThreads] = await Promise.all([
        db.communicationThread.findMany({
          where: whereClause,
          orderBy: { lastMessageAt: 'desc' },
          take: 100,
        }),
        db.communicationThread.count({ where: whereClause }),
      ]);

      // If a specific threadId is requested, fetch its messages
      let messages: unknown[] = [];
      if (threadId) {
        const [threadMessages, messageCount] = await Promise.all([
          db.communicationMessage.findMany({
            where: { threadId },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.communicationMessage.count({ where: { threadId } }),
        ]);
        messages = threadMessages;
      }

      // Calculate total unread count across all assigned threads
      const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

      return NextResponse.json({
        success: true,
        data: {
          threads,
          totalThreads,
          totalUnread,
          messages,
        },
      });
    } catch (error) {
      console.error('Employee messages GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: { threads: [], totalThreads: 0, totalUnread: 0, messages: [] },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load messages' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { threadId, studentId, content, messageType, fileUrl, fileName, isInternal } = body;

      if (!threadId || !content) {
        return NextResponse.json(
          { success: false, error: 'threadId and content are required' },
          { status: 400 }
        );
      }

      // Verify thread is assigned to this employee
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      const thread = await db.communicationThread.findUnique({
        where: { id: threadId },
      });

      if (!thread) {
        return NextResponse.json(
          { success: false, error: 'Thread not found' },
          { status: 404 }
        );
      }

      // Create the message
      const message = await db.communicationMessage.create({
        data: {
          threadId,
          studentId: studentId || thread.studentId || '',
          senderType: 'counselor',
          senderId: employeeId,
          senderName: auth.name,
          content,
          messageType: messageType || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          isAiGenerated: false,
          isRead: true,
          isInternal: isInternal || false,
        },
      });

      // Update thread with last message info
      await db.communicationThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 100),
          updatedAt: new Date(),
        },
      });

      await logAuditAction(auth, 'send_message', 'CommunicationMessage', message.id, {
        threadId,
        messageType: messageType || 'text',
        isInternal: isInternal || false,
      });

      return NextResponse.json({
        success: true,
        data: message,
        message: 'Message sent successfully',
      });
    } catch (error) {
      console.error('Employee messages POST error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { threadId, messageIds } = body;

      if (!threadId || !messageIds || !Array.isArray(messageIds)) {
        return NextResponse.json(
          { success: false, error: 'threadId and messageIds array are required' },
          { status: 400 }
        );
      }

      // Mark messages as read
      const result = await db.communicationMessage.updateMany({
        where: {
          id: { in: messageIds },
          threadId,
          senderType: { not: 'counselor' }, // Only mark incoming messages as read
        },
        data: { isRead: true },
      });

      // Reset unread count on thread if all messages are read
      if (result.count > 0) {
        const remainingUnread = await db.communicationMessage.count({
          where: {
            threadId,
            isRead: false,
            senderType: { not: 'counselor' },
          },
        });

        await db.communicationThread.update({
          where: { id: threadId },
          data: { unreadCount: remainingUnread, updatedAt: new Date() },
        });
      }

      await logAuditAction(auth, 'mark_messages_read', 'CommunicationThread', threadId, {
        messageCount: result.count,
      });

      return NextResponse.json({
        success: true,
        data: { markedCount: result.count },
        message: `${result.count} messages marked as read`,
      });
    } catch (error) {
      console.error('Employee messages PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }
  })(request);
}
