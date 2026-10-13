/**
 * Structured logger — JSON in production, pretty-printed in development.
 * ---------------------------------------------------------------------
 * Every log line includes:
 *   - `timestamp`  ISO 8601 UTC
 *   - `level`      debug | info | warn | error
 *   - `message`    short event name (e.g. "inquiry.created")
 *   - `requestId`  current request ID (from AsyncLocalStorage, if any)
 *   - arbitrary metadata passed by the caller
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("inquiry.created", { reference: "ALM-2026-XXX" });
 *   logger.error("db.write_failed", { error: err });
 *
 * Output:
 *   - Production: single-line JSON to stdout (errors to stderr) for log
 *     shippers like Datadog / Loki / CloudWatch.
 *   - Development: colored, human-readable line with optional meta JSON.
 *
 * Min level is controlled by the `LOG_LEVEL` env var
 * (debug|info|warn|error). Defaults to `info` in prod, `debug` in dev.
 */
import { getRequestId } from "./request-context";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// ANSI styles for dev-only pretty output
const LEVEL_STYLE: Record<LogLevel, string> = {
  debug: "\x1b[90m", // gray
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const UNDIM = "\x1b[22m";

const isProd = process.env.NODE_ENV === "production";

function minLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || "").toLowerCase();
  if (env in LEVEL_PRIORITY) return env as LogLevel;
  return isProd ? "info" : "debug";
}

function shouldEmit(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel()];
}

/**
 * Make a value JSON-serialisable. Errors are unwrapped to
 * { name, message, stack }. Circular / uncloneable values fall back to
 * their string representation.
 */
function safeJson(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (typeof value === "object" && value !== null) {
    try {
      JSON.stringify(value); // throws on circular refs
      return value;
    } catch {
      try {
        return JSON.parse(JSON.stringify(value, replacer));
      } catch {
        return String(value);
      }
    }
  }
  return value;
}

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

function emit(level: LogLevel, message: string, meta?: LogMeta): void {
  if (!shouldEmit(level)) return;

  const requestId = getRequestId();
  const timestamp = new Date().toISOString();

  const safeMeta: LogMeta = {};
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      safeMeta[k] = safeJson(v);
    }
  }

  if (isProd) {
    // Production: single-line JSON for log aggregators (Datadog, Loki, etc.)
    const payload: Record<string, unknown> = {
      timestamp,
      level,
      message,
      ...safeMeta,
    };
    if (requestId) payload.requestId = requestId;
    const line = JSON.stringify(payload);
    // Route errors to stderr; everything else to stdout so log shippers
    // can split streams if desired.
    const stream = level === "error" ? process.stderr : process.stdout;
    stream.write(line + "\n");
  } else {
    // Development: human-readable colored line + pretty meta
    const color = LEVEL_STYLE[level];
    const rid = requestId ? ` ${DIM}[${requestId}]${UNDIM}` : "";
    const metaStr =
      Object.keys(safeMeta).length > 0
        ? " " + JSON.stringify(safeMeta)
        : "";
    process.stdout.write(
      `${color}[${level.toUpperCase()}]${RESET} ${timestamp}${rid} ${message}${metaStr}\n`
    );
  }
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    emit("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    emit("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    emit("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    emit("error", message, meta);
  },
};

export type Logger = typeof logger;
