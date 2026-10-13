import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Health Check — Public, No Auth Required ───────────────

export const dynamic = 'force-dynamic';

export async function GET() {
  let database: 'connected' | 'disconnected' = 'connected';

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = 'disconnected';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database,
    uptime: Math.floor(process.uptime()),
  });
}
