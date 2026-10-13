import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  Valid appointment statuses                                         */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];

/* ------------------------------------------------------------------ */
/*  PATCH — Update appointment status / notes                           */
/* ------------------------------------------------------------------ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    // Check appointment exists
    const existing = await db.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    // Build update data
    const data: Record<string, unknown> = {};

    if (typeof status === 'string' && status.trim()) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 },
        );
      }
      data.status = status;
    }

    if (typeof notes === 'string') {
      data.notes = notes.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 },
      );
    }

    const appointment = await db.appointment.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
