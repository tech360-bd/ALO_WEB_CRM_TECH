import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runMonitoringCycle } from '@/lib/university-monitoring-engine';
import type { MonitoringCounts } from '@/lib/university-monitoring-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const scope: string = body.scope || 'all';
    const limit: number | undefined = body.limit ? Number(body.limit) : undefined;

    // Create the VerificationRun record
    const run = await db.verificationRun.create({
      data: {
        status: 'RUNNING',
        scope,
        startedAt: new Date(),
      },
    });

    try {
      // Execute the monitoring cycle
      const result = await runMonitoringCycle(run.runId, { scope: scope as 'all' | 'verified-only' | `country:${scope}`, limit });
      const counts = result.counts as MonitoringCounts;

      // Update the run record with results
      const updated = await db.verificationRun.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          universitiesScanned: counts.universitiesChecked,
          coursesScanned: counts.coursesChecked,
          sourcesChecked: counts.sourcesChecked,
          changesDetected: counts.changesDetected,
          recordsNeedingReview: counts.manualReviewItems,
          aiReportSummary: result.aiReportSummary,
        },
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
          aiReportSummary: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ success: true, run: updated });
    } catch (runError: unknown) {
      const errorMessage = runError instanceof Error ? runError.message : 'Unknown run error';

      await db.verificationRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errors: JSON.stringify([errorMessage]),
        },
      });

      return NextResponse.json(
        { error: 'Monitoring run failed', details: errorMessage, runId: run.runId },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to start monitoring run', details: message }, { status: 500 });
  }
}
