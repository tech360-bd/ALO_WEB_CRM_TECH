/**
 * tests/api/admin-auth.test.ts — admin endpoint authn guards
 *
 * Verifies that admin CRM endpoints reject unauthenticated callers with
 * HTTP 401. If the dev server is not reachable on port 3000, `beforeAll`
 * throws — which fails every test in this file with a clear message,
 * instead of silently skipping (so CI catches a missing dev server).
 */
import { describe, it, expect, beforeAll } from "vitest";

// Dev server runs on port 3000 (per the updated package.json dev script).
const BASE = "http://localhost:3000";

beforeAll(async () => {
  // Fail loudly if the dev server isn't running. Throwing in `beforeAll`
  // marks every test in this file as failed (instead of silently skipping)
  // so CI catches a missing dev server.
  try {
    const res = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`health endpoint returned HTTP ${res.status}`);
    }
  } catch (e) {
    throw new Error(
      `Dev server not reachable on :3000 — start it with 'bun run dev' before running integration tests (${(e as Error).message})`,
    );
  }
});

describe("Admin API — unauthenticated access is rejected", () => {
  it("GET /api/v1/admin/dashboard returns 401 without a session cookie", async () => {
    const res = await fetch(`${BASE}/api/v1/admin/dashboard`, {
      credentials: "omit",
      signal: AbortSignal.timeout(5000),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors).toContain("unauthenticated");
  });

  it("GET /api/v1/admin/contacts returns 401 without a session cookie", async () => {
    const res = await fetch(`${BASE}/api/v1/admin/contacts`, {
      credentials: "omit",
      signal: AbortSignal.timeout(5000),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("unauthenticated");
  });
});
