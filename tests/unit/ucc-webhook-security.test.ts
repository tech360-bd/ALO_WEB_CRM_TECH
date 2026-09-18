// ============================================================
// Unified Communication Center — webhook security tests
// Proves each provider's OFFICIAL signature scheme verifies correctly,
// that tampering is rejected, and that everything FAILS CLOSED when a
// secret is missing (mandate §13). Also covers idempotency (§14).
// ============================================================

import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import {
  safeEqual,
  payloadHash,
  verifyMetaSignature,
  verifyMetaChallenge,
  verifyTelegramSecret,
  verifyXSignature,
  computeXCrcResponse,
  verifyWebhookSignature,
  idempotencyKey,
} from '@/lib/ucc/providers/webhook-security';

const RAW = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: '1' }] });

describe('constant-time comparison', () => {
  it('matches equal strings and rejects different ones', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
  });
  it('rejects different lengths without throwing', () => {
    expect(safeEqual('short', 'a-much-longer-string')).toBe(false);
  });
});

describe('Meta signature (WhatsApp/Facebook/Instagram/Messenger)', () => {
  const secret = 'meta-app-secret';
  const sig = 'sha256=' + createHmac('sha256', secret).update(RAW, 'utf8').digest('hex');

  it('accepts a valid X-Hub-Signature-256', () => {
    expect(verifyMetaSignature(RAW, sig, secret).verified).toBe(true);
  });
  it('rejects a tampered body', () => {
    expect(verifyMetaSignature(RAW + 'x', sig, secret).verified).toBe(false);
  });
  it('rejects a wrong signature', () => {
    expect(verifyMetaSignature(RAW, 'sha256=deadbeef', secret).verified).toBe(false);
  });
  it('FAILS CLOSED when the app secret is not configured', () => {
    const r = verifyMetaSignature(RAW, sig, undefined);
    expect(r.verified).toBe(false);
    expect(r.reason).toMatch(/fail closed/i);
  });
  it('rejects a missing signature header', () => {
    expect(verifyMetaSignature(RAW, undefined, secret).verified).toBe(false);
  });
});

describe('Meta subscription challenge', () => {
  it('echoes hub.challenge when the verify token matches', () => {
    const r = verifyMetaChallenge(
      { 'hub.mode': 'subscribe', 'hub.verify_token': 'tok', 'hub.challenge': '12345' },
      'tok'
    );
    expect(r.verified).toBe(true);
    expect(r.challenge).toBe('12345');
  });
  it('FAILS CLOSED when verify token is not configured', () => {
    const r = verifyMetaChallenge(
      { 'hub.mode': 'subscribe', 'hub.verify_token': 'tok', 'hub.challenge': '1' },
      undefined
    );
    expect(r.verified).toBe(false);
    expect(r.reason).toMatch(/fail closed/i);
  });
  it('rejects a mismatched verify token', () => {
    const r = verifyMetaChallenge(
      { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': '1' },
      'tok'
    );
    expect(r.verified).toBe(false);
  });
});

describe('Telegram secret_token handshake', () => {
  it('accepts the matching secret token', () => {
    expect(verifyTelegramSecret('s3cr3t', 's3cr3t').verified).toBe(true);
  });
  it('rejects a wrong secret token', () => {
    expect(verifyTelegramSecret('nope', 's3cr3t').verified).toBe(false);
  });
  it('FAILS CLOSED when no secret is configured', () => {
    const r = verifyTelegramSecret('s3cr3t', undefined);
    expect(r.verified).toBe(false);
    expect(r.reason).toMatch(/fail closed/i);
  });
});

describe('X (Twitter) Account Activity signature', () => {
  const consumerSecret = 'x-consumer-secret';
  const sig = 'sha256=' + createHmac('sha256', consumerSecret).update(RAW, 'utf8').digest('base64');

  it('accepts a valid base64 HMAC-SHA256 signature', () => {
    expect(verifyXSignature(RAW, sig, consumerSecret).verified).toBe(true);
  });
  it('rejects a tampered body', () => {
    expect(verifyXSignature(RAW + 'x', sig, consumerSecret).verified).toBe(false);
  });
  it('FAILS CLOSED when the consumer secret is not configured', () => {
    const r = verifyXSignature(RAW, sig, undefined);
    expect(r.verified).toBe(false);
    expect(r.reason).toMatch(/fail closed/i);
  });
  it('computes a deterministic CRC response token', () => {
    const a = computeXCrcResponse('crc123', consumerSecret);
    const b = computeXCrcResponse('crc123', consumerSecret);
    expect(a).toBe(b);
    expect(a.startsWith('sha256=')).toBe(true);
  });
});

describe('verifyWebhookSignature dispatch', () => {
  const metaSecret = 'meta-app-secret';
  const metaSig = 'sha256=' + createHmac('sha256', metaSecret).update(RAW, 'utf8').digest('hex');

  it('routes whatsapp to the Meta scheme and verifies', () => {
    const r = verifyWebhookSignature('whatsapp', {
      rawBody: RAW,
      headers: { 'X-Hub-Signature-256': metaSig },
      secrets: { metaAppSecret: metaSecret },
    });
    expect(r.verified).toBe(true);
  });
  it('is case-insensitive on header names', () => {
    const r = verifyWebhookSignature('instagram', {
      rawBody: RAW,
      headers: { 'x-hub-signature-256': metaSig },
      secrets: { metaAppSecret: metaSecret },
    });
    expect(r.verified).toBe(true);
  });
  it('FAILS CLOSED for providers with no wired scheme (linkedin/tiktok)', () => {
    for (const p of ['linkedin', 'tiktok'] as const) {
      const r = verifyWebhookSignature(p, { rawBody: RAW, headers: {}, secrets: {} });
      expect(r.verified).toBe(false);
      expect(r.reason).toMatch(/fail closed|not yet implemented/i);
    }
  });
  it('never claims Pub/Sub verification it did not perform', () => {
    const r = verifyWebhookSignature('youtube', {
      rawBody: '{}',
      headers: { authorization: 'Bearer a.b.c' },
      secrets: { pubsubAudience: 'aud' },
    });
    expect(r.verified).toBe(false);
    expect(r.reason).toMatch(/JWKS/i);
  });
});

describe('idempotency (mandate §14)', () => {
  it('produces a stable key from the provider event id', () => {
    const k1 = idempotencyKey('whatsapp', 'evt_1', RAW);
    const k2 = idempotencyKey('whatsapp', 'evt_1', RAW + 'different');
    // Same provider event id => same key even if the body differs slightly,
    // so duplicate deliveries collapse.
    expect(k1).toBe(k2);
    expect(k1).toBe('whatsapp:evt_1');
  });
  it('falls back to a payload hash when no event id is present', () => {
    const k1 = idempotencyKey('telegram', undefined, RAW);
    const k2 = idempotencyKey('telegram', undefined, RAW);
    const k3 = idempotencyKey('telegram', undefined, RAW + 'x');
    expect(k1).toBe(k2);
    expect(k1).not.toBe(k3);
    expect(k1.startsWith('telegram:hash:')).toBe(true);
  });
  it('payloadHash is a stable sha256 hex', () => {
    expect(payloadHash(RAW)).toMatch(/^[a-f0-9]{64}$/);
    expect(payloadHash(RAW)).toBe(payloadHash(RAW));
  });
});
