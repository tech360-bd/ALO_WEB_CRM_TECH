import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { requireWebhookManagement } from '@/lib/webhooks/access';
import { writePortalAudit } from '@/lib/transactional-audit';
import { deliveryStats } from '@/lib/webhooks';
// ============================================================
// GET /api/webhooks/deliveries — delivery log with real outcomes
// Partners see only their own tenant's deliveries (spec s69).
// ============================================================
const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];
export const GET = withAuth(async (request: Request, auth) => {
    const denied = await requireWebhookManagement(auth, request);
    if (denied)
        return denied;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const eventType = url.searchParams.get('eventType') || undefined;
    const subscriptionId = url.searchParams.get('subscriptionId') || undefined;
    const take = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200);
    const skip = Number(url.searchParams.get('offset') ?? 0);
    const rawLimit = Number(url.searchParams.get('limit') ?? 50);
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 200 || !Number.isInteger(skip) || skip < 0 || skip > 100000 || (status && !['PENDING', 'DELIVERED', 'FAILED', 'DEAD'].includes(status)) || (eventType && eventType.length > 100) || (subscriptionId && subscriptionId.length > 191))
        return NextResponse.json({ success: false, error: 'Invalid delivery filters or pagination.' }, { status: 400 });
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
        if (subscriptionId && !allowedSubscriptionIds.includes(subscriptionId))
            return NextResponse.json({ success: false, error: 'Subscription not found.' }, { status: 404 });
        if (subscriptionId)
            allowedSubscriptionIds = [subscriptionId];
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
    const stats = !isPartner ? await deliveryStats(7) : null;
    await db.$transaction(async (tx) => { await writePortalAudit(tx, auth, 'WEBHOOK_DELIVERIES_VIEWED', 'WebhookDelivery', auth.partnerId || 'authorized-global', { count: deliveries.length }, request); });
    return NextResponse.json({ success: true, deliveries, total, limit: take, offset: skip, stats }, { headers: { 'Cache-Control': 'private, no-store' } });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER', 'EMPLOYEE'] });
