/**
 * Environment configuration — validated at startup.
 * ----------------------------------------------
 * Centralized, typed access to all environment variables. In production,
 * required secrets MUST be present or the app refuses to start. In
 * development, missing secrets fall back to safe dev values with a clear
 * console warning so local work isn't blocked.
 *
 * SECURITY: Never access `process.env` directly outside this file.
 * Import from here so every access is validated and typed.
 */

export type AppEnv = {
  /** Node environment — "development" | "production" | "test" */
  nodeEnv: string;
  isProd: boolean;
  isDev: boolean;
  /** Public site URL (no trailing slash) — used for emails, OG tags, sitemap */
  siteUrl: string;
  /** SQLite database file path */
  databaseUrl: string;
  /** HMAC secret for signing session cookies (>= 32 bytes in production) */
  authSecret: string;
  /** SMTP host (e.g. smtp.gmail.com) — leave empty to use dev console transport */
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  /** Default From: address for outgoing email */
  emailFrom: string;
  /** Reply-To address for outgoing email */
  emailReplyTo: string;
  /** Resend API key (alternative to SMTP) — leave empty to use SMTP */
  resendApiKey: string | null;
  /** True when email sending is configured (SMTP or Resend) */
  emailConfigured: boolean;
  // ─── WhatsApp AI Agent ─────────────────────────────────────────────
  /** Official WhatsApp number in local format (e.g. "01716609554") */
  whatsappNumber: string;
  /** International format without "+" (e.g. "8801716609554") — used in wa.me URLs */
  whatsappInternationalNumber: string;
  /** Display format (e.g. "01716 609 554") — used in UI text */
  whatsappDisplayNumber: string;
  /** Business name shown to WhatsApp users */
  whatsappBusinessName: string;
  /** Webhook verify token for Meta Cloud API (echoes back on GET verification) */
  whatsappWebhookVerifyToken: string | null;
  /** Meta Cloud API Phone Number ID — blank = dev mode (no actual sends) */
  whatsappApiPhoneNumberId: string | null;
  /** Meta Cloud API access token — blank = dev mode */
  whatsappApiToken: string | null;
  /** True when WhatsApp Cloud API is fully configured for outbound sending */
  whatsappApiConfigured: boolean;
  /** AI provider: "zai" (default) or "openai" */
  whatsappAiProvider: string;
  /** AI model name */
  whatsappAiModel: string;
  /** AI mode: "ACTIVE" | "HUMAN_ONLY" | "APPROVAL_REQUIRED" | "PAUSED" */
  whatsappAiMode: "ACTIVE" | "HUMAN_ONLY" | "APPROVAL_REQUIRED" | "PAUSED";
};

const DEV_SITE_URL = "http://localhost:3000";
const DEV_FALLBACK_SECRET =
  "dev-fallback-secret-please-set-AUTH_SECRET-to-a-32+-byte-random-string";

function parsePort(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : def;
}

