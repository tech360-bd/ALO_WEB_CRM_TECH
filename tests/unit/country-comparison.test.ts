import { describe, expect, it } from 'vitest';
import {
  MAX_COMPARISON,
  buildComparisonModel,
  buildComparisonRows,
  getComparableCountries,
  hasValue,
  typicalEnglishRequirement,
  withDatabaseCounts,
} from '@/lib/country-comparison';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

describe('country comparison data assembly', () => {
  it('exposes every verified destination in the source dataset', () => {
    const countries = getComparableCountries();
    expect(countries).toHaveLength(Object.keys(COUNTRY_DESTINATIONS).length);
    expect(countries.map((country) => country.slug)).toContain('uk');
    expect(countries.map((country) => country.slug)).toContain('dubai');
  });

  it('sorts destinations alphabetically for a stable picker', () => {
    const names = getComparableCountries().map((country) => country.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('defaults a comparison to two countries and never exceeds the limit', () => {
    expect(buildComparisonModel([]).countries).toHaveLength(2);
    const many = getComparableCountries().slice(0, 7).map((country) => country.slug);
    expect(buildComparisonModel(many).countries.length).toBeLessThanOrEqual(MAX_COMPARISON);
  });

  it('preserves the caller ordering so columns stay stable while adding', () => {
    const model = buildComparisonModel(['canada', 'uk', 'ireland']);
    expect(model.countries.map((country) => country.slug)).toEqual(['canada', 'uk', 'ireland']);
  });

  it('drops rows that have no data for any selected country', () => {
    const countries = getComparableCountries().slice(0, 3);
    const rows = buildComparisonRows(countries);
    for (const row of rows) {
      const populated = Object.values(row.values).filter((value) => hasValue(value));
      expect(populated.length, `row "${row.label}" should not be entirely empty`).toBeGreaterThan(0);
    }
  });

  it('emits the spec-required comparison rows that the data actually supports', () => {
    const model = buildComparisonModel(['uk', 'canada']);
    const ids = model.rows.map((row) => row.id);
    for (const required of ['tuition', 'living-cost', 'visa', 'work-rights', 'intakes', 'english']) {
      expect(ids, `expected row "${required}"`).toContain(required);
    }
  });

  it('attaches database counts only for countries that were measured', () => {
    const countries = getComparableCountries().filter((country) => ['uk', 'canada'].includes(country.slug));
    const updated = withDatabaseCounts(countries, { uk: { universities: 42, courses: 1200 } });
    expect(updated.find((country) => country.slug === 'uk')?.universityCount).toBe(42);
    expect(updated.find((country) => country.slug === 'uk')?.courseCount).toBe(1200);
    // Unmeasured countries stay null so the row is hidden instead of showing 0.
    expect(updated.find((country) => country.slug === 'canada')?.universityCount).toBeNull();
  });

  it('renders measured counts and hides unmeasured ones', () => {
    const model = buildComparisonModel(['uk', 'canada'], { uk: { universities: 42, courses: 1200 } });
    const universityRow = model.rows.find((row) => row.id === 'universities');
    expect(universityRow).toBeDefined();
    expect(universityRow?.values.uk).toBe('42');
    expect(universityRow?.values.canada).toBeNull();
  });

  it('omits the catalogue rows entirely when the database reports nothing', () => {
    const model = buildComparisonModel(['uk', 'canada'], {});
    expect(model.rows.map((row) => row.id)).not.toContain('universities');
    expect(model.rows.map((row) => row.id)).not.toContain('courses');
  });

  it('reports the oldest verification date across the compared set', () => {
    const model = buildComparisonModel(['uk', 'canada']);
    const dates = model.countries.map((country) => country.lastVerifiedAt).filter(Boolean).sort() as string[];
    expect(model.oldestVerification).toBe(dates[0]);
  });

  it('traces comparison rows back to named sources', () => {
    const model = buildComparisonModel(['uk']);
    expect(model.sources.length).toBeGreaterThan(0);
    for (const source of model.sources) {
      expect(source.sourceName).toBeTruthy();
      expect(source.sourceUrl).toMatch(/^https?:\/\//);
      expect(source.country).toBe('United Kingdom');
    }
  });

  describe('typicalEnglishRequirement', () => {
    it('prefers the postgraduate requirement when one is published', () => {
      const uk = COUNTRY_DESTINATIONS.uk;
      const postgraduate = uk.entryRequirements.find((requirement) => /postgraduate/i.test(requirement.level));
      expect(typicalEnglishRequirement(uk)).toBe(postgraduate?.english);
    });

    it('falls back to the first published requirement, labelled by level', () => {
      const synthetic = {
        ...COUNTRY_DESTINATIONS.uk,
        entryRequirements: [{ level: 'Foundation', academic: 'x', english: 'IELTS 5.5', documents: [] }],
        englishTests: [],
      };
      expect(typicalEnglishRequirement(synthetic)).toBe('Foundation: IELTS 5.5');
    });

    it('returns null rather than inventing a score when nothing is published', () => {
      expect(typicalEnglishRequirement(undefined)).toBeNull();
      const synthetic = { ...COUNTRY_DESTINATIONS.uk, entryRequirements: [], englishTests: [] };
      expect(typicalEnglishRequirement(synthetic)).toBeNull();
    });
  });

  describe('hasValue', () => {
    it('treats null, empty strings and empty arrays as missing data', () => {
      expect(hasValue(null)).toBe(false);
      expect(hasValue(undefined)).toBe(false);
      expect(hasValue('')).toBe(false);
      expect(hasValue('   ')).toBe(false);
      expect(hasValue([])).toBe(false);
      expect(hasValue('IELTS 6.5')).toBe(true);
      expect(hasValue(['London'])).toBe(true);
    });
  });
});
