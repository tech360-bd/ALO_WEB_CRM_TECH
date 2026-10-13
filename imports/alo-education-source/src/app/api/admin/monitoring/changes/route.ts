import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const impactLevel = searchParams.get('impactLevel');
    const changeType = searchParams.get('changeType');
    const universitySlug = searchParams.get('universitySlug');
    const countrySlug = searchParams.get('countrySlug');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (impactLevel) where.impactLevel = impactLevel;
    if (changeType) where.changeType = changeType;
    if (universitySlug) where.universitySlug = universitySlug;
    if (countrySlug) where.countrySlug = countrySlug;

    const [changes, total] = await Promise.all([
      db.dataChange.findMany({
        where,
        select: {
          id: true,
          runId: true,
          sourceId: true,
          entityType: true,
          universitySlug: true,
          courseSlug: true,
          countrySlug: true,
          changeType: true,
          fieldName: true,
          oldValue: true,
          newValue: true,
          sourceUrl: true,
          detectedAt: true,
          previousVerifiedAt: true,
          newSourceDate: true,
          aiExplanation: true,
          confidence: true,
          impactLevel: true,
          status: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true,
          source: {
            select: {
              id: true,
              sourceName: true,
              sourceUrl: true,
              sourceType: true,
              status: true,
            },
          },
          approvalQueue: {
            select: {
              id: true,
              queueType: true,
              priority: true,
              status: true,
              reviewedAt: true,
              createdAt: true,
            },
          },
        },
        orderBy: { detectedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.dataChange.count({ where }),
    ]);

    return NextResponse.json(
      { changes, total, page, limit },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load changes', details: message }, { status: 500 });
  }
}
