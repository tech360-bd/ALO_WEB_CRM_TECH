import { NextRequest, NextResponse } from "next/server";
import { researchProviderStatus, researchHealthCheck } from "@/lib/research/molx-firecrawl-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/research/provider-status — health check for Molx/Firecrawl providers (Phase 3)
// Does NOT leak secrets — only boolean/configured status
export async function GET(req: NextRequest) {
  const status = researchProviderStatus();
  const health = await researchHealthCheck().catch(() => ({ molx: { ok: false, error: "health check failed" }, firecrawl: { ok: false, error: "health check failed" }, primary: status.primary }));
  
  // Check ALO_CRON_SECRET format without leaking value
  const cronSecretConfigured = !!process.env.ALO_CRON_SECRET && process.env.ALO_CRON_SECRET.length >= 16;
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    providers: {
      molx: {
        configured: status.molxConfigured,
        url: status.molxUrl ? status.molxUrl.replace(/\/\/.*@/, "//****@") : undefined,
        health: health.molx,
        note: "Primary (self-hosted, MIT, free) — Docker: http://molx:3001 | non-Docker: http://localhost:3001",
      },
      firecrawl: {
        configured: status.firecrawlConfigured,
        url: status.firecrawlUrl,
        health: health.firecrawl,
        note: "Fallback when MOLX_URL empty or 5xx — requires FIRECRAWL_API_KEY",
      },
      primary: status.primary,
      selection: "Molx → Firecrawl (logged, never silent switch)",
    },
    hardening: {
      timeoutMs: 15000,
      retry: "3× exponential backoff",
      rateLimit: "Redis (60/min molx, 30/min firecrawl) — fallback memory",
      ssrf: "Blocklist 169.254.169.254 + 10/192.168/172.16-31/127 private ranges",
      logging: "ProviderErrorLog + console (cost/quota aware)",
      costAwareness: "Molx free (MIT) vs Firecrawl billed (Autumn credits) — logged per request",
      duplicateDetection: "via sourceUrl + lastVerifiedAt, manual review workflow",
      untrustedHandling: "Truncate 200k markdown, validate schema, never auto-verify identity/academic/financial",
    },
    appUrl: process.env.ALO_APP_URL || process.env.APP_URL || "https://aloeducation.com",
    cronSecretConfigured,
    redis: process.env.REDIS_URL ? "redis" : "memory-fallback",
  });
}
