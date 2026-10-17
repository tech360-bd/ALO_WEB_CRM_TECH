import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * Public website chat. No auth.
 * - Creates a WebsiteChatSession + first visitor message.
 * - If after office hours OR AI mode is enabled, returns a rule-based greeting.
 * - Audits `public.website_chat_started`.
 */
function isWithinOfficeHours(
  businessHoursStart: string,
  businessHoursEnd: string,
  timezone: string
): boolean {
  try {
    const now = new Date();
    // Format current time in the configured timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const currentMinutes = hour * 60 + minute;

    const [startH, startM] = businessHoursStart.split(':').map((v) => parseInt(v, 10));
    const [endH, endM] = businessHoursEnd.split(':').map((v) => parseInt(v, 10));
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch {
    // On any TZ error, assume within office hours (don't block the chat)
    return true;
  }
}

function ruleBasedGreeting(visitorName?: string): string {
  const name = visitorName ? ` ${visitorName}` : '';
  return [
    `Hi${name}! Thanks for reaching out to ALO Education.`,
    '',
    'I\'m your virtual assistant. I can help you with:',
    '• Study abroad programs (UK, Canada, Australia, USA)',
    '• University applications & visa guidance',
    '• IELTS/PTE/TOEFL preparation',
    '• Course selection & scholarships',
    '',
    'Please leave your name and phone number — a counselor will contact you within business hours (10:00–18:00, Sat–Thu).',
    'Or call us directly at 01805020100.',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, visitorName, visitorPhone, visitorEmail, source, message } = body;

    if (!visitorId) {
      return NextResponse.json(
        { error: 'visitorId is required' },
        { status: 400 }
      );
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Load global AI config to decide if bot should greet
    const aiConfig = await db.whatsappAiConfig.findFirst({
      where: { scope: 'global' },
      orderBy: { createdAt: 'desc' },
    });

    const businessHoursStart = aiConfig?.businessHoursStart || '10:00';
    const businessHoursEnd = aiConfig?.businessHoursEnd || '18:00';
    const timezone = aiConfig?.timezone || 'Asia/Dhaka';

    const withinOfficeHours = isWithinOfficeHours(
      businessHoursStart,
      businessHoursEnd,
      timezone
    );

    const aiEnabled = aiConfig?.aiEnabled ?? true;
    const officeHoursOnly = aiConfig?.officeHoursOnly ?? true;

    // Bot should respond if AI is enabled AND (NOT officeHoursOnly OR within office hours)
    const botShouldRespond =
      aiEnabled && (!officeHoursOnly || withinOfficeHours);

    // Create chat session
    const session = await db.websiteChatSession.create({
      data: {
        visitorId,
        visitorName: visitorName || null,
        visitorPhone: visitorPhone || null,
        visitorEmail: visitorEmail || null,
        source: source || 'homepage',
        status: 'active',
        startedAt: new Date(),
      },
    });

    // Save visitor message
    await db.websiteChatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'visitor',
        message: message.trim(),
        messageType: 'text',
      },
    });

    // Bot greeting or after-hours system message
    let botMessage: string | null = null;
    if (botShouldRespond) {
      botMessage = ruleBasedGreeting(visitorName);
      await db.websiteChatMessage.create({
        data: {
          sessionId: session.id,
          sender: 'bot',
          message: botMessage,
          messageType: 'text',
        },
      });
    } else {
      // After-hours system message
      botMessage =
        `Thanks for reaching out! Our office is currently closed (business hours: ${businessHoursStart}–${businessHoursEnd}, ${timezone}). ` +
        'Please leave your name and phone number — a counselor will contact you during the next business day. ' +
        'For urgent enquiries, call 01805020100.';
      await db.websiteChatMessage.create({
        data: {
          sessionId: session.id,
          sender: 'system',
          message: botMessage,
          messageType: 'text',
        },
      });
    }

    await logAudit({
      userId: undefined,
      action: 'public.website_chat_started',
      module: 'public',
      recordId: session.id,
      newData: {
        sessionId: session.id,
        visitorId,
        visitorName: visitorName || null,
        withinOfficeHours,
        botResponded: botShouldRespond,
        source: source || 'homepage',
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        session,
        botReply: botMessage,
        withinOfficeHours,
        botHandled: botShouldRespond,
        officeHours: `${businessHoursStart}–${businessHoursEnd} ${timezone}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('public/chat POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow fetching a session by visitorId (no auth — public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    const sessionId = searchParams.get('sessionId');

    if (!visitorId && !sessionId) {
      return NextResponse.json(
        { error: 'visitorId or sessionId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {};
    if (sessionId) where.id = sessionId;
    if (visitorId) where.visitorId = visitorId;

    const sessions = await db.websiteChatSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        // TypeORM-style: include messages — Prisma doesn't have a relation defined
        // (WebsiteChatSession has no @relation field), so we fetch separately below.
      },
    });

    const sessionIds = sessions.map((s) => s.id);
    const messages = sessionIds.length
      ? await db.websiteChatMessage.findMany({
          where: { sessionId: { in: sessionIds } },
          orderBy: { createdAt: 'asc' },
        })
      : [];

    const messagesBySession = new Map<string, typeof messages>();
    for (const m of messages) {
      const arr = messagesBySession.get(m.sessionId) ?? [];
      arr.push(m);
      messagesBySession.set(m.sessionId, arr);
    }

    const result = sessions.map((s) => ({
      ...s,
      messages: messagesBySession.get(s.id) ?? [],
    }));

    return NextResponse.json({ sessions: result });
  } catch (error) {
    console.error('public/chat GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
