/**
 * tests/lib/env.test.ts — environment-variable validation
 *
 * Covers the critical paths of src/lib/env.ts:
 *   - dev fallback for AUTH_SECRET in development
 *   - hard failure in production when AUTH_SECRET is missing
 *   - hard failure in production when AUTH_SECRET is < 32 bytes
 *   - SMTP_PORT parsing (valid / invalid / unset)
 *   - emailConfigured flag reflects SMTP/Resend presence
 *
 * env() is a cached singleton, so we call `_resetEnv()` between every test
 * and snapshot/restore `process.env` to avoid cross-test contamination.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { env, _resetEnv, type AppEnv } from "@/lib/env";

const KEYS_WE_TOUCH = [
  "NODE_ENV",
  "AUTH_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "NEXT_PUBLIC_SITE_URL",
  "DATABASE_URL",
];

const snapshot: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS_WE_TOUCH) snapshot[k] = process.env[k];
  // Ensure a clean env-cache state for each test.
  _resetEnv();
});

afterEach(() => {
  for (const k of KEYS_WE_TOUCH) {
    if (snapshot[k] === undefined) delete process.env[k];
    else process.env[k] = snapshot[k];
  }
  _resetEnv();
});

function setDev() {
  process.env.NODE_ENV = "development";
}
function setProd() {
  process.env.NODE_ENV = "production";
}
function clearAuthSecret() {
  delete process.env.AUTH_SECRET;
}
function clearEmailEnv() {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
}

describe("env() — development fallbacks", () => {
  it("returns a dev-fallback AUTH_SECRET when not set in development", () => {
    setDev();
    clearAuthSecret();
    const e = env();
    expect(e.isDev).toBe(true);
    expect(e.isProd).toBe(false);
    // Fallback is intentionally non-empty and clearly marked as insecure.
    expect(e.authSecret).toBeTruthy();
    expect(e.authSecret.length).toBeGreaterThanOrEqual(32);
    expect(e.authSecret).toContain("dev");
  });

  it("uses an explicitly-set AUTH_SECRET when provided in development", () => {
    setDev();
    process.env.AUTH_SECRET = "a".repeat(48);
    const e = env();
    expect(e.authSecret).toBe("a".repeat(48));
  });

  it("falls back to the dev site URL when NEXT_PUBLIC_SITE_URL is unset", () => {
    setDev();
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const e = env();
    expect(e.siteUrl).toBe("http://localhost:3000");
  });

  it("strips a trailing slash from NEXT_PUBLIC_SITE_URL", () => {
    setDev();
    process.env.NEXT_PUBLIC_SITE_URL = "https://alaminn.info/";
    const e = env();
    expect(e.siteUrl).toBe("https://alaminn.info");
  });
});

describe("env() — production hardening", () => {
  it("throws when AUTH_SECRET is missing in production", () => {
    setProd();
    clearAuthSecret();
    // EMAIL_FROM must also be set in prod to avoid a separate throw — set it
    // so we isolate the AUTH_SECRET check.
    process.env.EMAIL_FROM = "Al Aminn <hello@alaminn.info>";
    expect(() => env()).toThrow(/AUTH_SECRET is missing/);
  });

  it("throws when AUTH_SECRET is shorter than 32 bytes in production", () => {
    setProd();
    process.env.AUTH_SECRET = "short"; // < 32 bytes
    process.env.EMAIL_FROM = "Al Aminn <hello@alaminn.info>";
    expect(() => env()).toThrow(/at least 32 bytes/);
  });

  it("accepts a >=32-byte AUTH_SECRET in production", () => {
    setProd();
    process.env.AUTH_SECRET = "x".repeat(64);
    process.env.EMAIL_FROM = "Al Aminn <hello@alaminn.info>";
    const e = env();
    expect(e.isProd).toBe(true);
    expect(e.authSecret).toBe("x".repeat(64));
  });

  it("throws when EMAIL_FROM is missing in production", () => {
    setProd();
    process.env.AUTH_SECRET = "x".repeat(64);
    delete process.env.EMAIL_FROM;
    expect(() => env()).toThrow(/EMAIL_FROM is missing/);
  });
});

describe("env() — SMTP_PORT parsing", () => {
  it("parses a valid SMTP_PORT", () => {
    setDev();
    clearEmailEnv();
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    const e = env();
    expect(e.smtpPort).toBe(465);
  });

  it("falls back to 587 when SMTP_PORT is unset", () => {
    setDev();
    clearEmailEnv();
    delete process.env.SMTP_PORT;
    const e = env();
    expect(e.smtpPort).toBe(587);
  });

  it("falls back to 587 when SMTP_PORT is non-numeric", () => {
    setDev();
    clearEmailEnv();
    process.env.SMTP_PORT = "not-a-number";
    const e = env();
    expect(e.smtpPort).toBe(587);
  });

  it("falls back to 587 when SMTP_PORT is out of range", () => {
    setDev();
    clearEmailEnv();
    process.env.SMTP_PORT = "99999";
    const e = env();
    expect(e.smtpPort).toBe(587);
  });

  it("falls back to 587 when SMTP_PORT is zero or negative", () => {
    setDev();
    clearEmailEnv();
    process.env.SMTP_PORT = "0";
    expect(env().smtpPort).toBe(587);
    process.env.SMTP_PORT = "-5";
    expect(env().smtpPort).toBe(587);
  });
});

describe("env() — emailConfigured flag", () => {
  it("is false when no SMTP or Resend is configured", () => {
    setDev();
    clearEmailEnv();
    const e = env();
    expect(e.emailConfigured).toBe(false);
    expect(e.smtpHost).toBeNull();
    expect(e.resendApiKey).toBeNull();
  });

  it("is true when a full SMTP set is configured", () => {
    setDev();
    clearEmailEnv();
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    const e = env();
    expect(e.emailConfigured).toBe(true);
  });

  it("is true when RESEND_API_KEY is set (even without SMTP)", () => {
    setDev();
    clearEmailEnv();
    process.env.RESEND_API_KEY = "re_test_key";
    const e = env();
    expect(e.emailConfigured).toBe(true);
  });

  it("is false when SMTP_HOST is set but other SMTP_* are missing (partial config)", () => {
    setDev();
    clearEmailEnv();
    // Only SMTP_HOST set — the others (USER, PASS) are still required for
    // smtpConfigured to flip true.
    process.env.SMTP_HOST = "smtp.example.com";
    const e = env() as AppEnv;
    // smtpConfigured = !!(host && port && user && pass) — host alone is insufficient.
    expect(e.emailConfigured).toBe(false);
  });
});
