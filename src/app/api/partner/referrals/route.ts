import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// GET: Get referrals made by this partner
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { referrerId: auth.userId };
    if (status) {
      where.status = status;
    }

    const [referrals, total] = await Promise.all([
      db.studentReferral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.studentReferral.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: referrals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /partner/referrals]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new referral
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });

    const body = await request.json();
    const { referredStudentEmail, destinationCountry, referredByName } = body;

    if (!referredStudentEmail || !destinationCountry) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: referredStudentEmail, destinationCountry' },
        { status: 400 },
      );
    }

    // Check for duplicate referral
    const existing = await db.studentReferral.findFirst({
      where: {
        referrerId: auth.userId,
        referredEmail: referredStudentEmail,
        status: { not: 'rejected' },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A referral for this student already exists' },
        { status: 409 },
      );
    }

    const referral = await db.studentReferral.create({
      data: {
        referrerId: auth.userId,
        referredName: String(referredByName || partner.companyName || ''),
        referredEmail: String(referredStudentEmail || ''),
        destinationCountry: String(destinationCountry || ''),
        status: 'pending',
        reward: 0,
      },
    });

    return NextResponse.json({ success: true, data: referral }, { status: 201 });
  } catch (error) {
    console.error('[POST /partner/referrals]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update referral status
export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { id, status, reward } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, status' },
        { status: 400 },
      );
    }

    const validStatuses = ['pending', 'accepted', 'enrolled', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const referral = await db.studentReferral.findUnique({ where: { id } });
    if (!referral) {
      return NextResponse.json({ success: false, error: 'Referral not found' }, { status: 404 });
    }

    const updated = await db.studentReferral.update({
      where: { id },
      data: {
        status,
        ...(reward !== undefined ? { reward } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PUT /partner/referrals]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
