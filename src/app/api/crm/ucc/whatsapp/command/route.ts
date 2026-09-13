import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// GET: Fetch WhatsApp threads with SLA info and student context
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '25');
      const status = searchParams.get('status') || '';
      const slaFilter = searchParams.get('sla') || ''; // overdue|warning|normal
      const search = searchParams.get('search') || '';

      const where: any = { channel: 'whatsapp' };
      if (status) where.status = status;
      if (slaFilter) where.slaStatus = slaFilter;
      if (search) {
        where.OR = [
          { lastMessagePreview: { contains: search } },
          { studentId: { contains: search } },
        ];
      }

      const [threads, total] = await Promise.all([
        db.communicationThread.findMany({
          where,
          orderBy: [{ slaStatus: 'desc' }, { lastMessageAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        }),
        db.communicationThread.count({ where }),
      ]);

      // Attach student context for matched threads
      const enriched = await Promise.all(threads.map(async (t) => {
        let studentContext: any = null;
        if (t.studentId) {
          studentContext = await db.student.findUnique({
            where: { id: t.studentId },
            select: {
              id: true, studentId: true, name: true, phone: true,
              email: true, counselorName: true,
            },
          }).catch(() => null);
        }

        // Calculate live SLA countdown
        const now = new Date();
        let slaRemainingMs: number | null = null;
        let slaOverdueMs: number | null = null;
        if (t.slaDueAt) {
          const diff = t.slaDueAt.getTime() - now.getTime();
          if (diff > 0) slaRemainingMs = diff;
          else slaOverdueMs = Math.abs(diff);
        }

        return { ...t, studentContext, slaRemainingMs, slaOverdueMs };
      }));

      const stats = {
        total,
        overdue: await db.communicationThread.count({ where: { channel: 'whatsapp', slaStatus: 'overdue' } }),
        warning: await db.communicationThread.count({ where: { channel: 'whatsapp', slaStatus: 'warning' } }),
        unread: await db.communicationThread.count({ where: { channel: 'whatsapp', unreadCount: { gt: 0 } } }),
      };

      return NextResponse.json({ success: true, threads: enriched, total, page, stats });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}

// POST: Send WhatsApp message (human or AI-approved)
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { threadId, content, mode, isAiGenerated, aiApprovedBy, templateName, attachmentId } = body;

      if (!threadId || !content) {
        return NextResponse.json({ success: false, error: 'threadId and content required' }, { status: 400 });
      }

      // For high-risk modes, AI draft must be human-approved
      if (isAiGenerated && !aiApprovedBy && mode !== 'ai_draft_only') {
        return NextResponse.json({ success: false, error: 'AI_APPROVAL_REQUIRED: Human approval needed before sending AI-generated message.' }, { status: 403 });
      }

      const thread = await db.communicationThread.findUnique({ where: { id: threadId } });
      if (!thread) return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });

      // Record message in DB
      const message = await db.communicationMessage.create({
        data: {
          threadId,
          channel: 'whatsapp',
          direction: 'outbound',
          senderUserId: auth.userId || '',
          senderName: auth.name || '',
          studentId: thread.studentId,
          applicationId: thread.applicationId,
          content,
          messageBody: content,
          isAiGenerated: isAiGenerated || false,
          aiApprovedBy: aiApprovedBy || '',
          status: 'sent',
          deliveryStatus: 'sent',
          type: 'text',
          messageType: templateName ? 'template' : 'text',
        },
      });

      // Update thread
      await db.communicationThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 120),
          status: 'in_progress',
        },
      });

      // Mark SLA event as responded if exists
      await db.communicationSlaEvent.updateMany({
        where: { threadId, slaStatus: { not: 'resolved' } },
        data: {
          receivedAt: new Date(),
          slaStatus: 'resolved',
          resolvedAt: new Date(),
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message,
        note: isAiGenerated ? 'AI_GENERATED_DRAFT_SENT_WITH_HUMAN_APPROVAL' : 'MESSAGE_SENT',
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}
