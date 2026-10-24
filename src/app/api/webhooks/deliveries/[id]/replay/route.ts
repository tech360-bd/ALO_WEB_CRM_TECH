import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { requireWebhookManagement } from '@/lib/webhooks/access';
import { writePortalAudit } from '@/lib/transactional-audit';
type Context = {
    params: Promise<{
        id: string;
    }>;
};
export const POST = withAuth(async (request: Request, auth, context: Context) => {
    const denied = await requireWebhookManagement(auth, request, true);
    if (denied)
        return denied;
    const { id } = await context.params;
    if (!id || id.length > 191)
        return NextResponse.json({ success: false, error: 'Invalid delivery ID.' }, { status: 400 });
    const delivery = await db.webhookDelivery.findUnique({ where: { id }, include: { subscription: { select: { partnerId: true } } } });
    if (!delivery || (auth.userType === 'PARTNER' && delivery.subscription.partnerId !== auth.partnerId))
        return NextResponse.json({ success: false, error: 'Delivery not found.' }, { status: 404 });
    if (!['FAILED', 'DEAD'].includes(delivery.status))
        return NextResponse.json({ success: false, error: 'Only failed/dead deliveries can be replayed.' }, { status: 409 });
    const queued = await db.$transaction(async (tx) => {
        const changed = await tx.webhookDelivery.updateMany({ where: { id, status: { in: ['FAILED', 'DEAD'] } }, data: { status: 'PENDING', attempts: 0, nextAttemptAt: new Date(), errorMessage: null } });
        if (changed.count !== 1)
            return false;
        await writePortalAudit(tx, auth, 'WEBHOOK_DELIVERY_REPLAYED', 'WebhookDelivery', id, { previousStatus: delivery.status, status: 'PENDING' }, request);
        return true;
    });
    if (!queued)
        return NextResponse.json({ success: false, error: 'Delivery changed before replay; reload its status.' }, { status: 409 });
    return NextResponse.json({ success: true, delivery: { id, status: 'PENDING' } }, { headers: { 'Cache-Control': 'private, no-store' } });
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'EMPLOYEE'] });
