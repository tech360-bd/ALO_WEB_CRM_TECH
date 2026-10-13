/**
 * Alaminn.info — email-worker (port 3002)
 *
 * An in-memory retry queue for failed email sends. Other services (or the
 * main Next.js app) POST failed send descriptors to /queue; the worker then
 * attempts retries with exponential backoff (2s, 4s, 8s, 16s, 32s, capped at
 * 60s) up to a max number of attempts.
 *
 * Endpoints:
 *   POST /queue                — enqueue a failed send
 *                                { messageId, recipient, subject, body, reason? }
 *   GET  /queue                — list pending retries (and recently processed)
 *   POST /retry/:messageId     — manually trigger a retry attempt now
 *   DELETE /queue/:messageId   — drop a queued item (give up)
 *   POST /send                 — synchronous one-shot send (no queue)
 *                                { to, subject, html?, text? }
 *   GET  /health               — { status, pending, processed, failed, uptime }
 *
 * Email transport (lazy, cached on first use):
 *   1. If SMTP_HOST is set      → nodemailer SMTP transport
 *      (SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE=ssl|starttls, EMAIL_FROM)
 *   2. Else if RESEND_API_KEY    → Resend HTTPS API (https://api.resend.com/emails)
 *   3. Else                     → simulation (logs a clear warning on boot +
 *      every send; returns synthetic success so the queue can drain). This
 *      is a development fallback — production MUST set SMTP_* or RESEND_API_KEY.
 *
 * Auto-restarts on file change via `bun --hot`.
 */

import nodemailer from "nodemailer";

const PORT = 3002;
const SERVICE_NAME = "email-worker";

const MAX_ATTEMPTS = 6;
const BASE_BACKOFF_MS = 2000; // 2s
const MAX_BACKOFF_MS = 60_000; // 60s cap
const TICK_INTERVAL_MS = 2000; // poll queue every 2s
const RETENTION_PROCESSED = 200; // keep last 200 processed/failed for inspection

type ItemStatus = "pending" | "processing" | "delivered" | "failed" | "dropped";

interface QueueItem {
  messageId: string;
  recipient: string;
  subject: string;
  body: string;
  reason: string | null;
  meta: Record<string, unknown> | null;
  enqueuedAt: string; // ISO
  nextAttemptAt: number; // epoch ms
  attempts: number;
  status: ItemStatus;
  lastError: string | null;
  lastAttemptAt: number | null;
  history: Array<{ at: string; attempt: number; result: "success" | "failure"; error?: string }>;
}

const startedAt = Date.now();
const queue = new Map<string, QueueItem>();
const processed: QueueItem[] = []; // recently terminal items (delivered/failed/dropped)

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
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

function backoffMs(attempt: number): number {
  // attempt is 1-based for the NEXT attempt
  const raw = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
  return Math.min(raw, MAX_BACKOFF_MS);
}

function moveToProcessed(item: QueueItem): void {
  queue.delete(item.messageId);
  processed.push(item);
  while (processed.length > RETENTION_PROCESSED) processed.shift();
}

function publicItem(item: QueueItem) {
  return {
    messageId: item.messageId,
    recipient: item.recipient,
    subject: item.subject,
    reason: item.reason,
    status: item.status,
    attempts: item.attempts,
    enqueuedAt: item.enqueuedAt,
    nextAttemptAt: item.nextAttemptAt ? new Date(item.nextAttemptAt).toISOString() : null,
    lastAttemptAt: item.lastAttemptAt ? new Date(item.lastAttemptAt).toISOString() : null,
    lastError: item.lastError,
    history: item.history,
  };
}

// ─── Transport (lazy, cached) ────────────────────────────────────
// Three modes, in priority order:
//   1. SMTP (nodemailer) — when SMTP_HOST is set
//   2. Resend HTTP API   — when RESEND_API_KEY is set
//   3. Simulation        — fallback (warns on every send; does NOT crash)
// The transport is created on first send and cached for the process lifetime.
// Reconfiguration requires a restart.
type TransportMode = "smtp" | "resend" | "simulation";

interface Transport {
  mode: TransportMode;
  from: string;
  // SMTP-only fields
  transporter?: nodemailer.Transporter;
  // Resend-only fields
  apiKey?: string;
}

