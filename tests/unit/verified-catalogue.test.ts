import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildCoverageKey,
  buildEvidenceKey,
  evidenceContentHash,
  feeCoversMonth,
  isInWindow,
  sameOfficialDomain,
  validateDataset,
  windowMonths,
} from '@/lib/verified-catalogue/validation';
import { buildCoverageMatrix, summarizeCoverage } from '@/lib/verified-catalogue/coverage';
import type { VerifiedDataset, CoverageRecord } from '@/lib/verified-catalogue/types';

const DATASET_PATH = resolve(process.cwd(), 'data/verified-2027/dataset.json');
const dataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8')) as VerifiedDataset;

function cloneDataset(): VerifiedDataset {
  return JSON.parse(JSON.stringify(dataset)) as VerifiedDataset;
}

describe('13-month window', () => {
  it('covers exactly January 2027 through January 2028', () => {
    const months = windowMonths();
    expect(months).toHaveLength(13);
    expect(months[0]).toEqual({ year: 2027, month: 1 });
    expect(months[12]).toEqual({ year: 2028, month: 1 });
    expect(months.filter((m) => m.year === 2027)).toHaveLength(12);
  });

  it('rejects months outside the window', () => {
    expect(isInWindow(2026, 12)).toBe(false);
    expect(isInWindow(2028, 2)).toBe(false);
    expect(isInWindow(2027, 6)).toBe(true);
  });
});

describe('fee carry-forward protection', () => {
  it('only lets an academic year cover the months it actually spans', () => {
    expect(feeCoversMonth('2027/28', 2027, 9)).toBe(true);
    expect(feeCoversMonth('2027/28', 2027, 8)).toBe(false);
    expect(feeCoversMonth('2026/27', 2027, 1)).toBe(true);
    expect(feeCoversMonth('2026/27', 2027, 9)).toBe(false);
    expect(feeCoversMonth('2027', 2027, 2)).toBe(true);
    expect(feeCoversMonth('2026', 2027, 2)).toBe(false);
  });

  it('blocks a 2026 fee from being re-used for a September 2027 intake', () => {
    const bad = cloneDataset();
    const row = bad.coverage.find((entry) => entry.status === 'VERIFIED_AVAILABLE' && entry.year === 2027 && entry.month === 9);
    expect(row).toBeTruthy();
    row!.feeAmount = 18000;
    row!.feeCurrency = 'GBP';
    row!.feeSourceUrl = 'https://www.example.ac.uk/fees';
    row!.academicYear = '2026/27';
    const result = validateDataset(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === 'COVERAGE_FEE_CARRY_FORWARD')).toBe(true);
  });

  it('blocks a fee with no academic year or currency', () => {
    const bad = cloneDataset();
    const row = bad.coverage.find((entry) => entry.status === 'VERIFIED_AVAILABLE')!;
    row.academicYear = '';
    row.feeCurrency = '';
    const result = validateDataset(bad);
    expect(result.errors.some((error) => error.code === 'COVERAGE_FEE_ACADEMIC_YEAR')).toBe(true);
    expect(result.errors.some((error) => error.code === 'COVERAGE_FEE_CURRENCY')).toBe(true);
  });
});

