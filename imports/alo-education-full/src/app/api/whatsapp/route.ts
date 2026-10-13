import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// RBAC: SUPER_ADMIN, ADMIN, COUNSELOR, MARKETING_MANAGER
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'MARKETING_MANAGER'];

// GET — WhatsApp conversations and messages dashboard
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (!ALLOWED_ROLES.includes(auth.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied.' },
      { status: 403 },
    );
  }

  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, 50);

    const [messages, total, channelStats] = await Promise.all([
      // WhatsApp messages (most recent first)
      db.communicationMessage.findMany({
        where: { channel: 'WHATSAPP' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          studentId: true,
          leadId: true,
          direction: true,
          senderId: true,
          recipientId: true,
          content: true,
          messageType: true,
          status: true,
          error: true,
          externalId: true,
          createdAt: true,
        },
      }),

      // Total WhatsApp messages
      db.communicationMessage.count({ where: { channel: 'WHATSAPP' } }),

      // Stats by status
      db.communicationMessage.groupBy({
        by: ['status'],
        where: { channel: 'WHATSAPP' },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages,
        stats: {
          total,
          byStatus: channelStats.map((s) => ({ status: s.status, count: s._count })),
        },
      },
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching WhatsApp dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch WhatsApp data.' },
      { status: 500 },
    );
  }
}

// POST — Send WhatsApp message
// CONFIGURATION_REQUIRED: This stores the message in CommunicationMessage but does NOT call
// any external WhatsApp API (e.g. Twilio, Meta Business API). Integrate with your
// WhatsApp Business provider here.
const sendMessageSchema = z.object({
  studentId: z.string().optional(),
  leadId: z.string().optional(),
  recipientId: z.string().min(1, 'Recipient ID is required.'),
  content: z.string().min(1, 'Message content is required.'),
  messageType: z.string().optional().default('TEXT'),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (!ALLOWED_ROLES.includes(auth.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { studentId, leadId, recipientId, content, messageType } = parsed.data;

    // Store message in CommunicationMessage (outbound, status = QUEUED)
    const message = await db.communicationMessage.create({
      data: {
        studentId: studentId || null,
        leadId: leadId || null,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        senderId: auth.user.id,
        recipientId,
        content,
        messageType,
        status: 'QUEUED',
        metadata: JSON.stringify({ senderName: auth.user.name }),
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'SEND_WHATSAPP',
      resource: 'CommunicationMessage',
      resourceId: message.id,
      details: { studentId, leadId, recipientId, messageType },
    });

    // NOTE: External WhatsApp API integration goes here.
    // Update message.status to 'SENT' or 'FAILED' after API call.

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send WhatsApp message.' },
      { status: 500 },
    );
  }
}
