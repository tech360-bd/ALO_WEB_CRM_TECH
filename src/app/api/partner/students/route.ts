import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// GET: Get students associated with this partner (from PartnerLead, deduplicated by email)
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const studyLevel = searchParams.get('studyLevel') || undefined;
    const destinationCountry = searchParams.get('destinationCountry') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { partnerId: partner.partnerId };
    if (status) where.status = status;
    if (studyLevel) where.studyLevel = studyLevel;
    if (destinationCountry) where.destinationCountry = destinationCountry;

    const [leads, total] = await Promise.all([
      db.partnerLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.partnerLead.count({ where }),
    ]);

    // Deduplicate by email, keeping the most recent record
    const seen = new Map<string, typeof leads[0]>();
    for (const lead of leads) {
      if (lead.studentEmail && !seen.has(lead.studentEmail)) {
        seen.set(lead.studentEmail, lead);
      }
    }
    const deduplicated = Array.from(seen.values());

    return NextResponse.json({
      success: true,
      data: deduplicated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /partner/students]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add new student association (create PartnerLead)
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });

    const body = await request.json();
    const { studentName, studentEmail, studentPhone, destinationCountry, studyLevel, intake, notes, source } = body;

    if (!studentName || !studentEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentName, studentEmail' },
        { status: 400 },
      );
    }

    const lead = await db.partnerLead.create({
      data: {
        partnerId: partner.partnerId,
        studentName,
        studentEmail,
        studentPhone: studentPhone || null,
        destinationCountry: destinationCountry || null,
        studyLevel: studyLevel || null,
        intake: intake || null,
        notes: notes || null,
        source: source || 'partner',
        status: 'new',
      },
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error('[POST /partner/students]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
