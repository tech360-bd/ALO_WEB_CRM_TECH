// Outbound webhook contracts (spec s77, s90, s91, s94, s99).
// Mocked Prisma + injectable transport so real delivery outcomes are asserted
// without touching the network.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    webhookSubscription: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    webhookDelivery: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/token-encryption', () => ({
  encryptToken: (value: string) => `enc(${value})`,
  decryptToken: (value: string) => String(value).replace(/^enc\((.*)\)$/, '$1'),
  maskToken: (value: string) => String(value).slice(0, 4) + '…',
}));

import { db } from '@/lib/db';
import {
  WEBHOOK_EVENTS,
  backoffDelayMs,
  createSubscription,
  deliverWebhook,
  emitWebhook,
  generateWebhookSecret,
  isEventNamespaceWildcard,
  isRetryableHttpStatus,
  normalizeEventList,
  processDueDeliveries,
  signPayload,
  subscriptionMatches,
  validateWebhookUrl,
  verifySignature,
} from '@/lib/webhooks';

const subCreate = db.webhookSubscription.create as unknown as ReturnType<typeof vi.fn>;
const subFindMany = db.webhookSubscription.findMany as unknown as ReturnType<typeof vi.fn>;
const deliveryCreate = db.webhookDelivery.create as unknown as ReturnType<typeof vi.fn>;
const deliveryFindUnique = db.webhookDelivery.findUnique as unknown as ReturnType<typeof vi.fn>;
const deliveryFindMany = db.webhookDelivery.findMany as unknown as ReturnType<typeof vi.fn>;
const deliveryUpdate = db.webhookDelivery.update as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  deliveryUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'd1', ...data }));
});

describe('Webhook event catalogue (s77)', () => {
  it('exposes every canonical event named in the specification', () => {
    const required = [
      'lead.created',
      'student.created',
      'application.created',
      'application.status_changed',
      'document.uploaded',
      'offer.received',
      'payment.completed',
      'visa.status_changed',
      'partner.approved',
      'commission.paid',
    ];
    for (const event of required) expect(WEBHOOK_EVENTS).toContain(event);
  });

  it('rejects unknown events when normalising a subscription list', () => {
    expect(normalizeEventList(['lead.created', 'not.a.real.event'])).toEqual(['lead.created']);
    expect(normalizeEventList(['*'])).toEqual(['*']);
    expect(normalizeEventList('nope')).toEqual([]);
    expect(normalizeEventList(null)).toEqual([]);
  });

  it('matches wildcards and prefixes', () => {
    expect(subscriptionMatches(['*'], 'commission.paid')).toBe(true);
    expect(subscriptionMatches(['application.*'], 'application.status_changed')).toBe(true);
    expect(subscriptionMatches(['application.*'], 'lead.created')).toBe(false);
    expect(subscriptionMatches(['lead.created'], 'lead.created')).toBe(true);
  });

  // Regression: normalizeEventList used to strip prefix wildcards before
  // subscriptionMatches could see them, so 'application.*' silently matched
  // nothing. Wildcards must survive normalisation.
  it('keeps catalogue-derived namespace wildcards through normalisation', () => {
    expect(normalizeEventList(['application.*'])).toEqual(['application.*']);
    expect(normalizeEventList(['visa.*', 'document.*'])).toEqual(['visa.*', 'document.*']);
    expect(subscriptionMatches(normalizeEventList(['application.*']), 'application.created')).toBe(true);
  });

  it('rejects wildcards for namespaces ALO does not emit', () => {
    // `payment` IS a real namespace (payment.completed), so payment.* is valid;
    // `bogus`, `invoice` and malformed patterns are not.
    expect(normalizeEventList(['payment.*'])).toEqual(['payment.*']);
    expect(normalizeEventList(['bogus.*', 'invoice.*', '.*', '*.*', 'application.'])).toEqual([]);
    expect(isEventNamespaceWildcard('payment.*')).toBe(true);
    expect(isEventNamespaceWildcard('bogus.*')).toBe(false);
    expect(isEventNamespaceWildcard('invoice.*')).toBe(false);
    expect(isEventNamespaceWildcard('.*')).toBe(false);
    expect(isEventNamespaceWildcard('application.*')).toBe(true);
  });
});

