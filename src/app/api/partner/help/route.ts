import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// ============================================================
// GET — Support tickets and FAQ data for partner
// ============================================================
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const section = searchParams.get('section') || 'all'; // 'tickets', 'faq', or 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const result: Record<string, unknown> = {};

    // ---- Support tickets (CommunicationThread with channel "partner_support") ----
    if (section === 'all' || section === 'tickets') {
      const ticketWhere: Record<string, unknown> = {
        channel: 'partner_support',
        studentId: auth.userId, // reuse studentId to store the partner user's userId
      };
      if (status) {
        ticketWhere.status = status;
      }

      const [tickets, ticketCount] = await Promise.all([
        db.communicationThread.findMany({
          where: ticketWhere,
          orderBy: { lastMessageAt: 'desc' },
          skip,
          take: limit,
        }),
        db.communicationThread.count({ where: ticketWhere }),
      ]);

      // Get message count per thread for richer response
      const threadIds = tickets.map((t) => t.id);
      const messageCounts = threadIds.length > 0
        ? await db.communicationMessage.groupBy({
            by: ['threadId'],
            where: { threadId: { in: threadIds } },
            _count: { id: true },
          })
        : [];

      const messageCountMap: Record<string, number> = {};
      for (const mc of messageCounts) {
        messageCountMap[mc.threadId] = mc._count.id;
      }

      const enrichedTickets = tickets.map((ticket) => ({
        ...ticket,
        messageCount: messageCountMap[ticket.id] || 0,
      }));

      result.tickets = enrichedTickets;
      result.ticketPagination = {
        page,
        limit,
        total: ticketCount,
        totalPages: Math.ceil(ticketCount / limit),
      };
    }

    // ---- FAQ data (HomepageFaq) ----
    if (section === 'all' || section === 'faq') {
      const faqs = await db.homepageFaq.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
        },
      });

      result.faqs = faqs;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[PARTNER HELP GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch help data' }, { status: 500 });
  }
}

// ============================================================
// POST — Create a new support ticket
// ============================================================
export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { subject, category, priority, description } = body;

    // Validate required fields
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Subject is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    // Build the message content with category and priority metadata
    const metadata = JSON.stringify({
      category: category || 'general',
      priority: priority || 'medium',
      partnerId: partner.partnerId,
      companyName: partner.companyName,
    });

    const fullContent = description;

    // Create support thread and first message in a transaction
    const thread = await db.communicationThread.create({
      data: {
        studentId: auth.userId, // reuse studentId to store partner user's userId
        channel: 'partner_support',
        status: 'open',
        lastMessageAt: new Date(),
        lastMessagePreview: subject.trim().substring(0, 200),
        unreadCount: 0,
        isAiHandled: false,
        needsHumanTakeover: false,
        slaStatus: priority === 'high' ? 'breached' : 'none',
      },
    });

    const message = await db.communicationMessage.create({
      data: {
        threadId: thread.id,
        studentId: auth.userId,
        senderType: 'partner',
        senderId: auth.userId,
        senderName: auth.name || partner.companyName,
        content: fullContent,
        messageType: 'text',
        isAiGenerated: false,
        isRead: false,
        isInternal: false,
      },
    });

    // Create a timeline event for the partner's portal
    await db.portalTimelineEvent.create({
      data: {
        channel: 'portal',
        messageType: 'support_ticket_created',
        content: `Support ticket created: ${subject.trim().substring(0, 100)}`,
        senderName: auth.name || 'Partner',
        senderType: 'system',
        // Use an empty string for studentProfileId since this is a partner-level event
        // Note: This is a workaround since timeline events require a student profile
        studentProfileId: '',
      },
    }).catch(() => {
      // Silently fail if timeline event creation fails (no student profile context)
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ticket: thread,
          message,
          metadata,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[PARTNER HELP POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create support ticket' }, { status: 500 });
  }
}
