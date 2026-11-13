import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import {
  backfillIntakeWindow,
  summarizeIntakeWindowCoverage,
  type IntakeWindowRecord,
} from '@/lib/course-finder/intake-window-backfill';
import { INTAKE_WINDOW_MONTHS, INTAKE_WINDOW_LABEL } from '@/lib/course-finder/intake-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function canReviewIntakeCoverage(auth: AuthContext): boolean {
  return auth.userType === 'SUPER_ADMIN'
    || auth.userType === 'ADMIN'
    || (auth.roles || []).some((role) => ['super_admin', 'admin', 'data_manager'].includes(String(role).toLowerCase()));
}

function forbidden() {
  return NextResponse.json({ success: false, error: 'Forbidden — intake coverage requires Super Admin or data-manager access.' }, { status: 403 });
}

/**
 * POST /api/admin/courses/intakes/backfill
 *
 * Historical route name retained for compatibility. This endpoint is now
 * intentionally report-only: the Jan 2027–Jan 2028 range is supported by the
 * finder, but no university/course is assumed to offer every month. Only
 * appropriately sourced, reviewed intake rows may be added through import/review.
 */
export const POST = withAuth(async (request, auth) => {
  if (!canReviewIntakeCoverage(auth)) return forbidden();

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ success: false, error: 'Request body must be a JSON object.' }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    // An empty body remains valid for backwards compatibility: it means "all active courses".
  }

  if (body.dryRun !== undefined && typeof body.dryRun !== 'boolean') {
    return NextResponse.json({ success: false, error: 'dryRun must be a boolean.' }, { status: 400 });
  }
  if (body.limit !== undefined && (typeof body.limit !== 'number' || !Number.isSafeInteger(body.limit) || body.limit < 0 || body.limit > 10_000)) {
    return NextResponse.json({ success: false, error: 'limit must be an integer from 0 to 10000.' }, { status: 400 });
  }
  if (body.courseId !== undefined && (typeof body.courseId !== 'string' || !body.courseId.trim() || body.courseId.trim().length > 191)) {
    return NextResponse.json({ success: false, error: 'courseId must be a non-empty string of at most 191 characters.' }, { status: 400 });
  }

  const dryRun = body.dryRun === true; // accepted for compatibility; the operation is always read-only
  const limit = body.limit === undefined ? 0 : Number(body.limit);
  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';

  try {
    const report = await backfillIntakeWindow(db, { dryRun, limit, ...(courseId ? { courseId } : {}) });
    return NextResponse.json({
      success: true,
      reportOnly: true,
      dryRun,
      window: {
        label: INTAKE_WINDOW_LABEL,
        months: INTAKE_WINDOW_MONTHS.length,
        start: INTAKE_WINDOW_MONTHS[0]?.key,
        end: INTAKE_WINDOW_MONTHS[INTAKE_WINDOW_MONTHS.length - 1]?.key,
      },
      report,
      message: `Read-only coverage report: ${report.verifiedPeriods} distinct source-backed verified course-months; ${report.missingPeriods} months have no recorded intake. No rows were created or changed.`,
    });
  } catch (error) {
    console.error('POST /api/admin/courses/intakes/backfill failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, error: 'The intake coverage report could not be completed.' }, { status: 503 });
  }
});

/** GET — authenticated coverage summary; only unique, source-backed verified months count. */
export const GET = withAuth(async (_request, auth) => {
  if (!canReviewIntakeCoverage(auth)) return forbidden();

  try {
    const courses = await db.crmCourse.findMany({
      where: { status: 'active' },
      select: { courseId: true, universityId: true },
    });
    const courseIds = [...new Set(courses.map((course) => course.courseId))];
    const intakeRows = courseIds.length === 0 ? [] : await db.crmCourseIntakeFee.findMany({
      where: { courseId: { in: courseIds }, status: 'active', intakeYear: { in: [2027, 2028] } },
      select: {
        courseId: true,
        intakeYear: true,
        intakeMonth: true,
        verificationStatus: true,
        status: true,
        intakeSourceUrl: true,
        feeSourceUrl: true,
      },
    });
    const coverage = summarizeIntakeWindowCoverage(courses, intakeRows as IntakeWindowRecord[]);
    const skippedNoUniversity = courses.filter((course) => !course.universityId).length;

    return NextResponse.json({
      success: true,
      reportOnly: true,
      window: {
        label: INTAKE_WINDOW_LABEL,
        months: INTAKE_WINDOW_MONTHS.length,
        start: INTAKE_WINDOW_MONTHS[0]?.key,
        end: INTAKE_WINDOW_MONTHS[INTAKE_WINDOW_MONTHS.length - 1]?.key,
      },
      coverage: {
        activeCourses: courses.length,
        coursesWithFullWindow: coverage.coursesWithFullWindow,
        coursesWithPartialWindow: coverage.coursesWithPartialWindow,
        coursesWithNoWindow: coverage.coursesWithNoVerifiedWindow,
        verifiedPeriods: coverage.verifiedPeriods,
        scheduledPeriodsNotCountedAsAvailability: coverage.scheduledPeriods,
        needsReviewPeriods: coverage.needsReviewPeriods,
        missingPeriods: coverage.missingPeriods,
        duplicatePeriodRows: coverage.duplicatePeriodRows,
        skippedNoUniversity,
      },
      hint: 'Add an intake only after its availability is confirmed from an appropriate official source. Scheduled placeholders and missing months are not displayed as course availability.',
    });
  } catch (error) {
    console.error('GET /api/admin/courses/intakes/backfill failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, error: 'The intake coverage report could not be loaded.' }, { status: 503 });
  }
});
