// ============================================================
// Token Encryption Utility — AES-256-GCM
// Uses ENCRYPTION_KEY from environment — 32-byte hex string
// Never logs or exposes decrypted values in any response
// ============================================================

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY || '';
  if (!keyHex || keyHex.length < 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes) in production.');
    }
    // Dev fallback — NOT for production
    return Buffer.from('alo_dev_fallback_key_32bytes_padx', 'utf8').slice(0, 32);
  }
  return Buffer.from(keyHex, 'hex').slice(0, 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return '';
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a ciphertext string produced by encryptToken.
 * Returns empty string on any failure (no error thrown).
 */
export function decryptToken(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(':')) return '';
  try {
    const key = getKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  } catch {
    return '';
  }
}

/**
 * Returns a masked version of a token for safe logging.
 */
export function maskToken(token: string): string {
  if (!token || token.length < 12) return '***';
  return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
}