describe('evidence integrity', () => {
  it('hashes the normalised excerpt deterministically', () => {
    const a = evidenceContentHash('January 2027\n Available   Available');
    const b = evidenceContentHash('January 2027 Available Available');
    expect(a).toBe(b);
    expect(evidenceContentHash('different text entirely here')).not.toBe(a);
  });

  it('builds a stable evidence key regardless of field-scope order', () => {
    const base = {
      sourceUrl: 'https://www.manchester.ac.uk/study/masters/courses/list/10867/msc-accounting/',
      entityType: 'COURSE' as const,
      universitySlug: 'university-of-manchester',
      courseSlug: 'manchester-msc-accounting',
      excerpt: 'Year of entry: 2027 Duration: 1 year',
    };
    const keyA = buildEvidenceKey({ ...base, fieldScope: ['duration', 'yearOfEntry'] });
    const keyB = buildEvidenceKey({ ...base, fieldScope: ['yearOfEntry', 'duration'] });
    expect(keyA).toBe(keyB);
    expect(buildEvidenceKey({ ...base, fieldScope: ['yearOfEntry'], excerpt: 'A different excerpt entirely here' })).not.toBe(keyA);
  });

  it('rejects evidence that is not an official HTTPS URL', () => {
    const bad = cloneDataset();
    bad.evidence[0].sourceUrl = 'http://not-secure.example.com/page';
    const result = validateDataset(bad);
    expect(result.errors.some((error) => error.code === 'EVIDENCE_URL')).toBe(true);
  });

  it('rejects a course URL that is not on the university domain', () => {
    const bad = cloneDataset();
    bad.courses[0].officialCourseUrl = 'https://aggregator.example.com/course/123';
    const result = validateDataset(bad);
    expect(result.errors.some((error) => error.code === 'COURSE_URL_DOMAIN')).toBe(true);
  });

  it('compares official domains correctly', () => {
    expect(sameOfficialDomain('https://www.manchester.ac.uk/x', 'https://manchester.ac.uk/')).toBe(true);
    expect(sameOfficialDomain('https://study.manchester.ac.uk/x', 'https://manchester.ac.uk/')).toBe(true);
    expect(sameOfficialDomain('https://manchester.ac.uk.evil.com/x', 'https://manchester.ac.uk/')).toBe(false);
  });
});

describe('coverage taxonomy rules', () => {
  it('requires evidence for any status other than VERIFICATION_PENDING', () => {
    const bad = cloneDataset();
    const row = bad.coverage.find((entry) => entry.status === 'VERIFIED_NOT_OFFERED')!;
    row.evidenceIds = [];
    const result = validateDataset(bad);
    expect(result.errors.some((error) => error.code === 'COVERAGE_EVIDENCE_REQUIRED')).toBe(true);
  });

  it('accepts VERIFICATION_PENDING without evidence but flags it as pending, not as absent', () => {
    const pending: CoverageRecord = {
      courseSlug: dataset.courses[0].slug, year: 2027, month: 2, status: 'VERIFICATION_PENDING',
      evidenceIds: [], confidence: 0.1,
    };
    const candidate = cloneDataset();
    candidate.coverage = candidate.coverage.filter((row) => !(row.courseSlug === pending.courseSlug && row.year === 2027 && row.month === 2));
    candidate.coverage.push(pending);
    const result = validateDataset(candidate);
    expect(result.errors.filter((error) => error.code === 'COVERAGE_EVIDENCE_REQUIRED')).toHaveLength(0);
  });

  it('rejects duplicate course-months and unsupported statuses', () => {
    const bad = cloneDataset();
    bad.coverage.push({ ...bad.coverage[0] });
    bad.coverage.push({ ...bad.coverage[1], month: bad.coverage[1].month === 3 ? 4 : 3, status: 'PROBABLY_FINE' as never });
    const result = validateDataset(bad);
    expect(result.errors.some((error) => error.code === 'COVERAGE_DUPLICATE')).toBe(true);
    expect(result.errors.some((error) => error.code === 'COVERAGE_STATUS')).toBe(true);
  });

  it('requires a start date or intake name for VERIFIED_AVAILABLE', () => {
    const bad = cloneDataset();
    const row = bad.coverage.find((entry) => entry.status === 'VERIFIED_AVAILABLE')!;
    row.startDate = '';
    row.intakeName = '';
    const result = validateDataset(bad);
    expect(result.errors.some((error) => error.code === 'COVERAGE_AVAILABLE_DETAIL')).toBe(true);
  });

  it('requires a conflict note for CONFLICT_REQUIRES_REVIEW', () => {
    const bad = cloneDataset();
    const row = bad.coverage.find((entry) => entry.status === 'VERIFIED_AVAILABLE')!;
    row.status = 'CONFLICT_REQUIRES_REVIEW';
    row.conflictNote = '';
    const result = validateDataset(bad);
    expect(result.errors.some((error) => error.code === 'COVERAGE_CONFLICT_NOTE')).toBe(true);
  });
});

