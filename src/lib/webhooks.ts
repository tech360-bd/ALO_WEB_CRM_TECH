// ============================================================
// ALO EDUCATION — OUTBOUND WEBHOOK SYSTEM (spec s77, s90, s91, s94)
// ============================================================
// The pre-existing `WebhookEvent` table is INBOUND only (it stores provider
// callbacks such as WhatsApp/HTTP-SMS receipts). This module adds the
// outbound side required by the operating-system spec: external systems can
// subscribe to canonical ALO events and receive signed HTTP deliveries.
//
// Hard rules enforced here:
//  * HONESTY (s94). If no subscriber exists, nothing is "sent" and nothing is
//    recorded as delivered. If delivery fails the row says FAILED/DEAD with
//    the real HTTP status and error. There is no optimistic success path.
//  * IDEMPOTENCY (s90). (subscriptionId, eventId) is UNIQUE, so replaying the
//    same business event can never double-deliver or double-insert.
//  * RETRY WITH BACKOFF. Exponential, capped by maxRetries, then DEAD
//    (dead-letter) so operators can inspect and replay.
//  * SSRF GUARD. Only http/https, and private/loopback/link-local hosts are
//    rejected unless an operator explicitly opts in per subscription.
//  * SIGNING. HMAC-SHA256 over `${timestamp}.${rawBody}` using the
//    subscription secret; secrets are stored encrypted (AES-256-GCM).
// ============================================================

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { decryptToken, encryptToken } from '@/lib/token-encryption';

/** Canonical outbound event catalogue (spec s77). */
export const WEBHOOK_EVENTS = [
  'lead.created',
  'lead.updated',
  'student.created',
  'application.created',
  'application.status_changed',
  'document.uploaded',
  'document.verified',
  'offer.received',
  'payment.completed',
  'visa.status_changed',
  'partner.approved',
  'commission.paid',
] as const;

export type WebhookEventName = (typeof WEBHOOK_EVENTS)[number];

export const WEBHOOK_DELIVERY_STATUSES = ['PENDING', 'DELIVERED', 'FAILED', 'DEAD'] as const;
export type WebhookDeliveryStatus = (typeof WEBHOOK_DELIVERY_STATUSES)[number];

export interface WebhookEnvelope {
  id: string;
  event: string;
  occurredAt: string;
  data: Record<string, unknown>;
}

// ============================================================
// URL safety
// ============================================================
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/i,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd00:/i,
  /\.local$/i,
  /\.internal$/i,
];

export interface UrlValidation {
  valid: boolean;
  reason?: string;
  normalizedUrl?: string;
}

/**
 * Validate a webhook target URL. Rejects non-HTTP(S) schemes and, unless
 * explicitly allowed, private/loopback hosts (SSRF protection).
 */
export function validateWebhookUrl(rawUrl: string, allowPrivate = false): UrlValidation {
  let parsed: URL;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    return { valid: false, reason: 'INVALID_URL' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, reason: 'SCHEME_NOT_ALLOWED' };
  }
  if (parsed.protocol === 'http:' && process.env.NODE_ENV === 'production') {
    return { valid: false, reason: 'INSECURE_SCHEME_IN_PRODUCTION' };
  }
  if (!allowPrivate && PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
    return { valid: false, reason: 'PRIVATE_HOST_NOT_ALLOWED' };
  }
  parsed.hash = '';
  return { valid: true, normalizedUrl: parsed.toString() };
}

// ============================================================
// Signing
// ============================================================
export interface SignatureHeaders {
  'x-alo-event': string;
  'x-alo-delivery': string;
  'x-alo-timestamp': string;
  'x-alo-signature': string;
  'content-type': string;
}

