import { describe, expect, it } from 'vitest';
import { assessDeadline, isStale, nextVerificationDate } from '@/lib/phd/deadlines';
import { assessFunding, summariseEligibility } from '@/lib/phd/funding';

const now = new Date('2026-10-25T10:00:00Z');
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

describe('deadline assessment', () => {
  it('never presents an expired deadline as open', () => {
    const result = assessDeadline({ dueDate: days(-3), verificationStatus: 'VERIFIED_OFFICIAL', sourceUrl: 'https://example.ac.uk' }, now);
    expect(result.status).toBe('EXPIRED');
    expect(result.isExpired).toBe(true);
    expect(result.isOpen).toBe(false);
    expect(result.note).toMatch(/must never be presented as open/i);
  });

  it('records an unpublished date as unknown, not as closed', () => {
    const result = assessDeadline({ dueDate: null }, now);
    expect(result.status).toBe('DATE_NOT_PUBLISHED');
    expect(result.isOpen).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.note).toMatch(/do not describe this opportunity as open or closed/i);
  });

  it('treats an unverified future date as needing verification, not as open', () => {
    const result = assessDeadline({ dueDate: days(60), verificationStatus: 'NOT_YET_VERIFIED' }, now);
    expect(result.status).toBe('NEEDS_VERIFICATION');
    expect(result.isOpen).toBe(false);
    expect(result.needsVerification).toBe(true);
  });

  it('flags a verified closing date within the reminder window', () => {
    const result = assessDeadline({ dueDate: days(5), verificationStatus: 'VERIFIED_OFFICIAL', reminderDays: 14, timezone: 'Europe/London' }, now);
    expect(result.status).toBe('CLOSING_SOON');
    expect(result.isOpen).toBe(true);
    expect(result.daysRemaining).toBe(5);
  });

  it('allows personal target dates to be open without official verification', () => {
    const result = assessDeadline({ dueDate: days(30), kind: 'PERSONAL' }, now);
    expect(result.isOpen).toBe(true);
    expect(result.status).toBe('UPCOMING');
  });

  it('marks stale verification and rolls the next check date forward', () => {
    expect(isStale(null, now)).toBe(true);
    expect(isStale('2026-01-01', now)).toBe(true);
    expect(isStale('2026-09-01', now)).toBe(false);
    const next = nextVerificationDate('2024-01-01', 180, now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });
});

const fundingBase = {
  name: 'Example Doctoral Studentship',
  fundingType: 'FULLY_FUNDED',
  eligibility: 'Open to all nationalities',
  tuitionCoverage: 'Full tuition fees are covered for three years',
  stipendAmountMinor: 1_900_000,
  currency: 'GBP',
  closingDate: days(90),
  verificationStatus: 'VERIFIED_OFFICIAL',
  sourceUrl: 'https://example.ac.uk/funding/scheme',
};

describe('funding assessment', () => {
  it('does not call an unverified award fully funded', () => {
    const result = assessFunding({ ...fundingBase, verificationStatus: 'NOT_YET_VERIFIED' }, now);
    expect(result.canBeDescribedAsFullyFunded).toBe(false);
    expect(result.fundingType).toBe('PARTIALLY_FUNDED_OR_UNVERIFIED');
    expect(result.missingEvidence.join(' ')).toMatch(/not been verified/i);
  });

  it('accepts a fully funded claim only with official terms, tuition, stipend and an open deadline', () => {
    const result = assessFunding(fundingBase, now);
    expect(result.canBeDescribedAsFullyFunded).toBe(true);
    expect(result.isOpen).toBe(true);
    expect(result.stipendDisplay).toContain('£');
  });

  it('refuses a fully funded claim when the award has expired', () => {
    const result = assessFunding({ ...fundingBase, closingDate: days(-1) }, now);
    expect(result.canBeDescribedAsFullyFunded).toBe(false);
    expect(result.isExpired).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/expired/i);
  });

  it('refuses a fully funded claim without a published stipend', () => {
    const result = assessFunding({ ...fundingBase, stipendAmountMinor: null }, now);
    expect(result.canBeDescribedAsFullyFunded).toBe(false);
    expect(result.missingEvidence.join(' ')).toMatch(/stipend/i);
  });

  it('does not assume international eligibility', () => {
    const restricted = assessFunding({ ...fundingBase, eligibility: 'Home students only' }, now);
    expect(restricted.internationalEligibility).toBe('NOT_ELIGIBLE');
    const unstated = assessFunding({ ...fundingBase, eligibility: '' , nationalityRestrictions: '' }, now);
    expect(unstated.internationalEligibility).toBe('NEEDS_VERIFICATION');
  });

  it('summarises eligibility criteria conservatively', () => {
    expect(summariseEligibility([
      { criterion: 'NATIONALITY', value: 'UK only', applicantStatus: 'NOT_ELIGIBLE' },
      { criterion: 'DEGREE', value: '2:1', applicantStatus: 'ELIGIBLE' },
    ]).overall).toBe('NOT_ELIGIBLE');
    expect(summariseEligibility([
      { criterion: 'DEGREE', value: '2:1', applicantStatus: 'ELIGIBLE' },
      { criterion: 'RESIDENCY', value: '3 years UK', applicantStatus: 'UNKNOWN' },
    ]).overall).toBe('NEEDS_VERIFICATION');
  });
});
