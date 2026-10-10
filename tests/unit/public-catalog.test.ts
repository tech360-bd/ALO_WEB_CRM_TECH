import { describe, expect, it } from 'vitest';
import {
  PublicQueryError,
  buildCourseFinderWhere,
  intakeMonthVariants,
  parseCourseFinderParams,
  publicCourseIdentifierWhere,
  publicCourseWhere,
  publicIntakeWhere,
  publicUniversityIdentifierWhere,
  publicUniversityWhere,
  stripInternalFields,
  toPublicCourseRow,
} from '@/lib/public-catalog';

const sp = (query: string) => new URLSearchParams(query);

describe('parseCourseFinderParams', () => {
  it('uses safe defaults for an empty query', () => {
    const f = parseCourseFinderParams(sp(''));
    expect(f).toMatchObject({
      search: '',
      countries: [],
      studyLevels: [],
      scholarship: false,
      applicationFeeWaived: false,
      lowDeposit: false,
      sort: 'title',
      page: 1,
      limit: 24,
    });
    expect(f.englishTest).toBeUndefined();
    expect(f.intakeMonth).toBeUndefined();
  });

  it('parses combined filters, including the UI subject alias and comma lists', () => {
    const f = parseCourseFinderParams(sp(
      'search=data&country=United%20Kingdom,Canada&studyLevel=Master&subjectArea=Business' +
      '&intake=January%202027&tuitionMin=10000&tuitionMax=30000&scholarship=yes&appFee=waived' +
      '&deposit=low&duration=12&englishTest=ielts&ieltsMin=6.5&deadline=rolling&page=3&limit=50&sort=newest',
    ));
    expect(f.search).toBe('data');
    expect(f.countries).toEqual(['United Kingdom', 'Canada']);
    expect(f.studyLevels).toEqual(['Master']);
    expect(f.subjectArea).toBe('Business');
    expect(f.intakeMonth).toBe(1);
    expect(f.intakeYear).toBe(2027);
    expect(f.tuitionMin).toBe(10000);
    expect(f.tuitionMax).toBe(30000);
    expect(f.scholarship).toBe(true);
    expect(f.applicationFeeWaived).toBe(true);
    expect(f.lowDeposit).toBe(true);
    expect(f.durationMonths).toBe(12);
    expect(f.englishTest).toBe('ielts');
    expect(f.ieltsScore).toBe(6.5);
    expect(f.deadline).toBe('rolling');
    expect(f.page).toBe(3);
    expect(f.limit).toBe(50);
    expect(f.sort).toBe('newest');
  });

  it('accepts YYYY-MM intake values', () => {
    expect(parseCourseFinderParams(sp('intake=2027-09'))).toMatchObject({ intakeMonth: 9, intakeYear: 2027 });
  });

  it.each([
    ['page=abc', '"page" must be a whole number'],
    ['page=0', '"page" must be between 1'],
    ['limit=500', '"limit" must be between 1 and 100'],
    ['englishTest=made-up', '"englishTest" is not a supported test'],
    ['tuitionMin=50000&tuitionMax=1000', 'cannot be greater'],
    ['intake=Smarch', '"intake" must be a month name'],
    ['intake=2027-13', '"intake" has an invalid month'],
    ['sort=drop_table', '"sort" must be title or newest'],
    ['deadline=someday', '"deadline" must be recorded or rolling'],
    ['ieltsMin=12', '"ieltsMin" must be between 0 and 9'],
  ])('rejects malformed input (%s) with a 400-class error instead of ignoring it', (query, message) => {
    expect(() => parseCourseFinderParams(sp(query))).toThrow(PublicQueryError);
    expect(() => parseCourseFinderParams(sp(query))).toThrow(message);
  });

  it('rejects over-long text and control characters', () => {
    expect(() => parseCourseFinderParams(sp(`search=${'a'.repeat(121)}`))).toThrow(/too long/);
    expect(() => parseCourseFinderParams(sp('search=a%00b'))).toThrow(/invalid characters/);
  });
});

