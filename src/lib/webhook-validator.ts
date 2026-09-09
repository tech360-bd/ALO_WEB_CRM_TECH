// ============================================================
// Webhook Signature Validator
// Validates incoming webhooks from Meta, WhatsApp, Telegram
// OAuth state + PKCE generator utilities
// ============================================================

import { createHmac, timingSafeEqual, randomBytes, createHash } from 'crypto';

/**
 * Validates Meta / WhatsApp Cloud API webhook signatures.
 * Meta sends: X-Hub-Signature-256: sha256=<hex>
 */
export function validateMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`;
  try {
    const sigBuf = Buffer.from(signatureHeader);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Validates Telegram webhook secret header.
 * Telegram sends: X-Telegram-Bot-Api-Secret-Token
 */
export function validateTelegramWebhookSecret(
  secretHeader: string | null,
  configuredSecret: string
): boolean {
  if (!secretHeader || !configuredSecret) return false;
  try {
    const a = Buffer.from(secretHeader);
    const b = Buffer.from(configuredSecret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically random OAuth state parameter.
 * Used to prevent CSRF attacks in OAuth flows.
 */
export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a cryptographically random PKCE code verifier.
 */
export function generatePKCEVerifier(): string {
  return randomBytes(64).toString('base64url');
}

/**
 * Derive PKCE code challenge from verifier (S256 method).
 */
export function derivePKCEChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}
