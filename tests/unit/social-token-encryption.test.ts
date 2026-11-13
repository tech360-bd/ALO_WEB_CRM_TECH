import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  decryptStoredToken,
  encryptStoredToken,
  encryptToken,
  isEncrypted,
  maskToken,
} from '@/lib/social/token-encryption';

const KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const savedEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.ENCRYPTION_KEY = KEY;
});

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('isEncrypted', () => {
  it('recognizes the canonical iv:authTag:ciphertext shape', () => {
    expect(isEncrypted(encryptToken('EAAGm0PX4ZCpsBADEADSKQz'))).toBe(true);
  });

  it('does not mistake plaintext for ciphertext', () => {
    expect(isEncrypted('EAAGm0PX4ZCpsBADEADSKQz')).toBe(false);
    expect(isEncrypted('')).toBe(false);
    expect(isEncrypted('a:b:c')).toBe(false); // too short to be a real IV+tag+payload
    expect(isEncrypted('has:two:colons:and-more')).toBe(false); // four segments
    expect(isEncrypted('zz:zz:zz' + 'z'.repeat(80))).toBe(false); // not hex
  });
});

describe('encryptStoredToken / decryptStoredToken round trip', () => {
  it('hides a Facebook page access token at rest and recovers it', () => {
    const token = 'EAAGm0PX4ZCpsBADEADSKQz1234567890abcdefghij';
    const stored = encryptStoredToken(token);

    expect(stored).not.toBe(token);
    expect(stored).not.toContain(token);
    expect(isEncrypted(stored)).toBe(true);
    expect(decryptStoredToken(stored)).toBe(token);
  });

  it('produces a different ciphertext each time (random IV) but decrypts identically', () => {
    const token = 'EAAGm0PX4ZCpsBADEADSKQz';
    const a = encryptStoredToken(token);
    const b = encryptStoredToken(token);
    expect(a).not.toBe(b);
    expect(decryptStoredToken(a)).toBe(token);
    expect(decryptStoredToken(b)).toBe(token);
  });

  it('is idempotent, so re-saving a row cannot double-encrypt', () => {
    const once = encryptStoredToken('secret-token-value');
    const twice = encryptStoredToken(once);
    expect(twice).toBe(once);
    expect(decryptStoredToken(twice)).toBe('secret-token-value');
  });

  it('passes legacy plaintext rows through so existing integrations keep working', () => {
    expect(decryptStoredToken('EAAGm0PX4ZCpsBADEADSKQz')).toBe('EAAGm0PX4ZCpsBADEADSKQz');
  });

  it('handles empty and null values without throwing', () => {
    expect(encryptStoredToken('')).toBe('');
    expect(encryptStoredToken(null)).toBe('');
    expect(encryptStoredToken(undefined)).toBe('');
    expect(decryptStoredToken('')).toBe('');
    expect(decryptStoredToken(null)).toBe('');
    expect(decryptStoredToken(undefined)).toBe('');
  });

  it('returns empty rather than the ciphertext when the key has changed', () => {
    const stored = encryptStoredToken('EAAGm0PX4ZCpsBADEADSKQz');
    process.env.ENCRYPTION_KEY = 'f'.repeat(64);
    // A ciphertext under the old key must never be handed back as a credential.
    expect(decryptStoredToken(stored)).toBe('');
  });

  it('never emits the plaintext into the masked form used for logging', () => {
    const token = 'EAAGm0PX4ZCpsBADEADSKQzabcdefghij';
    const masked = maskToken(token);
    expect(masked).not.toBe(token);
    expect(masked).toContain('...');
    expect(maskToken('short')).toBe('***');
  });
});

describe('production key policy', () => {
  it('refuses to encrypt in production without a 64-hex ENCRYPTION_KEY', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_KEY = 'too-short';
    expect(() => encryptStoredToken('EAAGm0PX4ZCpsBADEADSKQz')).toThrow(/ENCRYPTION_KEY/);
  });

  it('accepts a valid 64-hex key in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => encryptStoredToken('EAAGm0PX4ZCpsBADEADSKQz')).not.toThrow();
  });
});
