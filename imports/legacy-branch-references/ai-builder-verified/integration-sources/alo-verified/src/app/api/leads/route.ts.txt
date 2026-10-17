import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { counselorScope } from '@/lib/auth-rbac';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const temperature = searchParams.get('temperature') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { leadId: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = assignedTo;
    if (temperature) where.temperature = temperature;

    // ── RBAC scoping ──────────────────────────────────────────────────
    // counselorScope returns non-null for counselor/junior_counselor roles,
    // restricting visibility to their own assigned records.
    // Lead.assignedTo stores Employee.id (= auth.user.referenceId for employees).
    // Partner users see only leads sourced through their partnerId.
    const scope = counselorScope(auth);
    if (scope?.assignedCounselor) {
      where.assignedTo = auth.user.referenceId;
    } else if (auth.user.userType === 'partner') {
      where.partnerId = auth.user.referenceId;
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          counselor: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
          notes_relation: { take: 3, orderBy: { createdAt: 'desc' } },
        }
      }),
      db.lead.count({ where })
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Generate lead ID
    const lastLead = await db.lead.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { leadId: true }
    });
    let nextNum = 1;
    if (lastLead?.leadId) {
      const parts = lastLead.leadId.split('-');
      if (parts.length >= 2) {
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }
    }
    const leadId = `LEAD-${new Date().getFullYear()}${nextNum.toString().padStart(4, '0')}`;

    const lead = await db.lead.create({
      data: {
        leadId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        whatsappNumber: body.whatsappNumber || null,
        source: body.source || 'website',
        sourceId: body.sourceId || null,
        partnerId: body.partnerId || null,
        preferredCountry: body.preferredCountry || null,
        preferredCourse: body.preferredCourse || null,
        preferredIntake: body.preferredIntake || null,
        englishTestType: body.englishTestType || null,
        englishTestScore: body.englishTestScore || null,
        highestEducation: body.highestEducation || null,
        notes: body.notes || null,
        status: body.status || 'new',
        temperature: body.temperature || 'warm',
        assignedTo: body.assignedTo || null,
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      },
      include: {
        counselor: true,
      }
    });

    // Add initial note if provided
    if (body.notes) {
      await db.leadNote.create({
        data: {
          leadId: lead.id,
          note: body.notes,
          noteType: 'general',
          addedBy: body.addedBy || null,
        }
      });
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
