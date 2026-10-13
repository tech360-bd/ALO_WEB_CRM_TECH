/**
 * Alaminn.info — audit-worker (port 3003)
 *
 * A read-only reporting & export service that compiles audit log summaries
 * from the main app's database. Uses Prisma Client (Node-compatible, works
 * with both SQLite and MySQL) — no Bun dependency.
 *
 * Database selection (priority order):
 *   1. process.env.AUDIT_WORKER_DATABASE_URL
 *   2. process.env.DATABASE_URL
 *   3. dev default: file:/home/z/my-project/db/custom.db
 *
 * Endpoints:
 *   GET /report?from=ISO&to=ISO  — summary report (counts by action,
 *                                   top actors, timeline, totals)
 *   GET /export?format=json|csv  — full export of the audit log within range
 *   GET /health                  — { status, totalEvents, oldestEvent, newestEvent }
 *
 * The AuditLog table schema (must match the main app's Prisma schema):
 *   id TEXT, actorId TEXT, action TEXT, resource TEXT, resourceId TEXT,
 *   meta TEXT, ipHash TEXT, createdAt DATETIME
 */

import { PrismaClient } from "@prisma/client";

const PORT = 3003;
const SERVICE_NAME = "audit-worker";
const DEFAULT_DEV_DB_PATH = "/home/z/my-project/db/custom.db";

// ─── DB config resolution (env-driven) ──────────────────────────
interface DbConfig {
  /** The raw env URL (sanitised for logging — credentials stripped). */
  sourceUrl: string;
  /** Where the config came from (env var name or "default"). */
  source: string;
  /** Database provider: sqlite or mysql. */
  provider: "sqlite" | "mysql";
}

function sanitiseUrl(raw: string): string {
  return raw.replace(/(\w+):\/\/[^@]*@/, "$1://***@");
}

function resolveDbConfig(): DbConfig {
  const fromAuditWorker = process.env.AUDIT_WORKER_DATABASE_URL;
  const fromMain = process.env.DATABASE_URL;
  const raw = fromAuditWorker || fromMain || `file:${DEFAULT_DEV_DB_PATH}`;
  const source = fromAuditWorker ? "AUDIT_WORKER_DATABASE_URL" : fromMain ? "DATABASE_URL" : "default";
  const provider: "sqlite" | "mysql" = raw.startsWith("mysql") ? "mysql" : "sqlite";
  return { sourceUrl: sanitiseUrl(raw), source, provider };
}

const DB_CONFIG = resolveDbConfig();

const startedAt = Date.now();

