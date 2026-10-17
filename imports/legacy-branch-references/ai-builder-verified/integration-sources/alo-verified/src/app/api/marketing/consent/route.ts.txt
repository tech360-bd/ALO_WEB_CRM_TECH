import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingAccess } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

const VALID_OWNER_TYPES = new Set(['STUDENT', 'PARTNER', 'LEAD']);

/**
 * Communication preferences + opt-out management.
 * GET: list preferences for an owner (query: ownerType, ownerId).
 * POST/PUT: upsert preferences.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const ownerType = searchParams.get('ownerType');
    const ownerId = searchParams.get('ownerId');

    if (!ownerType || !ownerId) {
      return NextResponse.json(
        { error: 'ownerType and ownerId are required' },
        { status: 400 }
      );
    }
    if (!VALID_OWNER_TYPES.has(ownerType)) {
      return NextResponse.json(
        { error: 'ownerType must be STUDENT, PARTNER, or LEAD' },
        { status: 400 }
      );
    }

    const preference = await db.communicationPreference.findUnique({
      where: {
        ownerType_ownerId: { ownerType, ownerId },
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'marketing.consent.viewed',
      module: 'marketing',
      recordId: ownerId,
      newData: { ownerType, ownerId },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ preference });
  } catch (error) {
    console.error('marketing/consent GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const {
      ownerType,
      ownerId,
      whatsappAllowed,
      smsAllowed,
      emailAllowed,
      phoneAllowed,
      marketingAllowed,
      transactionalAllowed,
      consentSource,
    } = body;

    if (!ownerType || !ownerId) {
      return NextResponse.json(
        { error: 'ownerType and ownerId are required' },
        { status: 400 }
      );
    }
    if (!VALID_OWNER_TYPES.has(ownerType)) {
      return NextResponse.json(
        { error: 'ownerType must be STUDENT, PARTNER, or LEAD' },
        { status: 400 }
      );
    }

    const existing = await db.communicationPreference.findUnique({
      where: { ownerType_ownerId: { ownerType, ownerId } },
    });

    // Merge defaults — preserve unspecified channels
    const data = {
      whatsappAllowed: whatsappAllowed ?? existing?.whatsappAllowed ?? true,
      smsAllowed: smsAllowed ?? existing?.smsAllowed ?? true,
      emailAllowed: emailAllowed ?? existing?.emailAllowed ?? true,
      phoneAllowed: phoneAllowed ?? existing?.phoneAllowed ?? true,
      marketingAllowed: marketingAllowed ?? existing?.marketingAllowed ?? true,
      transactionalAllowed:
        transactionalAllowed ?? existing?.transactionalAllowed ?? true,
      consentSource: consentSource ?? existing?.consentSource ?? 'manual',
      optOutAt:
        marketingAllowed === false && !existing?.optOutAt ? new Date() : existing?.optOutAt,
    };

    const preference = existing
      ? await db.communicationPreference.update({
          where: { id: existing.id },
          data,
        })
      : await db.communicationPreference.create({
          data: { ownerType, ownerId, ...data },
        });

    await logAudit({
      userId: auth.user.id,
      action: 'marketing.consent.upserted',
      module: 'marketing',
      recordId: preference.id,
      oldData: existing ?? null,
      newData: preference,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ preference }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('marketing/consent POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Alias to POST for upsert semantics
  return POST(request);
}
