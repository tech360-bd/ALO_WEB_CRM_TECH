// ============================================================
// /api/crm/ucc/conversations/[id]/notes
// GET  — Fetch all internal notes for a conversation
// POST — Add a new internal note (visible only to staff)
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const notes = await db.uccMessage.findMany({
      where: { conversationId: id, direction: 'internal_note' },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, notes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const { content } = await request.json() as { content: string };

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Note content is required.' }, { status: 400 });
    }

    const conv = await db.uccConversation.findUnique({ where: { id } });
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    const note = await db.uccMessage.create({
      data: {
        conversationId: id,
        direction: 'internal_note',
        senderId: auth.userId,
        senderName: auth.name || auth.email || 'Staff',
        senderRole: 'employee',
        channel: conv.channel,
        content: content.trim(),
        messageType: 'text',
        status: 'sent',
        metadata: JSON.stringify({ addedAt: new Date().toISOString(), senderEmail: auth.email }),
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
