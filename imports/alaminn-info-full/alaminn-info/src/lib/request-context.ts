/**
 * Request-scoped context tracking via AsyncLocalStorage.
 * -----------------------------------------------------
 * Each HTTP request is assigned a unique request ID (read from the
 * `X-Request-Id` header if provided by the client, otherwise generated).
 * The ID is stored in an AsyncLocalStorage context so any code running
 * anywhere in the request lifecycle (route handlers, services, logger,
 * error handlers) can access it via `getRequestId()`.
 *
 * This module also maintains a process-wide request counter used by the
 * /api/health/deep endpoint for runtime metrics.
 *
 * SECURITY: The request ID is a non-secret correlation token. It is safe
 * to surface in logs, response headers, and error payloads. It does NOT
 * contain any user-identifying information.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes, randomUUID } from "node:crypto";

type RequestContext = { requestId: string };

export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Generate a short, URL-safe request ID.
 *
 * Uses `crypto.randomUUID()` (v4 UUID) when available and trims it to 16
 * hex chars for compact log lines while remaining practically unique.
 * Falls back to 16 hex chars from `randomBytes` if `randomUUID` is
 * unavailable (very old Node or restricted runtimes).
 */
export function generateRequestId(): string {
  try {
    // randomUUID may throw in runtimes without secure entropy (rare)
    const uuid = randomUUID();
    return uuid.replace(/-/g, "").slice(0, 16);
  } catch {
    return randomBytes(8).toString("hex");
  }
}

/**
 * Get the request ID for the current async context, if any.
 * Returns null when called outside a request (e.g. startup, cron, CLI).
 */
export function getRequestId(): string | null {
  const ctx = requestContext.getStore();
  return ctx?.requestId ?? null;
}

/**
 * Run a function within a request context. The provided requestId will be
 * available via `getRequestId()` for the duration of `fn`.
 */
export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return requestContext.run({ requestId }, fn);
}

// ─── Process-level request counter ────────────────────────────────────
// Incremented by middleware on every request. Read by /api/health/deep
// for the `runtime.requestCount` metric.
//
// We persist the counter on `globalThis` (the same pattern Prisma uses)
// so that middleware and route handlers — which may load separate
// module instances in Next.js dev / serverless — observe the SAME
// counter. A bare module-level `let` would silently reset to 0 in any
// route-handler module instance that wasn't the one middleware wrote to.
//
// NOTE: this is still in-process only. In a multi-instance deployment
// each instance would maintain its own counter; aggregate externally
// for fleet-wide totals.

const globalForMetrics = globalThis as unknown as {
  __requestCount?: number;
};

export function incrementRequestCount(): void {
  globalForMetrics.__requestCount = (globalForMetrics.__requestCount ?? 0) + 1;
}

export function getRequestCount(): number {
  return globalForMetrics.__requestCount ?? 0;
}
