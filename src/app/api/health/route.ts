// Health check endpoint.
// Public — no authentication required.
// Used by:
//   - Load balancers (Caddy/Nginx) to verify the app is responding
//   - Systemd watchdog to detect hangs
//   - Monitoring tools (Uptime Kuma, Prometheus, etc.)
//   - The mandatory clean-install gate: `curl -fsS http://127.0.0.1:3044/api/health`

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbError: string | undefined;

  try {
    // Run a trivial query to verify the DB connection is alive
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const response = {
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime_ms: process.uptime() * 1000,
    node: process.version,
    platform: process.platform,
    database: {
      connected: dbOk,
      ...(dbError ? { error: dbError } : {}),
    },
    responseTime_ms: Date.now() - startedAt,
  };

  // Return 200 even if DB is degraded — the app is running, just unhealthy.
  // Load balancers can use the `status` field to decide whether to drain traffic.
  // Use 503 only if the app process itself is failing (rare).
  return NextResponse.json(response, { status: 200 });
}
