import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { deliveryStats } from '@/lib/webhooks';

// ============================================================
// GET /api/webhooks/deliveries — delivery log with real outcomes
// Partners see only their own tenant's deliveries (spec s69).
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];

export const GET = withAuth(async (request: Request, auth) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  const eventType = url.searchParams.get('eventType') || undefined;
  const subscriptionId = url.searchParams.get('subscriptionId') || undefined;
  const take = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200);
  const skip = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);

  const isPartner = auth.userType === 'PARTNER';
  if (isPartner && !auth.partnerId) {
    return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });
  }

  // Resolve tenant-owned subscription ids first so a partner can never page
  // through another tenant's delivery log by omitting the filter.
  let allowedSubscriptionIds: string[] | undefined;
  if (isPartner) {
    const owned = await db.webhookSubscription.findMany({
      where: { partnerId: auth.partnerId as string },
      select: { id: true },
    });
    allowedSubscriptionIds = owned.map((row) => row.id);
    if (allowedSubscriptionIds.length === 0) {
      return NextResponse.json({ success: true, deliveries: [], total: 0, stats: null });
    }
  }

  const where = {
    ...(status ? { status } : {}),
    ...(eventType ? { eventType } : {}),
    ...(subscriptionId ? { subscriptionId } : {}),
    ...(allowedSubscriptionIds ? { subscriptionId: { in: allowedSubscriptionIds } } : {}),
  };

  const [deliveries, total] = await Promise.all([
    db.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: {
        id: true,
        subscriptionId: true,
        eventId: true,
        eventType: true,
        status: true,
        attempts: true,
        responseStatus: true,
        responseBody: true,
        errorMessage: true,
        durationMs: true,
        lastAttemptAt: true,
        nextAttemptAt: true,
        createdAt: true,
      },
    }),
    db.webhookDelivery.count({ where }),
  ]);

  const stats = ADMIN_TYPES.includes(auth.userType) ? await deliveryStats(7) : null;

  return NextResponse.json({ success: true, deliveries, total, limit: take, offset: skip, stats });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER', 'EMPLOYEE'] });
