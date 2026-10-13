/**
 * Next.js proxy (formerly middleware) — request ID + security headers (pass-through).
 * ------------------------------------------------------------------
 * Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`.
 * The export is now `proxy` instead of `middleware`, but the API is
 * identical (NextRequest in, NextResponse out, pass-through).
 *
 * Responsibilities:
 *
 *   1. Assign a request ID to every incoming request. If the client
 *      sent an `X-Request-Id` header, honour it; otherwise generate one.
 *      The ID is forwarded to route handlers via the request headers and
 *      also surfaced on the response so clients can correlate.
 *
 *   2. Add security headers to every matched response:
 *        X-Content-Type-Options:  nosniff
 *        X-Frame-Options:         DENY
 *        Referrer-Policy:         strict-origin-when-cross-origin
 *        Permissions-Policy:      camera/mic/geo/topics disabled
 *        Content-Security-Policy: strict default-src 'self'
 *        Strict-Transport-Security (production only — would break dev)
 *
 *   3. Increment the in-process request counter used by /api/health/deep
 *      for the `runtime.requestCount` metric.
 *
 * This proxy is PASS-THROUGH: it never blocks, redirects, or
 * rewrites a request. Its only effect is header injection + counter
 * increment. Authentication, rate limiting, and validation live in the
 * route handlers themselves.
 *
 * Matched paths: all routes EXCEPT static assets and Next.js internals
 * (see `config.matcher` below). This guarantees security headers are
 * applied to every page and API response.
 *
 * Runtime: `nodejs` (not Edge) so we can use `node:crypto` and share
 * module-level state (the request counter) with route handlers.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  generateRequestId,
  incrementRequestCount,
} from "@/lib/request-context";

// Note: proxy.ts always runs on the Node.js runtime in Next.js 16,
// so `export const runtime = "nodejs"` is not needed (and not allowed).

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Lock down client-side feature APIs that this app never uses.
  // Format: feature=(allowlist) — empty allowlist = disabled.
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  // Content-Security-Policy — restricts resource loading to prevent XSS,
  // data exfiltration, and clickjacking. Next.js requires 'unsafe-inline'
  // for styles and 'unsafe-eval' for some dev tooling; in production the
  // inline styles come from Next's styled-jsx / RSC payloads. For a stricter
  // policy, migrate to nonce-based CSP (advanced, future work).
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

export function proxy(req: NextRequest) {
  // ── Request counter (read by /api/health/deep) ─────────────────────
  incrementRequestCount();

  // ── Resolve request ID ─────────────────────────────────────────────
  const incomingId = req.headers.get("x-request-id");
  const requestId = incomingId || generateRequestId();

  // Forward the request ID to the downstream route handler by rewriting
  // the inbound request headers. Route handlers (and the observability
  // wrapper) read it via `req.headers.get("x-request-id")`.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // ── Echo the request ID back on the response ───────────────────────
  response.headers.set("x-request-id", requestId);

  // ── Security headers ───────────────────────────────────────────────
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // HSTS is HTTPS-only. Emitting it on dev (HTTP localhost) would cause
  // browsers to refuse subsequent plain-HTTP requests.
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  // Match all routes EXCEPT static assets + Next.js internals. This
  // ensures security headers (CSP, X-Frame-Options, HSTS, etc.) are
  // applied to every page and API response, not just /api/* and /.
  // Excluded: /_next/static, /_next/image, favicon, icon files,
  // manifest, robots, sitemap, and well-known file extensions.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|icon|apple-icon|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
