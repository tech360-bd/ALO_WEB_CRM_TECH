/**
 * Country comparison data assembly — /compare/countries
 *
 * Pure, side-effect-free functions that turn the verified country dataset (and
 * any admin-published overrides) into comparison rows. Kept separate from the
 * React layer so the rules can be unit-tested.
 *
 * HARD RULE: a row is only emitted when real data exists for it. There are no
 * placeholder values, no invented "application difficulty" scores and no
 * fabricated student populations — if the source has no field, the row is
 * omitted entirely.
 */

import { COUNTRY_DESTINATIONS, type CountryDestinationData } from '@/lib/country-destinations-data';

export interface ComparisonCountry {
  slug: string;
  name: string;
  flag: string;
  currency: string;
  lastVerifiedAt: string | null;
  /** Live counts from the ALO database. Null means "not measured". */
  universityCount: number | null;
  courseCount: number | null;
}

export interface ComparisonRow {
  id: string;
  label: string;
  hint?: string;
  /** One value per country slug, in the same order as `countries`. */
  values: Record<string, string | string[] | null>;
}

export interface CountryComparisonModel {
  countries: ComparisonCountry[];
  rows: ComparisonRow[];
  /** Oldest verification date across the compared set — the honest claim. */
  oldestVerification: string | null;
  sources: { country: string; section: string; sourceName: string; sourceUrl: string; lastVerifiedAt: string }[];
}

export const MAX_COMPARISON = 4;

/** Countries that have enough verified data to be comparable. */
export function getComparableCountries(): ComparisonCountry[] {
  return Object.values(COUNTRY_DESTINATIONS)
    .map((country) => toComparisonCountry(country))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toComparisonCountry(country: CountryDestinationData): ComparisonCountry {
  return {
    slug: country.slug,
    name: country.name,
    flag: country.flag,
    currency: country.currency,
    lastVerifiedAt: country.lastVerifiedAt ?? null,
    universityCount: null,
    courseCount: null,
  };
}

/**
 * Attaches real database counts. `counts` is supplied by the caller (a server
 * component or API route) because this module must stay free of I/O so it can
 * be unit-tested. Missing slugs stay `null`, which renders as "—".
 */
export function withDatabaseCounts(
  countries: ComparisonCountry[],
  counts: Record<string, { universities: number; courses: number }>,
): ComparisonCountry[] {
  return countries.map((country) => {
    const entry = counts[country.slug];
    if (!entry) return country;
    return {
      ...country,
      universityCount: entry.universities,
      courseCount: entry.courses,
    };
  });
}

/** Builds the comparison matrix. Rows with no data for any country are dropped. */
export function buildComparisonRows(selected: ComparisonCountry[]): ComparisonRow[] {
  const bySlug = new Map(selected.map((country) => [country.slug, COUNTRY_DESTINATIONS[country.slug]]));

  const rows: ComparisonRow[] = [
    {
      id: 'tuition',
      label: 'Tuition (per year)',
      hint: 'Published international fee range for the most common study levels.',
      values: pick(bySlug, (c) => c.tuitionRange),
    },
    {
      id: 'living-cost',
      label: 'Living cost',
      hint: 'Official or university-published maintenance figures.',
      values: pick(bySlug, (c) => c.livingCost),
    },
    {
      id: 'visa',
      label: 'Student visa',
      values: pick(bySlug, (c) => c.visaType),
    },
    {
      id: 'work-rights',
      label: 'Work rights while studying',
      values: pick(bySlug, (c) => c.workRights),
    },
    {
      id: 'post-study',
      label: 'Post-study work',
      values: pick(bySlug, (c) => c.workRightRules?.[0]?.postStudyRoute ?? null),
    },
    {
      id: 'intakes',
      label: 'Popular intakes',
      values: pick(bySlug, (c) => (c.popularIntakes?.length ? c.popularIntakes : null)),
    },
    {
      id: 'english',
      label: 'English requirement',
      hint: 'Typical postgraduate requirement. Always confirm against the specific course.',
      values: pick(bySlug, (c) => typicalEnglishRequirement(c)),
    },
    {
      id: 'study-levels',
      label: 'Study levels available',
      values: pick(bySlug, (c) => (c.studyLevels?.length ? c.studyLevels : null)),
    },
    {
      id: 'cities',
      label: 'Popular cities',
      values: pick(bySlug, (c) => (c.cities?.length ? c.cities.map((city) => city.name) : null)),
    },
    {
      id: 'universities',
      label: 'Universities in ALO database',
      values: pickCounts(selected, (c) => c.universityCount),
    },
    {
      id: 'courses',
      label: 'Courses in ALO database',
      values: pickCounts(selected, (c) => c.courseCount),
    },
  ];

  return rows.filter((row) => Object.values(row.values).some((value) => hasValue(value)));
}

/** The most representative English requirement we can source for a country. */
export function typicalEnglishRequirement(country: CountryDestinationData | undefined): string | null {
  if (!country) return null;
  const postgraduate = country.entryRequirements?.find((requirement) =>
    /postgraduate|master/i.test(requirement.level),
  );
  if (postgraduate?.english) return postgraduate.english;
  const first = country.entryRequirements?.[0];
  if (first?.english) return `${first.level}: ${first.english}`;
  const accepted = country.englishTests?.[0];
  if (accepted?.name) return accepted.name;
  return null;
}

function pick(
  bySlug: Map<string, CountryDestinationData>,
  read: (country: CountryDestinationData) => string | string[] | null | undefined,
): Record<string, string | string[] | null> {
  const values: Record<string, string | string[] | null> = {};
  for (const [slug, country] of bySlug) {
    values[slug] = country ? read(country) ?? null : null;
  }
  return values;
}

function pickCounts(
  selected: ComparisonCountry[],
  read: (country: ComparisonCountry) => number | null,
): Record<string, string | string[] | null> {
  const values: Record<string, string | string[] | null> = {};
  for (const country of selected) {
    const count = read(country);
    values[country.slug] = typeof count === 'number' ? count.toLocaleString('en-GB') : null;
  }
  return values;
}

export function hasValue(value: string | string[] | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export function buildComparisonModel(
  slugs: string[],
  counts: Record<string, { universities: number; courses: number }> = {},
): CountryComparisonModel {
  const all = getComparableCountries();
  const requested = slugs.length > 0 ? slugs : all.slice(0, 2).map((country) => country.slug);
  const limited = requested.slice(0, MAX_COMPARISON);

  const countries = withDatabaseCounts(
    all.filter((country) => limited.includes(country.slug)),
    counts,
  );
  // Preserve the caller's ordering so the UI columns stay stable while adding.
  countries.sort((a, b) => limited.indexOf(a.slug) - limited.indexOf(b.slug));

  const rows = buildComparisonRows(countries);

  const dates = countries.map((country) => country.lastVerifiedAt).filter((d): d is string => Boolean(d));
  const oldestVerification = dates.length > 0 ? [...dates].sort()[0] : null;

  const sources = countries.flatMap((country) =>
    (COUNTRY_DESTINATIONS[country.slug]?.sources ?? []).map((source) => ({
      country: country.name,
      section: source.section,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      lastVerifiedAt: source.lastVerifiedAt,
    })),
  );

  return { countries, rows, oldestVerification, sources };
}
