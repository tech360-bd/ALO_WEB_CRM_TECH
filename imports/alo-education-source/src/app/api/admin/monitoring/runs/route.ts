import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [runs, total] = await Promise.all([
      db.verificationRun.findMany({
        where,
        select: {
          id: true,
          runId: true,
          status: true,
          scope: true,
          startedAt: true,
          completedAt: true,
          universitiesScanned: true,
          coursesScanned: true,
          sourcesChecked: true,
          changesDetected: true,
          recordsVerified: true,
          recordsUpdated: true,
          recordsRejected: true,
          recordsNeedingReview: true,
          errors: true,
          aiReportSummary: true,
          createdAt: true,
          _count: {
            select: { logs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.verificationRun.count({ where }),
    ]);

    return NextResponse.json(
      { runs, total, page, limit },
      { headers: { 'Cache-Control': 'public, s-maxage=30' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load runs', details: message }, { status: 500 });
  }
}
