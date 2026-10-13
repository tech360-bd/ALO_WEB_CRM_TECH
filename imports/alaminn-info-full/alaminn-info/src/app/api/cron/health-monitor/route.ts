import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/health-monitor
 *
 * Pings `/api/health` on the main Next.js app plus the four sibling
 * mini-services (notification-service, email-worker, audit-worker,
 * health-monitor itself) and aggregates the results into a single
 * pass/fail status. Each ping has a 2-second timeout to keep the whole
 * cron run under ~10 seconds even when a service is unreachable.
 *
 * Recommended cPanel cron schedule: `0/5 * * * *` (every 5 minutes).
 *
 * Auth: requires `x-cron-secret` header (or `?secret=` query) matching the
 * `CRON_SECRET` environment variable. Returns 401 on auth failure, 503 if
 * the server is misconfigured (no CRON_SECRET).
 */

type ServiceKey =
  | "main"
  | "notification"
  | "emailWorker"
  | "auditWorker"
  | "healthMonitor";

interface PingResult {
  key: ServiceKey;
  label: string;
  url: string;
  status: "up" | "down";
  httpStatus: number | null;
  error: string | null;
  durationMs: number | null;
}

const PING_TIMEOUT_MS = 2000;

async function ping(url: string, label: string, key: ServiceKey): Promise<PingResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return {
      key,
      label,
      url,
      status: res.ok ? "up" : "down",
      httpStatus: res.status,
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    clearTimeout(timer);
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "timeout"
          : err.message
        : String(err);
    return {
      key,
      label,
      url,
      status: "down",
      httpStatus: null,
      error: message,
      durationMs: Date.now() - start,
    };
  }
}

export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
        data: null,
        meta: {},
        errors: [auth.error],
      },
      { status: auth.status }
    );
  }

  try {
    const now = new Date();
    // Resolve the base URL from the request's own origin (so it works both
    // in dev localhost and in production behind a proxy).
    const origin = request.nextUrl.origin;

    const targets: Array<{ url: string; label: string; key: ServiceKey }> = [
      {
        url: `${origin}/api/health`,
        label: "Next.js main app (/api/health)",
        key: "main",
      },
      {
        url: "http://localhost:3005/health",
        label: "notification-service",
        key: "notification",
      },
      {
        url: "http://localhost:3002/health",
        label: "email-worker",
        key: "emailWorker",
      },
      {
        url: "http://localhost:3003/health",
        label: "audit-worker",
        key: "auditWorker",
      },
      {
        url: "http://localhost:3004/health",
        label: "health-monitor",
        key: "healthMonitor",
      },
    ];

    const results = await Promise.all(
      targets.map((t) => ping(t.url, t.label, t.key))
    );

    const up = results.filter((r) => r.status === "up").length;
    const total = results.length;
    const allUp = up === total;

    console.log(
      `[cron:health-monitor] ${up}/${total} services up${
        allUp ? "" : " — down: " + results.filter((r) => r.status === "down").map((r) => r.key).join(",")
      }`
    );

    return NextResponse.json({
      success: true,
      message: "Health monitor scan complete.",
      data: {
        overall: allUp ? "healthy" : "degraded",
        up,
        total,
        services: results,
      },
      meta: {
        scannedAt: now.toISOString(),
        perPingTimeoutMs: PING_TIMEOUT_MS,
      },
      errors: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Cron job failed",
        data: null,
        meta: {},
        errors: [String(error)],
      },
      { status: 500 }
    );
  }
}
