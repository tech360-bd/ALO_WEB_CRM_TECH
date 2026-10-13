import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    const where: Record<string, unknown> = { runId };
    if (level) where.level = level;

    const logs = await db.monitoringLog.findMany({
      where,
      select: {
        id: true,
        level: true,
        message: true,
        entityType: true,
        entitySlug: true,
        sourceUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    return NextResponse.json(
      { logs },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load logs', details: message }, { status: 500 });
  }
}
