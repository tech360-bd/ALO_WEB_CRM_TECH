/**
 * Token encryption for social integrations.
 *
 * This module used to contain a second, independent AES-256-GCM implementation
 * that differed from src/lib/token-encryption.ts only in encoding (base64 vs
 * hex), segment order and failure behaviour. Two copies of the same primitive
 * means two places to get wrong, and neither was actually wired into the
 * Facebook integration — which stored page tokens and the app secret in
 * plaintext. It is now a thin adapter over the single canonical implementation.
 *
 * The canonical `decryptToken` returns '' on any failure, which is correct for
 * newly written rows but would silently blank out the legacy plaintext rows
 * already in `FacebookIntegration`. `decryptStoredToken` adds the one piece of
 * behaviour the social path genuinely needs: pass through values that were
 * never encrypted, so reading old rows keeps working while every write is now
 * encrypted at rest.
 */
import { decryptToken, encryptToken, maskToken } from '@/lib/token-encryption';

export { encryptToken, decryptToken, maskToken };

/**
 * An encrypted value from the canonical implementation is exactly three
 * hex-encoded segments (`iv:authTag:ciphertext`) separated by colons. A 12-byte
 * IV is 24 hex chars and a 16-byte GCM tag is 32, so any genuine ciphertext is
 * comfortably longer than 56 characters; the length floor keeps short plaintext
 * values that happen to contain two colons from being mistaken for ciphertext.
 */
export function isEncrypted(value: string): boolean {
  if (typeof value !== 'string' || !value) return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  if (value.length < 57) return false;
  return parts.every((part) => /^[0-9a-fA-F]+$/.test(part));
}

/**
 * Decrypts a stored token, tolerating legacy plaintext values.
 *
 * Returns '' only when the value looks encrypted but cannot be decrypted —
 * i.e. it was written under a different ENCRYPTION_KEY. That case must not
 * fall back to returning the ciphertext, because a ciphertext is not a usable
 * credential and silently returning one leads to confusing provider errors.
 */
export function decryptStoredToken(stored: string | null | undefined): string {
  if (!stored) return '';
  if (!isEncrypted(stored)) return stored;
  return decryptToken(stored);
}

/**
 * Encrypts a token for storage. Values that are already encrypted are returned
 * unchanged, so re-saving an integration row is idempotent and cannot produce
 * double-encrypted blobs.
 */
export function encryptStoredToken(plain: string | null | undefined): string {
  if (!plain) return '';
  if (isEncrypted(plain)) return plain;
  return encryptToken(plain);
}
