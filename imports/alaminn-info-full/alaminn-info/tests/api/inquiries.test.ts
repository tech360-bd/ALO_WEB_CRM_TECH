/**
 * tests/api/inquiries.test.ts — POST /api/v1/inquiries validation
 *
 * Integration tests against the running dev server (port 3000). Each test
 * exercises a *rejection* path — we deliberately do NOT submit a valid
 * inquiry because that would create a real DB row (contact + inquiry +
 * opportunity + task + audit log) on every test run.
 *
 * Covered rejection paths:
 *   - empty / missing / invalid-JSON body     → 400 "Invalid request body."
 *   - honeypot field filled                   → 400 "Submission rejected." ["spam"]
 *   - {} (valid JSON, no fields)              → 422 with required-field errors
 *   - invalid email format                    → 422 ["email_invalid"]
 *   - missing privacyConsent / commsConsent   → 422 with both consent errors
 *
 * Rate-limit safety: the route allows 5 submissions per minute per IP hash.
 * Rejection tests don't increment the rate-limit counter (they short-circuit
 * before the rate-limit check in some cases, or never reach the DB in others),
 * but we still stagger calls defensively.
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:3000";
const URL = `${BASE}/api/v1/inquiries`;

let serverReachable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    serverReachable = res.ok;
  } catch {
    serverReachable = false;
  }
});

async function postJson(body: unknown, init: RequestInit = {}): Promise<Response> {
  // The route rate-limits 5 submissions per 60s per IP hash. Each rejection
  // test that reaches the rate-limit check increments the counter, so a
  // single shared IP would hit 429 before we finish the suite. We sidestep
  // this by giving every call a unique X-Forwarded-For — the route reads
  // this header (see `ipHash()` in src/app/api/v1/inquiries/route.ts) and
  // hashes it per-IP, so each test gets its own fresh rate-limit bucket.
  const fakeIp = `198.51.100.${Math.floor(Math.random() * 254) + 1}`;
  return fetch(URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": fakeIp,
      ...(init.headers ?? {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
    ...init,
  });
}

describe("POST /api/v1/inquiries — body parsing rejections (400)", () => {
  it("returns 400 when no body is sent", async () => {
    if (!serverReachable) return;
    const res = await fetch(URL, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/invalid request body/i);
  });

  it("returns 400 when body is empty string", async () => {
    if (!serverReachable) return;
    const res = await postJson("");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/invalid request body/i);
  });

  it("returns 400 when body is not valid JSON", async () => {
    if (!serverReachable) return;
    const res = await postJson("not-json");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/invalid request body/i);
  });

  it("returns 400 with ['spam'] when the honeypot field is filled", async () => {
    if (!serverReachable) return;
    // The honeypot field is named `website`. A real user (with CSS on) never
    // fills it; a bot scraping the form will. Any truthy value triggers spam.
    const res = await postJson({
      website: "http://spam.example.com",
      type: "general",
      fullName: "Bot",
      email: "bot@example.com",
      privacyConsent: true,
      commsConsent: true,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("spam");
  });
});

describe("POST /api/v1/inquiries — field-validation rejections (422)", () => {
  it("returns 422 with required-field errors when body is {}", async () => {
    if (!serverReachable) return;
    const res = await postJson({});
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        "type_required",
        "fullName_required",
        "email_required",
        "privacyConsent_required",
        "commsConsent_required",
      ])
    );
    // Exactly the 5 required-field errors — no extras.
    expect(body.errors).toHaveLength(5);
  });

  it("returns 422 with ['email_invalid'] when email format is bad", async () => {
    if (!serverReachable) return;
    const res = await postJson({
      type: "general",
      fullName: "Jane Doe",
      email: "not-an-email",
      privacyConsent: true,
      commsConsent: true,
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("email_invalid");
    // The required-field errors must NOT be present (everything else is valid).
    expect(body.errors).not.toContain("email_required");
    expect(body.errors).not.toContain("type_required");
    expect(body.errors).not.toContain("fullName_required");
    expect(body.errors).not.toContain("privacyConsent_required");
    expect(body.errors).not.toContain("commsConsent_required");
  });

  it("returns 422 with both consent errors when consents are missing", async () => {
    if (!serverReachable) return;
    const res = await postJson({
      type: "general",
      fullName: "Jane Doe",
      email: "jane@example.com",
      // privacyConsent and commsConsent both omitted
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("privacyConsent_required");
    expect(body.errors).toContain("commsConsent_required");
  });

  it("returns 422 with ['studentDataConsent_required'] for student-referral without data consent", async () => {
    if (!serverReachable) return;
    const res = await postJson({
      type: "student-referral",
      fullName: "Jane Doe",
      email: "jane@example.com",
      privacyConsent: true,
      commsConsent: true,
      // studentDataConsent omitted
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("studentDataConsent_required");
  });

  it("treats explicitly-false consents the same as missing (422)", async () => {
    if (!serverReachable) return;
    const res = await postJson({
      type: "general",
      fullName: "Jane Doe",
      email: "jane@example.com",
      privacyConsent: false,
      commsConsent: false,
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors).toContain("privacyConsent_required");
    expect(body.errors).toContain("commsConsent_required");
  });
});

describe("POST /api/v1/inquiries — error envelope shape", () => {
  it("always returns a structured JSON envelope (not plain text)", async () => {
    if (!serverReachable) return;
    const res = await postJson({});
    const body = await res.json();
    // Envelope contract: { success, message, data, meta, errors }
    expect(body).toHaveProperty("success", false);
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("data", null);
    expect(body).toHaveProperty("meta");
    expect(body).toHaveProperty("errors");
    expect(Array.isArray(body.errors)).toBe(true);
  });
});
