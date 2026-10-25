import { describe, expect, it } from 'vitest';
import { calculateCommission, normaliseQuoteText, validateQuoteAgainstPage } from '@/lib/phd/commission/calculation';

const fee = {
  amountMinor: 1_500_000, // £15,000
  currency: 'GBP',
  academicYear: '2026/27',
  studentStatus: 'INTERNATIONAL',
  sourceUrl: 'https://example.ac.uk/fees/2026-27',
  verificationStatus: 'VERIFIED_OFFICIAL',
};

const record = {
  commissionType: 'PERCENTAGE',
  percentageBasisPoints: 1000, // 10%
  basisGrossNet: 'GROSS',
  verificationStatus: 'VERIFIED_OFFICIAL',
  extractionStatus: 'EXTRACTED',
  exactWording: 'The University will pay the Agent 10% of gross tuition fees for each enrolled PhD student.',
  pageNumber: 4,
  reviewRequired: false,
  agreementStatus: 'ELIGIBLE_CONFIRMED',
  exclusions: '',
  eligibleCategory: '',
};

describe('commission calculation guards', () => {
  it('computes an exact percentage amount only when every input is evidenced', () => {
    const result = calculateCommission({ record, fee });
    expect(result.status).toBe('CALCULATED');
    expect(result.amountMinor).toBe(150_000);
    expect(result.currency).toBe('GBP');
    expect(result.formula).toContain('10.00% of the gross fee');
    expect(result.requiresManualVerification).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it('blocks calculation when the commission structure excludes the university', () => {
    const result = calculateCommission({ record: { ...record, agreementStatus: 'EXCLUDED_BY_SUPPLIED_STRUCTURE' }, fee });
    expect(result.status).toBe('BLOCKED');
    expect(result.amountMinor).toBeNull();
    expect(result.blockers.join(' ')).toMatch(/excludes this university/i);
  });

  it('reports an unconfirmed agreement as unconfirmed, never as payable', () => {
    const result = calculateCommission({ record: { ...record, agreementStatus: 'UNCONFIRMED' }, fee });
    expect(result.status).toBe('UNCONFIRMED');
    expect(result.amountMinor).toBeNull();
    expect(result.blockers.join(' ')).toMatch(/manual verification required/i);
  });

  it('requires a verified record with exact wording and page citation', () => {
    const result = calculateCommission({
      record: { ...record, verificationStatus: 'UNVERIFIED', exactWording: '', pageNumber: null },
      fee,
    });
    expect(result.amountMinor).toBeNull();
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/not been verified/i),
        expect.stringMatching(/exact source wording/i),
        expect.stringMatching(/page number/i),
      ]),
    );
  });

  it('refuses to compute a percentage when the gross/net basis is not stated', () => {
    const result = calculateCommission({ record: { ...record, basisGrossNet: 'NOT_STATED' }, fee });
    expect(result.amountMinor).toBeNull();
    expect(result.blockers.join(' ')).toMatch(/gross\/net basis is not stated/i);
  });

  it('refuses a percentage without a verified fee record', () => {
    const result = calculateCommission({ record, fee: null });
    expect(result.amountMinor).toBeNull();
    expect(result.blockers.join(' ')).toMatch(/no verified tuition-fee record/i);
  });

  it('refuses a net calculation whose net fee exceeds the gross fee', () => {
    const result = calculateCommission({ record: { ...record, basisGrossNet: 'NET' }, fee, netFeeMinor: fee.amountMinor + 1 });
    expect(result.amountMinor).toBeNull();
    expect(result.blockers.join(' ')).toMatch(/net fee cannot exceed the gross fee/i);
  });

  it('uses the supplied net fee when the basis is net', () => {
    const result = calculateCommission({ record: { ...record, basisGrossNet: 'NET' }, fee, netFeeMinor: 1_200_000 });
    expect(result.status).toBe('CALCULATED');
    expect(result.amountMinor).toBe(120_000);
  });

  it('adds a fixed amount and a percentage for a mixed agreement', () => {
    const result = calculateCommission({ record: { ...record, commissionType: 'MIXED', amountMinor: 25_000 }, fee });
    expect(result.status).toBe('CALCULATED');
    expect(result.amountMinor).toBe(175_000);
  });

  it('detects PhD exclusions in the recorded terms', () => {
    const result = calculateCommission({
      record: { ...record, exclusions: 'Commission is not payable for PhD or doctoral research degree enrolments.' },
      fee,
    });
    expect(result.amountMinor).toBeNull();
    expect(result.blockers.join(' ')).toMatch(/exclude PhD/i);
  });

  it('never affects academic scoring inputs (pure calculation module)', () => {
    const result = calculateCommission({ record, fee });
    const serialised = JSON.stringify(result);
    expect(serialised).not.toMatch(/fitScore|topicScore|qualityScore/i);
  });
});

describe('commission quote validation', () => {
  const page = `4.3 Commission\n\nThe University will pay the Agent 10% of gross tuition fees for each enrolled PhD student. Payment is due within 30 days of enrolment.`;

  it('accepts exact wording that appears on the cited page', () => {
    const result = validateQuoteAgainstPage(record.exactWording, page);
    expect(result.matches).toBe(true);
    expect(result.coverage).toBe(1);
  });

  it('rejects invented wording even when the topic is similar', () => {
    const result = validateQuoteAgainstPage(
      'The University will pay the Agent 25% of net tuition fees for every doctoral candidate.',
      page,
    );
    expect(result.matches).toBe(false);
    expect(result.reason).toMatch(/not found|do not rely/i);
  });

  it('normalises curly quotes and whitespace before comparing', () => {
    expect(normaliseQuoteText('“The  University”\nwill pay')).toBe("'the university' will pay");
    const result = validateQuoteAgainstPage(
      'The University will pay the Agent 10% of gross tuition fees',
      page.replace(/\s+/g, '\n'),
    );
    expect(result.matches).toBe(true);
  });

  it('rejects a quote too short to identify', () => {
    const result = validateQuoteAgainstPage('10% fee', page);
    expect(result.matches).toBe(false);
    expect(result.reason).toMatch(/too short/i);
  });

  it('reports honestly when the page has no extractable text', () => {
    const result = validateQuoteAgainstPage(record.exactWording, '');
    expect(result.matches).toBe(false);
    expect(result.reason).toMatch(/no extracted text/i);
  });
});
