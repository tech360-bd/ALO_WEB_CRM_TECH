import type { PrismaClient } from '@prisma/client';
import { INTAKE_WINDOW_MONTHS, SCHEDULED_INTAKE_VERIFICATION } from './intake-window';

/**
 * INTAKE WINDOW BACKFILL
 * ======================
 * Master-build requirement: "all courses are added for every month — Jan 2027 to
 * Jan 2028 intakes."
 *
 * Creates one CrmCourseIntakeFee row per month of the ALO window for every course
 * so the Course Finder, university pages, student/partner finders and the CRM all
 * show the same months.
 *
 * HONESTY RULES (spec §47 — NO FAKE DATA):
 *   • a generated row records only the month/year and that ALO tracks it;
 *   • tuition, deposit, application fee, deadline and seats stay EMPTY — never
 *     invented and never copied from a neighbouring month;
 *   • verificationStatus = 'SCHEDULED' (never VERIFIED), so the UI labels the row
 *     as pending verification and only genuinely sourced rows look verified;
 *   • existing VERIFIED rows are never overwritten or downgraded;
 *   • idempotent — re-running adds nothing and changes no verified row.
 *
 * Shared by scripts/backfill-intake-window.ts (CLI) and
 * POST /api/admin/courses/intakes/backfill so both can never drift.
 */

const VERIFIED = 'VERIFIED';

export interface IntakeBackfillOptions {
  dryRun?: boolean;
  /** Limit the run to the first N matching courses (0 = all). */
  limit?: number;
  /** Restrict to a single courseId. */
  courseId?: string;
  log?: (line: string) => void;
}

export interface IntakeBackfillReport {
  courses: number;
  created: number;
  keptVerified: number;
  alreadyScheduled: number;
  needsReview: number;
  skippedNoUniversity: number;
  failed: number;
}

type IntakeBackfillPrisma = Pick<PrismaClient, 'crmCourse' | 'crmCourseIntakeFee'>;

function monthVariants(month: number, name: string): string[] {
  const set = new Set<string>([name, name.slice(0, 3), String(month), String(month).padStart(2, '0')]);
  if (month === 9) set.add('Sept');
  return [...set];
}

export async function backfillIntakeWindow(
  prisma: IntakeBackfillPrisma,
  options: IntakeBackfillOptions = {}
): Promise<IntakeBackfillReport> {
  const { dryRun = false, limit = 0, courseId = '', log = () => {} } = options;

  const courses = await prisma.crmCourse.findMany({
    where: courseId ? { courseId } : { status: 'active' },
    select: { courseId: true, universityId: true, courseTitle: true },
    ...(limit > 0 ? { take: limit } : {}),
  });

  const report: IntakeBackfillReport = {
    courses: courses.length,
    created: 0,
    keptVerified: 0,
    alreadyScheduled: 0,
    needsReview: 0,
    skippedNoUniversity: 0,
    failed: 0,
  };

  for (const course of courses) {
    if (!course.universityId) {
      // §41 — never allow an orphan course; report it instead of inventing a
      // university link for the intake row.
      report.skippedNoUniversity += 1;
      continue;
    }

    for (const entry of INTAKE_WINDOW_MONTHS) {
      const variants = monthVariants(entry.month, entry.monthName);
      try {
        const existing = await prisma.crmCourseIntakeFee.findFirst({
          where: { courseId: course.courseId, intakeYear: entry.year, intakeMonth: { in: variants } },
          select: { id: true, verificationStatus: true },
        });

        if (existing) {
          const status = String(existing.verificationStatus || '').toUpperCase();
          if (status === VERIFIED) report.keptVerified += 1;
          else if (status === SCHEDULED_INTAKE_VERIFICATION) report.alreadyScheduled += 1;
          // Anything else (NEEDS_REVIEW, EXPIRED, …) is a human decision — a
          // backfill must never promote or delete it.
          else report.needsReview += 1;
          continue;
        }

        if (dryRun) {
          report.created += 1;
          continue;
        }

        await prisma.crmCourseIntakeFee.create({
          data: {
            universityId: course.universityId,
            courseId: course.courseId,
            intakeYear: entry.year,
            intakeMonth: entry.monthName,
            intakeName: entry.label,
            // Deliberately empty: no official source has verified these yet.
            applicationDeadline: '',
            appFeeAmount: 0,
            appFeeCurrency: '',
            yearlyTuition: 0,
            totalTuition: 0,
            tuitionCurrency: '',
            depositAmount: 0,
            depositCurrency: '',
            feeSourceUrl: '',
            intakeSourceUrl: '',
            lastCheckedAt: '',
            verificationStatus: SCHEDULED_INTAKE_VERIFICATION,
            batchId: 'intake-window-2027-2028',
            status: 'active',
          },
        });
        report.created += 1;
      } catch (error) {
        report.failed += 1;
        log(`  ! ${course.courseId} ${entry.monthName} ${entry.year}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return report;
}
