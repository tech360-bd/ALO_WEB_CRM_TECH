import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { backfillIntakeWindow } from '@/lib/course-finder/intake-window-backfill';
import { INTAKE_WINDOW_MONTHS, INTAKE_WINDOW_LABEL } from '@/lib/course-finder/intake-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/courses/intakes/backfill
 *
 * Ensures every course carries an intake row for every month of the ALO window
 * (Jan 2027 … Jan 2028) — the master-build requirement. Super Admin / authorized
 * staff only.
 *
 * Safety properties (see scripts/backfill-intake-window.mjs):
 *   • the script is imported, not re-implemented, so the API and the CLI can
 *     never drift;
 *   • verified rows are never overwritten or downgraded;
 *   • generated rows carry no tuition, deposit, fee, deadline or seats and are
 *     marked SCHEDULED, not VERIFIED;
 *   • `dryRun: true` reports what would change without writing.
 */
export const POST = withAuth(async (request, auth) => {
  const allowed =
    auth.userType === 'SUPER_ADMIN' ||
    auth.userType === 'ADMIN' ||
    (auth.roles || []).some((role) => ['super_admin', 'admin', 'data_manager'].includes(String(role).toLowerCase()));
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Forbidden — intake window backfill requires Super Admin or data-manager access.' }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // An empty body is valid: it means "run with defaults".
  }

  const dryRun = body.dryRun === true;
  const limit = Number.isSafeInteger(Number(body.limit)) && Number(body.limit) > 0 ? Number(body.limit) : 0;
  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';

  try {
    const report = await backfillIntakeWindow(db, { dryRun, limit, courseId, log: (line: string) => console.warn(line) });
    return NextResponse.json({
      success: true,
      dryRun,
      window: { label: INTAKE_WINDOW_LABEL, months: INTAKE_WINDOW_MONTHS.length, start: INTAKE_WINDOW_MONTHS[0]?.key, end: INTAKE_WINDOW_MONTHS[INTAKE_WINDOW_MONTHS.length - 1]?.key },
      report,
      message: dryRun
        ? `Dry run: ${report.created} intake rows would be created across ${report.courses} courses. Nothing was written.`
        : `Intake window applied: ${report.created} rows created, ${report.keptVerified} verified rows left untouched.`,
    });
  } catch (error) {
    console.error('POST /api/admin/courses/intakes/backfill error', error);
    return NextResponse.json({ success: false, error: 'The intake window backfill could not be completed.' }, { status: 500 });
  }
});

/** GET — coverage report so an admin can see how complete the window is. */
export const GET = withAuth(async () => {
  const totalCourses = await db.crmCourse.count({ where: { status: 'active' } });
  const requiredMonths = INTAKE_WINDOW_MONTHS.length;

  const covered = await db.crmCourseIntakeFee.groupBy({
    by: ['courseId'],
    where: { status: 'active', verificationStatus: { in: ['VERIFIED', 'SCHEDULED'] } },
    _count: { _all: true },
  }).catch(() => [] as Array<{ courseId: string; _count: { _all: number } }>);

  const full = covered.filter((row) => row._count._all >= requiredMonths).length;
  const partial = covered.length - full;

  return NextResponse.json({
    success: true,
    window: { label: INTAKE_WINDOW_LABEL, months: requiredMonths, start: INTAKE_WINDOW_MONTHS[0]?.key, end: INTAKE_WINDOW_MONTHS[requiredMonths - 1]?.key },
    coverage: {
      activeCourses: totalCourses,
      coursesWithFullWindow: full,
      coursesWithPartialWindow: partial,
      coursesWithNoWindow: Math.max(0, totalCourses - covered.length),
    },
    hint: full < totalCourses
      ? 'POST to this endpoint (or run scripts/backfill-intake-window.mjs) to complete the window. Verified rows are never overwritten.'
      : 'Every active course carries the full intake window.',
  });
});