describe('Webhook URL safety — SSRF guard (s66, s99)', () => {
  it('accepts a normal https endpoint', () => {
    const result = validateWebhookUrl('https://hooks.example.com/alo');
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe('https://hooks.example.com/alo');
  });

  it('rejects non-http schemes', () => {
    for (const url of ['file:///etc/passwd', 'ftp://example.com', 'javascript:alert(1)', 'gopher://x']) {
      expect(validateWebhookUrl(url).valid).toBe(false);
    }
  });

  it('rejects malformed URLs', () => {
    expect(validateWebhookUrl('not a url').reason).toBe('INVALID_URL');
    expect(validateWebhookUrl('').valid).toBe(false);
  });

  it('rejects loopback, private and link-local hosts by default', () => {
    const blocked = [
      'https://localhost/hook',
      'https://127.0.0.1/hook',
      'https://10.0.0.5/hook',
      'https://192.168.1.1/hook',
      'https://172.16.0.1/hook',
      'https://169.254.169.254/latest/meta-data/',
      'https://metadata.internal/hook',
    ];
    for (const url of blocked) {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('PRIVATE_HOST_NOT_ALLOWED');
    }
  });

  it('allows a private host only on explicit operator opt-in', () => {
    expect(validateWebhookUrl('https://127.0.0.1/hook', true).valid).toBe(true);
  });

  it('strips the fragment so it cannot smuggle data past validation', () => {
    const result = validateWebhookUrl('https://hooks.example.com/alo#secret');
    expect(result.normalizedUrl).toBe('https://hooks.example.com/alo');
  });
});

describe('Webhook signing (s77)', () => {
  it('verifies a correct signature and rejects a tampered body', () => {
    const secret = generateWebhookSecret();
    const timestamp = '1700000000';
    const body = JSON.stringify({ event: 'lead.created' });
    const signature = signPayload(secret, timestamp, body);

    expect(verifySignature(secret, timestamp, body, signature)).toBe(true);
    expect(verifySignature(secret, timestamp, body + 'x', signature)).toBe(false);
    expect(verifySignature(secret, '1700000001', body, signature)).toBe(false);
    expect(verifySignature('other-secret', timestamp, body, signature)).toBe(false);
  });

  it('does not throw on a malformed signature', () => {
    expect(verifySignature('secret', '123', '{}', '')).toBe(false);
    expect(verifySignature('secret', '123', '{}', 'short')).toBe(false);
  });

  it('generates prefixed, unique secrets', () => {
    const a = generateWebhookSecret();
    const b = generateWebhookSecret();
    expect(a).toMatch(/^whsec_[0-9a-f]{48}$/);
    expect(a).not.toBe(b);
  });
});

describe('Subscription creation', () => {
  it('stores the secret encrypted and returns it once in plaintext', async () => {
    subCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 's1', ...data }));
    const result = await createSubscription({
      name: 'Partner CRM',
      targetUrl: 'https://hooks.example.com/alo',
      events: ['lead.created'],
      actorId: 'admin-1',
    });
    expect(result.secret).toMatch(/^whsec_/);
    expect(subCreate.mock.calls[0][0].data.secret).toBe(`enc(${result.secret})`);
    // The returned object must not carry the plaintext secret.
    expect((result.subscription as Record<string, unknown>).secret).toBeUndefined();
    expect((result.subscription as Record<string, unknown>).secretConfigured).toBe(true);
  });

  it('refuses an SSRF target', async () => {
    await expect(
      createSubscription({
        name: 'bad',
        targetUrl: 'https://169.254.169.254/latest/meta-data/',
        events: ['lead.created'],
      }),
    ).rejects.toThrow(/PRIVATE_HOST_NOT_ALLOWED/);
  });

  it('refuses a subscription with no supported event', async () => {
    await expect(
      createSubscription({ name: 'x', targetUrl: 'https://hooks.example.com', events: ['bogus.event'] }),
    ).rejects.toThrow(/At least one supported webhook event/);
  });
});

