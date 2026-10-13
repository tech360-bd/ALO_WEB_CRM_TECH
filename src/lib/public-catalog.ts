/**
 * Canonical public catalogue rules for universities and courses.
 *
 * Single source of truth for:
 *   - what a PUBLIC visitor may see (published + verified + source-linked),
 *   - how the public Course Finder parses and applies its filters,
 *   - which fields a public course row is allowed to expose.
 *
 * Every public route (/api/course-finder, /api/courses, /api/courses/search,
 * /api/courses/[slug], /api/course-finder/[slug], /api/universities/[slug],
 * /course/[slug]) must use these helpers so a record cannot appear in the
 * Course Finder while its detail page reports "not available" (or vice versa).
 *
 * Pure functions only (no database access) so the rules are unit-testable.
 */

import { NON_PUBLIC_INTERNATIONAL_VALUES } from './course-finder/eligibility-rules';
import { parseIntakePeriodToken } from '@/lib/course-finder/intake-window';

export const PUBLISHED_STATUSES = ['published', 'PUBLISHED'] as const;
export const SOURCE_VERIFIED_STATUSES = ['VERIFIED', 'verified'] as const;

export class PublicQueryError extends Error {
  readonly status = 400;
}

/** A record is publicly visible only with a source link (official URL or source URL). */
function hasSourceLink() {
  return { OR: [{ sourceUrl: { not: '' } }, { officialUrl: { not: '' } }] };
}

export function publicUniversityWhere() {
  return {
    AND: [
      { status: 'active' },
      { verificationStatus: 'VERIFIED' },
      { publicationStatus: { in: [...PUBLISHED_STATUSES] } },
      hasSourceLink(),
    ],
  };
}

/**
 * A course is public only if the course AND its university are public.
 * This keeps Course Finder results and course detail pages in agreement.
 */
export function publicCourseWhere() {
  return {
    AND: [
      { status: 'active' },
      { verificationStatus: 'VERIFIED' },
      { publicationStatus: { in: [...PUBLISHED_STATUSES] } },
      hasSourceLink(),
      // Courses recorded as closed to international students or home/domestic-only
      // are never public. Unverified status stays visible but is labelled as such.
      { internationalEligibility: { notIn: [...NON_PUBLIC_INTERNATIONAL_VALUES] } },
      { university: { is: publicUniversityWhere() } },
    ],
  };
}

/**
 * Intake rows shown publicly.
 *
 * Two verification states are listed:
 *   • VERIFIED  — the month, deadline and fees came from an official source and
 *                 were checked (the only state that may carry fee/deadline data).
 *   • SCHEDULED — the ALO intake window (Jan 2027 … Jan 2028) row created by the
 *                 backfill. It asserts only that ALO tracks that month as an
 *                 intake; tuition, deposit, application fee and deadline stay
 *                 EMPTY until a source is verified, and the API flags each such
 *                 row (`verified: false`) so no screen can present it as fact.
 *
 * EXPIRED / NEEDS_REVIEW / anything else stays out of public results.
 */
export function publicIntakeWhere() {
  return { status: 'active', verificationStatus: { in: ['VERIFIED', 'SCHEDULED'] } };
}

/** Intake rows whose month, deadline and fees are all source-verified. */
export function publicVerifiedIntakeWhere() {
  return { status: 'active', verificationStatus: 'VERIFIED' };
}

export function publicRequirementWhere() {
  return { verificationStatus: 'VERIFIED' };
}

export function publicScholarshipWhere() {
  return { status: 'active', verificationStatus: { in: [...SOURCE_VERIFIED_STATUSES] } };
}

/**
 * Destination (country) scoping for public lists. Matches the stored country
 * name or code on the course or its university, always combined with the
 * public visibility rules above.
 */
export function publicCoursesInCountryWhere(countryName: string, countryCode: string) {
  return {
    AND: [
      publicCourseWhere(),
      {
        OR: [
          { country: { contains: countryName } },
          { country: { contains: countryCode } },
          { university: { is: { country: { contains: countryName } } } },
          { university: { is: { country: { contains: countryCode } } } },
        ],
      },
    ],
  };
}

