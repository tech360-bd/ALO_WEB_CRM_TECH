// ============================================================
// Unified Communication Center — Webhook Security
// src/lib/ucc/providers/webhook-security.ts
//
// Provider-specific webhook signature verification + idempotency, per the
// master mandate §13 (webhook security) and §14 (idempotency).
//
// Rules enforced:
//  - Signature checks run over the RAW body bytes, never parsed JSON.
//  - Comparison is constant-time (timingSafeEqual) to avoid leaking the
//    secret through response timing.
//  - Missing secret => fail closed (reject), never fail open.
//  - Each provider uses its OFFICIAL scheme; where a provider has no
//    replay protection (e.g. X), we say so and do not pretend otherwise.
//
// No secrets are stored here; they are read from env at call time and
// never logged or returned.
// ============================================================

import { createHmac, timingSafeEqual, createHash } from 'crypto';
import type { ProviderCode } from './types';

/** Outcome of a webhook verification attempt. */
export interface WebhookVerification {
  verified: boolean;
  /** Present for GET verification challenges (Meta hub.challenge, X CRC). */
  challenge?: string;
  /** Why it failed — safe, secret-free text. */
  reason?: string;
}

/** Constant-time string comparison that never throws on length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** HMAC-SHA256 of the raw body with the given secret, hex-encoded. */
function hmacSha256Hex(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

/** HMAC-SHA256 of the raw body with the given secret, base64-encoded. */
function hmacSha256Base64(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
}

/** SHA-256 hex of a payload — used for idempotency hashing (§14). */
export function payloadHash(rawBody: string): string {
  return createHash('sha256').update(rawBody, 'utf8').digest('hex');
}

/**
 * Verify a Meta-family webhook (WhatsApp / Facebook / Instagram /
 * Messenger). Meta signs POSTs with `X-Hub-Signature-256: sha256=<hex>`,
 * an HMAC-SHA256 of the raw body keyed with the app secret.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  appSecret: string | undefined
): WebhookVerification {
  if (!appSecret) return { verified: false, reason: 'app secret not configured (fail closed)' };
  if (!signatureHeader) return { verified: false, reason: 'missing X-Hub-Signature-256 header' };
  const provided = signatureHeader.replace(/^sha256=/, '').trim();
  const expected = hmacSha256Hex(appSecret, rawBody);
  return safeEqual(provided, expected)
    ? { verified: true }
    : { verified: false, reason: 'signature mismatch' };
}

/**
 * Handle the Meta GET subscription challenge (hub.verify_token). Returns the
 * hub.challenge to echo back when the verify token matches.
 */
export function verifyMetaChallenge(
  query: Record<string, string>,
  verifyToken: string | undefined
): WebhookVerification {
  if (!verifyToken) return { verified: false, reason: 'WHATSAPP_VERIFY_TOKEN not configured (fail closed)' };
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  if (mode !== 'subscribe') return { verified: false, reason: 'hub.mode is not subscribe' };
  if (!token) return { verified: false, reason: 'missing hub.verify_token' };
  if (!safeEqual(token, verifyToken)) return { verified: false, reason: 'verify token mismatch' };
  return { verified: true, challenge };
}

/**
 * Verify a Telegram webhook. Telegram does not sign the body; instead the
 * bot's `secret_token` (set via setWebhook) is echoed in the
 * `X-Telegram-Bot-Api-Secret-Token` header. We compare it constant-time.
 */
export function verifyTelegramSecret(
  secretHeader: string | undefined,
  expectedSecret: string | undefined
): WebhookVerification {
  if (!expectedSecret) return { verified: false, reason: 'telegram webhook secret not configured (fail closed)' };
  if (!secretHeader) return { verified: false, reason: 'missing X-Telegram-Bot-Api-Secret-Token header' };
  return safeEqual(secretHeader, expectedSecret)
    ? { verified: true }
    : { verified: false, reason: 'secret token mismatch' };
}

/**
 * Verify an X (Twitter) Account Activity webhook. X signs the raw body with
 * the consumer secret and sends `x-twitter-webhooks-signature:
 * sha256=<base64>`. NOTE: the signature carries NO timestamp, so X provides
 * no native replay protection — callers must rely on event-id idempotency.
 */
export function verifyXSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  consumerSecret: string | undefined
): WebhookVerification {
  if (!consumerSecret) return { verified: false, reason: 'consumer secret not configured (fail closed)' };
  if (!signatureHeader) return { verified: false, reason: 'missing x-twitter-webhooks-signature header' };
  const provided = signatureHeader.replace(/^sha256=/, '').trim();
  const expected = hmacSha256Base64(consumerSecret, rawBody);
  return safeEqual(provided, expected)
    ? { verified: true }
    : { verified: false, reason: 'signature mismatch' };
}

