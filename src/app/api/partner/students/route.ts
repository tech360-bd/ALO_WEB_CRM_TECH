import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// GET: actual student profiles linked to the authenticated partner tenant.
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    if (!['approved', 'active'].includes(partner.approvalStatus.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Partner account approval is required to access student records.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 20;
    const stage = (searchParams.get('stage') || searchParams.get('status') || '').trim().slice(0, 80);
    const country = (searchParams.get('destinationCountry') || searchParams.get('destination') || '').trim().slice(0, 100);
    const query = (searchParams.get('search') || '').trim().slice(0, 100);

    const where: Record<string, unknown> = { partnerId: partner.partnerId };
    if (stage && stage !== 'all') where.journeyStage = stage;
    if (country && country !== 'All') where.preferredCountry = { contains: country };
    if (query) {
      where.OR = [
        { fullName: { contains: query } },
        { studentId: { contains: query } },
        { user: { is: { email: { contains: query } } } },
      ];
    }

    const [students, total] = await Promise.all([
      db.portalStudentProfile.findMany({
        where,
        select: {
          id: true,
          studentId: true,
          fullName: true,
          preferredCountry: true,
          preferredLevel: true,
          preferredSubject: true,
          preferredIntake: true,
          journeyStage: true,
          profileCompletion: true,
          counselorName: true,
          updatedAt: true,
          user: { select: { email: true, phone: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.portalStudentProfile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /partner/students]', error);
    return NextResponse.json({ success: false, error: 'Could not load partner student records.' }, { status: 500 });
  }
}

// POST is retained for legacy integrations that still submit referrals here.
// New partner UI submissions use /api/partner/leads; this does not create or
// impersonate an enrolled student profile.
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    if (!['approved', 'active'].includes(partner.approvalStatus.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Partner account approval is required to submit referrals.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim() : '';
    const studentEmail = typeof body.studentEmail === 'string' ? body.studentEmail.trim() : '';
    const studentPhone = typeof body.studentPhone === 'string' ? body.studentPhone.trim() : '';
    if (!studentName || !studentEmail || !studentPhone) {
      return NextResponse.json({ success: false, error: 'Student name, email and phone are required.' }, { status: 400 });
    }
    if (studentName.length > 200 || studentEmail.length > 254 || studentPhone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      return NextResponse.json({ success: false, error: 'Referral fields are invalid or too long.' }, { status: 400 });
    }

    const lead = await db.$transaction(async (tx) => {
      const created = await tx.partnerLead.create({
        data: {
          partnerId: partner.partnerId,
          partnerName: partner.companyName,
          studentName,
          studentEmail,
          studentPhone,
          destinationCountry: typeof body.destinationCountry === 'string' ? body.destinationCountry.trim().slice(0, 100) : '',
          studyLevel: typeof body.studyLevel === 'string' ? body.studyLevel.trim().slice(0, 100) : '',
          intake: typeof body.intake === 'string' ? body.intake.trim().slice(0, 100) : '',
          notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 5000) : '',
          source: 'partner',
          status: 'new',
        },
      });
      await tx.partnerProfile.updateMany({
        where: { partnerId: partner.partnerId },
        data: { totalLeads: { increment: 1 } },
      });
      return created;
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error('[POST /partner/students]', error);
    return NextResponse.json({ success: false, error: 'Could not submit referral.' }, { status: 500 });
  }
}
