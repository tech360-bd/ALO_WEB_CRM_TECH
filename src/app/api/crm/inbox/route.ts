import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM INBOX API — CommunicationThread management
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const channel = searchParams.get('channel') || '';
      const status = searchParams.get('status') || '';
      const assignedTo = searchParams.get('assignedTo') || '';
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const search = searchParams.get('search') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      const where: Record<string, unknown> = {};
      if (channel) where.channel = channel;
      if (status) where.status = status;
      if (assignedTo) where.assignedToId = assignedTo;
      if (unreadOnly) where.unreadCount = { gt: 0 };
      if (search) {
        where.OR = [
          { studentId: { contains: search } },
          { assignedToName: { contains: search } },
          { lastMessagePreview: { contains: search } },
        ];
      }

      const [data, total] = await Promise.all([
        db.communicationThread.findMany({
          where,
          orderBy: { lastMessageAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.communicationThread.count({ where }),
      ]);

      const [totalUnread, openCount, escalatedCount] = await Promise.all([
        db.communicationThread.count({ where: { unreadCount: { gt: 0 } } }),
        db.communicationThread.count({ where: { status: 'open' } }),
        db.communicationThread.count({ where: { status: 'escalated' } }),
      ]);

      return NextResponse.json({
        success: true,
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        meta: { totalUnread, openCount, escalatedCount },
      });
    } catch (error) {
      console.error('Inbox GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load inbox' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, action, assignedToId, assignedToName, status, markRead } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: 'Thread id is required' }, { status: 400 });
      }

      const existing = await db.communicationThread.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};

      if (action === 'assign' && assignedToId) {
        updateData.assignedToId = assignedToId;
        updateData.assignedToName = assignedToName || '';
        updateData.status = 'open';
      }

      if (action === 'mark_read' || markRead) {
        updateData.unreadCount = 0;
        await db.communicationMessage.updateMany({
          where: { threadId: id, isRead: false },
          data: { isRead: true },
        });
      }

      if (status) updateData.status = status;

      const thread = await db.communicationThread.update({ where: { id }, data: updateData });

      await logAuditAction(auth, `inbox_${action || 'update'}`, 'CommunicationThread', id, {
        before: { status: existing.status, assignedToId: existing.assignedToId },
        after: updateData,
      });

      return NextResponse.json({ success: true, data: thread });
    } catch (error) {
      console.error('Inbox PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update thread' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { threadId, content, messageType, isInternal } = body;

      if (!threadId || !content) {
        return NextResponse.json({ success: false, error: 'threadId and content are required' }, { status: 400 });
      }

      const thread = await db.communicationThread.findUnique({ where: { id: threadId } });
      if (!thread) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
      }

      const message = await db.communicationMessage.create({
        data: {
          threadId,
          studentId: thread.studentId,
          senderType: 'counselor',
          senderId: auth.userId,
          senderName: auth.name,
          content,
          messageType: messageType || 'text',
          isRead: true,
          isInternal: isInternal || false,
        },
      });

      await db.communicationThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 100),
        },
      });

      await logAuditAction(auth, 'send_message', 'CommunicationMessage', message.id, {
        threadId, messageType, isInternal,
      });

      return NextResponse.json({ success: true, data: message }, { status: 201 });
    } catch (error) {
      console.error('Inbox POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
    }
  })(request);
}
