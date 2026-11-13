import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireWebhookManagement } from '@/lib/webhooks/access';
import { privateWebhookHostAllowed } from '@/lib/webhooks/transport';
import { normalizeEventList, redactSubscription, rotateSubscriptionSecret, validateWebhookUrl } from '@/lib/webhooks';
const types = ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'EMPLOYEE'];
type Context = {
    params: Promise<{
        id: string;
    }>;
};
async function owned(id: string, auth: AuthContext) {
    if (!id || id.length > 191)
        return null;
    const row = await db.webhookSubscription.findUnique({ where: { id } });
    return row && (auth.userType !== 'PARTNER' || row.partnerId === auth.partnerId) ? row : null;
}
const missing = () => NextResponse.json({ success: false, error: 'Webhook subscription not found.' }, { status: 404 });
export const GET = withAuth(async (request: Request, auth, context: Context) => {
    const denied = await requireWebhookManagement(auth, request);
    if (denied)
        return denied;
    const { id } = await context.params;
    const row = await owned(id, auth);
    if (!row)
        return missing();
    const deliveries = await db.webhookDelivery.findMany({ where: { subscriptionId: id }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, eventType: true, status: true, attempts: true, responseStatus: true, errorMessage: true, durationMs: true, createdAt: true, lastAttemptAt: true, nextAttemptAt: true } });
    await db.$transaction(async (tx) => { await writePortalAudit(tx, auth, 'WEBHOOK_SUBSCRIPTION_VIEWED', 'WebhookSubscription', id, { deliveries: deliveries.length }, request); });
    return NextResponse.json({ success: true, subscription: redactSubscription(row), deliveries }, { headers: { 'Cache-Control': 'private, no-store' } });
}, { requireUserTypes: types });
const Patch = z.object({ name: z.string().trim().min(1).max(190).optional(), events: z.array(z.string().max(80)).min(1).max(50).optional(), active: z.boolean().optional(), maxRetries: z.number().int().min(0).max(10).optional(), timeoutMs: z.number().int().min(1000).max(60000).optional(), description: z.string().max(1900).optional(), targetUrl: z.string().url().max(191).optional(), allowPrivateHost: z.boolean().optional() }).strict();
export const PATCH = withAuth(async (request: Request, auth, context: Context) => {
    const denied = await requireWebhookManagement(auth, request, true);
    if (denied)
        return denied;
    const { id } = await context.params;
    const row = await owned(id, auth);
    if (!row)
        return missing();
    const parsed = Patch.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
        return NextResponse.json({ success: false, error: 'Invalid webhook update.' }, { status: 400 });
    const { allowPrivateHost, ...input } = parsed.data;
    const data: {
        name?: string;
        events?: string;
        active?: boolean;
        maxRetries?: number;
        timeoutMs?: number;
        description?: string;
        targetUrl?: string;
        updatedBy: string;
    } = { ...input, events: undefined, updatedBy: auth.actorUserId };
    if (input.events) {
        const events = normalizeEventList(input.events);
        if (!events.length)
            return NextResponse.json({ success: false, error: 'At least one supported event is required.' }, { status: 400 });
        data.events = JSON.stringify(events);
    }
    if (input.targetUrl) {
        const check = validateWebhookUrl(input.targetUrl, auth.userType !== 'PARTNER' && allowPrivateHost === true && privateWebhookHostAllowed(input.targetUrl));
        if (!check.valid)
            return NextResponse.json({ success: false, error: `Webhook target rejected: ${check.reason}` }, { status: 400 });
        data.targetUrl = check.normalizedUrl;
    }
    const updated = await db.$transaction(async (tx) => { const result = await tx.webhookSubscription.update({ where: { id }, data }); await writePortalAudit(tx, auth, 'WEBHOOK_SUBSCRIPTION_UPDATED', 'WebhookSubscription', id, { changed: Object.keys(parsed.data), previousActive: row.active, newActive: result.active }, request); return result; });
    return NextResponse.json({ success: true, subscription: redactSubscription(updated), changed: Object.keys(parsed.data) });
}, { requireUserTypes: types });
// Archive instead of cascading deletion of delivery/audit history.
export const DELETE = withAuth(async (request: Request, auth, context: Context) => {
    const denied = await requireWebhookManagement(auth, request, true);
    if (denied)
        return denied;
    const { id } = await context.params;
    const row = await owned(id, auth);
    if (!row)
        return missing();
    await db.$transaction(async (tx) => { await tx.webhookSubscription.update({ where: { id }, data: { active: false, updatedBy: auth.actorUserId } }); await writePortalAudit(tx, auth, 'WEBHOOK_SUBSCRIPTION_ARCHIVED', 'WebhookSubscription', id, { previousActive: row.active, active: false, historyPreserved: true }, request); });
    return NextResponse.json({ success: true, archived: id, historyPreserved: true });
}, { requireUserTypes: types });
export const POST = withAuth(async (request: Request, auth, context: Context) => {
    const denied = await requireWebhookManagement(auth, request, true);
    if (denied)
        return denied;
    const { id } = await context.params;
    if (!await owned(id, auth))
        return missing();
    const body = z.object({ action: z.literal('rotate-secret') }).strict().safeParse(await request.json().catch(() => null));
    if (!body.success)
        return NextResponse.json({ success: false, error: 'Unsupported webhook action.' }, { status: 400 });
    const result = await db.$transaction(async (tx) => { const rotated = await rotateSubscriptionSecret(id, auth.actorUserId, tx); await writePortalAudit(tx, auth, 'WEBHOOK_SECRET_ROTATED', 'WebhookSubscription', id, {}, request); return rotated; });
    return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'private, no-store' } });
}, { requireUserTypes: types });