export function publicUniversitiesInCountryWhere(countryName: string, countryCode: string) {
  return {
    AND: [
      publicUniversityWhere(),
      { OR: [{ country: { contains: countryName } }, { country: { contains: countryCode } }] },
    ],
  };
}

export function publicScholarshipsInCountryWhere(countryName: string, countryCode: string) {
  return {
    AND: [
      publicScholarshipWhere(),
      { university: { is: publicUniversitiesInCountryWhere(countryName, countryCode) } },
    ],
  };
}

/** Identifier lookup for a single public course. Exact matches only — never fuzzy. */
export function publicCourseIdentifierWhere(identifier: string) {
  const id = identifier.trim();
  if (!id || id.length > 191) return null;
  return {
    AND: [publicCourseWhere(), { OR: [{ slug: id }, { courseId: id }, { id }] }],
  };
}

/** Identifier lookup for a single public university. Exact matches only — never fuzzy. */
export function publicUniversityIdentifierWhere(identifier: string) {
  const id = identifier.trim();
  if (!id || id.length > 191) return null;
  return {
    AND: [publicUniversityWhere(), { OR: [{ slug: id }, { universityId: id }, { id }] }],
  };
}

/** Internal fields that must never reach a public response, even if a record contains them. */
const INTERNAL_KEYS = new Set([
  'commissions',
  'internalNotes',
  'internal_notes',
  'partnerNotes',
  'partnerDescription',
  'staffNotes',
  'admissionNotes',
  'contactEmail',
  'createdBy',
  'updatedBy',
  'internationalStudentSupportSummary',
]);

/** Returns a shallow copy of a record with internal/commission fields removed. */
export function stripInternalFields<T>(record: T): T {
  // Recursively removes internal keys from nested objects and arrays, so a
  // relation included wholesale (e.g. `university: true`) cannot leak notes or commissions.
  if (Array.isArray(record)) return record.map((item) => stripInternalFields(item)) as T;
  if (record === null || typeof record !== 'object' || record instanceof Date) return record;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
    if (!INTERNAL_KEYS.has(key)) out[key] = stripInternalFields(value);
  }
  return out as T;
}

// ---------------------------------------------------------------------------
// Course Finder query parsing
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const MONTH_ALIASES: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

/** Every spelling a stored intake month might use, for an exact `IN (...)` match. */
export function intakeMonthVariants(month: number): string[] {
  const name = MONTH_NAMES[month - 1];
  const abbr = name.slice(0, 3);
  const variants = new Set<string>([name, abbr, String(month), String(month).padStart(2, '0')]);
  if (month === 9) variants.add('Sept');
  return [...variants];
}

export { INTAKE_WINDOW_MONTHS, INTAKE_WINDOW_LABEL } from '@/lib/course-finder/intake-window';

export const ENGLISH_TEST_KEYS = [
  'ielts', 'pte', 'toefl', 'duolingo', 'moi', 'oietc', 'oxford', 'languagecert', 'oet',
] as const;
export type EnglishTestKey = (typeof ENGLISH_TEST_KEYS)[number];

const ENGLISH_TEST_DEFINITIONS: Record<EnglishTestKey, {
  testTypes: string[];
  requirementLabel: string;
  overallField?: 'ieltsOverall' | 'pteOverall' | 'toeflOverall' | 'detOverall';
  courseFlag?: 'moiAccepted';
}> = {
  ielts: { testTypes: ['IELTS', 'IELTS UKVI'], requirementLabel: 'IELTS', overallField: 'ieltsOverall' },
  pte: { testTypes: ['PTE'], requirementLabel: 'PTE', overallField: 'pteOverall' },
  toefl: { testTypes: ['TOEFL'], requirementLabel: 'TOEFL', overallField: 'toeflOverall' },
  duolingo: { testTypes: ['Duolingo'], requirementLabel: 'Duolingo', overallField: 'detOverall' },
  moi: { testTypes: ['MOI'], requirementLabel: 'MOI', courseFlag: 'moiAccepted' },
  oietc: { testTypes: ['OIETC'], requirementLabel: 'OIETC' },
  oxford: { testTypes: ['Oxford ELLT'], requirementLabel: 'Oxford ELLT' },
  languagecert: { testTypes: ['LanguageCert'], requirementLabel: 'LanguageCert' },
  oet: { testTypes: ['OET'], requirementLabel: 'OET' },
};

