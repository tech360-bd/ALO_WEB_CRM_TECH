import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import type { AuthContext } from '@/lib/auth-middleware';

async function authenticatedPartner(req: NextRequest): Promise<AuthContext | NextResponse> {
  const result = await authenticateRequest(req);
  if (result instanceof NextResponse) return result;
  if (result.userType !== 'PARTNER' || !result.partnerId) {
    return NextResponse.json({ success: false, error: 'Approved partner identity is required.' }, { status: 403 });
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticatedPartner(req);
    if (auth instanceof NextResponse) return auth;
    const partner = await db.partnerProfile.findFirst({
      where: { userId: auth.userId, partnerId: auth.partnerId, approvalStatus: { in: ['approved', 'active'] } },
      select: { id: true, partnerId: true },
    });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner tenant not found.' }, { status: 403 });

    const users = await db.portalUser.findMany({
      where: { partnerProfile: { partnerId: partner.partnerId } },
      select: { id: true, name: true, email: true, userType: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, partnerId: partner.partnerId, currentCount: users.length, users });
  } catch {
    return NextResponse.json({ success: false, error: 'Partner users are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticatedPartner(req);
  if (auth instanceof NextResponse) return auth;
  // PartnerProfile.partnerId is currently a one-user/one-profile relation and
  // no secure membership/invitation model exists. Do not create shared-tenant
  // users with a fabricated password or duplicate tenant ID.
  return NextResponse.json({
    success: false,
    error: 'Additional partner seats are not supported until tenant membership and secure invitations are configured.',
  }, { status: 501 });
}
