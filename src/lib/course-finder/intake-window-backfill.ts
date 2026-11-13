import type { PrismaClient } from '@prisma/client';
import { INTAKE_WINDOW_MONTHS, parseIntakePeriodToken } from './intake-window';
import { isInUniversityCourseIntakeWindow, normalizeIntakeMonth } from '@/lib/university-intake-window';

/**
 * INTAKE WINDOW COVERAGE (read-only)
 * =================================
 * Supports filtering and reporting for Jan 2027–Jan 2028, but never creates an
 * intake merely because a month falls inside that window. Individual availability
 * is a factual claim and must come from an appropriately verified official source.
 *
 * Kept under the historical `backfillIntakeWindow` name for API/CLI compatibility.
 * It is now deliberately report-only: no missing month is synthesized, no
 * verification state is promoted, and no existing row is modified or deleted.
 */

const VERIFIED = 'VERIFIED';
const SCHEDULED = 'SCHEDULED';
const EXPECTED_PERIOD_KEYS = new Set(INTAKE_WINDOW_MONTHS.map((period) => period.key));

export interface IntakeBackfillOptions {
  /** Retained for CLI/API compatibility. This operation is always read-only. */
  dryRun?: boolean;
  /** Limit the report to the first N matching active courses (0 = all). */
  limit?: number;
  /** Restrict to a single courseId. */
  courseId?: string;
  log?: (line: string) => void;
}

export interface IntakeWindowRecord {
  courseId: string;
  intakeYear: number;
  intakeMonth: string;
  verificationStatus?: string | null;
  status?: string | null;
  intakeSourceUrl?: string | null;
  feeSourceUrl?: string | null;
}

export interface IntakeWindowCoverage {
  requiredMonths: number;
  coursesWithFullWindow: number;
  coursesWithPartialWindow: number;
  coursesWithNoVerifiedWindow: number;
  verifiedPeriods: number;
  scheduledPeriods: number;
  needsReviewPeriods: number;
  missingPeriods: number;
  duplicatePeriodRows: number;
}

export interface IntakeBackfillReport extends IntakeWindowCoverage {
  courses: number;
  /** Always zero: the report-only operation never fabricates intake records. */
  created: 0;
  keptVerified: number;
  alreadyScheduled: number;
  needsReview: number;
  skippedNoUniversity: number;
  failed: 0;
  reportOnly: true;
}

type IntakeBackfillPrisma = Pick<PrismaClient, 'crmCourse' | 'crmCourseIntakeFee'>;

function periodKey(year: number, month: string): string | null {
  const explicitPeriod = parseIntakePeriodToken(month);
  const explicitSlashYear = month.trim().match(/^(20\d{2})\/(\d{1,2})$/);
  if ((explicitPeriod && explicitPeriod.year !== year) || (explicitSlashYear && Number(explicitSlashYear[1]) !== year)) return null;
  const monthNumber = normalizeIntakeMonth(month);
  if (monthNumber === null || !isInUniversityCourseIntakeWindow(year, month)) return null;
  const key = `${year}-${String(monthNumber).padStart(2, '0')}`;
  return EXPECTED_PERIOD_KEYS.has(key) ? key : null;
}

function hasHttpsSource(row: IntakeWindowRecord): boolean {
  for (const raw of [row.intakeSourceUrl, row.feeSourceUrl]) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return true;
    } catch {
      // Invalid or incomplete evidence does not make an intake verified.
    }
  }
  return false;
}

/** Count distinct, source-backed calendar periods; duplicate aliases never inflate coverage. */
export function summarizeIntakeWindowCoverage(
  courses: Array<{ courseId: string }>,
  rows: IntakeWindowRecord[],
): IntakeWindowCoverage {
  const courseIds = [...new Set(courses.map((course) => course.courseId))];
  const courseSet = new Set(courseIds);
  const periodsByCourse = new Map<string, Map<string, IntakeWindowRecord[]>>();

  for (const row of rows) {
    if (!courseSet.has(row.courseId) || (row.status && row.status.toLowerCase() !== 'active')) continue;
    const key = periodKey(row.intakeYear, row.intakeMonth);
    if (!key) continue;
    const byPeriod = periodsByCourse.get(row.courseId) ?? new Map<string, IntakeWindowRecord[]>();
    const matches = byPeriod.get(key) ?? [];
    matches.push(row);
    byPeriod.set(key, matches);
    periodsByCourse.set(row.courseId, byPeriod);
  }

  const result: IntakeWindowCoverage = {
    requiredMonths: INTAKE_WINDOW_MONTHS.length,
    coursesWithFullWindow: 0,
    coursesWithPartialWindow: 0,
    coursesWithNoVerifiedWindow: 0,
    verifiedPeriods: 0,
    scheduledPeriods: 0,
    needsReviewPeriods: 0,
    missingPeriods: 0,
    duplicatePeriodRows: 0,
  };

  for (const courseId of courseIds) {
    let verifiedForCourse = 0;
    const byPeriod = periodsByCourse.get(courseId);
    for (const period of INTAKE_WINDOW_MONTHS) {
      const records = byPeriod?.get(period.key) ?? [];
      if (records.length > 1) result.duplicatePeriodRows += records.length - 1;
      if (records.some((row) => String(row.verificationStatus || '').toUpperCase() === VERIFIED && hasHttpsSource(row))) {
        result.verifiedPeriods += 1;
        verifiedForCourse += 1;
      } else if (records.some((row) => String(row.verificationStatus || '').toUpperCase() === SCHEDULED)) {
        // Legacy scheduled placeholders are counted as pending internal work,
        // never as evidence that a university offers this intake.
        result.scheduledPeriods += 1;
      } else if (records.length > 0) {
        result.needsReviewPeriods += 1;
      } else {
        result.missingPeriods += 1;
      }
    }

    if (verifiedForCourse === INTAKE_WINDOW_MONTHS.length) result.coursesWithFullWindow += 1;
    else if (verifiedForCourse > 0) result.coursesWithPartialWindow += 1;
    else result.coursesWithNoVerifiedWindow += 1;
  }

  return result;
}

export async function backfillIntakeWindow(
  prisma: IntakeBackfillPrisma,
  options: IntakeBackfillOptions = {},
): Promise<IntakeBackfillReport> {
  const { limit = 0, log = () => {} } = options;
  const rawCourseId = options.courseId || '';
  const courseId = rawCourseId.trim();
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 10_000) {
    throw new RangeError('limit must be an integer from 0 to 10000.');
  }
  if (options.courseId !== undefined && !courseId) throw new RangeError('courseId must not be blank.');
  if (courseId.length > 191) throw new RangeError('courseId must be at most 191 characters.');
  const courses = await prisma.crmCourse.findMany({
    where: { status: 'active', ...(courseId ? { courseId } : {}) },
    select: { courseId: true, universityId: true, courseTitle: true },
    ...(limit > 0 ? { take: limit } : {}),
  });
  const courseIds = [...new Set(courses.map((course) => course.courseId))];
  const intakeRows = courseIds.length === 0 ? [] : await prisma.crmCourseIntakeFee.findMany({
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
  const report: IntakeBackfillReport = {
    ...coverage,
    courses: courses.length,
    created: 0,
    keptVerified: coverage.verifiedPeriods,
    alreadyScheduled: coverage.scheduledPeriods,
    needsReview: coverage.needsReviewPeriods,
    skippedNoUniversity,
    failed: 0,
    reportOnly: true,
  };

  log(`Read-only intake coverage report: ${report.verifiedPeriods} source-backed verified periods; ${report.missingPeriods} months have no recorded intake. No rows were created.`);
  return report;
}
