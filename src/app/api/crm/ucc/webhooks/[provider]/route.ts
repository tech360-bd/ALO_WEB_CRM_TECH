// ============================================================
// /api/crm/ucc/webhooks/[provider]
// GET, POST — Universal Provider Webhook Endpoint
// Handlers for Meta (WhatsApp/FB/IG), Telegram, Google, Custom Gateways
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { db } from '@/lib/db';

// GET — Webhook Verification (e.g. Meta hub.verify_token)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);

    if (provider === 'whatsapp' || provider === 'meta_business' || provider === 'facebook_page' || provider === 'instagram') {
      const mode = searchParams.get('hub.mode');
      const token = searchParams.get('hub.verify_token');
      const challenge = searchParams.get('hub.challenge');

      const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'alo_education_verify_token_2026';

      if (mode === 'subscribe' && token === expectedToken) {
        return new Response(challenge, { status: 200 });
      }
      return new Response('Verification failed', { status: 403 });
    }

    return NextResponse.json({ success: true, provider, status: 'listening' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Inbound Webhook Payload Processing
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const bodyText = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = { raw: bodyText };
    }

    // Record Webhook Event in DB
    const webhookEvent = await db.uccWebhookEvent.create({
      data: {
        provider,
        eventType: body.entry?.[0]?.changes?.[0]?.field || body.event || 'incoming_message',
        payload: JSON.stringify(body),
        status: 'processed',
      },
    });

    // Auto-Process Inbound WhatsApp / Meta Message
    if (provider === 'whatsapp' || provider === 'meta_business') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (message) {
        const fromPhone = message.from;
        const msgText = message.text?.body || '[Attachment Received]';
        const senderName = change?.contacts?.[0]?.profile?.name || `Phone ${fromPhone}`;

        // Find or create conversation
        let conversation = await db.uccConversation.findFirst({
          where: { participantPhone: `+${fromPhone}` },
        });

        if (!conversation) {
          conversation = await db.uccConversation.create({
            data: {
              channel: 'whatsapp',
              externalId: fromPhone,
              participantName: senderName,
              participantPhone: `+${fromPhone}`,
              status: 'open',
              lastMessageText: msgText,
              lastMessageAt: new Date(),
              unreadCount: 1,
            },
          });
        }

        // Save Inbound Message
        await db.uccMessage.create({
          data: {
            conversationId: conversation.id,
            direction: 'inbound',
            senderName,
            senderRole: 'student',
            channel: 'whatsapp',
            content: msgText,
            messageType: message.type || 'text',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      provider,
      eventId: webhookEvent.id,
      message: 'Webhook payload received and processed.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
