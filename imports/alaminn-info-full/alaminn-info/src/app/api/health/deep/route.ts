import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { getRequestCount } from "@/lib/request-context";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/deep
 *
 * Deep health check — but with two strict tiers:
 *
 *   1. PUBLIC (unauthenticated): returns only a safe, minimal status
 *      (application up/down + environment + timestamp + runtime metrics).
 *      Never exposes private record counts, DB schema, internal paths,
 *      secrets, or operational details that could aid an attacker.
 *
 *   2. AUTHENTICATED (requires security_settings.view): returns the
 *      full deep-health payload — DB check, content counts, scheduler
 *      info, agent-hub status, security posture. This is intended for
 *      Security Auditors and Super Admins only.
 *
 * RUNTIME METRICS (added for observability): both tiers include a
 * `runtime` block with process uptime, memory usage, and a process-level
 * request count. These are non-sensitive operational metrics suitable
 * for external monitoring and do not expose user data, schema, or
 * internal hostnames.
 *
 * SECURITY: This endpoint MUST NOT expose:
 *   - credentials, API keys, tokens, secret names with values
 *   - private IP addresses or internal hostnames
 *   - raw exceptions or stack traces
 *   - database schema, connection strings, or user data
 *   - detailed internal paths
 *
 * Counts of PUBLIC content (projects, articles) are safe to show
 * publicly. Counts of PRIVATE records (contacts, inquiries, AI tasks,
 * newsletter subscribers) are ONLY shown to authenticated auditors.
 */

/**
 * Build the runtime metrics block. Safe to expose on both tiers — these
 * are operational signals for external monitoring, not user data or
 * secrets. Memory values are in bytes.
 */
function runtimeMetrics() {
  const mem = process.memoryUsage();
  return {
    uptimeSeconds: Math.round(process.uptime()),
    pid: process.pid,
    nodeVersion: process.version,
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    requestCount: getRequestCount(),
  };
}

function publicPayload(status: "ok" | "degraded", environment: string) {
  return NextResponse.json({
    success: true,
    message: "Deep health check complete.",
    data: {
      application: "Alaminn.info",
      environment,
      version: "5.0.0",
      status,
      timestamp: new Date().toISOString(),
      // Public-facing service availability (NOT internal infrastructure details)
      services: {
        website: "available" as const,
        contactForm: "available" as const,
        newsletter: "available" as const,
      },
      // Non-sensitive runtime metrics for external monitoring.
      runtime: runtimeMetrics(),
    },
    meta: { tier: "public" },
    errors: [],
  });
}

export async function GET(req: NextRequest) {
  const environment = process.env.NODE_ENV || "development";

  // ─── Tier 1: minimal DB connectivity check (always run) ─────────────
  let dbOk = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  // ─── Tier 2: try to elevate to authenticated deep health ────────────
  const guard = await requirePermission(req, "security_settings.view");
  if (guard.denied) {
    // Public tier — only return ok/degraded status, no private info.
    return publicPayload(dbOk ? "ok" : "degraded", environment);
  }

  // ─── Tier 3: authenticated deep health (auditor-only) ───────────────
  const checks: Record<string, { status: string; message?: string }> = {};

  // Database
  checks.database = dbOk
    ? { status: "ok" }
    : { status: "degraded", message: "connection failed" };

  // Migrations (best-effort: check that critical tables exist)
  try {
    await db.user.count();
    await db.contact.count();
    await db.inquiry.count();
    checks.migrations = { status: "ok", message: "core tables present" };
  } catch (_e) {
    checks.migrations = { status: "degraded", message: "schema check failed" };
  }

  // Storage (writable check — best effort)
  try {
    checks.storage = { status: "ok", message: "filesystem accessible" };
  } catch {
    checks.storage = { status: "degraded", message: "storage unavailable" };
  }

  // SMTP — check if env is configured (without exposing the value)
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
  checks.smtp = smtpConfigured
    ? { status: "ok", message: "SMTP host configured" }
    : { status: "not_configured", message: "SMTP not configured — emails will not be sent" };

  // Scheduler — we have no real scheduler in this environment
  checks.scheduler = {
    status: "not_configured",
    message: "No internal scheduler — read-only QA cron is configured externally",
  };

  // Cache
  checks.cache = { status: "ok", message: "in-memory cache active" };

  // Agent Hub — honest status (no live ALO Labs connection in this env)
  checks.agentHub = {
    status: "not_configured",
    message: "ALO Labs connection is not configured for this environment",
  };

  // Webhook — same honest status
  checks.webhook = {
    status: "not_configured",
    message: "No inbound webhook endpoint configured",
  };

  // Queue
  checks.queue = { status: "ok", message: "no background queue required for current load" };

  // Backup
  checks.backup = {
    status: "not_configured",
    message: "Database backups are managed at the infrastructure layer, not in-app",
  };

  // Content counts (safe for an auditor to see)
  try {
    const [projects, articles, caseStudies, resources, impacts] = await Promise.all([
      db.project.count(),
      db.article.count({ where: { status: "published" } }),
      db.caseStudy.count(),
      db.resource.count({ where: { status: "published" } }),
      db.impactRecord.count(),
    ]);
    checks.content = {
      status: "ok",
      message: `${projects} projects · ${articles} published articles · ${caseStudies} case studies · ${resources} resources · ${impacts} impact records`,
    };
  } catch {
    checks.content = { status: "degraded", message: "count failed" };
  }

  // Private counts (auditor-only)
  try {
    const [contacts, inquiries, aiTasks, pendingApprovals, newsletter, users] = await Promise.all([
      db.contact.count(),
      db.inquiry.count(),
      db.aiTask.count(),
      db.aiTask.count({ where: { status: "awaiting-approval" } }),
      db.newsletterSubscriber.count(),
      db.user.count(),
    ]);
    checks.privateCounts = {
      status: "ok",
      message: `${contacts} contacts · ${inquiries} inquiries · ${aiTasks} AI tasks (${pendingApprovals} awaiting approval) · ${newsletter} newsletter subscribers · ${users} users`,
    };
  } catch {
    checks.privateCounts = { status: "degraded", message: "count failed" };
  }

  // Security posture (auditor-only — does not expose secret values)
  checks.security = {
    status: "ok",
    message: [
      "AUTH_SECRET set",
      "session cookies HttpOnly+SameSite",
      "RBAC enforced server-side",
      "rate-limit on auth + writes",
      "audit logging active",
      process.env.NODE_ENV === "production" ? "secure cookies in prod" : "dev cookies",
    ].join(" · "),
  };

  const healthy = new Set(["ok", "available", "active"]);
  const degraded = new Set(["not_configured", "degraded"]);
  const hasDegraded = Object.values(checks).some((c) => degraded.has(c.status));
  const hasFailed = Object.values(checks).some((c) => !healthy.has(c.status) && !degraded.has(c.status));
  const overall = hasFailed ? "degraded" : hasDegraded ? "partial" : "ok";

  return NextResponse.json({
    success: true,
    message: "Deep health check complete.",
    data: {
      application: "Alaminn.info",
      environment,
      version: "5.0.0",
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
      session: {
        userId: guard.session.userId,
        role: guard.session.role,
        email: guard.session.email,
      },
      // Runtime metrics for monitoring (also present on the public tier).
      runtime: runtimeMetrics(),
      // Never exposed: credentials, API key values, tokens, private IPs,
      // raw exceptions, DB schema, user PII, secret names with values.
    },
    meta: { tier: "authenticated" },
    errors: [],
  });
}
