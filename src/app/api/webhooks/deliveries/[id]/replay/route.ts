import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { replayDeadDelivery } from '@/lib/webhooks';

// ============================================================
// POST /api/webhooks/deliveries/[id]/replay
// Re-queue a DEAD/FAILED delivery. Tenant-checked from the stored row.
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];
type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (_request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const delivery = await db.webhookDelivery.findUnique({
    where: { id },
    include: { subscription: { select: { id: true, partnerId: true } } },
  });
  if (!delivery) {
    return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
  }

  const isAdmin = ADMIN_TYPES.includes(auth.userType);
  if (!isAdmin) {
    if (auth.userType !== 'PARTNER' || !auth.partnerId) {
      return NextResponse.json({ success: false, error: 'Insufficient access level.' }, { status: 403 });
    }
    if (delivery.subscription.partnerId !== auth.partnerId) {
      return NextResponse.json({ success: false, error: 'TENANT_MISMATCH' }, { status: 403 });
    }
  }

  if (delivery.status === 'DELIVERED') {
    // Replaying an already-delivered event would double-send. Refuse instead of
    // silently creating a duplicate (spec s90 idempotency).
    return NextResponse.json(
      { success: false, error: 'Delivery already succeeded; nothing to replay' },
      { status: 409 },
    );
  }

  const updated = await replayDeadDelivery(id);
  await logAuditAction(auth, 'WEBHOOK_DELIVERY_REPLAYED', 'WebhookDelivery', id, {
    previousStatus: delivery.status,
  });
  return NextResponse.json({ success: true, delivery: { id: updated.id, status: updated.status } });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER'] });
