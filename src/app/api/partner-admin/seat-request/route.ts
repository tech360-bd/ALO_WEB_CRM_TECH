import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as any;

    const partnerId = auth.partnerId;
    if (!partnerId) return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });
    const requests = await db.partnerUserSeatRequest.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch seat requests', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as any;

    const body = await req.json();
    const { requestedExtraSeats, reason } = body;

    const partnerId = auth.partnerId;
    if (!partnerId) return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });
    const currentLimit = 3;

    const seatRequest = await db.partnerUserSeatRequest.create({
      data: {
        partnerId,
        requestedBy: auth.email || auth.userId,
        currentLimit,
        requestedExtraSeats: Number(requestedExtraSeats) || 2,
        reason: reason || 'Expanding counselor team for upcoming intake',
        status: 'pending',
      },
    });

    await db.integrationAuditLog.create({
      data: {
        actorId: auth.userId,
        actorName: auth.name || auth.email,
        actorRole: 'PARTNER_SUPER_ADMIN',
        action: 'PARTNER_SEAT_REQUEST_SUBMITTED',
        resourceType: 'PartnerUserSeatRequest',
        resourceId: seatRequest.id,
        metadata: JSON.stringify({ requestedExtraSeats, currentLimit }),
      },
    });

    return NextResponse.json({
      success: true,
      request: seatRequest,
      message: 'Extra user seat request submitted to ALO Super Admin for approval.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to submit seat request', details: error.message }, { status: 500 });
  }
}