export function signPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export function verifySignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string,
): boolean {
  const expected = Buffer.from(signPayload(secret, timestamp, rawBody), 'utf8');
  const received = Buffer.from(String(signature || ''), 'utf8');
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('hex')}`;
}

// ============================================================
// Subscription management
// ============================================================
export interface CreateSubscriptionInput {
  name: string;
  targetUrl: string;
  events: string[];
  secret?: string;
  active?: boolean;
  environment?: string;
  partnerId?: string | null;
  branchId?: string | null;
  maxRetries?: number;
  timeoutMs?: number;
  description?: string;
  allowPrivateHost?: boolean;
  actorId?: string | null;
}

/** Namespaces that may be used as a prefix wildcard, e.g. "application.*". */
export const WEBHOOK_EVENT_NAMESPACES = Array.from(
  new Set(WEBHOOK_EVENTS.map((event) => event.split('.')[0])),
);

/**
 * Is this a supported prefix wildcard such as `application.*`?
 * Derived from the catalogue so a wildcard can never subscribe to an event
 * namespace that does not exist.
 */
export function isEventNamespaceWildcard(event: string): boolean {
  if (!event.endsWith('.*')) return false;
  const namespace = event.slice(0, -2);
  return namespace.length > 0 && WEBHOOK_EVENT_NAMESPACES.includes(namespace);
}

export function normalizeEventList(events: unknown): string[] {
  if (!Array.isArray(events)) return [];
  const allowed = new Set<string>(WEBHOOK_EVENTS);
  const unique = Array.from(
    new Set(
      events
        .filter((event): event is string => typeof event === 'string')
        .map((event) => event.trim())
        .filter(Boolean),
    ),
  );
  // '*' (everything) and catalogue-derived namespace wildcards such as
  // 'application.*' are permitted and stored explicitly. Anything else is
  // dropped so a subscription can never claim an event ALO does not emit.
  return unique.filter(
    (event) => event === '*' || allowed.has(event) || isEventNamespaceWildcard(event),
  );
}

export function subscriptionMatches(subscriptionEvents: string[], eventType: string): boolean {
  const events = normalizeEventListFromRaw(subscriptionEvents);
  if (events.includes('*')) return true;
  if (events.includes(eventType)) return true;
  // Support prefix wildcards such as "application.*"
  return events.some((event) => event.endsWith('.*') && eventType.startsWith(event.slice(0, -1)));
}

function normalizeEventListFromRaw(raw: unknown): string[] {
  if (Array.isArray(raw)) return normalizeEventList(raw);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return normalizeEventList(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

/** Subscriptions are returned WITHOUT the plaintext secret. */
export function redactSubscription<T extends { secret: string }>(subscription: T) {
  const { secret: _secret, ...rest } = subscription;
  return { ...rest, secretConfigured: Boolean(_secret) };
}

export async function createSubscription(input: CreateSubscriptionInput) {
  const urlCheck = validateWebhookUrl(input.targetUrl, input.allowPrivateHost === true);
  if (!urlCheck.valid) {
    throw new Error(`Webhook target rejected: ${urlCheck.reason}`);
  }
  const events = normalizeEventList(input.events);
  if (events.length === 0) {
    throw new Error('At least one supported webhook event is required');
  }
  const plaintextSecret = input.secret?.trim() || generateWebhookSecret();

  const subscription = await db.webhookSubscription.create({
    data: {
      name: String(input.name || '').trim().slice(0, 190),
      targetUrl: urlCheck.normalizedUrl as string,
      secret: encryptToken(plaintextSecret),
      events: JSON.stringify(events),
      active: input.active !== false,
      environment: input.environment || 'production',
      partnerId: input.partnerId || null,
      branchId: input.branchId || null,
      maxRetries: Math.max(0, Math.min(10, Number(input.maxRetries ?? 5))),
      timeoutMs: Math.max(1000, Math.min(60000, Number(input.timeoutMs ?? 10000))),
      description: input.description || '',
      createdBy: input.actorId || '',
      updatedBy: input.actorId || '',
    },
  });

  return {
    subscription: redactSubscription(subscription),
    // Returned exactly once, at creation. Never retrievable afterwards.
    secret: plaintextSecret,
  };
}

export async function listSubscriptions(filter: { partnerId?: string | null; active?: boolean } = {}) {
  const rows = await db.webhookSubscription.findMany({
    where: {
      ...(filter.partnerId !== undefined ? { partnerId: filter.partnerId } : {}),
      ...(filter.active !== undefined ? { active: filter.active } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(redactSubscription);
}

export async function rotateSubscriptionSecret(id: string, actorId?: string | null) {
  const plaintextSecret = generateWebhookSecret();
  await db.webhookSubscription.update({
    where: { id },
    data: { secret: encryptToken(plaintextSecret), updatedBy: actorId || '' },
  });
  return { secret: plaintextSecret };
}

// ============================================================
// Emit — fan an event out to every matching subscription
// ============================================================
export interface EmitResult {
  event: string;
  eventId: string;
  status: 'QUEUED' | 'NOT_CONFIGURED' | 'SKIPPED';
  queued: number;
  reason?: string;
  deliveryIds: string[];
}

export interface EmitOptions {
  /** Caller-supplied idempotency key. Strongly recommended. */
  eventId?: string;
  occurredAt?: Date;
  partnerId?: string | null;
  branchId?: string | null;
}

/**
 * Queue a canonical event for every matching, active subscription.
 *
 * Returns NOT_CONFIGURED when no subscription matches — it never pretends a
 * delivery happened (spec s94). Safe to call from business logic: failures to
 * enqueue are captured and reported, not swallowed.
 */
export async function emitWebhook(
  eventType: string,
  data: Record<string, unknown>,
  options: EmitOptions = {},
): Promise<EmitResult> {
  const eventId = options.eventId || `${eventType}:${randomBytes(12).toString('hex')}`;
  const occurredAt = (options.occurredAt ?? new Date()).toISOString();

  let subscriptions;
  try {
    subscriptions = await db.webhookSubscription.findMany({ where: { active: true } });
  } catch (error) {
    return {
      event: eventType,
      eventId,
      status: 'SKIPPED',
      queued: 0,
      deliveryIds: [],
      reason: `SUBSCRIPTION_LOOKUP_FAILED:${error instanceof Error ? error.message : 'unknown'}`,
    };
  }

  const matching = subscriptions.filter((subscription) => {
    if (!subscriptionMatches(subscription.events, eventType)) return false;
    // Tenant isolation: a partner-scoped subscription only receives events
    // carrying the same partnerId, and never internal cross-tenant events.
    if (subscription.partnerId && options.partnerId !== subscription.partnerId) return false;
    if (subscription.branchId && options.branchId !== subscription.branchId) return false;
    return true;
  });

  if (matching.length === 0) {
    return {
      event: eventType,
      eventId,
      status: 'NOT_CONFIGURED',
      queued: 0,
      deliveryIds: [],
      reason: 'NO_MATCHING_SUBSCRIPTION',
    };
  }

  const envelope: WebhookEnvelope = { id: eventId, event: eventType, occurredAt, data };
  const payload = JSON.stringify(envelope);
  const deliveryIds: string[] = [];

  for (const subscription of matching) {
    try {
      const delivery = await db.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          eventId,
          eventType,
          payload,
          status: 'PENDING',
          attempts: 0,
          nextAttemptAt: new Date(),
        },
      });
      deliveryIds.push(delivery.id);
    } catch (error) {
      // Unique (subscriptionId, eventId) collision means this event was
      // already queued for that subscriber — idempotent by design, not an error.
      const message = error instanceof Error ? error.message : 'unknown';
      if (!/Unique constraint|duplicate|P2002/i.test(message)) throw error;
    }
  }

  return {
    event: eventType,
    eventId,
    status: deliveryIds.length > 0 ? 'QUEUED' : 'SKIPPED',
    queued: deliveryIds.length,
    deliveryIds,
    reason: deliveryIds.length > 0 ? undefined : 'ALREADY_QUEUED',
  };
}

// ============================================================
// Delivery worker
// ============================================================
export interface DeliveryAttemptResult {
  id: string;
  status: WebhookDeliveryStatus;
  httpStatus?: number;
  error?: string;
  durationMs?: number;
}

export function backoffDelayMs(attempt: number): number {
  // 30s, 2m, 8m, 32m, 2h ... capped at 6h
  const base = 30_000 * Math.pow(4, Math.max(0, attempt - 1));
  return Math.min(base, 6 * 60 * 60 * 1000);
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

interface FetchLike {
  (url: string, init: Record<string, unknown>): Promise<{
    status: number;
    text(): Promise<string>;
  }>;
}

export interface DeliverOptions {
  /** Injectable transport for tests. Defaults to global fetch. */
  fetchImpl?: FetchLike;
  now?: Date;
}

/**
 * Deliver one queued webhook. Records the true outcome. Never throws for
 * transport-level failures — they are persisted on the delivery row so the
 * job system can retry and operators can see exactly what happened (s91).
 */
export async function deliverWebhook(
  deliveryId: string,
  options: DeliverOptions = {},
): Promise<DeliveryAttemptResult> {
  const now = options.now ?? new Date();
  const doFetch = options.fetchImpl || (globalThis.fetch as unknown as FetchLike);

  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { subscription: true },
  });
  if (!delivery) return { id: deliveryId, status: 'DEAD', error: 'DELIVERY_NOT_FOUND' };
  if (delivery.status === 'DELIVERED' || delivery.status === 'DEAD') {
    return { id: deliveryId, status: delivery.status as WebhookDeliveryStatus };
  }

  const subscription = delivery.subscription;
  if (!subscription.active) {
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: 'DEAD', errorMessage: 'SUBSCRIPTION_INACTIVE', lastAttemptAt: now },
    });
    return { id: deliveryId, status: 'DEAD', error: 'SUBSCRIPTION_INACTIVE' };
  }

  const urlCheck = validateWebhookUrl(subscription.targetUrl, true);
  if (!urlCheck.valid) {
    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: 'DEAD', errorMessage: `TARGET_REJECTED:${urlCheck.reason}`, lastAttemptAt: now },
    });
    return { id: deliveryId, status: 'DEAD', error: `TARGET_REJECTED:${urlCheck.reason}` };
  }

  const attempt = delivery.attempts + 1;
  const timestamp = String(Math.floor(now.getTime() / 1000));
  let secret = '';
  try {
    secret = decryptToken(subscription.secret);
  } catch {
    secret = '';
  }
  const signature = secret ? signPayload(secret, timestamp, delivery.payload) : '';

  const startedAt = Date.now();
  try {
    const response = await doFetch(subscription.targetUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-alo-event': delivery.eventType,
        'x-alo-delivery': delivery.id,
        'x-alo-timestamp': timestamp,
        ...(signature ? { 'x-alo-signature': `sha256=${signature}` } : {}),
      },
      body: delivery.payload,
      signal: AbortSignal.timeout(Math.max(1000, subscription.timeoutMs || 10000)),
    });
    const durationMs = Date.now() - startedAt;
    const body = await response.text().catch(() => '');

    if (response.status >= 200 && response.status < 300) {
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERED',
          attempts: attempt,
          lastAttemptAt: now,
          nextAttemptAt: null,
          responseStatus: response.status,
          responseBody: body.slice(0, 2000),
          errorMessage: null,
          durationMs,
        },
      });
      return { id: deliveryId, status: 'DELIVERED', httpStatus: response.status, durationMs };
    }

    return await registerFailure({
      deliveryId,
      delivery,
      subscription,
      attempt,
      now,
      durationMs,
      httpStatus: response.status,
      error: `HTTP_${response.status}`,
      retryable: isRetryableHttpStatus(response.status),
      responseBody: body.slice(0, 2000),
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : 'unknown transport error';
    // Network/timeout errors are retryable.
    return await registerFailure({
      deliveryId,
      delivery,
      subscription,
      attempt,
      now,
      durationMs,
      error: message,
      retryable: true,
    });
  }
}

async function registerFailure(args: {
  deliveryId: string;
  delivery: { id: string };
  subscription: { maxRetries: number };
  attempt: number;
  now: Date;
  durationMs: number;
  httpStatus?: number;
  error: string;
  retryable: boolean;
  responseBody?: string;
}): Promise<DeliveryAttemptResult> {
  const maxRetries = Math.max(0, args.subscription.maxRetries ?? 5);
  const exhausted = !args.retryable || args.attempt > maxRetries;
  const status: WebhookDeliveryStatus = exhausted ? 'DEAD' : 'FAILED';

  await db.webhookDelivery.update({
    where: { id: args.deliveryId },
    data: {
      status,
      attempts: args.attempt,
      lastAttemptAt: args.now,
      nextAttemptAt: exhausted ? null : new Date(args.now.getTime() + backoffDelayMs(args.attempt)),
      responseStatus: args.httpStatus ?? null,
      responseBody: args.responseBody ?? null,
      errorMessage: args.error.slice(0, 1900),
      durationMs: args.durationMs,
    },
  });

  return {
    id: args.deliveryId,
    status,
    httpStatus: args.httpStatus,
    error: args.error,
    durationMs: args.durationMs,
  };
}

/**
 * Process every delivery that is due. Idempotent: rows already DELIVERED or
 * DEAD are skipped, and the UNIQUE(subscriptionId, eventId) constraint stops
 * duplicate queueing upstream.
 */
export async function processDueDeliveries(
  limit = 25,
  options: DeliverOptions = {},
): Promise<{ processed: number; delivered: number; failed: number; dead: number }> {
  const now = options.now ?? new Date();
  const due = await db.webhookDelivery.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: Math.max(1, Math.min(limit, 200)),
  });

  let delivered = 0;
  let failed = 0;
  let dead = 0;
  for (const delivery of due) {
    const result = await deliverWebhook(delivery.id, options);
    if (result.status === 'DELIVERED') delivered += 1;
    else if (result.status === 'FAILED') failed += 1;
    else dead += 1;
  }
  return { processed: due.length, delivered, failed, dead };
}

export async function replayDeadDelivery(deliveryId: string, now = new Date()) {
  const delivery = await db.webhookDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new Error('Delivery not found');
  return db.webhookDelivery.update({
    where: { id: deliveryId },
    data: { status: 'PENDING', attempts: 0, nextAttemptAt: now, errorMessage: null },
  });
}

export async function deliveryStats(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [delivered, failed, dead, pending] = await Promise.all([
    db.webhookDelivery.count({ where: { status: 'DELIVERED', createdAt: { gte: since } } }),
    db.webhookDelivery.count({ where: { status: 'FAILED', createdAt: { gte: since } } }),
    db.webhookDelivery.count({ where: { status: 'DEAD', createdAt: { gte: since } } }),
    db.webhookDelivery.count({ where: { status: 'PENDING', createdAt: { gte: since } } }),
  ]);
  return { since: since.toISOString(), delivered, failed, dead, pending, total: delivered + failed + dead + pending };
}
