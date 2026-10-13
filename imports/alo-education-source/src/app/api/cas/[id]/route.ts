import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  Valid statuses                                                      */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = ['PENDING', 'REQUESTED', 'RECEIVED', 'CANCELLED'];

/* ------------------------------------------------------------------ */
/*  PATCH — Update CAS status                                           */
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
    const { status, casNumber, casDate, conditions, notes } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const existing = await db.cASRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'CAS record not found.' }, { status: 404 });
    }

    const data: Record<string, unknown> = { status };
    if (typeof casNumber === 'string' && casNumber.trim()) data.casNumber = casNumber.trim();
    if (casDate) data.casDate = new Date(casDate);
    if (typeof conditions === 'string') data.conditions = conditions.trim() || null;
    if (typeof notes === 'string') data.notes = notes.trim() || null;

    const record = await db.cASRecord.update({ where: { id }, data });

    return NextResponse.json({ success: true, casRecord: record });
  } catch (error) {
    console.error('Error updating CAS record:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
