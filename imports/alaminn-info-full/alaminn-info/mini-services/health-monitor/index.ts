/**
 * Alaminn.info — health-monitor (port 3004)
 *
 * A mesh health monitor. Every 30 seconds it pings the main Next.js app
 * (/api/health on port 3000 — same as the dev server) and each sibling
 * mini-service (/health on ports 3002, 3003, 3005). The most recent check
 * result for each target is cached in memory; the last 100 check rounds are
 * retained for inspection.
 *
 * NOTE: notification-service moved from 3001 → 3005 (Fix C-1, see worklog)
 * because the Next.js dev server (package.json: `next dev -p 3000`) occupies
 * 3000. The main app health endpoint (/api/health) is served by the Next.js
 * app on 3000 in dev, or by the standalone production server on whatever
 * PORT the systemd service sets (3000 per deploy/alaminn-info.service).
 *
 * Endpoints:
 *   GET /status   — current status of every target + self
 *   GET /health   — the monitor's own health
 *   GET /metrics  — uptime, total check rounds, last check time, per-target stats
 *
 * Uses node:http (via bun-shim) + fetch — works on both Bun and Node.js.
 * Bun:  `bun --hot index.ts`
 * Node: `npx tsx index.ts`  (for cPanel/Node-only environments)
 */

const PORT = 3004;
const SERVICE_NAME = "health-monitor";
const CHECK_INTERVAL_MS = 30_000; // 30s
const HISTORY_LIMIT = 100;

interface Target {
  key: "main" | "notification" | "emailWorker" | "auditWorker";
  label: string;
  url: string;
}

const TARGETS: Target[] = [
  { key: "main", label: "Next.js main app", url: "http://localhost:3000/api/health" },
  { key: "notification", label: "notification-service", url: "http://localhost:3005/health" },
  { key: "emailWorker", label: "email-worker", url: "http://localhost:3002/health" },
  { key: "auditWorker", label: "audit-worker", url: "http://localhost:3003/health" },
];

interface TargetResult {
  key: Target["key"];
  label: string;
  url: string;
  status: "up" | "down";
  httpStatus: number | null;
  responseTimeMs: number | null;
  error: string | null;
  checkedAt: string; // ISO
  bodyPreview: unknown;
}

interface CheckRound {
  startedAt: string; // ISO
  finishedAt: string | null; // ISO
  durationMs: number | null;
  results: TargetResult[];
  anyDown: boolean;
}

const startedAt = Date.now();
let checkCount = 0;
let lastCheckAt: string | null = null;
const latestByTarget: Record<string, TargetResult> = {};
const history: CheckRound[] = [];

// ─── Helpers ──────────────────────────────────────────────────────
function uptimeSeconds(): number {
  return Math.round((Date.now() - startedAt) / 1000);
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Request-Id",
      "X-Service": SERVICE_NAME,
      ...extraHeaders,
    },
  });
}

function structuredLog(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    event,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

async function pingTarget(target: Target): Promise<TargetResult> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(target.url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "alaminn-health-monitor/1.0" },
    });
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - started;
    let bodyPreview: unknown = null;
    try {
      const text = await res.text();
      try {
        bodyPreview = JSON.parse(text);
      } catch {
        bodyPreview = text.slice(0, 200);
      }
    } catch {
      // ignore body read errors
    }
    const ok = res.status >= 200 && res.status < 400;
    return {
      key: target.key,
      label: target.label,
      url: target.url,
      status: ok ? "up" : "down",
      httpStatus: res.status,
      responseTimeMs,
      error: ok ? null : `HTTP ${res.status}`,
      checkedAt,
      bodyPreview,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    return {
      key: target.key,
      label: target.label,
      url: target.url,
      status: "down",
      httpStatus: null,
      responseTimeMs,
      error: message,
      checkedAt,
      bodyPreview: null,
    };
  }
}

async function runCheckRound(): Promise<void> {
  const startedAtIso = new Date().toISOString();
  const started = Date.now();
  const results = await Promise.all(TARGETS.map(pingTarget));
  const finished = Date.now();
  const finishedAtIso = new Date().toISOString();
  const anyDown = results.some((r) => r.status === "down");

  for (const r of results) {
    latestByTarget[r.key] = r;
  }

  const round: CheckRound = {
    startedAt: startedAtIso,
    finishedAt: finishedAtIso,
    durationMs: finished - started,
    results,
    anyDown,
  };
  history.push(round);
  while (history.length > HISTORY_LIMIT) history.shift();

  checkCount += 1;
  lastCheckAt = finishedAtIso;

  const summary = results.map((r) => `${r.key}=${r.status}`).join(" ");
  if (anyDown) {
    const downTargets = results.filter((r) => r.status === "down").map((r) => `${r.key} (${r.error || r.httpStatus})`);
    structuredLog("warn", "check.round_completed_with_down", {
      round: checkCount,
      durationMs: round.durationMs,
      summary,
      down: downTargets,
    });
  } else {
    structuredLog("info", "check.round_completed", {
      round: checkCount,
      durationMs: round.durationMs,
      summary,
    });
  }
}

