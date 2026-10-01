import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAllSchedulers } from "@/lib/automation-engine";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verify ALO_CRON_SECRET server-side (never expose to frontend)
// Supports: Authorization: Bearer <secret> or x-cron-secret header
function verifyCronSecret(req: NextRequest): boolean {
  const expected = process.env.ALO_CRON_SECRET;
  if (!expected || expected.length < 16) {
    // In production, secret must be set — fail closed for external scheduler
    // But allow session auth fallback for admin UI dev
    return false;
  }
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const xCron = req.headers.get("x-cron-secret") || req.headers.get("x-alo-cron-secret") || "";
  const provided = bearer || xCron;
  if (!provided) return false;
  // Constant-time compare to prevent timing oracle
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// GET /api/automation/schedule — health + cron verification (no secrets leaked)
export async function GET(req: NextRequest) {
  const cronConfigured = !!process.env.ALO_CRON_SECRET && process.env.ALO_CRON_SECRET.length >= 16;
  const appUrl = process.env.ALO_APP_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://aloeducation.com";
  const redisUrl = process.env.REDIS_URL || "";
  const redisMode = redisUrl ? "redis" : "memory-fallback";
  
  // Verify secret if provided — for external health check
  const hasValidSecret = verifyCronSecret(req);
  const authHeaderPresent = !!(req.headers.get("authorization") || req.headers.get("x-cron-secret"));
  
  return NextResponse.json({
    success: true,
    scheduler: "ALO Education Cron — 15 jobs Asia/Dhaka",
    cronSecretConfigured: cronConfigured,
    cronSecretVerified: hasValidSecret,
    // Never leak secret value — only boolean
    appUrl,
    redisMode,
    healthPort: process.env.PORT || null,
    timestamp: new Date().toISOString(),
    jobs: 15,
    timezone: "Asia/Dhaka",
    auth: authHeaderPresent ? (hasValidSecret ? "cron_secret_valid" : "cron_secret_invalid") : "no_cron_header",
    note: "Scheduler requires Authorization: Bearer $ALO_CRON_SECRET for external cron. Admin UI may use session auth. See docs/PRODUCTION_SETUP.md Phase 10.",
  });
}

// POST /api/automation/schedule — execute the real scheduler workflows.
// Supports two auth modes:
// 1. External scheduler: Authorization: Bearer $ALO_CRON_SECRET (verified server-side, never frontend)
// 2. Admin UI: NextAuth session with SUPER_ADMIN/ADMIN role
export async function POST(req: NextRequest) {
  // First, try cron secret auth (for external scheduler like Vercel/cPanel cron)
  const cronValid = verifyCronSecret(req);
  let actorId: string | undefined;
  let authMethod: "cron_secret" | "session" | "none" = "none";

  if (cronValid) {
    actorId = "cron-scheduler";
    authMethod = "cron_secret";
    // Audit cron secret usage (without logging secret)
    console.log(`[automation.schedule] cron_secret auth success from ${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"} at ${new Date().toISOString()}`);
  } else {
    // Fallback to session auth for admin UI
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        actorId = (session.user as { id?: string }).id;
        authMethod = "session";
      } else {
        return NextResponse.json({ error: "Insufficient permissions — requires SUPER_ADMIN or ADMIN or valid ALO_CRON_SECRET" }, { status: 403 });
      }
    }
  }

  if (authMethod === "none") {
    const hasCronConfigured = !!process.env.ALO_CRON_SECRET && process.env.ALO_CRON_SECRET.length >= 16;
    return NextResponse.json({ 
      error: "Unauthorized — provide Authorization: Bearer $ALO_CRON_SECRET or valid admin session",
      hint: hasCronConfigured ? "External cron must send Authorization: Bearer $ALO_CRON_SECRET" : "ALO_CRON_SECRET not configured on server — set through the hosting secure environment configuration",
      cronSecretConfigured: hasCronConfigured,
    }, { status: 401 });
  }

  try {
    const activePauses = await db.globalAiPause.findMany({ where: { active: true }, take: 1 });
    if (activePauses.length > 0) {
      return NextResponse.json({
        error: "Global AI is paused. Resume via /api/ai-safety/resume before scheduling.",
        globalAiPaused: true,
        authMethod,
      }, { status: 423 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await runAllSchedulers({
      actorId: actorId!,
      dryRun: body.dryRun === true,
    });

    // Audit log without secrets
    await (db as any).aloAuditLog?.create?.({
      data: {
        actorType: authMethod === "cron_secret" ? "cron" : "admin",
        actorName: actorId!,
        action: "SCHEDULER_RUN",
        resource: "Automation",
        resourceId: "schedule",
        details: JSON.stringify({ authMethod, dryRun: body.dryRun === true, timestamp: new Date().toISOString() }),
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, result, globalAiPaused: false, authMethod });
  } catch (error) {
    console.error("[automation.schedule] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduler failed", authMethod }, { status: 500 });
  }
}
