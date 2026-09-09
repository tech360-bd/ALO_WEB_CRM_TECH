import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'assigned';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (scope === 'assigned' && auth.userId) {
      where.counselorId = auth.userId;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const leads = await db.marketingLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      total: leads.length,
      leads: leads.map(l => ({ ...l, fullName: l.name })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch employee leads', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { fullName, name, phone, email, country, destination, level, intake } = body;
    const leadName = fullName || name;

    if (!leadName || !phone) {
      return NextResponse.json({ error: 'Full name and phone number are required.' }, { status: 400 });
    }

    const newLead = await db.marketingLead.create({
      data: {
        name: leadName,
        phone,
        email: email || '',
        destination: destination || country || 'United Kingdom',
        level: level || 'Undergraduate',
        intake: intake || 'Sep 2026',
        source: 'Walk-in / Direct Contact',
        counselorId: auth.userId,
        counselorName: auth.name || 'ALO Counselor',
        status: 'new',
        hotLead: true,
        score: 75,
      },
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: (auth.roles && auth.roles[0]) || 'COUNSELOR',
        action: 'LEAD_CREATED',
        targetCollection: 'MarketingLead',
        targetId: newLead.id,
        afterData: JSON.stringify({ name: leadName, phone, email }),
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      lead: { ...newLead, fullName: newLead.name },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create lead', details: error.message }, { status: 500 });
  }
}
