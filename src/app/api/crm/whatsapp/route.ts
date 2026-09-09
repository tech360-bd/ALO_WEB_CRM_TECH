import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM WHATSAPP API — WhatsApp-specific threads & templates
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || '';
      const assignedTo = searchParams.get('assignedTo') || '';
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      const where: Record<string, unknown> = { channel: 'whatsapp' };
      if (status) where.status = status;
      if (assignedTo) where.assignedToId = assignedTo;
      if (unreadOnly) where.unreadCount = { gt: 0 };

      const [data, total] = await Promise.all([
        db.communicationThread.findMany({
          where,
          orderBy: { lastMessageAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.communicationThread.count({ where }),
      ]);

      const totalWa = await db.communicationThread.count({ where: { channel: 'whatsapp' } });
      const unreadWa = await db.communicationThread.count({ where: { channel: 'whatsapp', unreadCount: { gt: 0 } } });

      return NextResponse.json({
        success: true, data, total, page,
        totalPages: Math.ceil(total / limit),
        meta: { totalWhatsApp: totalWa, unreadWhatsApp: unreadWa },
      });
    } catch (error) {
      console.error('WhatsApp GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load WhatsApp threads' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { threadId, templateName, templateParams, content } = body;

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
          messageType: 'text',
          isRead: true,
          isInternal: false,
        },
      });

      await db.communicationThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date(), lastMessagePreview: content.substring(0, 100) },
      });

      await logAuditAction(auth, 'send_whatsapp_template', 'CommunicationMessage', message.id, {
        threadId, templateName, templateParams,
      });

      return NextResponse.json({ success: true, data: message }, { status: 201 });
    } catch (error) {
      console.error('WhatsApp POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to send WhatsApp message' }, { status: 500 });
    }
  })(request);
}
