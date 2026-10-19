import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { normalizeEventList, redactSubscription, rotateSubscriptionSecret } from '@/lib/webhooks';

// ============================================================
// GET    /api/webhooks/subscriptions/[id]
// PATCH  /api/webhooks/subscriptions/[id]
// DELETE /api/webhooks/subscriptions/[id]
//
// Every access re-checks tenant ownership from the STORED row, so a partner
// cannot read, edit or delete another tenant's subscription by guessing an id
// (spec s69, s99 direct-object-reference protection).
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];

type RouteContext = { params: Promise<{ id: string }> };

async function loadOwnedSubscription(id: string, auth: { userType: string; partnerId?: string }) {
  const subscription = await db.webhookSubscription.findUnique({ where: { id } });
  if (!subscription) return { error: 'NOT_FOUND' as const };
  const isAdmin = ADMIN_TYPES.includes(auth.userType);
  if (!isAdmin) {
    if (auth.userType !== 'PARTNER' || !auth.partnerId) return { error: 'FORBIDDEN' as const };
    if (subscription.partnerId !== auth.partnerId) return { error: 'TENANT_MISMATCH' as const };
  }
  return { subscription };
}

export const GET = withAuth(async (_request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const result = await loadOwnedSubscription(id, auth);
  if ('error' in result) {
    const status = result.error === 'NOT_FOUND' ? 404 : 403;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  const deliveries = await db.webhookDelivery.findMany({
    where: { subscriptionId: result.subscription.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      eventType: true,
      status: true,
      attempts: true,
      responseStatus: true,
      errorMessage: true,
      durationMs: true,
      createdAt: true,
      lastAttemptAt: true,
      nextAttemptAt: true,
    },
  });
  return NextResponse.json({
    success: true,
    subscription: redactSubscription(result.subscription),
    deliveries,
  });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER', 'EMPLOYEE'] });

export const PATCH = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const result = await loadOwnedSubscription(id, auth);
  if ('error' in result) {
    const status = result.error === 'NOT_FOUND' ? 404 : 403;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  const data: Record<string, unknown> = { updatedBy: auth.actorUserId };
  const changes: string[] = [];

  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim().slice(0, 190);
    changes.push('name');
  }
  if (Array.isArray(body.events)) {
    const events = normalizeEventList(body.events);
    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one supported event is required' },
        { status: 400 },
      );
    }
    data.events = JSON.stringify(events);
    changes.push('events');
  }
  if (typeof body.active === 'boolean') {
    data.active = body.active;
    changes.push('active');
  }
  if (typeof body.maxRetries === 'number') {
    data.maxRetries = Math.max(0, Math.min(10, Math.round(body.maxRetries)));
    changes.push('maxRetries');
  }
  if (typeof body.timeoutMs === 'number') {
    data.timeoutMs = Math.max(1000, Math.min(60000, Math.round(body.timeoutMs)));
    changes.push('timeoutMs');
  }
  if (typeof body.description === 'string') {
    data.description = body.description.slice(0, 1900);
    changes.push('description');
  }
  // targetUrl changes go through the SSRF-validating creation path semantics.
  if (typeof body.targetUrl === 'string' && body.targetUrl.trim()) {
    const { validateWebhookUrl } = await import('@/lib/webhooks');
    const isPartner = auth.userType === 'PARTNER';
    const check = validateWebhookUrl(body.targetUrl, !isPartner && body.allowPrivateHost === true);
    if (!check.valid) {
      return NextResponse.json(
        { success: false, error: `Webhook target rejected: ${check.reason}` },
        { status: 400 },
      );
    }
    data.targetUrl = check.normalizedUrl;
    changes.push('targetUrl');
  }

  if (changes.length === 0) {
    return NextResponse.json({ success: true, changed: [], subscription: redactSubscription(result.subscription) });
  }

  const updated = await db.webhookSubscription.update({ where: { id }, data });
  await logAuditAction(auth, 'WEBHOOK_SUBSCRIPTION_UPDATED', 'WebhookSubscription', id, { changes });
  return NextResponse.json({ success: true, changed: changes, subscription: redactSubscription(updated) });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER', 'EMPLOYEE'] });

export const DELETE = withAuth(async (_request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const result = await loadOwnedSubscription(id, auth);
  if ('error' in result) {
    const status = result.error === 'NOT_FOUND' ? 404 : 403;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  await db.webhookSubscription.delete({ where: { id } });
  await logAuditAction(auth, 'WEBHOOK_SUBSCRIPTION_DELETED', 'WebhookSubscription', id, {});
  return NextResponse.json({ success: true, deleted: id });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER'] });

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const result = await loadOwnedSubscription(id, auth);
  if ('error' in result) {
    const status = result.error === 'NOT_FOUND' ? 404 : 403;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  const body = await request.json().catch(() => ({}));
  if (body?.action !== 'rotate-secret') {
    return NextResponse.json(
      { success: false, error: 'Unsupported action. Use { action: "rotate-secret" }.' },
      { status: 400 },
    );
  }
  const { secret } = await rotateSubscriptionSecret(id, auth.actorUserId);
  await logAuditAction(auth, 'WEBHOOK_SECRET_ROTATED', 'WebhookSubscription', id, {});
  return NextResponse.json({ success: true, secret });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER', 'EMPLOYEE'] });
