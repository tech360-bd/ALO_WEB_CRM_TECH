import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  Valid statuses                                                      */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = ['PENDING', 'REQUESTED', 'RECEIVED', 'CANCELLED'];

/* ------------------------------------------------------------------ */
/*  GET — List CAS records                                              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (applicationId) where.applicationId = applicationId;
    if (status && VALID_STATUSES.includes(status)) where.status = status;

    const records = await db.cASRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ casRecords: records });
  } catch (error) {
    console.error('Error fetching CAS records:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create CAS record                                            */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { applicationId, casNumber, casDate, conditions, notes } = body;

    if (!applicationId || typeof applicationId !== 'string') {
      return NextResponse.json({ error: 'applicationId is required.' }, { status: 400 });
    }

    // Verify application exists
    const app = await db.application.findUnique({ where: { id: applicationId } });
    if (!app) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const record = await db.cASRecord.create({
      data: {
        applicationId,
        casNumber: typeof casNumber === 'string' ? casNumber.trim() || null : null,
        casDate: casDate ? new Date(casDate) : null,
        conditions: typeof conditions === 'string' ? conditions.trim() || null : null,
        notes: typeof notes === 'string' ? notes.trim() || null : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, casRecord: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating CAS record:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