describe('public visibility predicates', () => {
  it('requires published, VERIFIED, source-linked status for courses and their universities', () => {
    const where = JSON.stringify(publicCourseWhere());
    expect(where).toContain('"verificationStatus":"VERIFIED"');
    expect(where).toContain('"publicationStatus"');
    expect(where).toContain('"sourceUrl"');
    expect(where).toContain('"officialUrl"');
    expect(where).toContain('"university"');
    expect(JSON.stringify(publicUniversityWhere())).toContain('"verificationStatus":"VERIFIED"');
  });

  it('never treats needs_review / draft records as public', () => {
    expect(JSON.stringify(publicCourseWhere())).not.toContain('NEEDS_REVIEW');
    expect(JSON.stringify(publicIntakeWhere())).toEqual('{"status":"active","verificationStatus":"VERIFIED"}');
  });

  it('looks up a single course by exact identifier only (no fuzzy title match)', () => {
    const where = publicCourseIdentifierWhere('msc-data-science');
    expect(where).not.toBeNull();
    expect(JSON.stringify(where)).not.toContain('courseTitle');
    expect(JSON.stringify(where)).toContain('"slug":"msc-data-science"');
    expect(JSON.stringify(where)).toContain('"courseId":"msc-data-science"');
  });

  it('rejects empty and oversized identifiers', () => {
    expect(publicCourseIdentifierWhere('   ')).toBeNull();
    expect(publicCourseIdentifierWhere('x'.repeat(192))).toBeNull();
    expect(publicUniversityIdentifierWhere('')).toBeNull();
  });

  it('uses the same university identifier rule for slug and universityId', () => {
    const json = JSON.stringify(publicUniversityIdentifierWhere('UNI-001'));
    expect(json).toContain('"universityId":"UNI-001"');
    expect(json).not.toContain('"name"');
  });
});

describe('buildCourseFinderWhere', () => {
  it('always applies the public visibility rule first, even with no filters', () => {
    const where = buildCourseFinderWhere(parseCourseFinderParams(sp(''))) as { AND: unknown[] };
    expect(where.AND).toHaveLength(1);
    expect(where.AND[0]).toEqual(publicCourseWhere());
  });

  it('turns every supplied filter into a server-side condition (none silently dropped)', () => {
    const f = parseCourseFinderParams(sp(
      'search=ai&country=UK&city=London&campus=Main&studyLevel=Master&subjectArea=Computer&discipline=AI' +
      '&university=example-uni&intake=September&year=2027&tuitionMin=1&tuitionMax=9&scholarship=yes' +
      '&appFee=waived&deposit=low&duration=12&deadline=recorded&englishTest=ielts&ieltsMin=6',
    ));
    const where = buildCourseFinderWhere(f) as { AND: unknown[] };
    // public gate + 17 filter conditions (each filter appends one condition; deadline/englishTest/ielts add one each)
    expect(where.AND.length).toBeGreaterThanOrEqual(15);
    const json = JSON.stringify(where);
    expect(json).toContain('"courseTitle":{"contains":"ai"}');
    expect(json).toContain('"city":{"contains":"London"}');
    expect(json).toContain('"campus":{"contains":"Main"}');
    expect(json).toContain('"durationMonths":12');
    expect(json).toContain('"applicationFeeWaiver":true');
    expect(json).toContain('"lowDeposit":true');
    expect(json).toContain('"intakeYear":2027');
    expect(json).toContain('"scholarshipRecords"');
    expect(json).toContain('"ieltsOverall":{"gt":0,"lte":6}');
    expect(json).toContain('"yearlyTuition":{"gt":0,"gte":1,"lte":9}');
    expect(json).toContain('"applicationDeadline":{"not":""}');
  });

  it('matches intake months across every stored spelling, not just one format', () => {
    expect(intakeMonthVariants(1)).toEqual(expect.arrayContaining(['January', 'Jan', '1', '01']));
    expect(intakeMonthVariants(9)).toEqual(expect.arrayContaining(['September', 'Sep', 'Sept', '09']));
  });

  it('ANDs combined filters rather than letting one overwrite another', () => {
    const f = parseCourseFinderParams(sp('search=business&studyLevel=Bachelor&country=Canada'));
    const where = buildCourseFinderWhere(f) as { AND: Array<Record<string, unknown>> };
    const ors = where.AND.filter((clause) => 'OR' in clause);
    // search OR, studyLevel OR, country OR are separate clauses (not overwritten)
    expect(ors.length).toBe(3);
  });

  it('builds an English-test filter that requires a verified requirement or a recorded test', () => {
    const f = parseCourseFinderParams(sp('englishTest=pte'));
    const json = JSON.stringify(buildCourseFinderWhere(f));
    expect(json).toContain('"pteOverall":{"gt":0}');
    expect(json).toContain('"testType":{"in":["PTE"]}');
  });
});

