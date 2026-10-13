/**
 * Next.js instrumentation — runs once on server startup (before any request).
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 *
 * We use this hook to:
 *   1. Validate environment variables as early as possible. In production,
 *      missing required secrets throw and prevent the server from starting.
 *      In development, missing secrets fall back to safe dev defaults with
 *      a console warning.
 *   2. Install graceful-shutdown handlers (SIGTERM / SIGINT) so Prisma is
 *      disconnected cleanly and the process exits within a bounded window.
 *
 * NOTE: This file is bundled for BOTH the Node.js and Edge runtimes. Edge
 * cannot use `process.exit` or `process.on('SIGTERM', ...)`, so all of
 * that logic is gated behind the `NEXT_RUNTIME === "nodejs"` check and
 * a dynamic import that the Edge bundler can tree-shake out.
 */

export async function register() {
  // Only run on the server (not the edge build)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    // Dynamic import to avoid pulling env validation into the edge bundle
    const { env } = await import("./lib/env");
    const { setupShutdownHandlers } = await import("./lib/shutdown");
    const { logger } = await import("./lib/logger");

    // Install graceful shutdown handlers exactly once. Idempotent — safe
    // even if register() is invoked multiple times in dev.
    setupShutdownHandlers();

    const e = env();
    if (process.env.NODE_ENV === "production") {
      logger.info("instrumentation.production_env_ok", {
        emailConfigured: e.emailConfigured,
        smtpConfigured: !!(e.smtpHost && e.smtpUser),
        resendConfigured: !!e.resendApiKey,
      });
    } else {
      logger.info("instrumentation.dev_env_loaded", {
        emailConfigured: e.emailConfigured,
        authSecret: e.authSecret ? "set" : "fallback",
      });
    }
  } catch (err) {
    // Use console directly here — if env() throws, the structured logger
    // may not be fully wired yet.
    console.error("[instrumentation] FATAL: environment validation failed.");
    console.error(err);
    // In production, crash the server. In dev, let it run with warnings.
    // `fatalExit` is imported dynamically above so that `process.exit`
    // never appears lexically in this file (the Edge runtime bundler
    // warns on its presence even when guarded by runtime checks).
    if (process.env.NODE_ENV === "production") {
      const { fatalExit } = await import("./lib/shutdown");
      fatalExit(1);
    }
  }
}
// trigger recompile Sun Jul 12 03:10:42 UTC 2026
