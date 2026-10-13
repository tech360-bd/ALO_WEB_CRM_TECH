import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/analytics/track
 * ----------------------------
 * First-party, cookie-less, privacy-friendly analytics ingestion.
 *
 * Privacy contract:
 *   - No cookies are set or read.
 *   - The raw IP is NEVER stored. Only a sha256 hash, truncated to 16
 *     hex chars, is persisted — and only for rate-limiting + abuse
 *     detection. The hash cannot be reversed to recover the IP.
 *   - `sessionId` is a client-generated, daily-rotating anonymous ID
 *     (date + random suffix) stored in the visitor's localStorage.
 *     It carries no personal data.
 *   - UTM parameters are accepted from the request body (the client
 *     sends them) and persisted for marketing attribution.
 *   - This handler never throws. Any error is swallowed and a 204 is
 *     returned so the client's fire-and-forget `sendBeacon` never
 *     surfaces a failure to the visitor.
 *
 * Response: 204 No Content (always — even on validation failure,
 * to keep the client simple and avoid retry storms).
 *
 * Rate limit: 30 events per minute per IP hash. Over the limit → 429.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "inquiry_submitted",
  "newsletter_signup",
  "meeting_requested",
  "resource_download",
  "cta_click",
  "scroll_depth",
  "outbound_click",
]);

const RATE_LIMIT = 30; // per window per IP hash
const RATE_WINDOW = 60_000; // 1 minute
const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/**
 * Hash the request IP with sha256 and truncate to 16 hex chars.
 * Falls back to "unknown" when no IP header is present (e.g. direct
 * localhost dev). The hash is one-way — it cannot be reversed.
 */
function hashIp(req: NextRequest): string {
  const raw =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

/**
 * Coerce a body value to a trimmed string (max 256 chars). Returns
 * `null` when absent, empty, or not a string-like value.
 */
function str(value: unknown, max = 256): string | null {
  if (value === null || value === undefined) return null;
  const s = typeof value === "string" ? value : String(value);
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/**
 * Validate that `meta` is a plain object suitable for JSON.stringify.
 * Strips keys whose values are functions/symbols. Caps the JSON
 * string length at 4 KB to prevent abuse.
 */
function serializeMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  try {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
      if (typeof v === "function" || typeof v === "symbol") continue;
      clean[k] = v;
    }
    const json = JSON.stringify(clean);
    if (!json || json.length > 4096) return null;
    return json;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Always return 204 — even on failure — to keep the fire-and-forget
  // client simple. The single exception is rate-limit, which returns
  // 429 so the client can choose to back off (most won't bother, and
  // that's fine — `sendBeacon` doesn't surface status codes anyway).
  try {
    // ── Parse + validate body ────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new NextResponse(null, { status: 204 });
    }

    const eventName = str(body.eventName, 64);
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      // Invalid event name — silently drop.
      return new NextResponse(null, { status: 204 });
    }

    // ── Rate limit (per IP hash) ─────────────────────────────────────
    const ipHash = hashIp(req);
    if (rateLimited(ipHash)) {
      return new NextResponse(null, { status: 429 });
    }

    // ── Pull UTM params from body (client sends them) ────────────────
    const utmSource = str(body.utmSource) ?? str(body.utm_source);
    const utmMedium = str(body.utmMedium) ?? str(body.utm_medium);
    const utmCampaign = str(body.utmCampaign) ?? str(body.utm_campaign);
    const utmContent = str(body.utmContent) ?? str(body.utm_content);
    const utmTerm = str(body.utmTerm) ?? str(body.utm_term);

    // ── Pull sessionId + referrer + page ─────────────────────────────
    const sessionId = str(body.sessionId, 64);
    const page = str(body.page, 512);
    const referrer = str(body.referrer, 512);
    const meta = serializeMeta(body.meta);

    // ── Persist ──────────────────────────────────────────────────────
    // If the DB write fails, we still return 204 — analytics must
    // never break the visitor's UX.
    try {
      await db.analyticsEvent.create({
        data: {
          eventName,
          page,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          sessionId,
          ipHash,
          meta,
        },
      });
    } catch (dbErr) {
      // Log + swallow.
      logger.warn("analytics.track_db_failed", {
        eventName,
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Last-resort safety net. Never surface the error to the client.
    logger.warn("analytics.track_unhandled", {
      error: err instanceof Error ? err.message : String(err),
    });
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * Other methods are not supported — return 204 (not 405) to avoid
 * surfacing noise to the client. The endpoint is fire-and-forget.
 */
export const GET = () => new NextResponse(null, { status: 204 });
export const PUT = () => new NextResponse(null, { status: 204 });
export const DELETE = () => new NextResponse(null, { status: 204 });
export const PATCH = () => new NextResponse(null, { status: 204 });
