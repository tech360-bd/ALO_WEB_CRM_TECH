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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

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
    const { studentName, studentEmail, studentPhone, destinationCountry, studyLevel, intake, notes, source } = body;

    if (!studentName || !studentPhone) {
      return NextResponse.json({ success: false, error: 'Student name and phone are required' }, { status: 400 });
    }

    const lead = await db.partnerLead.create({
      data: {
        partnerId: profile.partnerId,
        studentName: studentName || '',
        studentEmail: studentEmail || '',
        studentPhone: studentPhone || '',
        destinationCountry: destinationCountry || '',
        studyLevel: studyLevel || '',
        intake: intake || '',
        notes: notes || '',
        source: source || 'partner',
        status: 'new',
      },
    });

    // Update lead count on profile
    await db.partnerProfile.update({
      where: { userId: auth.userId },
      data: { totalLeads: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('[PARTNER LEADS] POST error:', error);
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 });
  }
}