/**
 * X Challenge-Response Check (CRC). X periodically GETs the endpoint with
 * `crc_token`; we must reply with a JSON body containing
 * `response_token = "sha256=" + base64(HMAC_SHA256(crc_token, consumerSecret))`.
 */
export function computeXCrcResponse(crcToken: string, consumerSecret: string): string {
  return `sha256=${hmacSha256Base64(consumerSecret, crcToken)}`;
}

/**
 * Verify a Google Cloud Pub/Sub push message JWT-ish handshake. Pub/Sub
 * push uses an OIDC JWT in the Authorization header; full verification
 * requires fetching Google's JWKS and validating claims. We expose the
 * structural checks here and require the caller to validate the JWT
 * signature/audience with a verified JWKS verifier (not faked here).
 */
export function verifyPubSubStructure(
  authHeader: string | undefined,
  expectedAudience: string | undefined
): WebhookVerification {
  if (!authHeader?.startsWith('Bearer ')) {
    return { verified: false, reason: 'missing Bearer JWT' };
  }
  const jwt = authHeader.slice('Bearer '.length).trim();
  const parts = jwt.split('.');
  if (parts.length !== 3) return { verified: false, reason: 'malformed JWT' };
  // Structural check only. Signature + aud + exp MUST be validated by a
  // JWKS-backed verifier before trusting the payload. We refuse to claim
  // verification we did not perform.
  if (!expectedAudience) return { verified: false, reason: 'audience not configured (cannot validate JWT)' };
  return { verified: false, reason: 'JWT signature validation must be performed by a JWKS verifier (not faked here)' };
}

/**
 * Dispatch to the correct provider verification scheme. Providers without a
 * body signature (or not yet wired) fail closed with an explicit reason —
 * they are never silently treated as verified.
 */
export function verifyWebhookSignature(
  provider: ProviderCode,
  opts: {
    rawBody: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    secrets: {
      metaAppSecret?: string;
      metaVerifyToken?: string;
      telegramSecret?: string;
      xConsumerSecret?: string;
      pubsubAudience?: string;
    };
  }
): WebhookVerification {
  const h = lowerKeys(opts.headers);
  switch (provider) {
    case 'whatsapp':
    case 'facebook':
    case 'messenger':
    case 'instagram':
      return verifyMetaSignature(opts.rawBody, h['x-hub-signature-256'], opts.secrets.metaAppSecret);
    case 'telegram':
      return verifyTelegramSecret(h['x-telegram-bot-api-secret-token'], opts.secrets.telegramSecret);
    case 'x':
      return verifyXSignature(opts.rawBody, h['x-twitter-webhooks-signature'], opts.secrets.xConsumerSecret);
    case 'youtube':
    case 'google_business':
      return verifyPubSubStructure(h['authorization'], opts.secrets.pubsubAudience);
    case 'linkedin':
    case 'tiktok':
      // These providers' webhook schemes are product-gated and not yet
      // wired. Fail closed rather than pretend.
      return { verified: false, reason: `${provider} webhook verification not yet implemented (fail closed)` };
    case 'email':
      return { verified: false, reason: 'email inbound uses provider-specific verification (e.g. Inbound Parse signature); configure per transport' };
    default:
      return { verified: false, reason: `no verification scheme for provider '${provider}'` };
  }
}

/**
 * Derive a stable idempotency key for a webhook event (§14). Combines the
 * provider, the provider's own event id when present, and a hash of the
 * payload so duplicate deliveries collapse to one key.
 */
export function idempotencyKey(
  provider: ProviderCode,
  providerEventId: string | undefined,
  rawBody: string
): string {
  const hash = payloadHash(rawBody).slice(0, 32);
  return providerEventId ? `${provider}:${providerEventId}` : `${provider}:hash:${hash}`;
}

function lowerKeys(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) out[k.toLowerCase()] = v;
  return out;
}
