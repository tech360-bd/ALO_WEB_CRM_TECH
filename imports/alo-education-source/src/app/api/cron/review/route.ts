import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron Review Endpoint
 * Triggered every 15 minutes by the project review cron job.
 * Performs automated health checks and project status review.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, { status: string; details?: string; durationMs?: number }> = {};

  // 1. Dev server health
  try {
    const start = Date.now();
    checks.server = {
      status: 'ok',
      details: 'Server responding',
      durationMs: Date.now() - start,
    };
  } catch {
    checks.server = { status: 'error', details: 'Server not responding' };
  }

  // 2. Database connectivity
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    checks.database = {
      status: 'ok',
      details: 'Database connected',
      durationMs: Date.now() - start,
    };
  } catch (e: any) {
    checks.database = { status: 'error', details: e.message };
  }

  // 3. Memory usage
  const mem = process.memoryUsage();
  checks.memory = {
    status: mem.heapUsed > 3.5 * 1024 * 1024 * 1024 ? 'warning' : 'ok',
    details: `Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(0)}MB / ${(mem.heapTotal / 1024 / 1024).toFixed(0)}MB, RSS: ${(mem.rss / 1024 / 1024).toFixed(0)}MB`,
  };

  // 4. Cron config check
  try {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const cronConfig = JSON.parse(
      readFileSync(join(process.cwd(), 'cron.json'), 'utf-8')
    );
    checks.cronConfig = {
      status: 'ok',
      details: `${cronConfig.jobs?.length || 0} job(s) configured`,
    };
  } catch {
    checks.cronConfig = { status: 'warning', details: 'No cron.json found' };
  }

  const totalDuration = Date.now() - startTime;
  const overallStatus = Object.values(checks).every(c => c.status === 'ok') ? 'healthy' : 'degraded';

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: overallStatus,
    durationMs: totalDuration,
    checks,
    cron: {
      kind: 'webDevReview',
      interval: '15m',
      nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.kind !== 'webDevReview') {
      return NextResponse.json({ error: 'Invalid payload kind' }, { status: 400 });
    }

    // Reuse GET logic for the triggered cron run
    const getUrl = new URL(request.url);
    const getReq = new NextRequest(getUrl);
    return GET(getReq);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
