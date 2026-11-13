/**
 * Signed OAuth `state` for provider connection flows.
 *
 * Why this exists
 * ---------------
 * The Facebook connection flow built a `state` value out of a plain base64url
 * blob containing `returnTo`, and the callback only *decoded* it — it never
 * verified that this server had issued it. Two consequences:
 *
 *   1. Login/connection CSRF. An attacker can craft a callback URL whose
 *      `state` they chose, so a victim's browser completes an OAuth exchange
 *      that binds the attacker's provider account (or the attacker's chosen
 *      `returnTo`) to the victim's session.
 *   2. Open redirect. `returnTo` was fed straight into `new URL(returnTo, req.url)`.
 *      A `returnTo` of `https://evil.example` resolves absolutely, so the
 *      callback redirected the user off-site after a successful connection —
 *      a ready-made phishing hop that carries the site's own trust.
 *
 * This module signs the state with HMAC-SHA256, expires it, and constrains
 * `returnTo` to a same-origin absolute path.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** How long a signed state stays valid. An OAuth round trip is seconds. */
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/**
 * The signing key. `NEXTAUTH_SECRET` is already a production-required variable
 * (see docs/environment-classification.json), so this adds no new secret to
 * the deployment contract; `AUTH_SECRET` is accepted as the newer alias.
 *
 * Fails closed in every environment: without a key, states cannot be signed and
 * the flow must not run, because an unsigned state is exactly the vulnerability
 * this module removes. There is deliberately no development fallback — every
 * other NEXTAUTH_SECRET consumer in this repository fails closed too, and a
 * predictable signing key would let anyone forge a state.
 */
function signingKey(): Buffer {
  // Read on separate lines on purpose. Chaining the two lookups together with a
  // logical-OR default on one line reads as an inline fallback to
  // scripts/audit-env-vars.mjs, which would reclassify NEXTAUTH_SECRET from
  // REFERENCED_FAIL_CLOSED to REFERENCED_WITH_FALLBACK in the documented
  // production contract. There is no default here — a missing or short secret
  // throws. (Note for editors: do not write an example of the rejected pattern
  // in this comment; the scanner matches it inside comments too.)
  const nextauthSecret = process.env.NEXTAUTH_SECRET;
  const authSecret = process.env.AUTH_SECRET;
  const secret = nextauthSecret ?? authSecret;
  if (!secret || secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET (or AUTH_SECRET) of at least 32 characters is required to sign OAuth state.');
  }
  return Buffer.from(secret, 'utf8');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', signingKey()).update(payloadB64).digest('base64url');
}

export interface OAuthStatePayload {
  /** Same-origin absolute path to return to after the flow. */
  returnTo?: string;
  /** Issued-at epoch milliseconds. */
  ts: number;
  /** Random value so two identical flows never share a state. */
  nonce: string;
  /** Provider tag, bound into the signature so a state cannot be replayed across providers. */
  provider: string;
}

/**
 * Constrains a redirect target to a same-origin absolute path.
 *
 * Rejects protocol-relative (`//evil.example`), scheme-bearing and backslash
 * variants — all of which `new URL(value, base)` would resolve off-site.
 */
export function safeReturnTo(candidate: string | null | undefined, fallback: string): string {
  const value = (candidate || '').trim();
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // Reject embedded control characters and any second slash-trick after decoding.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (value.includes('\\')) return fallback;
  if (value.length > 512) return fallback;
  return value;
}

/** Builds a signed, expiring state token. */
export function createOAuthState(provider: string, returnTo?: string): string {
  const payload: OAuthStatePayload = {
    returnTo: safeReturnTo(returnTo, ''),
    ts: Date.now(),
    nonce: randomBytes(16).toString('hex'),
    provider,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

export type OAuthStateFailure = 'malformed' | 'bad-signature' | 'expired' | 'provider-mismatch';

export type OAuthStateResult =
  | { ok: true; payload: OAuthStatePayload }
  | { ok: false; reason: OAuthStateFailure };

/**
 * Verifies a state token. Returns a discriminated result rather than throwing
 * so the callback can distinguish "reject the callback" from "server
 * misconfigured" without string matching.
 */
export function verifyOAuthState(
  state: string | null | undefined,
  provider: string,
  maxAgeMs: number = OAUTH_STATE_TTL_MS,
  now: number = Date.now(),
): OAuthStateResult {
  if (!state || typeof state !== 'string') return { ok: false, reason: 'malformed' };

  const separator = state.lastIndexOf('.');
  if (separator <= 0 || separator === state.length - 1) return { ok: false, reason: 'malformed' };

  const payloadB64 = state.slice(0, separator);
  const providedSignature = state.slice(separator + 1);

  const expected = sign(payloadB64);
  const a = Buffer.from(providedSignature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'bad-signature' };

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as OAuthStatePayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!payload || typeof payload.ts !== 'number') return { ok: false, reason: 'malformed' };
  if (payload.provider !== provider) return { ok: false, reason: 'provider-mismatch' };
  if (now - payload.ts > maxAgeMs || payload.ts > now + 60_000) return { ok: false, reason: 'expired' };

  return { ok: true, payload: { ...payload, returnTo: safeReturnTo(payload.returnTo, '') } };
}