describe('shipped 2027 dataset', () => {
  it('passes validation with no errors', () => {
    const result = validateDataset(dataset);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('has a complete 13-month matrix for every verified course', () => {
    const keys = new Set(dataset.coverage.map((row) => buildCoverageKey(row.courseSlug, row.year, row.month)));
    for (const course of dataset.courses) {
      for (const { year, month } of windowMonths()) {
        expect(keys.has(buildCoverageKey(course.slug, year, month))).toBe(true);
      }
    }
    expect(dataset.coverage).toHaveLength(dataset.courses.length * 13);
  });

  it('never carries an earlier-year fee into a 2027/2028 month', () => {
    for (const row of dataset.coverage) {
      if ((row.feeAmount ?? 0) > 0) {
        expect(row.academicYear, `${row.courseSlug} ${row.year}-${row.month}`).toBeTruthy();
        expect(feeCoversMonth(row.academicYear!, row.year, row.month), `${row.courseSlug} ${row.year}-${row.month} fee year ${row.academicYear}`).toBe(true);
      }
    }
  });

  it('only asserts VERIFIED_NOT_OFFERED from an explicit enumeration', () => {
    for (const row of dataset.coverage.filter((entry) => entry.status === 'VERIFIED_NOT_OFFERED')) {
      expect(row.conflictNote ?? '').toMatch(/enumerat/i);
      expect(row.evidenceIds.length).toBeGreaterThan(0);
    }
  });

  it('publishes real evidence for every verified course-month', () => {
    const ids = new Set(dataset.evidence.map((evidence) => evidence.id));
    for (const row of dataset.coverage.filter((entry) => entry.status === 'VERIFIED_AVAILABLE')) {
      expect(row.evidenceIds.length).toBeGreaterThan(0);
      for (const id of row.evidenceIds) expect(ids.has(id)).toBe(true);
    }
  });
});

describe('coverage matrix reporting', () => {
  it('renders 13 columns per course and counts every status', () => {
    const universities = new Map(dataset.universities.map((u) => [u.slug, u]));
    const matrix = buildCoverageMatrix(
      dataset.courses.map((course) => ({
        slug: course.slug,
        title: course.title,
        universitySlug: course.universitySlug,
        universityName: universities.get(course.universitySlug)?.name,
        country: universities.get(course.universitySlug)?.country,
      })),
      dataset.coverage,
    );
    expect(matrix.months).toHaveLength(13);
    expect(matrix.courses).toHaveLength(dataset.courses.length);
    expect(Object.values(matrix.totals).reduce((a, b) => a + b, 0)).toBe(dataset.coverage.length);
    expect(matrix.totals.MISSING).toBe(0);
    const summary = summarizeCoverage(matrix);
    expect(summary.availableMonths).toContain('2027-01');
    expect(summary.availableMonths).toContain('2028-01');
  });

  it('marks a course-month with no record as MISSING rather than guessing', () => {
    const matrix = buildCoverageMatrix(
      [{ slug: 'x', title: 'X', universitySlug: 'u', universityName: 'U', country: 'UK' }],
      [{ courseSlug: 'x', year: 2027, month: 1, status: 'VERIFIED_AVAILABLE', startDate: '2027-01-10' }],
    );
    expect(matrix.courses[0].cells['2027-01'].status).toBe('VERIFIED_AVAILABLE');
    expect(matrix.courses[0].cells['2027-02'].status).toBe('MISSING');
    expect(matrix.totals.MISSING).toBe(12);
  });
});