export interface IntakePeriodFilter {
  year: number;
  month: number;
}

export interface CourseFinderFilters {
  search: string;
  countries: string[];
  cities: string[];
  campus: string;
  studyLevels: string[];
  subjectArea: string;
  discipline: string;
  university: string;
  intakeMonth?: number;
  intakeYear?: number;
  /**
   * Multi-month intake selection, e.g. every month of 2027. Takes precedence
   * over the single `intakeMonth` when present. Month numbers 1-12.
   */
  intakeMonths?: number[];
  /**
   * Year-qualified intake selection — the canonical form for the ALO intake
   * window (Jan 2027 … Jan 2028), where a month number alone is ambiguous
   * because the window spans two years.
   */
  intakePeriods?: IntakePeriodFilter[];
  tuitionMin?: number;
  tuitionMax?: number;
  scholarship: boolean;
  applicationFeeWaived: boolean;
  lowDeposit: boolean;
  durationMonths?: number;
  deadline?: 'recorded' | 'rolling';
  englishTest?: EnglishTestKey;
  ieltsScore?: number;
  sort: 'title' | 'newest';
  page: number;
  limit: number;
}

export const COURSE_FINDER_DEFAULT_LIMIT = 24;
export const COURSE_FINDER_MAX_LIMIT = 100;
const MAX_TEXT_LENGTH = 120;
const MAX_LIST_ITEMS = 10;

function readText(sp: URLSearchParams, key: string): string {
  const value = (sp.get(key) ?? '').trim();
  if (value.length > MAX_TEXT_LENGTH) throw new PublicQueryError(`"${key}" is too long.`);
  // Reject control characters; everything else is bound as a parameter.
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new PublicQueryError(`"${key}" contains invalid characters.`);
  return value;
}

