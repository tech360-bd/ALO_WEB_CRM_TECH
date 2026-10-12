import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  Valid review actions                                               */
/* ------------------------------------------------------------------ */

const VALID_ACTIONS = ['approve_review', 'request_changes', 'reject'] as const;
type ReviewAction = (typeof VALID_ACTIONS)[number];

/* ------------------------------------------------------------------ */
/*  POST — Human review: approve / request changes / reject             */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { error, user } = await requireRole(req, ['SUPER_ADMIN', 'ADMIN']);
    if (error) return error;

    const body = await req.json();
    const { visaId, action, notes, internalNotes } = body as {
      visaId?: string;
      action?: ReviewAction;
      notes?: string;
      internalNotes?: string;
    };

    // Validate
    if (!visaId || typeof visaId !== 'string') {
      return NextResponse.json({ error: 'visaId is required.' }, { status: 400 });
    }
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 },
      );
    }

    const existing = await db.visaApplication.findUnique({
      where: { id: visaId },
      include: { application: { select: { id: true, university: true, country: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Visa record not found.' }, { status: 404 });
    }

    // Only PREPARATION or READY can be reviewed
    if (existing.status !== 'PREPARATION' && existing.status !== 'READY') {
      return NextResponse.json(
        { error: `Cannot review visa in status: ${existing.status}. Must be PREPARATION or READY.` },
        { status: 400 },
      );
    }

    const userId = user?.id || null;
    const data: Record<string, unknown> = {
      reviewedById: userId,
      reviewedAt: new Date(),
    };

    if (typeof notes === 'string' && notes.trim()) {
      data.reviewNotes = notes.trim();
    }
    if (typeof internalNotes === 'string' && internalNotes.trim()) {
      data.internalNotes = internalNotes.trim();
    }

    switch (action) {
      case 'approve_review': {
        // Human review approved → move to READY for submission
        data.status = 'READY';
        break;
      }
      case 'request_changes': {
        // Send back to PREPARATION with notes
        data.status = 'PREPARATION';
        break;
      }
      case 'reject': {
        // Withdraw the application
        data.status = 'WITHDRAWN';
        if (typeof notes === 'string' && notes.trim()) {
          data.refusedReason = notes.trim();
        }
        break;
      }
    }

    const record = await db.visaApplication.update({
      where: { id: visaId },
      data,
      include: {
        application: { select: { id: true, applicationId: true, university: true, country: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, visaRecord: record });
  } catch (error) {
    console.error('Error reviewing visa:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
