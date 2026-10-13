import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  Valid statuses                                                      */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = ['PENDING', 'UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'];

/* ------------------------------------------------------------------ */
/*  PATCH — Update document status                                      */
/* ------------------------------------------------------------------ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError, user } = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason, notes } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const existing = await db.applicationDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const data: Record<string, unknown> = { status };

    // When REJECTED, rejectionReason is required
    if (status === 'REJECTED') {
      if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
        return NextResponse.json(
          { error: 'rejectionReason is required when status is REJECTED.' },
          { status: 400 },
        );
      }
      data.rejectionReason = rejectionReason.trim();
    }

    // When VERIFIED, set verifiedBy and verifiedAt
    if (status === 'VERIFIED') {
      const userId = user!.id;
      data.verifiedBy = userId;
      data.verifiedAt = new Date();
    }

    if (typeof notes === 'string') {
      data.notes = notes.trim() || null;
    }

    const document = await db.applicationDocument.update({
      where: { id },
      data,
      include: {
        application: { select: { id: true, applicationId: true, university: true, course: true } },
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
