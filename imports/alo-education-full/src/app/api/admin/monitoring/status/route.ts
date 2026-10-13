import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      lastRun,
      activeSources,
      brokenSources,
      disabledSources,
      pendingChanges,
      approvedChanges,
      rejectedChanges,
      highConfidenceChanges,
      needsReviewChanges,
      lowImpactChanges,
      mediumImpactChanges,
      highImpactChanges,
      criticalImpactChanges,
      staleSources,
    ] = await Promise.all([
      db.verificationRun.findFirst({
        orderBy: { createdAt: 'desc' },
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
        },
      }),
      db.officialSource.count({ where: { status: 'ACTIVE' } }),
      db.officialSource.count({ where: { status: 'BROKEN' } }),
      db.officialSource.count({ where: { status: 'DISABLED' } }),
      db.dataChange.count({ where: { status: 'PENDING' } }),
      db.dataChange.count({ where: { status: 'APPROVED' } }),
      db.dataChange.count({ where: { status: 'REJECTED' } }),
      db.dataChange.count({ where: { status: 'HIGH_CONFIDENCE' } }),
      db.dataChange.count({ where: { status: 'NEEDS_REVIEW' } }),
      db.dataChange.count({ where: { impactLevel: 'LOW' } }),
      db.dataChange.count({ where: { impactLevel: 'MEDIUM' } }),
      db.dataChange.count({ where: { impactLevel: 'HIGH' } }),
      db.dataChange.count({ where: { impactLevel: 'CRITICAL' } }),
      db.officialSource.count({
        where: {
          lastVerifiedAt: { lt: thirtyDaysAgo },
        },
      }),
    ]);

    // Sources by country (grouped)
    const countryAgg = await db.officialSource.groupBy({
      by: ['countrySlug'],
      where: { countrySlug: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const sourcesByCountry = countryAgg.map((c) => ({
      country: c.countrySlug,
      count: c._count.id,
    }));

    // Sources by status full breakdown
    const sourcesByStatus = {
      ACTIVE: activeSources,
      BROKEN: brokenSources,
      DISABLED: disabledSources,
    };

    // Changes by status
    const changesByStatus = {
      PENDING: pendingChanges,
      APPROVED: approvedChanges,
      REJECTED: rejectedChanges,
      HIGH_CONFIDENCE: highConfidenceChanges,
      NEEDS_REVIEW: needsReviewChanges,
    };

    // Changes by impact level
    const changesByImpact = {
      LOW: lowImpactChanges,
      MEDIUM: mediumImpactChanges,
      HIGH: highImpactChanges,
      CRITICAL: criticalImpactChanges,
    };

    return NextResponse.json(
      {
        lastRun,
        sourcesByStatus,
        changesByStatus,
        changesByImpact,
        sourcesByCountry,
        staleRecords: staleSources,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load monitoring status', details: message }, { status: 500 });
  }
}