// Prisma client — lazily initialized (read-only usage; we only run SELECT queries).
let prisma: PrismaClient | null = null;
function getDb(): PrismaClient | null {
  if (prisma) return prisma;
  try {
    prisma = new PrismaClient({
      log: ["error"],
    });
    return prisma;
  } catch (err) {
    structuredLog("error", "db.open_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    prisma = null;
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────
interface AuditRow {
  id: string;
  actorId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  meta: string | null;
  ipHash: string | null;
  createdAt: Date | bigint | number;
}

interface CountRow {
  key: string;
  count: bigint;
}

// ─── Helpers ──────────────────────────────────────────────────────
function uptimeSeconds(): number {
  return Math.round((Date.now() - startedAt) / 1000);
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, (_k, v) => (typeof v === "bigint" ? Number(v) : v)), {
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

function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Access-Control-Allow-Origin": "*",
      "X-Service": SERVICE_NAME,
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

function parseDateParam(value: string | null, defaultAt: number): number {
  if (!value) return defaultAt;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return defaultAt;
  return t;
}

function safeJsonParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toIso(d: Date | bigint | number | string | null | undefined): string | null {
  if (d === null || d === undefined) return null;
  let ms: number;
  if (d instanceof Date) {
    ms = d.getTime();
  } else if (typeof d === "bigint") {
    ms = Number(d);
  } else if (typeof d === "number") {
    ms = d;
  } else {
    // string — try parsing as date or epoch-ms
    const parsed = Date.parse(d);
    ms = Number.isNaN(parsed) ? Number(d) : parsed;
  }
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

// ─── Queries (Prisma raw SQL — parameterized, injection-safe) ─────
async function fetchTotals(db: PrismaClient, fromMs: number, toMs: number) {
  const fromDate = new Date(fromMs);
  const toDate = new Date(toMs);
  const rows = await db.$queryRaw<
    Array<{ c: bigint; oldest: Date | null; newest: Date | null }>
  >`SELECT COUNT(*) AS c, MIN(createdAt) AS oldest, MAX(createdAt) AS newest FROM AuditLog WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate}`;
  return {
    total: Number(rows[0]?.c ?? 0),
    oldest: rows[0]?.oldest ?? null,
    newest: rows[0]?.newest ?? null,
  };
}

async function fetchCountsByAction(db: PrismaClient, fromMs: number, toMs: number): Promise<Array<{ key: string; count: number }>> {
  const fromDate = new Date(fromMs);
  const toDate = new Date(toMs);
  const rows = await db.$queryRaw<
    Array<{ action: string; count: bigint }>
  >`SELECT action, COUNT(*) AS count FROM AuditLog WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} GROUP BY action ORDER BY count DESC`;
  return rows.map((r) => ({ key: r.action, count: Number(r.count) }));
}

async function fetchCountsByResource(db: PrismaClient, fromMs: number, toMs: number): Promise<Array<{ key: string; count: number }>> {
  const fromDate = new Date(fromMs);
  const toDate = new Date(toMs);
  const rows = await db.$queryRaw<
    Array<{ resource: string | null; count: bigint }>
  >`SELECT resource, COUNT(*) AS count FROM AuditLog WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} GROUP BY resource ORDER BY count DESC LIMIT 50`;
  return rows.map((r) => ({ key: r.resource ?? "(none)", count: Number(r.count) }));
}

async function fetchTopActors(db: PrismaClient, fromMs: number, toMs: number): Promise<Array<{ key: string; count: number }>> {
  const fromDate = new Date(fromMs);
  const toDate = new Date(toMs);
  const rows = await db.$queryRaw<
    Array<{ actorId: string | null; count: bigint }>
  >`SELECT actorId, COUNT(*) AS count FROM AuditLog WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} GROUP BY actorId ORDER BY count DESC LIMIT 20`;
  return rows.map((r) => ({ key: r.actorId ?? "(anonymous)", count: Number(r.count) }));
}

async function fetchCountsByIp(db: PrismaClient, fromMs: number, toMs: number): Promise<Array<{ key: string; count: number }>> {
  const fromDate = new Date(fromMs);
  const toDate = new Date(toMs);
  const rows = await db.$queryRaw<
    Array<{ ipHash: string | null; count: bigint }>
  >`SELECT ipHash, COUNT(*) AS count FROM AuditLog WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} GROUP BY ipHash ORDER BY count DESC LIMIT 20`;
  return rows.map((r) => ({ key: r.ipHash ?? "(none)", count: Number(r.count) }));
}

async function fetchTimelineHourly(db: PrismaClient, fromMs: number, toMs: number): Promise<Array<{ bucket: string; count: number }>> {
  const fromDate = new Date(fromMs);
  const toDate = new Date(toMs);
  const HOUR_MS = 60 * 60 * 1000;
  // SQLite stores DateTime as epoch-ms INTEGER; MySQL uses DATETIME. Use a
  // portable approach: group by the ISO hour prefix of createdAt.
  // SQLite stores DateTime as epoch-ms INTEGER. Convert to unixepoch seconds for strftime.
  // MySQL uses DATETIME natively — DATE_FORMAT works directly.
  const rows = await db.$queryRaw<
    Array<{ bucketIso: string | null; count: bigint }>
  >`
    SELECT strftime('%Y-%m-%dT%H:00:00.000Z', createdAt / 1000, 'unixepoch') AS bucketIso, COUNT(*) AS count
    FROM AuditLog
    WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate}
    GROUP BY bucketIso
    ORDER BY bucketIso ASC
  `.catch(async () => {
    // Fallback for MySQL (strftime not available) — use DATE_FORMAT
    return db.$queryRaw<
      Array<{ bucketIso: string | null; count: bigint }>
    >`SELECT DATE_FORMAT(createdAt, '%Y-%m-%dT%H:00:00.000Z') AS bucketIso, COUNT(*) AS count FROM AuditLog WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} GROUP BY bucketIso ORDER BY bucketIso ASC`;
  });
  return rows
    .filter((r) => r.bucketIso !== null)
    .map((r) => ({ bucket: r.bucketIso as string, count: Number(r.count) }));
}

async function fetchRows(db: PrismaClient, fromMs: number, toMs: number, limit: number): Promise<AuditRow[]> {
  const fromDate = new Date(fromMs);
  const toDate = new Date(toMs);
  return db.$queryRaw<AuditRow[]>`SELECT id, actorId, action, resource, resourceId, meta, ipHash, createdAt FROM AuditLog WHERE createdAt >= ${fromDate} AND createdAt <= ${toDate} ORDER BY createdAt ASC LIMIT ${limit}`;
}

// ─── Handlers ─────────────────────────────────────────────────────
async function handleReport(url: URL): Promise<Response> {
  const db = getDb();
  if (!db) {
    return json({ success: false, error: "Database unavailable", source: DB_CONFIG.source }, 503);
  }
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const fromMs = parseDateParam(url.searchParams.get("from"), now - 30 * dayMs);
  const toMs = parseDateParam(url.searchParams.get("to"), now);
  if (fromMs > toMs) {
    return json({ success: false, error: "'from' must be <= 'to'" }, 422);
  }
  const range = { fromIso: new Date(fromMs).toISOString(), toIso: new Date(toMs).toISOString() };
  try {
    const totals = await fetchTotals(db, fromMs, toMs);
    const byAction = await fetchCountsByAction(db, fromMs, toMs);
    const byResource = await fetchCountsByResource(db, fromMs, toMs);
    const topActors = await fetchTopActors(db, fromMs, toMs);
    const byIp = await fetchCountsByIp(db, fromMs, toMs);
    const timeline = await fetchTimelineHourly(db, fromMs, toMs);
    return json({
      success: true,
      data: {
        range,
        totals: {
          total: totals.total,
          uniqueActors: topActors.length,
          uniqueActions: byAction.length,
          oldestEvent: toIso(totals.oldest),
          newestEvent: toIso(totals.newest),
        },
        countsByAction: byAction,
        countsByResource: byResource,
        topActors,
        countsByIpHash: byIp,
        timelineHourly: timeline,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    structuredLog("error", "report.query_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ success: false, error: "Query failed", details: err instanceof Error ? err.message : String(err) }, 500);
  }
}

async function handleExport(url: URL): Promise<Response> {
  const db = getDb();
  if (!db) {
    return json({ success: false, error: "Database unavailable", source: DB_CONFIG.source }, 503);
  }
  const formatParam = (url.searchParams.get("format") || "json").toLowerCase();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const fromMs = parseDateParam(url.searchParams.get("from"), now - 90 * dayMs);
  const toMs = parseDateParam(url.searchParams.get("to"), now);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 1000, 1), 100000) : 10000;

  let rows: AuditRow[];
  try {
    rows = await fetchRows(db, fromMs, toMs, limit);
  } catch (err) {
    structuredLog("error", "export.query_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ success: false, error: "Query failed", details: err instanceof Error ? err.message : String(err) }, 500);
  }

  if (formatParam === "csv") {
    const header = ["id", "createdAt", "actorId", "action", "resource", "resourceId", "ipHash", "meta"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          csvEscape(r.id),
          csvEscape(toIso(r.createdAt)),
          csvEscape(r.actorId),
          csvEscape(r.action),
          csvEscape(r.resource),
          csvEscape(r.resourceId),
          csvEscape(r.ipHash),
          csvEscape(r.meta),
        ].join(","),
      );
    }
    const filename = `audit-log-${new Date(fromMs).toISOString().slice(0, 10)}_to_${new Date(toMs).toISOString().slice(0, 10)}.csv`;
    return csvResponse(lines.join("\n"), filename);
  }

  return json({
    success: true,
    data: {
      range: { fromIso: new Date(fromMs).toISOString(), toIso: new Date(toMs).toISOString() },
      count: rows.length,
      limit,
      rows: rows.map((r) => ({
        id: r.id,
        createdAt: toIso(r.createdAt),
        actorId: r.actorId,
        action: r.action,
        resource: r.resource,
        resourceId: r.resourceId,
        ipHash: r.ipHash,
        meta: safeJsonParse(r.meta),
      })),
    },
    generatedAt: new Date().toISOString(),
  });
}

async function handleHealth(): Promise<Response> {
  const db = getDb();
  if (!db) {
    return json({
      status: "degraded",
      service: SERVICE_NAME,
      uptime: uptimeSeconds(),
      totalEvents: 0,
      oldestEvent: null,
      newestEvent: null,
      dbAvailable: false,
      source: DB_CONFIG.source,
      timestamp: new Date().toISOString(),
    }, 503);
  }
  try {
    const rows = await db.$queryRaw<
      Array<{ c: bigint; oldest: Date | null; newest: Date | null }>
    >`SELECT COUNT(*) AS c, MIN(createdAt) AS oldest, MAX(createdAt) AS newest FROM AuditLog`;
    return json({
      status: "ok",
      service: SERVICE_NAME,
      uptime: uptimeSeconds(),
      totalEvents: Number(rows[0]?.c ?? 0),
      oldestEvent: toIso(rows[0]?.oldest ?? null),
      newestEvent: toIso(rows[0]?.newest ?? null),
      dbAvailable: true,
      source: DB_CONFIG.source,
      provider: DB_CONFIG.provider,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    structuredLog("error", "health.query_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({
      status: "degraded",
      service: SERVICE_NAME,
      uptime: uptimeSeconds(),
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }, 503);
  }
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

  if (pathname === "/health" && method === "GET") return handleHealth();
  if (pathname === "/report" && method === "GET") return handleReport(url);
  if (pathname === "/export" && method === "GET") return handleExport(url);

  return json({ success: false, error: "Not found", path: pathname, method }, 404);
}

// ─── Boot ─────────────────────────────────────────────────────────
// Uses the shared Bun_ shim so the service runs on BOTH Bun and Node.js.
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
  provider: DB_CONFIG.provider,
  dbSource: DB_CONFIG.source,
  dbSourceUrl: DB_CONFIG.sourceUrl,
});
console.log(`[${SERVICE_NAME}] listening on :${server.port}`);

process.on("SIGTERM", () => {
  structuredLog("info", "service.stopping", { signal: "SIGTERM" });
  try { void prisma?.$disconnect(); } catch { /* ignore */ }
  server.stop(true);
  process.exit(0);
});
process.on("SIGINT", () => {
  structuredLog("info", "service.stopping", { signal: "SIGINT" });
  try { void prisma?.$disconnect(); } catch { /* ignore */ }
  server.stop(true);
  process.exit(0);
});