let cachedTransport: Transport | null = null;
let transportWarnedOnce = false;

function getTransport(): Transport {
  if (cachedTransport) return cachedTransport;

  const from = process.env.EMAIL_FROM || "no-reply@alaminn.info";
  const smtpHost = process.env.SMTP_HOST;
  const resendKey = process.env.RESEND_API_KEY;

  if (smtpHost) {
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    // SMTP_SECURE accepts "ssl" (true, port 465) or "starttls" (false, port 587).
    // Default to starttls (false) because 587 is the more common modern default.
    const secure = process.env.SMTP_SECURE === "ssl";
    const user = process.env.SMTP_USER;
    // Accept both SMTP_PASS (main app convention) and SMTP_PASSWORD (legacy)
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      ...(user ? { auth: { user, pass: pass || "" } } : {}),
    });
    cachedTransport = { mode: "smtp", from, transporter };
    structuredLog("info", "transport.initialized", {
      mode: "smtp",
      host: smtpHost,
      port,
      secure,
      auth: !!user,
      from,
    });
    return cachedTransport;
  }

  if (resendKey) {
    cachedTransport = { mode: "resend", from, apiKey: resendKey };
    structuredLog("info", "transport.initialized", { mode: "resend", from });
    return cachedTransport;
  }

  cachedTransport = { mode: "simulation", from };
  structuredLog("warn", "transport.initialized", {
    mode: "simulation",
    reason:
      "Neither SMTP_HOST nor RESEND_API_KEY is set; emails will be SIMULATED (not actually sent). " +
      "Set SMTP_HOST (+ SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_SECURE/EMAIL_FROM) or RESEND_API_KEY in the environment to enable real delivery.",
    from,
  });
  return cachedTransport;
}