function readList(sp: URLSearchParams, key: string): string[] {
  return readText(sp, key)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

function readInteger(sp: URLSearchParams, key: string, min: number, max: number): number | undefined {
  const raw = (sp.get(key) ?? '').trim();
  if (!raw) return undefined;
  if (!/^\d+$/.test(raw)) throw new PublicQueryError(`"${key}" must be a whole number.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new PublicQueryError(`"${key}" must be between ${min} and ${max}.`);
  }
  return value;
}

function readDecimal(sp: URLSearchParams, key: string, min: number, max: number): number | undefined {
  const raw = (sp.get(key) ?? '').trim();
  if (!raw) return undefined;
  if (!/^\d+(\.\d+)?$/.test(raw)) throw new PublicQueryError(`"${key}" must be a number.`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new PublicQueryError(`"${key}" must be between ${min} and ${max}.`);
  }
  return value;
}

function parseIntake(raw: string): { month?: number; year?: number } {
  const value = raw.trim();
  if (!value) return {};
  const numeric = value.match(/^(\d{4})-(\d{1,2})$/);
  if (numeric) {
    const month = Number(numeric[2]);
    if (month < 1 || month > 12) throw new PublicQueryError('"intake" has an invalid month.');
    return { year: Number(numeric[1]), month };
  }
  const named = value.match(/^([A-Za-z]+)(?:\s+(\d{4}))?$/);
  if (named) {
    const month = MONTH_ALIASES[named[1].toLowerCase()];
    if (!month) throw new PublicQueryError('"intake" must be a month name such as January.');
    return { month, year: named[2] ? Number(named[2]) : undefined };
  }
  throw new PublicQueryError('"intake" must be a month name or YYYY-MM.');
}

/**
 * Parse and validate the public Course Finder query string.
 * Throws PublicQueryError (HTTP 400) for malformed input rather than
 * silently ignoring a filter the visitor asked for.
 */
export function parseCourseFinderParams(sp: URLSearchParams): CourseFinderFilters {
  const intake = parseIntake(readText(sp, 'intake'));
  const yearParam = readInteger(sp, 'year', 2000, 2100);
  const englishRaw = readText(sp, 'englishTest').toLowerCase();
  if (englishRaw && !(ENGLISH_TEST_KEYS as readonly string[]).includes(englishRaw)) {
    throw new PublicQueryError('"englishTest" is not a supported test.');
  }
  const tuitionMin = readDecimal(sp, 'tuitionMin', 0, 100_000_000);
  const tuitionMax = readDecimal(sp, 'tuitionMax', 0, 100_000_000);
  if (tuitionMin !== undefined && tuitionMax !== undefined && tuitionMin > tuitionMax) {
    throw new PublicQueryError('"tuitionMin" cannot be greater than "tuitionMax".');
  }
  const sortRaw = readText(sp, 'sort') || 'title';
  if (sortRaw !== 'title' && sortRaw !== 'newest') throw new PublicQueryError('"sort" must be title or newest.');
  const deadlineRaw = readText(sp, 'deadline');
  if (deadlineRaw && deadlineRaw !== 'recorded' && deadlineRaw !== 'rolling') {
    throw new PublicQueryError('"deadline" must be recorded or rolling.');
  }
  const scholarshipRaw = readText(sp, 'scholarship').toLowerCase();
  const appFeeRaw = readText(sp, 'appFee').toLowerCase();
  const depositRaw = readText(sp, 'deposit').toLowerCase();
  const page = readInteger(sp, 'page', 1, 1_000_000) ?? 1;
  const limit = readInteger(sp, 'limit', 1, COURSE_FINDER_MAX_LIMIT) ?? COURSE_FINDER_DEFAULT_LIMIT;

  // Year-qualified intake months ("2027-01", "Jan 2028" or repeated
  // intakeMonth=… params). The ALO window spans Jan 2027 → Jan 2028, so the
  // year travels with the month instead of relying on a separate `year`.
  const rawIntakeMonths = sp.getAll('intakeMonth').flatMap((value) => value.split(',')).map((v) => v.trim()).filter(Boolean);
  const intakePeriods: IntakePeriodFilter[] = [];
  for (const token of rawIntakeMonths) {
    const parsed = parseIntakePeriodToken(token, yearParam ?? undefined);
    if (!parsed) throw new PublicQueryError('"intakeMonth" must be a month name, a number 1-12, "YYYY-MM" or "<Mon> YYYY".');
    if (!intakePeriods.some((entry) => entry.year === parsed.year && entry.month === parsed.month)) {
      intakePeriods.push({ year: parsed.year, month: parsed.month });
    }
  }

  return {
    search: readText(sp, 'search'),
    countries: readList(sp, 'country'),
    cities: readList(sp, 'city'),
    campus: readText(sp, 'campus'),
    studyLevels: readList(sp, 'studyLevel'),
    subjectArea: readText(sp, 'subjectArea') || readText(sp, 'subject'),
    discipline: readText(sp, 'discipline'),
    university: readText(sp, 'university'),
    intakeMonth: intake.month,
    intakeYear: yearParam ?? intake.year,
    intakePeriods: intakePeriods.length > 0 ? intakePeriods : undefined,
    tuitionMin,
    tuitionMax,
    scholarship: ['yes', 'true', '1'].includes(scholarshipRaw),
    applicationFeeWaived: ['waived', 'yes', 'true', '1'].includes(appFeeRaw),
    lowDeposit: ['low', 'yes', 'true', '1'].includes(depositRaw),
    durationMonths: readInteger(sp, 'duration', 1, 240),
    deadline: (deadlineRaw || undefined) as CourseFinderFilters['deadline'],
    englishTest: (englishRaw || undefined) as EnglishTestKey | undefined,
    ieltsScore: readDecimal(sp, 'ieltsMin', 0, 9),
    sort: sortRaw,
    page,
    limit,
  };
}

/** Builds the Prisma `where` for public course search. Every filter is applied server-side. */
export function buildCourseFinderWhere(f: CourseFinderFilters): Record<string, unknown> {
  const and: Record<string, unknown>[] = [publicCourseWhere()];

  if (f.search) {
    and.push({
      OR: [
        { courseTitle: { contains: f.search } },
        { subjectArea: { contains: f.search } },
        { disciplineArea: { contains: f.search } },
        { university: { is: { name: { contains: f.search } } } },
      ],
    });
  }
  if (f.countries.length) {
    and.push({
      OR: f.countries.flatMap((country) => [
        { country: { contains: country } },
        { university: { is: { country: { contains: country } } } },
      ]),
    });
  }
  if (f.cities.length) {
    and.push({
      OR: f.cities.flatMap((city) => [
        { city: { contains: city } },
        { university: { is: { city: { contains: city } } } },
      ]),
    });
  }
  if (f.campus) and.push({ campus: { contains: f.campus } });
  if (f.studyLevels.length) {
    and.push({ OR: f.studyLevels.map((level) => ({ studyLevel: { contains: level } })) });
  }
  if (f.subjectArea) and.push({ subjectArea: { contains: f.subjectArea } });
  if (f.discipline) and.push({ disciplineArea: { contains: f.discipline } });
  if (f.university) {
    and.push({
      OR: [
        { universityId: f.university },
        { university: { is: { slug: f.university } } },
        { university: { is: { name: { contains: f.university } } } },
      ],
    });
  }
  if (f.durationMonths) and.push({ durationMonths: f.durationMonths });
  if (f.scholarship) {
    and.push({
      scholarshipRecords: { some: publicScholarshipWhere() },
    });
  }
  if (f.applicationFeeWaived) and.push({ applicationFeeWaiver: true });
  if (f.lowDeposit) and.push({ lowDeposit: true });

  const intakeFee: Record<string, unknown> = { ...publicIntakeWhere() };
  if (f.intakePeriods?.length) {
    // Year-qualified periods: one OR branch per (year, month) so Jan 2027 and
    // Jan 2028 are never confused with each other.
    and.push({
      OR: f.intakePeriods.map((entry) => ({
        intakeFees: {
          some: {
            ...publicIntakeWhere(),
            intakeYear: entry.year,
            intakeMonth: { in: intakeMonthVariants(entry.month) },
          },
        },
      })),
    });
  } else if (f.intakeMonths?.length) {
    intakeFee.intakeMonth = { in: f.intakeMonths.flatMap((month) => intakeMonthVariants(month)) };
  } else if (f.intakeMonth) {
    intakeFee.intakeMonth = { in: intakeMonthVariants(f.intakeMonth) };
  }
  if (f.intakeYear) intakeFee.intakeYear = f.intakeYear;
  if (f.intakeMonths?.length || f.intakeMonth || f.intakeYear) and.push({ intakeFees: { some: intakeFee } });

  if (f.tuitionMin !== undefined || f.tuitionMax !== undefined) {
    const range: Record<string, number> = { gt: 0 };
    if (f.tuitionMin !== undefined) range.gte = f.tuitionMin;
    if (f.tuitionMax !== undefined) range.lte = f.tuitionMax;
    and.push({ intakeFees: { some: { ...publicIntakeWhere(), yearlyTuition: range } } });
  }

  if (f.deadline === 'recorded') {
    and.push({ intakeFees: { some: { ...publicIntakeWhere(), applicationDeadline: { not: '' } } } });
  } else if (f.deadline === 'rolling') {
    and.push({ intakeFees: { some: { ...publicIntakeWhere(), applicationDeadline: { contains: 'olling' } } } });
  }

  if (f.englishTest) {
    const def = ENGLISH_TEST_DEFINITIONS[f.englishTest];
    const options: Record<string, unknown>[] = [
      { requirements: { some: { ...publicRequirementWhere(), OR: [{ englishTest: { contains: def.requirementLabel } }, ...def.testTypes.map((t) => ({ englishTest: { contains: t } }))] } } },
      { englishRequirements: { some: { testType: { in: def.testTypes }, sourceUrl: { not: '' } } } },
    ];
    if (def.overallField) {
      options.push({ requirements: { some: { ...publicRequirementWhere(), [def.overallField]: { gt: 0 } } } });
    }
    if (def.courseFlag) {
      options.push({ [def.courseFlag]: true });
      options.push({ requirements: { some: { ...publicRequirementWhere(), moiAccepted: true } } });
    }
    and.push({ OR: options });
  }

  if (f.ieltsScore !== undefined) {
    // "My IELTS score": show courses whose verified IELTS overall requirement is at or below it.
    and.push({ requirements: { some: { ...publicRequirementWhere(), ieltsOverall: { gt: 0, lte: f.ieltsScore } } } });
  }

  return { AND: and };
}

export function buildCourseFinderOrderBy(sort: CourseFinderFilters['sort']): Record<string, string>[] {
  return sort === 'newest'
    ? [{ createdAt: 'desc' }, { id: 'asc' }]
    : [{ courseTitle: 'asc' }, { id: 'asc' }];
}

/** Include clause for public intakes; the intake filter is repeated so the shown intake matches the search. */
export function buildPublicIntakeInclude(f: CourseFinderFilters) {
  const where: Record<string, unknown> = { ...publicIntakeWhere() };
  if (f.intakePeriods?.length) {
    // Year-qualified selection: keep each (year, month) pair intact.
    where.OR = f.intakePeriods.map((entry) => ({
      intakeYear: entry.year,
      intakeMonth: { in: intakeMonthVariants(entry.month) },
    }));
  } else if (f.intakeMonths?.length) {
    where.intakeMonth = { in: f.intakeMonths.flatMap((month) => intakeMonthVariants(month)) };
  } else if (f.intakeMonth) {
    where.intakeMonth = { in: intakeMonthVariants(f.intakeMonth) };
  }
  if (f.intakeYear && !f.intakePeriods?.length) where.intakeYear = f.intakeYear;
  return {
    where,
    // Ordered earliest-first so intakeFees[0] stays the primary intake. The
    // window can hold 13 months, so allow a longer slice than the two extra
    // intakes the table prints — the API receives every month it must show.
    orderBy: [{ intakeYear: 'asc' as const }, { intakeMonth: 'asc' as const }, { id: 'asc' as const }],
    take: f.intakePeriods?.length ? Math.min(f.intakePeriods.length, 13) : 13,
  };
}

export const PUBLIC_SCHOLARSHIP_COUNT_FILTER = { status: 'active', verificationStatus: { in: [...SOURCE_VERIFIED_STATUSES] } };

type CourseLike = {
  id: string;
  courseId: string;
  slug?: string | null;
  courseTitle: string;
  studyLevel?: string | null;
  programLevel?: string | null;
  subjectArea?: string | null;
  disciplineArea?: string | null;
  qualification?: string | null;
  durationMonths?: number | null;
  deliveryMode?: string | null;
  attendanceMode?: string | null;
  campus?: string | null;
  country?: string | null;
  city?: string | null;
  officialUrl?: string | null;
  officialApplicationUrl?: string | null;
  sourceUrl?: string | null;
  verificationStatus?: string | null;
  lastVerifiedAt?: string | null;
  applicationFeeWaiver?: boolean | null;
  lowDeposit?: boolean | null;
  internationalEligibility?: string | null;
  university: {
    universityId: string;
    slug?: string | null;
    name: string;
    country?: string | null;
    city?: string | null;
    campusName?: string | null;
    ranking?: number | null;
    worldRanking?: number | null;
    website?: string | null;
    officialUrl?: string | null;
    sourceUrl?: string | null;
    lastVerifiedAt?: string | null;
    ieltsMin?: number | null;
  };
  intakeFees?: Array<{
    intakeYear: number;
    intakeMonth: string;
    intakeName?: string | null;
    applicationDeadline?: string | null;
    appFeeAmount?: number | null;
    appFeeCurrency?: string | null;
    yearlyTuition?: number | null;
    tuitionCurrency?: string | null;
    tuitionPeriod?: string | null;
    depositAmount?: number | null;
    depositCurrency?: string | null;
    feeSourceUrl?: string | null;
    intakeSourceUrl?: string | null;
  }>;
  _count?: { scholarshipRecords?: number };
};

/**
 * Public Course Finder row. Uses the canonical slug when recorded, otherwise the
 * stable courseId, so every link resolves through the same exact-match lookup.
 * Never includes commission, notes, or partner data.
 */
export function toPublicCourseRow(c: CourseLike) {
  const fee = c.intakeFees?.[0];
  const uni = c.university;
  const identifier = c.slug || c.courseId;
  return {
    id: c.id,
    courseId: c.courseId,
    slug: identifier,
    courseTitle: c.courseTitle,
    universityId: uni.universityId,
    universitySlug: uni.slug || uni.universityId,
    universityName: uni.name,
    universityRanking: uni.ranking || 0,
    universityWorldRanking: uni.worldRanking || 0,
    universityWebsite: uni.website || '',
    universityOfficialUrl: uni.officialUrl || '',
    universitySourceUrl: uni.sourceUrl || '',
    universityLastVerifiedAt: uni.lastVerifiedAt || '',
    ieltsMin: uni.ieltsMin || 0,
    country: c.country || uni.country || '',
    city: c.city || uni.city || '',
    campus: c.campus || uni.campusName || '',
    studyLevel: c.studyLevel || c.programLevel || '',
    subjectArea: c.subjectArea || c.disciplineArea || '',
    disciplineArea: c.disciplineArea || '',
    qualification: c.qualification || '',
    durationMonths: c.durationMonths && c.durationMonths > 0 ? c.durationMonths : null,
    deliveryMode: c.deliveryMode || c.attendanceMode || '',
    scholarships: (c._count?.scholarshipRecords ?? 0) > 0,
    applicationFeeWaiver: Boolean(c.applicationFeeWaiver),
    lowDeposit: Boolean(c.lowDeposit),
    internationalEligibility: c.internationalEligibility || 'not_verified',
    officialCourseUrl: c.officialUrl || '',
    officialApplicationUrl: c.officialApplicationUrl || '',
    courseVerificationStatus: c.verificationStatus || '',
    courseLastVerifiedAt: c.lastVerifiedAt || '',
    courseSourceUrl: c.sourceUrl || c.officialUrl || '',
    intakeYear: fee?.intakeYear ?? null,
    intakeMonth: fee?.intakeMonth || '',
    intakeName: fee?.intakeName || '',
    applicationDeadline: fee?.applicationDeadline || '',
    appFeeAmount: fee?.appFeeAmount && fee.appFeeAmount > 0 ? fee.appFeeAmount : 0,
    appFeeCurrency: fee?.appFeeCurrency || '',
    yearlyTuition: fee?.yearlyTuition && fee.yearlyTuition > 0 ? fee.yearlyTuition : 0,
    tuitionCurrency: fee?.tuitionCurrency || '',
    tuitionPeriod: fee?.tuitionPeriod || '',
    depositAmount: fee?.depositAmount && fee.depositAmount > 0 ? fee.depositAmount : 0,
    depositCurrency: fee?.depositCurrency || '',
    feeSourceUrl: fee?.feeSourceUrl || '',
    intakeSourceUrl: fee?.intakeSourceUrl || '',
  };
}

export type PublicCourseRow = ReturnType<typeof toPublicCourseRow>;