describe('emitWebhook — honesty and idempotency (s90, s94)', () => {
  it('reports NOT_CONFIGURED when no subscription matches — never a fake success', async () => {
    subFindMany.mockResolvedValue([]);
    const result = await emitWebhook('lead.created', { leadId: 'L1' });
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.queued).toBe(0);
    expect(result.reason).toBe('NO_MATCHING_SUBSCRIPTION');
    expect(deliveryCreate).not.toHaveBeenCalled();
  });

  it('does not pretend delivery happened when the lookup fails', async () => {
    subFindMany.mockRejectedValue(new Error('db down'));
    const result = await emitWebhook('lead.created', { leadId: 'L1' });
    expect(result.status).toBe('SKIPPED');
    expect(result.reason).toMatch(/SUBSCRIPTION_LOOKUP_FAILED/);
  });

  it('queues one delivery per matching subscription', async () => {
    subFindMany.mockResolvedValue([
      { id: 's1', events: '["lead.created"]', active: true, partnerId: null, branchId: null },
      { id: 's2', events: '["*"]', active: true, partnerId: null, branchId: null },
      { id: 's3', events: '["commission.paid"]', active: true, partnerId: null, branchId: null },
    ]);
    deliveryCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: `d-${data.subscriptionId}`,
      ...data,
    }));

    const result = await emitWebhook('lead.created', { leadId: 'L1' });
    expect(result.status).toBe('QUEUED');
    expect(result.queued).toBe(2);
    expect(result.deliveryIds.sort()).toEqual(['d-s1', 'd-s2']);
  });

  it('enforces partner tenant isolation on fan-out (s69)', async () => {
    subFindMany.mockResolvedValue([
      { id: 'partnerA', events: '["*"]', active: true, partnerId: 'P-A', branchId: null },
      { id: 'partnerB', events: '["*"]', active: true, partnerId: 'P-B', branchId: null },
    ]);
    deliveryCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: `d-${data.subscriptionId}`,
      ...data,
    }));

    const result = await emitWebhook('lead.created', { leadId: 'L1' }, { partnerId: 'P-A' });
    expect(result.queued).toBe(1);
    expect(result.deliveryIds).toEqual(['d-partnerA']);
  });

  it('treats a duplicate (subscriptionId, eventId) as already-queued, not an error', async () => {
    subFindMany.mockResolvedValue([
      { id: 's1', events: '["lead.created"]', active: true, partnerId: null, branchId: null },
    ]);
    deliveryCreate.mockRejectedValue(new Error('Unique constraint failed on P2002'));

    const result = await emitWebhook('lead.created', { leadId: 'L1' }, { eventId: 'fixed-id' });
    expect(result.status).toBe('SKIPPED');
    expect(result.reason).toBe('ALREADY_QUEUED');
    expect(result.queued).toBe(0);
  });

  it('persists a stable envelope with the caller-supplied eventId', async () => {
    subFindMany.mockResolvedValue([
      { id: 's1', events: '["lead.created"]', active: true, partnerId: null, branchId: null },
    ]);
    deliveryCreate.mockResolvedValue({ id: 'd1' });

    await emitWebhook('lead.created', { leadId: 'L1' }, { eventId: 'lead:L1' });
    const payload = JSON.parse(deliveryCreate.mock.calls[0][0].data.payload);
    expect(payload.id).toBe('lead:L1');
    expect(payload.event).toBe('lead.created');
    expect(payload.data).toEqual({ leadId: 'L1' });
    expect(payload.occurredAt).toBeTruthy();
  });
});

