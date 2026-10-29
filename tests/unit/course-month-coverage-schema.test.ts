import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { officialCourseStagingSchema } from '@/lib/course-month-coverage-schema';

const fixture = JSON.parse(readFileSync('data/official-source-audit/aston-ai-msc-2027-monthly-staging.json', 'utf8'));

describe('official course month coverage staging', () => {
  it('accepts exactly the researched 13-month subset without claiming catalogue completion', () => {
    const parsed = officialCourseStagingSchema.parse(fixture);
    expect(parsed.course.months).toHaveLength(13);
    expect(parsed.institution.catalogueTraversalComplete).toBe(false);
    expect(parsed.institution.facultiesTraversed).toBe(0);
    expect(parsed.institution.departmentsTraversed).toBe(0);
  });

  it('records only the three official 2027 start months and leaves all other months unpublished', () => {
    const available = fixture.course.months.filter((row: { availabilityStatus: string }) => row.availabilityStatus === 'VERIFIED_AVAILABLE').map((row: { calendarMonth: string }) => row.calendarMonth);
    expect(available).toEqual(['2027-01', '2027-04', '2027-09']);
    expect(fixture.course.months.filter((row: { availabilityStatus: string }) => row.availabilityStatus === 'NOT_PUBLISHED')).toHaveLength(10);
    expect(fixture.course.months.every((row: { tuitionAmount?: number | null }) => row.tuitionAmount == null)).toBe(true);
  });

  it('rejects a 2026/27 fee copied into a 2027/28 month', () => {
    const invalid = structuredClone(fixture);
    invalid.course.months[0].tuitionAmount = 24800;
    invalid.course.months[0].tuitionCurrency = 'GBP';
    expect(officialCourseStagingSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects non-official or insecure source URLs', () => {
    const invalid = structuredClone(fixture);
    invalid.course.sources[0].url = 'http://example.invalid/course';
    expect(officialCourseStagingSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects duplicate, missing or out-of-window month rows', () => {
    const duplicate = structuredClone(fixture);
    duplicate.course.months[1].calendarMonth = '2027-01';
    expect(officialCourseStagingSchema.safeParse(duplicate).success).toBe(false);
    const missing = structuredClone(fixture);
    missing.course.months.pop();
    expect(officialCourseStagingSchema.safeParse(missing).success).toBe(false);
  });
});
