import { NextResponse } from 'next/server';

export async function GET() {
  const channelsData = {
    channels: [
      { id: 'whatsapp', name: 'WhatsApp', status: 'connected', unreadCount: 5, businessPhone: '+91 98765 43210' },
      { id: 'email', name: 'Email', status: 'connected', unreadCount: 2, account: 'counselor@aloeducation.com' },
      { id: 'sms', name: 'SMS', status: 'connected', unreadCount: 0, provider: 'Twilio' },
      { id: 'telegram', name: 'Telegram', status: 'connected', unreadCount: 3, botName: '@ALOEducationBot' },
    ],
    conversations: [
      { id: 'c1', name: 'Rahul Sharma', channel: 'whatsapp', lastMessage: 'Thank you for the UK university list!', unread: 2, time: '2 min ago' },
      { id: 'c2', name: 'Priya Patel', channel: 'email', lastMessage: 'SOP draft for review', unread: 1, time: '15 min ago' },
      { id: 'c3', name: 'Vikram Singh', channel: 'telegram', lastMessage: 'Can you send me the scholarship form?', unread: 3, time: '3 hrs ago' },
    ],
    templates: [
      { id: 't1', name: 'Welcome Message', channel: ['whatsapp', 'telegram'], category: 'Greeting' },
      { id: 't2', name: 'Document Request', channel: ['whatsapp', 'email', 'sms'], category: 'Application' },
      { id: 't3', name: 'Appointment Reminder', channel: ['whatsapp', 'sms'], category: 'Scheduling' },
    ],
    broadcastSegments: [
      { id: 'all', name: 'All Students', count: 1240 },
      { id: 'uk-bound', name: 'UK Bound Students', count: 320 },
      { id: 'australia-bound', name: 'Australia Bound', count: 280 },
      { id: 'canada-bound', name: 'Canada Bound', count: 195 },
    ],
    totalUnread: 10,
  };

  return NextResponse.json(channelsData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, message, channel } = body;

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'conversationId and message are required' }, { status: 400 });
    }

    // In production, this would send via the appropriate channel
    return NextResponse.json({
      success: true,
      messageId: `msg_${Date.now()}`,
      conversationId,
      channel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
