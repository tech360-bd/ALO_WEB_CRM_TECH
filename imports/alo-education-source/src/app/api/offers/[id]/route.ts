import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/audit';

/* ------------------------------------------------------------------ */
/*  Valid statuses                                                      */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = [
  'RECEIVED',
  'CONDITIONAL',
  'UNCONDITIONAL',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
];

/* ------------------------------------------------------------------ */
/*  PATCH — Update offer status                                         */
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

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const existing = await db.offer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });
    }

    const data: Record<string, unknown> = { status };
    if (status === 'ACCEPTED') {
      data.acceptedAt = new Date();
    }
    if (status === 'DECLINED') {
      data.declinedAt = new Date();
    }
    if (typeof notes === 'string' && notes.trim()) {
      data.notes = notes.trim();
    }

    const offer = await db.offer.update({
      where: { id },
      data,
      include: { application: { select: { id: true, applicationId: true, university: true, course: true } } },
    });

    logAudit({
      action: 'STATUS_CHANGE',
      entity: 'Offer',
      entityId: offer.id,
      oldValue: existing.status,
      newValue: status,
    }).catch(() => {});

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