// Kick off the periodic checker. Run once immediately on boot, then every 30s.
setTimeout(() => {
  runCheckRound().catch((err) => {
    structuredLog("error", "check.round_exception", {
      message: err instanceof Error ? err.message : String(err),
    });
  });
}, 500); // small delay so the server is listening before we start pinging siblings
setInterval(() => {
  runCheckRound().catch((err) => {
    structuredLog("error", "check.round_exception", {
      message: err instanceof Error ? err.message : String(err),
    });
  });
}, CHECK_INTERVAL_MS);

// ─── Handlers ─────────────────────────────────────────────────────
function handleStatus(): Response {
  const targets: Record<string, unknown> = {};
  for (const t of TARGETS) {
    const r = latestByTarget[t.key];
    targets[t.key] = r
      ? {
          status: r.status,
          label: r.label,
          url: r.url,
          httpStatus: r.httpStatus,
          responseTimeMs: r.responseTimeMs,
          error: r.error,
          checkedAt: r.checkedAt,
        }
      : {
          status: "unknown",
          label: t.label,
          url: t.url,
          httpStatus: null,
          responseTimeMs: null,
          error: "No check has run yet",
          checkedAt: null,
        };
  }
  return json({
    success: true,
    data: {
      ...targets,
      self: { status: "up", url: `http://localhost:${PORT}/health`, checkedAt: new Date().toISOString() },
    },
    lastCheckAt,
    checkCount,
    timestamp: new Date().toISOString(),
  });
}

function handleHealth(): Response {
  // "self" health: are WE up? Always yes if we're responding.
  return json({
    status: "ok",
    service: SERVICE_NAME,
    uptime: uptimeSeconds(),
    checkCount,
    lastCheckAt,
    intervalMs: CHECK_INTERVAL_MS,
    targetsMonitored: TARGETS.length,
    timestamp: new Date().toISOString(),
  });
}

function handleMetrics(): Response {
  const perTarget: Record<string, { up: number; down: number; lastStatus: string | null; lastResponseTimeMs: number | null; lastCheckedAt: string | null }> = {};
  for (const t of TARGETS) {
    let up = 0;
    let down = 0;
    let lastStatus: string | null = null;
    let lastResponseTimeMs: number | null = null;
    let lastCheckedAt: string | null = null;
    for (const round of history) {
      const r = round.results.find((x) => x.key === t.key);
      if (!r) continue;
      if (r.status === "up") up += 1;
      else down += 1;
      lastStatus = r.status;
      lastResponseTimeMs = r.responseTimeMs;
      lastCheckedAt = r.checkedAt;
    }
    perTarget[t.key] = { up, down, lastStatus, lastResponseTimeMs, lastCheckedAt };
  }
  return json({
    success: true,
    data: {
      uptime: uptimeSeconds(),
      checkCount,
      lastCheckAt,
      intervalMs: CHECK_INTERVAL_MS,
      historySize: history.length,
      historyLimit: HISTORY_LIMIT,
      perTarget,
      recentRounds: history.slice(-10).map((r) => ({
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        durationMs: r.durationMs,
        anyDown: r.anyDown,
        summary: r.results.map((x) => `${x.key}=${x.status}`).join(" "),
      })),
    },
    timestamp: new Date().toISOString(),
  });
}

// ─── Router ───────────────────────────────────────────────────────
async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Request-Id",
      },
    });
  }

  if (pathname === "/status" && method === "GET") return handleStatus();
  if (pathname === "/health" && method === "GET") return handleHealth();
  if (pathname === "/metrics" && method === "GET") return handleMetrics();

  return json({ success: false, error: "Not found", path: pathname, method }, 404);
}

// ─── Boot ─────────────────────────────────────────────────────────
import { Bun_ } from "../_shared/bun-shim";

const server = await Bun_.serve({
  port: PORT,
  fetch(req) {
    return router(req).catch((err: unknown) => {
      const errorId = `err_${Date.now().toString(36)}`;
      structuredLog("error", "request.unhandled", {
        errorId,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return json({ success: false, error: "Internal server error", errorId }, 500);
    });
  },
});

structuredLog("info", "service.started", {
  port: server.port,
  pid: process.pid,
  checkIntervalMs: CHECK_INTERVAL_MS,
  targets: TARGETS.map((t) => `${t.key}=${t.url}`).join(", "),
});
console.log(`[${SERVICE_NAME}] listening on :${server.port}`);

process.on("SIGTERM", () => {
  structuredLog("info", "service.stopping", { signal: "SIGTERM" });
  server.stop(true);
  process.exit(0);
});
process.on("SIGINT", () => {
  structuredLog("info", "service.stopping", { signal: "SIGINT" });
  server.stop(true);
  process.exit(0);
});
