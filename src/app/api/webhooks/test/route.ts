import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { requireWebhookManagement } from '@/lib/webhooks/access';
import { writePortalAudit } from '@/lib/transactional-audit';
import { deliverWebhook } from '@/lib/webhooks';
const Input = z.object({ subscriptionId: z.string().trim().min(1).max(191) }).strict();
export const POST = withAuth(async (request: Request, auth) => {
    const denied = await requireWebhookManagement(auth, request, true);
    if (denied)
        return denied;
    const input = Input.safeParse(await request.json().catch(() => null));
    if (!input.success)
        return NextResponse.json({ success: false, error: 'A valid subscription ID is required.' }, { status: 400 });
    const subscription = await db.webhookSubscription.findUnique({ where: { id: input.data.subscriptionId }, select: { id: true, partnerId: true, active: true } });
    if (!subscription || (auth.userType === 'PARTNER' && subscription.partnerId !== auth.partnerId))
        return NextResponse.json({ success: false, error: 'Subscription not found.' }, { status: 404 });
    if (!subscription.active)
        return NextResponse.json({ success: false, error: 'Activate the subscription before requesting a test.' }, { status: 409 });
    try {
        const reservation = await db.$transaction(async (tx) => {
            const recent = await tx.webhookDelivery.findFirst({ where: { subscriptionId: subscription.id, eventType: 'webhook.test', createdAt: { gte: new Date(Date.now() - 60000) } }, select: { id: true } });
            if (recent)
                return null;
            const eventId = `webhook-test:${randomUUID()}`;
            const delivery = await tx.webhookDelivery.create({ data: { subscriptionId: subscription.id, eventId, eventType: 'webhook.test', payload: JSON.stringify({ id: eventId, event: 'webhook.test', occurredAt: new Date().toISOString(), data: { test: true, organization: 'ALO Education' } }), status: 'PENDING', attempts: 0, nextAttemptAt: new Date() } });
            await writePortalAudit(tx, auth, 'WEBHOOK_TEST_REQUESTED', 'WebhookDelivery', delivery.id, { subscriptionId: subscription.id, containsBusinessData: false }, request);
            return delivery;
        }, { isolationLevel: 'Serializable' });
        if (!reservation)
            return NextResponse.json({ success: false, error: 'One connectivity test per subscription per minute is allowed.' }, { status: 429, headers: { 'Retry-After': '60' } });
        const result = await deliverWebhook(reservation.id);
        await db.$transaction(async (tx) => { await writePortalAudit(tx, auth, 'WEBHOOK_TEST_COMPLETED', 'WebhookDelivery', reservation.id, { status: result.status, httpStatus: result.httpStatus, subscriptionId: subscription.id }, request); });
        return NextResponse.json({ success: true, delivered: result.status === 'DELIVERED', ...result }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch {
        return NextResponse.json({ success: false, error: 'Webhook test did not complete with verified persistence. Review its delivery log before retrying.' }, { status: 503 });
    }
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'EMPLOYEE'] });
