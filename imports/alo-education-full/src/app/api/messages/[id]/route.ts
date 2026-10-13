import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  PATCH — Mark a message as read                                     */
/* ------------------------------------------------------------------ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;

    const existing = await db.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    if (existing.status === 'READ') {
      const message = await db.message.findUnique({
        where: { id },
        include: {
          sender: { select: { id: true, name: true, email: true, avatar: true } },
          recipient: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });
      return NextResponse.json({ success: true, message });
    }

    const message = await db.message.update({
      where: { id },
      data: { status: 'READ' },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        recipient: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
