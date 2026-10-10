import { describe, expect, it } from 'vitest';
import { rankScholarships, scoreScholarship, type ScholarshipRecord } from '@/lib/scholarship-match';

const FIXED_NOW = new Date('2026-10-08T00:00:00.000Z');

function makeScholarship(overrides: Partial<ScholarshipRecord> = {}): ScholarshipRecord {
  return {
    id: 'sch-1',
    slug: 'chevening',
    name: 'Test Scholarship',
    country: 'United Kingdom',
    university: '',
    fundingAmount: 'Full funding',
    fundingType: 'full_funding',
    studyLevel: 'Postgraduate',
    subject: '',
    eligibility: 'Open to postgraduate applicants',
    courseEligibility: '',
    academicRequirements: '',
    englishRequirements: '',
    nationalityRequirements: '',
    deadline: '5 November 2026',
    deadlineDate: new Date('2026-11-05T00:00:00.000Z'),
    officialSourceUrl: 'https://example.gov/scholarship',
    officialSourceName: 'Official provider',
    verificationStatus: 'verified',
    lastVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('scholarship matching', () => {
  it('scores a fully aligned profile at 100', () => {
    const result = scoreScholarship(
      makeScholarship(),
      { countries: ['united-kingdom'], studyLevel: 'Postgraduate', fundingType: 'full', nationality: 'Bangladeshi' },
      FIXED_NOW,
    );
    expect(result.matchScore).toBe(100);
    expect(result.concerns).toEqual([]);
    expect(result.openForApplications).toBe(true);
  });

  it('marks a mismatched destination as not matched and raises a concern', () => {
    const result = scoreScholarship(makeScholarship(), { countries: ['canada'] }, FIXED_NOW);
    const country = result.criteria.find((criterion) => criterion.label === 'Country');
    expect(country?.state).toBe('not_matched');
    expect(country?.published).toBe('United Kingdom');
    expect(result.concerns.some((concern) => concern.includes('United Kingdom'))).toBe(true);
    expect(result.matchScore).toBeLessThan(100);
  });

  it('matches study level through aliases, not just exact strings', () => {
    const scholarship = makeScholarship({ studyLevel: '', eligibility: 'Open to Master and MSc applicants' });
    const result = scoreScholarship(scholarship, { studyLevel: 'Postgraduate' }, FIXED_NOW);
    expect(result.criteria.find((criterion) => criterion.label === 'Study level')?.state).toBe('matched');
  });

  it('does not penalise a scholarship that publishes no subject restriction', () => {
    const open = scoreScholarship(makeScholarship({ subject: '' }), { subject: 'Public Health' }, FIXED_NOW);
    const restricted = scoreScholarship(
      makeScholarship({ subject: 'Engineering only' }),
      { subject: 'Public Health' },
      FIXED_NOW,
    );
    expect(open.matchScore).toBe(100);
    expect(restricted.matchScore).toBeLessThan(open.matchScore);
    expect(restricted.criteria.find((criterion) => criterion.label === 'Subject')?.state).toBe('not_matched');
  });

  it('reports unpublished criteria as unknown rather than assuming they are met', () => {
    // Country, study level (both the field and the eligibility text) and
    // funding type are all blank, so none of them can be evaluated.
    const result = scoreScholarship(
      makeScholarship({ country: '', studyLevel: '', eligibility: '', fundingType: '' }),
      { countries: ['united-kingdom'], studyLevel: 'Postgraduate', fundingType: 'full' },
      FIXED_NOW,
    );
    const unknown = result.criteria.filter((criterion) => criterion.state === 'unknown');
    expect(unknown.map((criterion) => criterion.label)).toEqual(
      expect.arrayContaining(['Country', 'Study level', 'Funding type']),
    );
  });

  it('excludes unpublished criteria from the score instead of counting them as met', () => {
    // Only the deadline can be evaluated here, and it is open — so the score
    // reflects evaluated criteria alone rather than being inflated to 100 by
    // fields the provider never published.
    const sparse = scoreScholarship(
      makeScholarship({ country: '', studyLevel: '', eligibility: '', fundingType: '' }),
      { countries: ['united-kingdom'], studyLevel: 'Postgraduate', fundingType: 'full' },
      FIXED_NOW,
    );
    expect(sparse.matchScore).toBe(100);
    expect(sparse.criteria.filter((criterion) => criterion.state !== 'unknown').map((c) => c.label)).toEqual(['Deadline']);
  });

  it('flags a scholarship whose deadline has already passed', () => {
    const result = scoreScholarship(
      makeScholarship({ deadlineDate: new Date('2026-01-01T00:00:00.000Z') }),
      { countries: ['united-kingdom'] },
      FIXED_NOW,
    );
    expect(result.openForApplications).toBe(false);
    expect(result.concerns).toContain('The published deadline has passed.');
  });

  it('reports openForApplications as null when no deadline is published', () => {
    const result = scoreScholarship(makeScholarship({ deadlineDate: null, deadline: '' }), {}, FIXED_NOW);
    expect(result.openForApplications).toBeNull();
  });

  it('warns when the record is not verified', () => {
    const result = scoreScholarship(makeScholarship({ verificationStatus: 'pending' }), {}, FIXED_NOW);
    expect(result.concerns.some((concern) => concern.includes('"pending"'))).toBe(true);
  });

  it('never returns a score outside 0–100', () => {
    const result = scoreScholarship(makeScholarship(), {}, FIXED_NOW);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });

  describe('rankScholarships', () => {
    it('puts open awards above closed and undated ones regardless of score', () => {
      const open = makeScholarship({ id: 'open', slug: 'open', name: 'Open award' });
      const closed = makeScholarship({
        id: 'closed', slug: 'closed', name: 'Closed award',
        deadlineDate: new Date('2026-01-01T00:00:00.000Z'),
      });
      const undated = makeScholarship({ id: 'undated', slug: 'undated', name: 'Undated award', deadlineDate: null });

      const ranked = rankScholarships([closed, undated, open], {}, FIXED_NOW);
      expect(ranked.map((match) => match.scholarship.id)).toEqual(['open', 'undated', 'closed']);
    });

    it('orders by score within the same deadline state', () => {
      const strong = makeScholarship({ id: 'strong', slug: 'strong', name: 'Strong match', country: 'Canada' });
      const weak = makeScholarship({ id: 'weak', slug: 'weak', name: 'Weak match', country: 'Germany' });
      const ranked = rankScholarships([weak, strong], { countries: ['canada'] }, FIXED_NOW);
      expect(ranked.map((match) => match.scholarship.id)).toEqual(['strong', 'weak']);
      expect(ranked[0].matchScore).toBeGreaterThan(ranked[1].matchScore);
    });

    it('is deterministic for identical input', () => {
      const records = [
        makeScholarship({ id: 'a', slug: 'a', name: 'A', country: 'Canada' }),
        makeScholarship({ id: 'b', slug: 'b', name: 'B', country: 'United Kingdom' }),
      ];
      const profile = { countries: ['canada'], studyLevel: 'Postgraduate' };
      const first = rankScholarships(records, profile, FIXED_NOW).map((match) => match.scholarship.id);
      const second = rankScholarships(records, profile, FIXED_NOW).map((match) => match.scholarship.id);
      expect(first).toEqual(second);
    });

    it('returns an empty list for an empty catalogue instead of inventing awards', () => {
      expect(rankScholarships([], { countries: ['canada'] }, FIXED_NOW)).toEqual([]);
    });
  });
});
