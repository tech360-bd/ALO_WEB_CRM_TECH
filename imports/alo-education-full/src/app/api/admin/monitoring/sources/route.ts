import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const countrySlug = searchParams.get('countrySlug');
    const monitoringEnabled = searchParams.get('monitoringEnabled');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (countrySlug) where.countrySlug = countrySlug;
    if (monitoringEnabled !== null && monitoringEnabled !== undefined) {
      where.monitoringEnabled = monitoringEnabled === 'true';
    }

    const [sources, total] = await Promise.all([
      db.officialSource.findMany({
        where,
        select: {
          id: true,
          sourceUrl: true,
          sourceName: true,
          sourceType: true,
          entityType: true,
          universitySlug: true,
          courseSlug: true,
          countrySlug: true,
          priority: true,
          monitoringEnabled: true,
          trustLevel: true,
          status: true,
          lastCheckedAt: true,
          lastVerifiedAt: true,
          lastHttpStatus: true,
          consecutiveFailures: true,
          failureCount: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ priority: 'asc' }, { lastCheckedAt: 'asc' }],
        skip,
        take: limit,
      }),
      db.officialSource.count({ where }),
    ]);

    return NextResponse.json(
      { sources, total, page, limit },
      { headers: { 'Cache-Control': 'public, s-maxage=30' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load sources', details: message }, { status: 500 });
  }
}
