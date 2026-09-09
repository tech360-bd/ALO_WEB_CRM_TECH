// Unit tests for the password hashing utility.
// Verifies that passwords are hashed correctly and that hashes can be verified.

import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('password hashing', () => {
  it('hashes a password and verifies it', async () => {
    const password = 'MySecurePassword123!';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);
  });

  it('rejects wrong password', async () => {
    const password = 'correct-password';
    const wrong = 'wrong-password';
    const hash = await bcrypt.hash(password, 10);
    const match = await bcrypt.compare(wrong, hash);
    expect(match).toBe(false);
  });

  it('produces different hashes for same password (salt)', async () => {
    const password = 'same-password';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    expect(hash1).not.toBe(hash2);
    // Both should still verify against the original password
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });
});
