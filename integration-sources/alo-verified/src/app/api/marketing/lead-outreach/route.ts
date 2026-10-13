import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

const VALID_SOURCES = new Set([
  'official_db',
  'google_maps_compliant',
  'opted_in_form',
  'referral',
]);
const REJECTED_SOURCES = new Set(['illegal_scrape', 'scraped', 'unauthorized']);

/**
 * Compliant lead outreach.
 * - GET: list outreach (paginated, filterable).
 * - POST: create outreach record. Rejects illegal sources.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const source = searchParams.get('source');
    const consentStatus = searchParams.get('consentStatus');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (source) where.source = source;
    if (consentStatus) where.consentStatus = consentStatus;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      db.leadOutreach.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.leadOutreach.count({ where }),
    ]);

    await logAudit({
      userId: auth.user.id,
      action: 'marketing.lead_outreach.listed',
      module: 'marketing',
      newData: { filters: { source, consentStatus, channel, status }, total },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('marketing/lead-outreach GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { leadId, studentId, phone, email, source, consentStatus, channel } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'phone or email is required' },
        { status: 400 }
      );
    }
    if (source && REJECTED_SOURCES.has(source)) {
      return NextResponse.json(
        { error: 'Illegal source rejected. Compliance violation.' },
        { status: 400 }
      );
    }
    if (source && !VALID_SOURCES.has(source)) {
      return NextResponse.json(
        {
          error:
            'source must be one of: official_db, google_maps_compliant, opted_in_form, referral',
        },
        { status: 400 }
      );
    }
    if (!leadId && !studentId) {
      return NextResponse.json(
        { error: 'leadId or studentId is required' },
        { status: 400 }
      );
    }
    if (channel && !['whatsapp', 'sms', 'email', 'call'].includes(channel)) {
      return NextResponse.json(
        { error: "channel must be one of: whatsapp, sms, email, call" },
        { status: 400 }
      );
    }

    const record = await db.leadOutreach.create({
      data: {
        leadId: leadId || null,
        studentId: studentId || null,
        phone: phone || null,
        email: email || null,
        source: source || 'opted_in_form',
        consentStatus: consentStatus || 'pending',
        channel: channel || null,
        lastOutreachAt: new Date(),
        status: 'active',
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'lead_outreach.initiated',
      module: 'marketing',
      recordId: record.id,
      newData: record,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('marketing/lead-outreach POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
