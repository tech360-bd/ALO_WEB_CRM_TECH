import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 50;

    const where: Record<string, unknown> = { partnerId: profile.partnerId };
    if (status && status !== 'all') where.status = status;

    const [leads, total] = await Promise.all([
      db.partnerLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.partnerLead.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: leads, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[PARTNER LEADS] GET error:', error);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const body = await request.json();
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim() : '';
    const studentPhone = typeof body.studentPhone === 'string' ? body.studentPhone.trim() : '';
    const studentEmail = typeof body.studentEmail === 'string' ? body.studentEmail.trim() : '';
    const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.trim() : '';
    const studyLevel = typeof body.studyLevel === 'string' ? body.studyLevel.trim() : '';
    const intake = typeof body.intake === 'string' ? body.intake.trim() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (!studentName || !studentPhone || !destinationCountry) {
      return NextResponse.json({ success: false, error: 'Student name, phone and destination are required' }, { status: 400 });
    }
    if (studentName.length > 200 || studentPhone.length > 40 || studentEmail.length > 254 || destinationCountry.length > 100 || studyLevel.length > 100 || intake.length > 100 || notes.length > 5000) {
      return NextResponse.json({ success: false, error: 'One or more fields exceed the allowed length' }, { status: 400 });
    }
    if (studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      return NextResponse.json({ success: false, error: 'Enter a valid student email address' }, { status: 400 });
    }

    const lead = await db.$transaction(async (tx) => {
      const created = await tx.partnerLead.create({
        data: {
          partnerId: profile.partnerId,
          partnerName: profile.companyName,
          studentName,
          studentEmail,
          studentPhone,
          destinationCountry,
          studyLevel,
          intake,
          notes,
          source: 'partner',
          status: 'new',
        },
      });

      await tx.partnerProfile.updateMany({
        where: { partnerId: profile.partnerId },
        data: { totalLeads: { increment: 1 } },
      });
      return created;
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error('[PARTNER LEADS] POST error:', error);
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 });
  }
}
