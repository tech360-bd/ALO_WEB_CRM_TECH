/**
 * tests/lib/auth.test.ts — password hashing primitives
 *
 * Covers the pure-Node password primitives in src/lib/auth.ts:
 *   - hashPassword returns `scrypt$salt$hash` (3 $-separated parts)
 *   - verifyPassword accepts the correct password
 *   - verifyPassword rejects an incorrect password
 *   - different salts produce different stored hashes for the same password
 *
 * These tests deliberately avoid touching `next/headers`, the cookie store,
 * or the DB — `hashPassword` / `verifyPassword` are pure functions over
 * Node's `crypto` module. Importing `auth.ts` does pull in `db` and
 * `next/headers`, but neither is invoked at module load.
 *
 * scrypt is intentionally slow (~100 ms per hash at N=16384), so we keep
 * the number of hashes per test minimal.
 */
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("hashPassword — output format", () => {
  it("returns a string in `scrypt$salt$hash` format", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(typeof stored).toBe("string");
    const parts = stored.split("$");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("scrypt");
    // salt is 16 random bytes → 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    // hash is 64 bytes → 128 hex chars
    expect(parts[2]).toMatch(/^[0-9a-f]{128}$/);
  });

  it("produces a different salt on every call (randomness)", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
    const saltA = a.split("$")[1];
    const saltB = b.split("$")[1];
    expect(saltA).not.toBe(saltB);
  });
});

describe("verifyPassword — correct password", () => {
  it("returns true for the original password", () => {
    const password = "Tr0ub4dor&3";
    const stored = hashPassword(password);
    expect(verifyPassword(password, stored)).toBe(true);
  });

  it("returns true for a long passphrase", () => {
    const password = "a".repeat(200);
    const stored = hashPassword(password);
    expect(verifyPassword(password, stored)).toBe(true);
  });

  it("returns true for a password with unicode", () => {
    const password = "пароль-🔐-123";
    const stored = hashPassword(password);
    expect(verifyPassword(password, stored)).toBe(true);
  });
});

describe("verifyPassword — wrong password", () => {
  it("returns false for a completely different password", () => {
    const stored = hashPassword("correct-password");
    expect(verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("returns false for a near-miss password", () => {
    const stored = hashPassword("correct-password");
    expect(verifyPassword("correct-passw0rd", stored)).toBe(false);
    expect(verifyPassword("Correct-password", stored)).toBe(false);
    expect(verifyPassword("correct-password ", stored)).toBe(false);
  });

  it("returns false for an empty password", () => {
    const stored = hashPassword("real-password");
    expect(verifyPassword("", stored)).toBe(false);
  });
});

describe("verifyPassword — different salts produce different hashes", () => {
  it("two hashes for the same password are not equal", () => {
    const password = "shared-secret";
    const h1 = hashPassword(password);
    const h2 = hashPassword(password);
    expect(h1).not.toBe(h2);
    // ...but both verify against the original password.
    expect(verifyPassword(password, h1)).toBe(true);
    expect(verifyPassword(password, h2)).toBe(true);
    // And the salt portion specifically differs.
    expect(h1.split("$")[1]).not.toBe(h2.split("$")[1]);
    // While the hash portion also differs (different salt → different hash).
    expect(h1.split("$")[2]).not.toBe(h2.split("$")[2]);
  });

  it("a hash generated with one salt does not verify against a re-hash with a different salt", () => {
    // Sanity: re-hashing the same password produces a different stored
    // string, but both should still verify the password independently.
    const password = "salt-test-123";
    const stored = hashPassword(password);
    const otherStored = hashPassword(password);
    // Verifying the same password against either stored hash works.
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword(password, otherStored)).toBe(true);
    // A wrong password fails against both.
    expect(verifyPassword("nope", stored)).toBe(false);
    expect(verifyPassword("nope", otherStored)).toBe(false);
  });
});

describe("verifyPassword — malformed stored strings", () => {
  it("returns false for a stored string with the wrong scheme prefix", () => {
    expect(verifyPassword("anything", "bcrypt$salt$hash")).toBe(false);
  });

  it("returns false for a stored string missing parts", () => {
    expect(verifyPassword("anything", "scrypt$onlyonepart")).toBe(false);
    expect(verifyPassword("anything", "scrypt$")).toBe(false);
    expect(verifyPassword("anything", "$$")).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });

  it("returns false for a stored string with non-hex salt/hash", () => {
    // The split shape is correct, but the salt and hash contain non-hex
    // characters. scryptSync will throw, which verifyPassword swallows.
    expect(verifyPassword("anything", "scrypt$zzzz$yyyy")).toBe(false);
  });

  it("returns false for non-string stored values (defensive)", () => {
    // verifyPassword is typed to accept string, but we verify that passing
    // odd values via a cast doesn't crash the process.
    expect(verifyPassword("anything", null as unknown as string)).toBe(false);
    expect(verifyPassword("anything", undefined as unknown as string)).toBe(false);
    expect(verifyPassword("anything", 42 as unknown as string)).toBe(false);
  });
});
