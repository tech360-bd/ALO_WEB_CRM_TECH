import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Manage the 3 approved marketing users (MarketingUserAccess).
 * - marketing_manager / super_admin only.
 * - Enforces MAX 3 active records.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const accessRecords = await db.marketingUserAccess.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            profilePhoto: true,
            userType: true,
            status: true,
          },
        },
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'marketing.approved_user.listed',
      module: 'marketing',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      accessRecords,
      activeCount: accessRecords.length,
      maxAllowed: 3,
    });
  } catch (error) {
    console.error('marketing/access GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { userId, accessLevel } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (accessLevel && !['limited', 'full'].includes(accessLevel)) {
      return NextResponse.json(
        { error: "accessLevel must be 'limited' or 'full'" },
        { status: 400 }
      );
    }

    // Verify user exists
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already an active approved marketing user
    const existing = await db.marketingUserAccess.findUnique({ where: { userId } });
    if (existing && existing.status === 'active') {
      return NextResponse.json(
        { error: 'User already has active marketing access', access: existing },
        { status: 409 }
      );
    }

    // Enforce MAX 3 active records
    const activeCount = await db.marketingUserAccess.count({
      where: { status: 'active' },
    });
    if (activeCount >= 3) {
      return NextResponse.json(
        { error: 'Only 3 approved marketing users allowed' },
        { status: 409 }
      );
    }

    // Find linked employee record (if any)
    const employee = await db.employee.findUnique({ where: { userId } });

    // If existing revoked record, reactivate; else create new
    let access;
    if (existing && existing.status === 'revoked') {
      access = await db.marketingUserAccess.update({
        where: { id: existing.id },
        data: {
          accessLevel: accessLevel || 'limited',
          employeeId: employee?.id || null,
          approvedBy: auth.user.id,
          approvedAt: new Date(),
          status: 'active',
        },
      });
    } else {
      access = await db.marketingUserAccess.create({
        data: {
          userId,
          employeeId: employee?.id || null,
          accessLevel: accessLevel || 'limited',
          approvedBy: auth.user.id,
          approvedAt: new Date(),
          status: 'active',
        },
      });
    }

    await logAudit({
      userId: auth.user.id,
      action: 'marketing.approved_user.granted',
      module: 'marketing',
      recordId: access.id,
      newData: { userId, accessLevel: access.accessLevel, approvedBy: auth.user.id },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ access }, { status: 201 });
  } catch (error) {
    console.error('marketing/access POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    // Accept userId from query OR body
    let userId: string | undefined;
    const { searchParams } = new URL(request.url);
    userId = searchParams.get('userId') || undefined;

    if (!userId) {
      try {
        const body = await request.json();
        userId = body.userId;
      } catch {
        // body may be empty — ignore
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const existing = await db.marketingUserAccess.findUnique({ where: { userId } });
    if (!existing || existing.status !== 'active') {
      return NextResponse.json(
        { error: 'No active marketing access for this user' },
        { status: 404 }
      );
    }

    const access = await db.marketingUserAccess.update({
      where: { id: existing.id },
      data: { status: 'revoked' },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'marketing.approved_user.revoked',
      module: 'marketing',
      recordId: access.id,
      oldData: { userId, previousStatus: 'active' },
      newData: { userId, status: 'revoked' },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ access, revoked: true });
  } catch (error) {
    console.error('marketing/access DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
