import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const run = await db.verificationRun.findFirst({
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
    });

    if (!run) {
      return NextResponse.json({ message: 'No monitoring runs yet' });
    }

    // Parse errors for detailed stats
    let parsedErrors: string[] = [];
    try {
      parsedErrors = JSON.parse(run.errors || '[]');
    } catch {
      parsedErrors = run.errors ? [run.errors] : [];
    }

    const durationMs =
      run.startedAt && run.completedAt
        ? run.completedAt.getTime() - run.startedAt.getTime()
        : null;

    return NextResponse.json(
      {
        ...run,
        errors: parsedErrors,
        durationMs,
        stats: {
          universitiesScanned: run.universitiesScanned,
          coursesScanned: run.coursesScanned,
          sourcesChecked: run.sourcesChecked,
          changesDetected: run.changesDetected,
          recordsVerified: run.recordsVerified,
          recordsUpdated: run.recordsUpdated,
          recordsRejected: run.recordsRejected,
          recordsNeedingReview: run.recordsNeedingReview,
          errorCount: parsedErrors.length,
          durationMs,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load report', details: message }, { status: 500 });
  }
}