interface SendArgs {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

type SendResult =
  | { ok: true; mode: TransportMode; messageId: string | null }
  | { ok: false; mode: TransportMode; error: string };

async function sendEmail(args: SendArgs): Promise<SendResult> {
  const t = getTransport();

  if (t.mode === "simulation") {
    // Simulate network latency so the queue processor behaves realistically.
    await new Promise((r) => setTimeout(r, 50));
    if (!transportWarnedOnce) {
      transportWarnedOnce = true;
      // Already logged on transport init; this is just a per-process reminder.
    }
    structuredLog("warn", "send.simulated", {
      to: args.to.slice(0, 64),
      subject: args.subject.slice(0, 80),
      reason: "No SMTP_HOST or RESEND_API_KEY configured — simulated success only.",
    });
    return {
      ok: true,
      mode: "simulation",
      messageId: `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  if (t.mode === "smtp" && t.transporter) {
    try {
      const info = await t.transporter.sendMail({
        from: t.from,
        to: args.to,
        subject: args.subject,
        ...(args.html ? { html: args.html } : {}),
        ...(args.text ? { text: args.text } : {}),
      });
      return { ok: true, mode: "smtp", messageId: info.messageId };
    } catch (err) {
      return {
        ok: false,
        mode: "smtp",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  if (t.mode === "resend" && t.apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: t.from,
          to: [args.to],
          subject: args.subject,
          ...(args.html ? { html: args.html } : {}),
          ...(args.text ? { text: args.text } : {}),
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          ok: false,
          mode: "resend",
          error: `Resend API ${res.status}: ${errText.slice(0, 200)}`,
        };
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, mode: "resend", messageId: data.id ?? null };
    } catch (err) {
      return {
        ok: false,
        mode: "resend",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Defensive — should be unreachable
  return { ok: false, mode: t.mode, error: "Transport not configured" };
}

// ─── Queue processor ──────────────────────────────────────────────
/**
 * Attempts a real send via the configured transport (SMTP / Resend) or falls
 * back to simulation when neither is configured. Returns { ok, error? }.
 * If meta.forceFail is true, always fails — useful for testing backoff/retry.
 * If meta.flaky is true, fails ~50% on the first attempt (testing backoff).
 */
async function attemptSend(item: QueueItem): Promise<{ ok: true } | { ok: false; error: string }> {
  // Test-only override: always fail when explicitly requested.
  if (item.meta && item.meta.forceFail === true) {
    return { ok: false, error: "synthetic_failure_forced" };
  }
  // Test-only flaky mode: fail ~50% on the first attempt.
  if (item.meta && item.meta.flaky === true && item.attempts === 0 && Math.random() < 0.5) {
    return { ok: false, error: "transient_smtp_timeout" };
  }
  // Real send via the configured transport.
  const result = await sendEmail({
    to: item.recipient,
    subject: item.subject,
    text: item.body, // existing queue items store the body as plain text
  });
  if (result.ok) return { ok: true };
  return { ok: false, error: result.error };
}

function processQueue(): void {
  const now = Date.now();
  for (const item of Array.from(queue.values())) {
    if (item.status !== "pending") continue;
    if (item.nextAttemptAt > now) continue;

    item.status = "processing";
    item.attempts += 1;
    item.lastAttemptAt = now;

    attemptSend(item)
      .then((res) => {
        const attemptedAt = new Date().toISOString();
        if (res.ok) {
          item.status = "delivered";
          item.history.push({ at: attemptedAt, attempt: item.attempts, result: "success" });
          structuredLog("info", "retry.delivered", {
            messageId: item.messageId,
            attempts: item.attempts,
          });
          moveToProcessed(item);
        } else {
          item.lastError = res.error;
          item.history.push({ at: attemptedAt, attempt: item.attempts, result: "failure", error: res.error });
          if (item.attempts >= MAX_ATTEMPTS) {
            item.status = "failed";
            structuredLog("error", "retry.exhausted", {
              messageId: item.messageId,
              attempts: item.attempts,
              lastError: res.error,
            });
            moveToProcessed(item);
          } else {
            item.status = "pending";
            item.nextAttemptAt = Date.now() + backoffMs(item.attempts);
            structuredLog("warn", "retry.scheduled", {
              messageId: item.messageId,
              attempt: item.attempts,
              nextAttemptInMs: backoffMs(item.attempts),
              error: res.error,
            });
          }
        }
      })
      .catch((err: unknown) => {
        // Should not happen — attemptSend catches its own errors — but guard anyway
        item.status = "pending";
        item.lastError = err instanceof Error ? err.message : String(err);
        item.nextAttemptAt = Date.now() + backoffMs(item.attempts);
        structuredLog("error", "retry.processor_exception", {
          messageId: item.messageId,
          error: item.lastError,
        });
      });
  }
}

// Kick off the background tick. setInterval is fine for an in-memory worker.
setInterval(processQueue, TICK_INTERVAL_MS);

// ─── Handlers ─────────────────────────────────────────────────────
async function handleEnqueue(req: Request): Promise<Response> {
  const body = (await readJsonBody(req)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const messageId =
    typeof body.messageId === "string" && body.messageId.length > 0 ? body.messageId : `msg_${Date.now().toString(36)}`;
  const recipient = typeof body.recipient === "string" ? body.recipient : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const bodyText = typeof body.body === "string" ? body.body : "";
  const reason = typeof body.reason === "string" ? body.reason : null;
  const meta = body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
    ? (body.meta as Record<string, unknown>)
    : null;

  if (!recipient) {
    return json({ success: false, error: "'recipient' is required" }, 422);
  }

  if (queue.has(messageId)) {
    // Idempotent re-enqueue — return existing
    const existing = queue.get(messageId)!;
    return json({ success: true, data: publicItem(existing), reused: true }, 200);
  }

  const item: QueueItem = {
    messageId,
    recipient,
    subject,
    body: bodyText,
    reason,
    meta,
    enqueuedAt: new Date().toISOString(),
    nextAttemptAt: Date.now(), // eligible immediately
    attempts: 0,
    status: "pending",
    lastError: null,
    lastAttemptAt: null,
    history: [],
  };
  queue.set(messageId, item);
  structuredLog("info", "queue.enqueued", { messageId, recipient: recipient.slice(0, 64), subject: subject.slice(0, 80), reason });
  return json({ success: true, data: publicItem(item) }, 202);
}

function handleListQueue(): Response {
  const pending = Array.from(queue.values()).filter((i) => i.status === "pending").map(publicItem);
  const processing = Array.from(queue.values()).filter((i) => i.status === "processing").map(publicItem);
  const recent = processed.slice(-50).map(publicItem);
  return json({
    success: true,
    data: {
      pendingCount: pending.length,
      processingCount: processing.length,
      pending,
      processing,
      recent,
    },
  });
}

function handleManualRetry(messageId: string): Response {
  const item = queue.get(messageId);
  if (!item) {
    return json({ success: false, error: "Not found", messageId }, 404);
  }
  // Force eligibility now
  item.status = "pending";
  item.nextAttemptAt = Date.now();
  structuredLog("info", "retry.manual_trigger", { messageId, attempts: item.attempts });
  return json({ success: true, data: publicItem(item), message: "Retry scheduled immediately" });
}

function handleDrop(messageId: string): Response {
  const item = queue.get(messageId);
  if (!item) {
    return json({ success: false, error: "Not found", messageId }, 404);
  }
  item.status = "dropped";
  item.history.push({ at: new Date().toISOString(), attempt: item.attempts, result: "failure", error: "dropped_by_operator" });
  moveToProcessed(item);
  structuredLog("warn", "queue.dropped", { messageId });
  return json({ success: true, message: "Item dropped", messageId });
}

function handleHealth(): Response {
  let pending = 0;
  let processing = 0;
  for (const i of queue.values()) {
    if (i.status === "pending") pending += 1;
    else if (i.status === "processing") processing += 1;
  }
  const processedDelivered = processed.filter((i) => i.status === "delivered").length;
  const processedFailed = processed.filter((i) => i.status === "failed" || i.status === "dropped").length;
  return json({
    status: "ok",
    service: SERVICE_NAME,
    uptime: uptimeSeconds(),
    pending,
    processing,
    processed: processedDelivered,
    failed: processedFailed,
    transport: getTransport().mode,
    config: {
      maxAttempts: MAX_ATTEMPTS,
      baseBackoffMs: BASE_BACKOFF_MS,
      maxBackoffMs: MAX_BACKOFF_MS,
      tickIntervalMs: TICK_INTERVAL_MS,
    },
    timestamp: new Date().toISOString(),
  });
}

// ─── Synchronous send handler ────────────────────────────────────
// POST /send { to, subject, html?, text? }
// Sends immediately via the configured transport (no queue, no retry).
// Returns 200 on success, 502 on transport failure, 422 on validation error.
async function handleSend(req: Request): Promise<Response> {
  const body = (await readJsonBody(req)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const to = typeof body.to === "string" ? body.to : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const html = typeof body.html === "string" ? body.html : undefined;
  const text = typeof body.text === "string" ? body.text : undefined;

  if (!to) {
    return json({ success: false, error: "'to' is required" }, 422);
  }
  if (!subject) {
    return json({ success: false, error: "'subject' is required" }, 422);
  }
  if (!html && !text) {
    return json({ success: false, error: "Either 'html' or 'text' is required" }, 422);
  }

  const result = await sendEmail({ to, subject, html, text });
  if (result.ok) {
    return json(
      {
        success: true,
        data: {
          to,
          subject,
          mode: result.mode,
          messageId: result.messageId,
          simulated: result.mode === "simulation",
        },
      },
      200,
    );
  }
  return json(
    {
      success: false,
      error: result.error,
      mode: result.mode,
    },
    502,
  );
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
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Request-Id",
      },
    });
  }

  if (pathname === "/health" && method === "GET") return handleHealth();
  if (pathname === "/queue" && method === "GET") return handleListQueue();
  if (pathname === "/queue" && method === "POST") return handleEnqueue(req);
  if (pathname === "/send" && method === "POST") return handleSend(req);

  // /retry/:messageId
  const retryMatch = pathname.match(/^\/retry\/([^/]+)$/);
  if (retryMatch && method === "POST") return handleManualRetry(decodeURIComponent(retryMatch[1]));

  // /queue/:messageId (DELETE)
  const dropMatch = pathname.match(/^\/queue\/([^/]+)$/);
  if (dropMatch && method === "DELETE") return handleDrop(decodeURIComponent(dropMatch[1]));

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
  maxAttempts: MAX_ATTEMPTS,
  baseBackoffMs: BASE_BACKOFF_MS,
  transport: getTransport().mode,
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
