import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { getQuota } from '@/lib/access-check-engine';

// GET: List users in partner tenant
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const partnerId = (auth as any).partnerId || (auth as any).branch;
    if (!partnerId) return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });

    const users = await db.portalUser.findMany({
      where: {
        partnerProfile: { partnerId },
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const seatLimit = await getQuota('PARTNER', partnerId, 'user_seats');

    return NextResponse.json({
      success: true,
      partnerId,
      seatLimit,
      currentCount: users.length,
      users,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch partner users', details: error.message }, { status: 500 });
  }
}

// POST: Create partner employee within seat limit
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const partnerId = (auth as any).partnerId || (auth as any).branch;
    if (!partnerId) return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    // 1. Enforce Partner Max User Seat Limit (Default = 3)
    const seatLimit = await getQuota('PARTNER', partnerId, 'user_seats');
    const currentUsers = await db.portalUser.count({
      where: { partnerProfile: { partnerId } },
    });

    if (currentUsers >= seatLimit) {
      return NextResponse.json({
        error: 'Your current partner user limit has been reached. Please request additional seats from ALO Education.',
        currentCount: currentUsers,
        seatLimit,
      }, { status: 403 });
    }

    // 2. Check for duplicate email
    const existing = await db.portalUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    // 3. Create portal user and partner profile
    const newUser = await db.portalUser.create({
      data: {
        name,
        email,
        userType: 'PARTNER',
        status: 'active',
        passwordHash: '$2b$10$temporaryhashforpartnercreateduser',
        partnerProfile: {
          create: {
            partnerId,
            companyName: 'Partner Branch',
            contactPerson: name,
            approvalStatus: 'approved',
          },
        },
      },
    });

    // 4. Create Audit Log
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: 'PARTNER_SUPER_ADMIN',
        action: 'PARTNER_USER_CREATED',
        targetCollection: 'PortalUser',
        targetId: newUser.id,
        afterData: JSON.stringify({ name, email, userType: 'PARTNER', partnerId }),
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Partner employee user created successfully.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      seatUsage: {
        current: currentUsers + 1,
        limit: seatLimit,
        available: Math.max(0, seatLimit - (currentUsers + 1)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create partner user', details: error.message }, { status: 500 });
  }
}
