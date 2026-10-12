import crypto from 'crypto';

/**
 * Signed, expiring unsubscribe tokens.
 *
 * Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload)).
 * The payload carries the recipient address and the campaign id. Verification
 * fails closed: a missing or short secret never produces a valid token.
 */

export const UNSUBSCRIBE_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;
export const MIN_UNSUBSCRIBE_SECRET_LENGTH = 32;
const MAX_TOKEN_LENGTH = 2048;

export type UnsubscribeTokenFailure = 'config' | 'malformed' | 'bad_signature' | 'expired';

export type UnsubscribeVerification =
  | { ok: true; email: string; campaignId: string | null }
  | { ok: false; reason: UnsubscribeTokenFailure };

export function isUsableUnsubscribeSecret(secret: string | null | undefined): secret is string {
  return typeof secret === 'string' && secret.length >= MIN_UNSUBSCRIBE_SECRET_LENGTH;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createUnsubscribeToken(
  input: { email: string; campaignId?: string | null },
  secret: string | null | undefined,
  nowMs: number = Date.now()
): string {
  if (!isUsableUnsubscribeSecret(secret)) throw new Error('EMAIL_UNSUBSCRIBE_SECRET_INVALID');
  const body = JSON.stringify({
    e: input.email,
    c: input.campaignId ?? null,
    x: nowMs + UNSUBSCRIBE_TOKEN_TTL_MS,
  });
  const payload = Buffer.from(body, 'utf8').toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyUnsubscribeToken(
  token: unknown,
  secret: string | null | undefined,
  nowMs: number = Date.now()
): UnsubscribeVerification {
  if (!isUsableUnsubscribeSecret(secret)) return { ok: false, reason: 'config' };
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: 'malformed' };
  }

  const parts = token.split('.');
  if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
    return { ok: false, reason: 'malformed' };
  }
  const [payload, signature] = parts;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!data || typeof data !== 'object') return { ok: false, reason: 'malformed' };

  const record = data as { e?: unknown; c?: unknown; x?: unknown };
  if (typeof record.e !== 'string' || typeof record.x !== 'number') return { ok: false, reason: 'malformed' };
  if (nowMs > record.x) return { ok: false, reason: 'expired' };

  return {
    ok: true,
    email: record.e,
    campaignId: typeof record.c === 'string' && record.c.length > 0 ? record.c : null,
  };
}

/** Public unsubscribe URL for one recipient. Throws when the secret is unusable. */
export function buildUnsubscribeUrl(args: {
  baseUrl: string;
  secret: string | null | undefined;
  email: string;
  campaignId: string | null;
}): string {
  const token = createUnsubscribeToken({ email: args.email, campaignId: args.campaignId }, args.secret);
  return `${args.baseUrl}/api/email/unsubscribe?t=${encodeURIComponent(token)}`;
}
