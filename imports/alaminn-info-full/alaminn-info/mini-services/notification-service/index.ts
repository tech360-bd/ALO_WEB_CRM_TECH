/**
 * Alaminn.info — notification-service (port 3005)
 *
 * A lightweight, dependency-free notification ingestion service built on
 * Bun's built-in HTTP server. Receives notification requests from the main
 * Next.js app (and other mini-services) via POST /notify, stores them in an
 * in-memory FIFO log (max 1000 entries), and exposes the log for debugging.
 *
 * Endpoints:
 *   POST /notify            — accepts { type, recipient, subject, message, meta }
 *   GET  /notifications     — returns the notification log (newest last)
 *   GET  /notifications/:type — filter by notification type
 *   GET  /health            — { status, uptime, count }
 *
 * Designed to be called from the main app via:
 *   fetch("/api/notify?XTransformPort=3005", { method: "POST", ... })
 *
 * Port 3005 is used (not 3001) because the Next.js dev server occupies 3001
 * (see package.json: `next dev -p 3001`). 3005 is the next free port after
 * health-monitor on 3004.
 *
 * No external dependencies. Auto-restarts on file change via `bun --hot`.
 */

const PORT = 3005;
const SERVICE_NAME = "notification-service";
const MAX_LOG_SIZE = 1000;

interface NotificationRecord {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  message: string;
  meta: Record<string, unknown> | null;
  receivedAt: string; // ISO
}

const startedAt = Date.now();
const log: NotificationRecord[] = [];

// ─── Helpers ──────────────────────────────────────────────────────
function uptimeSeconds(): number {
  return Math.round((Date.now() - startedAt) / 1000);
}

function genId(): string {
  return `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

async function readJsonBody(req: Request): Promise<unknown | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Store ────────────────────────────────────────────────────────
function pushNotification(n: NotificationRecord): void {
  log.push(n);
  // FIFO eviction — keep the most recent MAX_LOG_SIZE entries
  while (log.length > MAX_LOG_SIZE) {
    log.shift();
  }
}

// ─── Handlers ─────────────────────────────────────────────────────
async function handleNotify(req: Request): Promise<Response> {
  const body = (await readJsonBody(req)) as Partial<NotificationRecord> | null;
  if (!body || typeof body !== "object") {
    structuredLog("warn", "notify.rejected", { reason: "invalid_body" });
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const type = typeof body.type === "string" ? body.type : "generic";
  const recipient = typeof body.recipient === "string" ? body.recipient : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const message = typeof body.message === "string" ? body.message : "";
  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : null;

  if (!recipient && !message) {
    structuredLog("warn", "notify.rejected", { reason: "missing_recipient_and_message", type });
    return json({ success: false, error: "At least 'recipient' or 'message' is required" }, 422);
  }

  const record: NotificationRecord = {
    id: genId(),
    type,
    recipient,
    subject,
    message,
    meta,
    receivedAt: new Date().toISOString(),
  };
  pushNotification(record);

  structuredLog("info", "notify.received", {
    id: record.id,
    type,
    recipient: recipient.slice(0, 64),
    subject: subject.slice(0, 80),
  });

  return json({ success: true, data: { id: record.id, receivedAt: record.receivedAt } }, 202);
}

function handleListNotifications(url: URL): Response {
  const typeFilter = url.searchParams.get("type");
  const limitParam = url.searchParams.get("limit");
  let items = log.slice();
  if (typeFilter) {
    items = items.filter((n) => n.type === typeFilter);
  }
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 1000) : 1000;
  items = items.slice(-limit);
  return json({
    success: true,
    data: {
      count: items.length,
      totalStored: log.length,
      capacity: MAX_LOG_SIZE,
      items,
    },
  });
}

function handleHealth(): Response {
  return json({
    status: "ok",
    service: SERVICE_NAME,
    uptime: uptimeSeconds(),
    count: log.length,
    capacity: MAX_LOG_SIZE,
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Request-Id",
      },
    });
  }

  // Health first (cheapest)
  if (pathname === "/health" && method === "GET") return handleHealth();

  if (pathname === "/notify" && method === "POST") return handleNotify(req);

  if (pathname === "/notifications" && method === "GET") return handleListNotifications(url);

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
      return json(
        { success: false, error: "Internal server error", errorId },
        500,
      );
    });
  },
});

structuredLog("info", "service.started", {
  port: server.port,
  pid: process.pid,
  maxLogSize: MAX_LOG_SIZE,
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