describe('deliverWebhook — real outcomes only (s91, s94)', () => {
  function delivery(overrides: Record<string, unknown> = {}) {
    return {
      id: 'd1',
      subscriptionId: 's1',
      eventId: 'e1',
      eventType: 'lead.created',
      payload: '{"id":"e1"}',
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: new Date(),
      subscription: {
        id: 's1',
        active: true,
        targetUrl: 'https://hooks.example.com/alo',
        secret: 'enc(whsec_test)',
        maxRetries: 3,
        timeoutMs: 5000,
      },
      ...overrides,
    };
  }

  it('records DELIVERED with the real HTTP status on 2xx', async () => {
    deliveryFindUnique.mockResolvedValue(delivery());
    const fetchImpl = vi.fn().mockResolvedValue({ status: 200, text: async () => 'ok' });

    const result = await deliverWebhook('d1', { fetchImpl });
    expect(result.status).toBe('DELIVERED');
    expect(result.httpStatus).toBe(200);
    expect(deliveryUpdate.mock.calls[0][0].data.status).toBe('DELIVERED');
  });

  it('sends a valid HMAC signature the receiver can verify', async () => {
    deliveryFindUnique.mockResolvedValue(delivery());
    const fetchImpl = vi.fn().mockResolvedValue({ status: 200, text: async () => 'ok' });

    await deliverWebhook('d1', { fetchImpl, now: new Date(1700000000000) });
    const init = fetchImpl.mock.calls[0][1];
    const timestamp = init.headers['x-alo-timestamp'];
    const signature = init.headers['x-alo-signature'].replace('sha256=', '');
    expect(init.headers['x-alo-event']).toBe('lead.created');
    expect(verifySignature('whsec_test', timestamp, '{"id":"e1"}', signature)).toBe(true);
    expect(timestamp).toBe(String(Math.floor(1700000000000 / 1000)));
  });

  it('retries a 500 with backoff instead of giving up', async () => {
    deliveryFindUnique.mockResolvedValue(delivery({ attempts: 0 }));
    const fetchImpl = vi.fn().mockResolvedValue({ status: 503, text: async () => 'unavailable' });

    const result = await deliverWebhook('d1', { fetchImpl, now: new Date(1700000000000) });
    expect(result.status).toBe('FAILED');
    const data = deliveryUpdate.mock.calls[0][0].data;
    expect(data.status).toBe('FAILED');
    expect(data.attempts).toBe(1);
    expect(data.responseStatus).toBe(503);
    expect(data.nextAttemptAt.getTime()).toBeGreaterThan(1700000000000);
  });

  it('does NOT retry a 400 — a bad payload will not fix itself', async () => {
    deliveryFindUnique.mockResolvedValue(delivery());
    const fetchImpl = vi.fn().mockResolvedValue({ status: 400, text: async () => 'bad request' });

    const result = await deliverWebhook('d1', { fetchImpl });
    expect(result.status).toBe('DEAD');
    expect(deliveryUpdate.mock.calls[0][0].data.nextAttemptAt).toBeNull();
  });

  it('dead-letters after maxRetries and records the transport error', async () => {
    deliveryFindUnique.mockResolvedValue(delivery({ attempts: 3 }));
    const fetchImpl = vi.fn().mockRejectedValue(new Error('socket hang up'));

    const result = await deliverWebhook('d1', { fetchImpl });
    expect(result.status).toBe('DEAD');
    expect(result.error).toBe('socket hang up');
    const data = deliveryUpdate.mock.calls[0][0].data;
    expect(data.status).toBe('DEAD');
    expect(data.errorMessage).toBe('socket hang up');
  });

  it('refuses to deliver for an inactive subscription', async () => {
    deliveryFindUnique.mockResolvedValue(
      delivery({ subscription: { ...delivery().subscription, active: false } }),
    );
    const fetchImpl = vi.fn();
    const result = await deliverWebhook('d1', { fetchImpl });
    expect(result.status).toBe('DEAD');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('never re-sends an already delivered event (s90)', async () => {
    deliveryFindUnique.mockResolvedValue(delivery({ status: 'DELIVERED' }));
    const fetchImpl = vi.fn();
    const result = await deliverWebhook('d1', { fetchImpl });
    expect(result.status).toBe('DELIVERED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a missing delivery rather than throwing', async () => {
    deliveryFindUnique.mockResolvedValue(null);
    const result = await deliverWebhook('nope', { fetchImpl: vi.fn() });
    expect(result.status).toBe('DEAD');
    expect(result.error).toBe('DELIVERY_NOT_FOUND');
  });
});

describe('Retry policy', () => {
  it('backs off exponentially and is capped', () => {
    expect(backoffDelayMs(1)).toBe(30_000);
    expect(backoffDelayMs(2)).toBe(120_000);
    expect(backoffDelayMs(3)).toBe(480_000);
    expect(backoffDelayMs(10)).toBe(6 * 60 * 60 * 1000);
    expect(backoffDelayMs(50)).toBe(6 * 60 * 60 * 1000);
  });

  it('classifies retryable statuses correctly', () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(408)).toBe(true);
    expect(isRetryableHttpStatus(400)).toBe(false);
    expect(isRetryableHttpStatus(401)).toBe(false);
    expect(isRetryableHttpStatus(404)).toBe(false);
  });
});

describe('processDueDeliveries', () => {
  it('is a no-op with an empty queue', async () => {
    deliveryFindMany.mockResolvedValue([]);
    const result = await processDueDeliveries(25, { fetchImpl: vi.fn() });
    expect(result).toEqual({ processed: 0, delivered: 0, failed: 0, dead: 0 });
  });

  it('only selects PENDING/FAILED rows that are due', async () => {
    deliveryFindMany.mockResolvedValue([]);
    const now = new Date(1700000000000);
    await processDueDeliveries(10, { fetchImpl: vi.fn(), now });
    const where = deliveryFindMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ['PENDING', 'FAILED'] });
    expect(where.OR).toContainEqual({ nextAttemptAt: { lte: now } });
  });
});
