import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import {
  WEBHOOK_EVENTS,
  createSubscription,
  listSubscriptions,
} from '@/lib/webhooks';

// ============================================================
// GET  /api/webhooks/subscriptions — list subscriptions
// POST /api/webhooks/subscriptions — create a subscription
//
// Tenant isolation: a PARTNER caller only ever sees and creates subscriptions
// scoped to their own partnerId, resolved from the session — never from the
// request body (spec s69).
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];

export const GET = withAuth(async (_request: Request, auth) => {
  const isPartner = auth.userType === 'PARTNER';
  if (isPartner && !auth.partnerId) {
    return NextResponse.json(
      { success: false, error: 'Partner identity required' },
      { status: 403 },
    );
  }

  const subscriptions = await listSubscriptions({
    ...(isPartner ? { partnerId: auth.partnerId as string } : {}),
  });

  return NextResponse.json({
    success: true,
    events: WEBHOOK_EVENTS,
    subscriptions,
    count: subscriptions.length,
    // Honest status: an empty list means outbound webhooks are NOT CONFIGURED
    // for this tenant, not that delivery is working (spec s94).
    configured: subscriptions.length > 0,
  });
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER', 'EMPLOYEE'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  const isPartner = auth.userType === 'PARTNER';
  if (isPartner && !auth.partnerId) {
    return NextResponse.json(
      { success: false, error: 'Partner identity required' },
      { status: 403 },
    );
  }

  try {
    const { subscription, secret } = await createSubscription({
      name: String(body.name || '').trim(),
      targetUrl: String(body.targetUrl || ''),
      events: Array.isArray(body.events) ? body.events : [],
      secret: typeof body.secret === 'string' ? body.secret : undefined,
      active: body.active !== false,
      environment: typeof body.environment === 'string' ? body.environment : 'production',
      // A partner cannot scope a subscription to another partner's tenant.
      partnerId: isPartner ? auth.partnerId : (body.partnerId ?? null),
      branchId: isPartner ? null : (body.branchId ?? null),
      maxRetries: typeof body.maxRetries === 'number' ? body.maxRetries : undefined,
      timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : undefined,
      description: typeof body.description === 'string' ? body.description : '',
      // Private hosts are only reachable for administrators who explicitly opt
      // in; partners can never target an internal address (SSRF guard).
      allowPrivateHost: !isPartner && body.allowPrivateHost === true && ADMIN_TYPES.includes(auth.userType),
      actorId: auth.actorUserId,
    });

    await logAuditAction(auth, 'WEBHOOK_SUBSCRIPTION_CREATED', 'WebhookSubscription', subscription.id, {
      name: subscription.name,
      targetUrl: subscription.targetUrl,
      events: subscription.events,
    });

    // The plaintext secret is returned exactly once and cannot be retrieved
    // again — only rotated.
    return NextResponse.json({ success: true, subscription, secret }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription creation failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}, { requireUserTypes: [...ADMIN_TYPES, 'PARTNER', 'EMPLOYEE'] });
