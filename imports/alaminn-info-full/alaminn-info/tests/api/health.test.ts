/**
 * tests/api/health.test.ts — public health endpoints
 *
 * Integration tests against the running Next.js dev server (port 3000).
 * If the dev server is not reachable, `beforeAll` throws — which fails
 * every test in this file with a clear error message. This makes the
 * failure visible in CI instead of silently passing as a skip.
 *
 * Covered:
 *   - GET /api/health returns 200 with { success: true, data: { status: "ok" } }
 *   - GET /api/health/deep returns 200 with a services block (public tier)
 *   - GET /api/health is fast (< 2s — fails otherwise to catch a hung server)
 *   - GET /api/health/deep does not leak private counts to anonymous callers
 */
import { describe, it, expect, beforeAll } from "vitest";

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

describe("GET /api/health — liveness", () => {
  it("returns 200 with success:true and data.status === 'ok'", async () => {
    const res = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeTypeOf("object");
    expect(body.data.status).toBe("ok");
    expect(body.data.application).toBe("Alaminn.info");
    // ISO timestamp present
    expect(typeof body.data.timestamp).toBe("string");
    expect(Date.parse(body.data.timestamp)).not.toBeNaN();
  });

  it("responds quickly (< 2s wall time)", async () => {
    const start = Date.now();
    const res = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const elapsed = Date.now() - start;
    expect(res.ok).toBe(true);
    expect(elapsed).toBeLessThan(2000);
  });
});

describe("GET /api/health/deep — public tier", () => {
  it("returns 200 with a services block", async () => {
    const res = await fetch(`${BASE}/api/health/deep`, {
      signal: AbortSignal.timeout(5000),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeTypeOf("object");
    // The public tier advertises a small, safe services map.
    expect(body.data.services).toBeTypeOf("object");
    expect(body.data.services.website).toBe("available");
    expect(body.data.services.contactForm).toBe("available");
    expect(body.data.services.newsletter).toBe("available");
    // The public tier explicitly labels itself as such.
    expect(body.meta.tier).toBe("public");
  });

  it("does not leak private record counts to anonymous callers", async () => {
    const res = await fetch(`${BASE}/api/health/deep`, {
      signal: AbortSignal.timeout(5000),
    });
    const body = await res.json();
    // The authenticated tier exposes a `checks.privateCounts` block. The
    // public tier MUST NOT — that would leak contact / inquiry / user counts.
    expect(body.data.checks).toBeUndefined();
    expect(body.data.privateCounts).toBeUndefined();
    expect(body.data.session).toBeUndefined();
  });

  it("exposes non-sensitive runtime metrics (uptime, memory, requestCount)", async () => {
    const res = await fetch(`${BASE}/api/health/deep`, {
      signal: AbortSignal.timeout(5000),
    });
    const body = await res.json();
    expect(body.data.runtime).toBeTypeOf("object");
    expect(typeof body.data.runtime.uptimeSeconds).toBe("number");
    expect(body.data.runtime.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.data.runtime.memory).toBeTypeOf("object");
    expect(typeof body.data.runtime.memory.rss).toBe("number");
    expect(typeof body.data.runtime.requestCount).toBe("number");
  });
});