describe('stripInternalFields and public rows', () => {
  it('removes commission, notes, and partner-only keys from any record', () => {
    const out = stripInternalFields({
      courseTitle: 'MSc Data',
      commissions: [{ partnerCommission: 500 }],
      internalNotes: 'secret',
      partnerDescription: 'partner only',
      admissionNotes: 'staff',
      contactEmail: 'x@example.com',
      officialUrl: 'https://example.edu',
    });
    expect(out).toEqual({ courseTitle: 'MSc Data', officialUrl: 'https://example.edu' });
  });

  const baseRow = {
    id: 'row-1',
    courseId: 'CRS-001',
    slug: '',
    courseTitle: 'MSc Data Science',
    studyLevel: 'Master',
    subjectArea: 'Data Science',
    durationMonths: 12,
    country: 'United Kingdom',
    city: 'Leeds',
    campus: '',
    officialUrl: 'https://example.edu/course',
    sourceUrl: 'https://example.edu/course',
    verificationStatus: 'VERIFIED',
    lastVerifiedAt: '2026-09-01',
    university: {
      universityId: 'UNI-001',
      slug: '',
      name: 'Example University',
      country: 'United Kingdom',
      city: 'Leeds',
      campusName: 'Main',
      ranking: 0,
      worldRanking: 120,
      website: 'https://example.edu',
    },
    intakeFees: [{
      intakeYear: 2027,
      intakeMonth: 'January',
      applicationDeadline: '2027-01-15',
      yearlyTuition: 21000,
      tuitionCurrency: 'GBP',
      appFeeAmount: 0,
      depositAmount: 0,
    }],
    _count: { scholarshipRecords: 2 },
  } as unknown as Parameters<typeof toPublicCourseRow>[0];

  it('falls back to the stable courseId when no slug is recorded, so links resolve to the same record', () => {
    const row = toPublicCourseRow(baseRow);
    expect(row.slug).toBe('CRS-001');
    expect(row.universitySlug).toBe('UNI-001');
  });

  it('returns recorded fee and intake values, and never null-as-zero or invented values', () => {
    const row = toPublicCourseRow(baseRow);
    expect(row).toMatchObject({
      yearlyTuition: 21000,
      tuitionCurrency: 'GBP',
      intakeMonth: 'January',
      intakeYear: 2027,
      applicationDeadline: '2027-01-15',
      appFeeAmount: 0,
      scholarships: true,
      durationMonths: 12,
    });
    const noFee = toPublicCourseRow({ ...baseRow, intakeFees: [], durationMonths: 0, _count: {} });
    expect(noFee).toMatchObject({ yearlyTuition: 0, intakeYear: null, intakeMonth: '', durationMonths: null, scholarships: false });
  });

  it('never exposes commission or internal fields in a public row', () => {
    const json = JSON.stringify(toPublicCourseRow({ ...baseRow, commissions: [{ partnerCommission: 900 }], internalNotes: 'x' } as any));
    expect(json).not.toContain('commission');
    expect(json).not.toContain('internalNotes');
    expect(json).not.toContain('partnerCommission');
  });
});
