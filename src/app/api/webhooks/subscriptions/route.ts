import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireWebhookManagement } from '@/lib/webhooks/access';
import { privateWebhookHostAllowed } from '@/lib/webhooks/transport';
import { WEBHOOK_EVENTS, createSubscription, listSubscriptions, validateWebhookUrl } from '@/lib/webhooks';
const types = ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'EMPLOYEE'];
const Input = z.object({ name: z.string().trim().min(1).max(190), targetUrl: z.string().trim().url().max(191), events: z.array(z.string().max(80)).min(1).max(50), secret: z.string().min(32).max(256).optional(), active: z.boolean().optional(), environment: z.enum(['production', 'staging', 'development']).optional(), partnerId: z.string().max(191).nullable().optional(), branchId: z.string().max(191).nullable().optional(), maxRetries: z.number().int().min(0).max(10).optional(), timeoutMs: z.number().int().min(1000).max(60000).optional(), description: z.string().max(1900).optional(), allowPrivateHost: z.boolean().optional() }).strict();
export const GET = withAuth(async (request: Request, auth) => {
    const denied = await requireWebhookManagement(auth, request);
    if (denied)
        return denied;
    try {
        const subscriptions = await listSubscriptions(auth.userType === 'PARTNER' ? { partnerId: auth.partnerId! } : {});
        await db.$transaction(async (tx) => { await writePortalAudit(tx, auth, 'WEBHOOK_SUBSCRIPTIONS_VIEWED', 'WebhookSubscription', auth.partnerId || 'authorized-global', { count: subscriptions.length }, request); });
        return NextResponse.json({ success: true, events: WEBHOOK_EVENTS, subscriptions, count: subscriptions.length, configured: subscriptions.length > 0 }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch {
        return NextResponse.json({ success: false, error: 'Webhook subscriptions are unavailable.' }, { status: 503 });
    }
}, { requireUserTypes: types });
export const POST = withAuth(async (request: Request, auth) => {
    const denied = await requireWebhookManagement(auth, request, true);
    if (denied)
        return denied;
    const input = Input.safeParse(await request.json().catch(() => null));
    if (!input.success)
        return NextResponse.json({ success: false, error: 'Invalid webhook subscription fields.' }, { status: 400 });
    const partner = auth.userType === 'PARTNER';
    const allowPrivateHost = !partner && input.data.allowPrivateHost === true && privateWebhookHostAllowed(input.data.targetUrl);
    const target = validateWebhookUrl(input.data.targetUrl, allowPrivateHost);
    if (!target.valid)
        return NextResponse.json({ success: false, error: `Webhook target rejected: ${target.reason}` }, { status: 400 });
    try {
        const result = await db.$transaction(async (tx) => {
            const created = await createSubscription({ ...input.data, partnerId: partner ? auth.partnerId : input.data.partnerId, branchId: partner ? null : input.data.branchId, allowPrivateHost, actorId: auth.actorUserId }, tx);
            await writePortalAudit(tx, auth, 'WEBHOOK_SUBSCRIPTION_CREATED', 'WebhookSubscription', created.subscription.id, { eventCount: input.data.events.length, partnerId: created.subscription.partnerId }, request);
            return created;
        });
        return NextResponse.json({ success: true, ...result }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch {
        return NextResponse.json({ success: false, error: 'Webhook subscription could not be saved.' }, { status: 503 });
    }
}, { requireUserTypes: types });
