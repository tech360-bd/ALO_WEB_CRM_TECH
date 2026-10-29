/**
 * VERIFIED CATALOGUE — 13-month coverage matrix
 * =============================================
 * Pure reporting helpers used by the CLI report, the coverage API and the
 * monitoring agent's weekly report. They never infer availability: a month is
 * only "available" when the stored row says VERIFIED_AVAILABLE.
 */

import { COVERAGE_STATUSES, type CoverageStatus } from './types';
import { buildCoverageKey, windowMonths } from './validation';

export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export interface MatrixCell {
  status: CoverageStatus | 'MISSING';
  startDate: string;
  feeAmount: number;
  feeCurrency: string;
  evidenceCount: number;
}

export interface MatrixCourse {
  courseSlug: string;
  title: string;
  universitySlug: string;
  universityName: string;
  country: string;
  cells: Record<string, MatrixCell>;
  missingMonths: string[];
  availableMonths: string[];
}

export interface CoverageMatrix {
  months: string[];
  courses: MatrixCourse[];
  totals: Record<CoverageStatus | 'MISSING', number>;
  courseCount: number;
  availableCourseMonths: number;
  verifiedNotOffered: number;
  notPublished: number;
  pending: number;
  missing: number;
}

export interface MatrixInputRow {
  courseSlug: string;
  year: number;
  month: number;
  status: string;
  startDate?: string | null;
  feeAmount?: number | null;
  feeCurrency?: string | null;
  evidenceId?: string | null;
}

export interface MatrixInputCourse {
  slug: string;
  title: string;
  universitySlug: string;
  universityName?: string;
  country?: string;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function buildCoverageMatrix(courses: MatrixInputCourse[], rows: MatrixInputRow[]): CoverageMatrix {
  const months = windowMonths().map(({ year, month }) => monthKey(year, month));
  const totals = Object.fromEntries(
    [...COVERAGE_STATUSES, 'MISSING'].map((status) => [status, 0]),
  ) as Record<CoverageStatus | 'MISSING', number>;

  const rowsByKey = new Map<string, MatrixInputRow>();
  for (const row of rows) rowsByKey.set(buildCoverageKey(row.courseSlug, row.year, row.month), row);

  const matrixCourses: MatrixCourse[] = courses.map((course) => {
    const cells: Record<string, MatrixCell> = {};
    const missingMonths: string[] = [];
    const availableMonths: string[] = [];
    for (const { year, month } of windowMonths()) {
      const key = monthKey(year, month);
      const row = rowsByKey.get(buildCoverageKey(course.slug, year, month));
      if (!row || !(COVERAGE_STATUSES as readonly string[]).includes(row.status)) {
        cells[key] = { status: 'MISSING', startDate: '', feeAmount: 0, feeCurrency: '', evidenceCount: 0 };
        missingMonths.push(key);
        totals.MISSING += 1;
        continue;
      }
      const status = row.status as CoverageStatus;
      cells[key] = {
        status,
        startDate: row.startDate ?? '',
        feeAmount: row.feeAmount ?? 0,
        feeCurrency: row.feeCurrency ?? '',
        evidenceCount: row.evidenceId ? 1 : 0,
      };
      totals[status] += 1;
      if (status === 'VERIFIED_AVAILABLE') availableMonths.push(key);
    }
    return {
      courseSlug: course.slug,
      title: course.title,
      universitySlug: course.universitySlug,
      universityName: course.universityName ?? course.universitySlug,
      country: course.country ?? '',
      cells,
      missingMonths,
      availableMonths,
    };
  });

  return {
    months,
    courses: matrixCourses,
    totals,
    courseCount: matrixCourses.length,
    availableCourseMonths: totals.VERIFIED_AVAILABLE,
    verifiedNotOffered: totals.VERIFIED_NOT_OFFERED,
    notPublished: totals.NOT_PUBLISHED,
    pending: totals.VERIFICATION_PENDING + totals.SOURCE_UNAVAILABLE + totals.CONFLICT_REQUIRES_REVIEW,
    missing: totals.MISSING,
  };
}

const SYMBOLS: Record<CoverageStatus | 'MISSING', string> = {
  VERIFIED_AVAILABLE: '✅',
  VERIFIED_NOT_OFFERED: '—',
  NOT_PUBLISHED: '?',
  VERIFICATION_PENDING: '…',
  SOURCE_UNAVAILABLE: '!',
  CONFLICT_REQUIRES_REVIEW: '⚠',
  MISSING: '·',
};

export function renderCoverageMatrixMarkdown(matrix: CoverageMatrix): string {
  const header = ['Course', 'University', 'Country', ...matrix.months.map(shortMonth)].join(' | ');
  const divider = ['---', '---', '---', ...matrix.months.map(() => ':---:')].join(' | ');
  const lines = [`| ${header} |`, `| ${divider} |`];
  for (const course of matrix.courses) {
    const cells = matrix.months.map((month) => {
      const cell = course.cells[month];
      return cell ? SYMBOLS[cell.status] : SYMBOLS.MISSING;
    });
    lines.push(`| ${course.title} | ${course.universityName} | ${course.country} | ${cells.join(' | ')} |`);
  }
  lines.push('');
  lines.push('Legend: ✅ VERIFIED_AVAILABLE · — VERIFIED_NOT_OFFERED · ? NOT_PUBLISHED · … VERIFICATION_PENDING · ! SOURCE_UNAVAILABLE · ⚠ CONFLICT_REQUIRES_REVIEW · · MISSING');
  return lines.join('\n');
}

function shortMonth(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_LABELS[Number(month) - 1].slice(0, 3)} ${year.slice(2)}`;
}

export interface CoverageSummary {
  totalCourseMonths: number;
  byStatus: Record<CoverageStatus | 'MISSING', number>;
  availableMonths: string[];
  coursesWithNoVerifiedMonth: string[];
  coursesFullyCovered: string[];
}

export function summarizeCoverage(matrix: CoverageMatrix): CoverageSummary {
  const availableMonths = new Set<string>();
  for (const course of matrix.courses) for (const month of course.availableMonths) availableMonths.add(month);
  return {
    totalCourseMonths: matrix.courses.length * matrix.months.length,
    byStatus: matrix.totals,
    availableMonths: [...availableMonths].sort(),
    coursesWithNoVerifiedMonth: matrix.courses.filter((c) => c.availableMonths.length === 0).map((c) => c.courseSlug),
    coursesFullyCovered: matrix.courses.filter((c) => c.missingMonths.length === 0).map((c) => c.courseSlug),
  };
}
