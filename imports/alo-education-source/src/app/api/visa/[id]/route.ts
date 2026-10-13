import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  Valid statuses & decisions                                         */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = [
  'PREPARATION',
  'SUBMITTED',
  'BIOMETRICS',
  'PROCESSING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
];

const VALID_DECISIONS = ['APPROVED', 'REJECTED', 'PENDING'];

/* ------------------------------------------------------------------ */
/*  PATCH — Update visa status/decision                                 */
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
    const { status, decision, country, visaType, submissionDate, notes } = body;

    const existing = await db.visaApplication.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Visa record not found.' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 },
        );
      }
      data.status = status;
    }

    if (decision !== undefined) {
      if (!VALID_DECISIONS.includes(decision)) {
        return NextResponse.json(
          { error: `Invalid decision. Must be one of: ${VALID_DECISIONS.join(', ')}` },
          { status: 400 },
        );
      }
      data.decision = decision;
      if (decision === 'APPROVED') {
        data.decisionDate = new Date();
      }
    }

    if (typeof country === 'string') data.country = country.trim() || null;
    if (typeof visaType === 'string') data.visaType = visaType.trim() || null;
    if (submissionDate) data.submissionDate = new Date(submissionDate);
    if (typeof notes === 'string') data.notes = notes.trim() || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const record = await db.visaApplication.update({
      where: { id },
      data,
      include: { application: { select: { id: true, applicationId: true, university: true, country: true } } },
    });

    return NextResponse.json({ success: true, visaRecord: record });
  } catch (error) {
    console.error('Error updating visa record:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
