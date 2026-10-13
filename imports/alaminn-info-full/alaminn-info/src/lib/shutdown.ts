/**
 * Graceful shutdown — close DB connections and exit cleanly.
 * ----------------------------------------------------------
 * Triggered by:
 *   - SIGTERM  (container orchestrators: Kubernetes, Docker stop, etc.)
 *   - SIGINT   (Ctrl-C in dev)
 *
 * On signal:
 *   1. Log "Shutting down gracefully..."
 *   2. Disconnect Prisma ($disconnect) so in-flight queries complete
 *      and the SQLite file handle is released cleanly.
 *   3. Hard-exit after 5s if shutdown hangs (defensive — prevents
 *      zombie processes from blocking deploys).
 *
 * Wired into src/instrumentation.ts → register() so handlers are
 * installed exactly once at server boot, before any request is served.
 *
 * NOTE: Next.js may invoke `register()` multiple times in dev (once per
 * runtime); the `_installed` guard makes this idempotent.
 */
import { logger } from "./logger";

let _installed = false;
const SHUTDOWN_TIMEOUT_MS = 5_000;

async function disconnectDb(): Promise<void> {
  try {
    // Lazy import so this module doesn't pull Prisma into edge bundles
    // and so tests can stub the db without registering shutdown handlers.
    const { db } = await import("./db");
    await db.$disconnect();
    logger.info("shutdown.db_disconnected");
  } catch (e) {
    logger.warn("shutdown.db_disconnect_failed", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

async function shutdown(signal: string): Promise<never> {
  logger.info("Shutting down gracefully...", { signal });

  // Force-exit after the timeout regardless of pending work. `unref()`
  // so the timer itself doesn't keep the event loop alive.
  const forceTimer = setTimeout(() => {
    logger.error("shutdown.timeout_exceeded", {
      timeoutMs: SHUTDOWN_TIMEOUT_MS,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref?.();

  await disconnectDb();

  logger.info("shutdown.complete");
  process.exit(0);
}

export function setupShutdownHandlers(): void {
  if (_installed) return;
  _installed = true;

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  logger.debug("shutdown.handlers_installed");
}

/**
 * Hard-exit the process with the given code. Used only for FATAL startup
 * failures (e.g. missing required production secrets).
 *
 * Lives in this node-only module so that `process.exit` is never lexically
 * present in `instrumentation.ts` (which is also bundled for the Edge
 * runtime — Edge's static analyzer warns on any `process.exit` usage,
 * even when guarded by runtime checks).
 */
export function fatalExit(code = 1): void {
  process.exit(code);
}
