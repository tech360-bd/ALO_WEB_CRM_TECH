import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

const TICKET_CATEGORIES = new Set(['General Inquiry', 'Lead Issue', 'Application Problem', 'Commission Query', 'Technical Issue', 'Document Request', 'Visa Support', 'Other']);
const PRIORITIES = new Set(['Low', 'Medium', 'High', 'Urgent']);

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const partner = await db.partnerProfile.findUnique({ where: { userId: auth.userId }, select: { partnerId: true } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';
    const status = (searchParams.get('status') || '').trim();
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 20;
    const result: Record<string, unknown> = {};

    if (section === 'all' || section === 'tickets') {
      const ticketWhere: Record<string, unknown> = { channel: 'partner_support', studentId: auth.userId, partnerId: partner.partnerId };
      if (status) ticketWhere.status = status;
      const [tickets, ticketCount] = await Promise.all([
        db.communicationThread.findMany({
          where: ticketWhere,
          select: { id: true, subject: true, status: true, priority: true, intent: true, createdAt: true, updatedAt: true, lastMessageAt: true, lastMessagePreview: true, unreadCount: true },
          orderBy: { lastMessageAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.communicationThread.count({ where: ticketWhere }),
      ]);
      result.tickets = tickets;
      result.ticketPagination = { page, limit, total: ticketCount, totalPages: Math.ceil(ticketCount / limit) };
    }

    if (section === 'all' || section === 'faq') {
      result.faqs = await db.homepageFaq.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, question: true, answer: true, sortOrder: true },
        take: 100,
      });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[PARTNER HELP GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Partner help data is temporarily unavailable.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const partner = await db.partnerProfile.findUnique({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' && TICKET_CATEGORIES.has(body.category) ? body.category : '';
    const priority = typeof body.priority === 'string' && PRIORITIES.has(body.priority) ? body.priority : '';
    if (!subject || !category || !priority || !description) {
      return NextResponse.json({ success: false, error: 'Subject, category, priority and description are required.' }, { status: 400 });
    }
    if (subject.length > 200 || description.length > 5000) {
      return NextResponse.json({ success: false, error: 'Subject must be 200 characters or fewer and description 5,000 characters or fewer.' }, { status: 400 });
    }

    const data = await db.$transaction(async (tx) => {
      const ticket = await tx.communicationThread.create({
        data: {
          partnerId: partner.partnerId,
          studentId: auth.userId,
          channel: 'partner_support',
          subject,
          intent: category,
          priority: priority.toLowerCase(),
          status: 'open',
          visibility: 'partner_support',
          lastMessageAt: new Date(),
          lastMessagePreview: description.slice(0, 200),
          unreadCount: 0,
          isAiHandled: false,
          needsHumanTakeover: false,
          participants: { create: [{ participantId: partner.partnerId, participantType: 'partner' }, { participantId: auth.userId, participantType: 'partner_user' }] },
        },
        select: { id: true, subject: true, status: true, priority: true, intent: true, createdAt: true, lastMessageAt: true, lastMessagePreview: true },
      });
      const message = await tx.communicationMessage.create({
        data: {
          threadId: ticket.id,
          studentId: auth.userId,
          partnerId: partner.partnerId,
          senderType: 'partner',
          senderId: auth.userId,
          senderUserId: auth.userId,
          senderName: auth.name || partner.companyName,
          direction: 'outbound',
          source: 'portal',
          channel: 'partner_support',
          messageSubject: subject,
          content: description,
          messageBody: description,
          messageType: 'text',
          type: 'text',
          status: 'sent',
          deliveryStatus: 'sent',
          isRead: true,
          isInternal: false,
        },
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.userId, action: 'PARTNER_SUPPORT_TICKET_CREATED', entityType: 'CommunicationThread', entityId: ticket.id, metadata: JSON.stringify({ category, priority }) },
      });
      return { ticket, message };
    });

    return NextResponse.json({ success: true, data, message: 'Support ticket saved. You can continue the conversation in Messages.' }, { status: 201 });
  } catch (error) {
    console.error('[PARTNER HELP POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Support ticket could not be saved.' }, { status: 500 });
  }
}
