import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "alo-education",
    version: "2.0.0",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: "unknown",
      redis: "unknown",
      storage: "unknown",
    },
  };

  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    health.checks.database = "connected";
  } catch {
    health.checks.database = "disconnected";
    health.status = "degraded";
  }

  // Check storage pools
  try {
    const fs = await import("fs");
    const poolA = process.env.STORAGE_POOL_A || "/mnt/ssd1";
    const poolB = process.env.STORAGE_POOL_B || "/mnt/ssd2";
    const poolC = process.env.STORAGE_POOL_C || "/home/aloedu/storage";
    const pools = { poolA: fs.existsSync(poolA), poolB: fs.existsSync(poolB), poolC: fs.existsSync(poolC) };
    health.checks.storage = Object.values(pools).some(v => v) ? "accessible" : "fallback";
  } catch {
    health.checks.storage = "fallback";
  }

  // Check Redis (if configured)
  if (process.env.REDIS_URL) {
    try {
      const { redis } = await import("@/lib/redis");
      await redis.ping();
      health.checks.redis = "connected";
    } catch {
      health.checks.redis = "disconnected";
      health.status = "degraded";
    }
  } else {
    health.checks.redis = "not_configured";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