function buildEnv(): AppEnv {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  const isDev = nodeEnv === "development";

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEV_SITE_URL).replace(/\/$/, "");

  const databaseUrl =
    process.env.DATABASE_URL || "file:./dev.db";

  // AUTH_SECRET — required in production, dev-fallback in development
  const authSecret = process.env.AUTH_SECRET || "";
  if (!authSecret) {
    if (isProd) {
      throw new Error(
        "[env] FATAL: AUTH_SECRET is missing in production. " +
          "Generate one with `openssl rand -hex 32` and set it in your environment."
      );
    }
    console.warn(
      "[env] WARNING: AUTH_SECRET not set. Using insecure dev fallback. DO NOT use in production."
    );
  }
  if (authSecret && authSecret.length < 32 && isProd) {
    throw new Error(
      "[env] FATAL: AUTH_SECRET must be at least 32 bytes in production."
    );
  }

  // SMTP / Resend — at least one must be configured in production for emails
  const smtpHost = process.env.SMTP_HOST || null;
  const smtpPort = parsePort(process.env.SMTP_PORT, 587);
  const smtpUser = process.env.SMTP_USER || null;
  const smtpPass = process.env.SMTP_PASS || null;
  const resendApiKey = process.env.RESEND_API_KEY || null;

  const emailFrom =
    process.env.EMAIL_FROM || (isProd ? "" : "Al Aminn <hello@alaminn.info>");
  const emailReplyTo =
    process.env.EMAIL_REPLY_TO || emailFrom;

  const smtpConfigured = !!(smtpHost && smtpPort && smtpUser && smtpPass);
  const emailConfigured = smtpConfigured || !!resendApiKey;

  if (isProd && !emailConfigured) {
    console.error(
      "[env] WARNING: No email transport configured (SMTP or RESEND_API_KEY). " +
        "Emails will not be sent in production. Set SMTP_* or RESEND_API_KEY."
    );
  }

  if (isProd && !emailFrom) {
    throw new Error(
      "[env] FATAL: EMAIL_FROM is missing in production."
    );
  }

  // ─── WhatsApp AI Agent ────────────────────────────────────────────────
  // OFFICIAL WHATSAPP NUMBER: 01716609554 (Bangladesh)
  // International format: 8801716609554 (used in wa.me deep links)
  // These can be overridden via env, but the defaults are the official numbers.
  const DEFAULT_WHATSAPP_NUMBER = "01716609554";
  const DEFAULT_WHATSAPP_INTL = "8801716609554";
  const DEFAULT_WHATSAPP_DISPLAY = "01716 609 554";

  const whatsappNumber = process.env.WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER;
  const whatsappInternationalNumber =
    process.env.WHATSAPP_INTERNATIONAL_NUMBER || DEFAULT_WHATSAPP_INTL;
  const whatsappDisplayNumber =
    process.env.WHATSAPP_DISPLAY_NUMBER || DEFAULT_WHATSAPP_DISPLAY;
  const whatsappBusinessName =
    process.env.WHATSAPP_BUSINESS_NAME || "Al Aminn Info";

  const whatsappWebhookVerifyToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || null;
  const whatsappApiPhoneNumberId =
    process.env.WHATSAPP_API_PHONE_NUMBER_ID || null;
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN || null;
  const whatsappApiConfigured = !!(whatsappApiPhoneNumberId && whatsappApiToken);

  const whatsappAiProvider = process.env.WHATSAPP_AI_PROVIDER || "zai";
  const whatsappAiModel = process.env.WHATSAPP_AI_MODEL || "glm-4.6";
  const rawAiMode = (process.env.WHATSAPP_AI_MODE || "ACTIVE").toUpperCase();
  const whatsappAiMode: AppEnv["whatsappAiMode"] =
    rawAiMode === "HUMAN_ONLY" ||
    rawAiMode === "APPROVAL_REQUIRED" ||
    rawAiMode === "PAUSED"
      ? rawAiMode
      : "ACTIVE";

  if (isProd && !whatsappApiConfigured) {
    console.warn(
      "[env] WARNING: WhatsApp Cloud API not configured (WHATSAPP_API_PHONE_NUMBER_ID + WHATSAPP_API_TOKEN). " +
        "WhatsApp AI agent will run in dev mode (responses returned in API body, not actually sent)."
    );
  }

  return {
    nodeEnv,
    isProd,
    isDev,
    siteUrl,
    databaseUrl,
    authSecret: authSecret || DEV_FALLBACK_SECRET,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    emailFrom,
    emailReplyTo,
    resendApiKey,
    emailConfigured,
    whatsappNumber,
    whatsappInternationalNumber,
    whatsappDisplayNumber,
    whatsappBusinessName,
    whatsappWebhookVerifyToken,
    whatsappApiPhoneNumberId,
    whatsappApiToken,
    whatsappApiConfigured,
    whatsappAiProvider,
    whatsappAiModel,
    whatsappAiMode,
  };
}

let _env: AppEnv | null = null;

/**
 * Get the validated environment. Throws on first access if production
 * secrets are missing. Cached after first call.
 */
export function env(): AppEnv {
  if (!_env) _env = buildEnv();
  return _env;
}

/**
 * Force re-evaluation (useful for tests).
 * @internal
 */
export function _resetEnv() {
  _env = null;
}
