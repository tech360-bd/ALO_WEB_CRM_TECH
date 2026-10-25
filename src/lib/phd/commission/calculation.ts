/**
 * Commission arithmetic with hard guards.
 *
 * Business rule (non-negotiable): commission data is a separate operations
 * dataset. It must never influence academic matching, topic scores or proposal
 * quality. And a payable amount is only calculated when the eligibility,
 * source, basis and fee inputs are all demonstrably present.
 */

export type CommissionBasis = 'GROSS' | 'NET' | 'NOT_STATED' | 'UNKNOWN';
export type CommissionType = 'FIXED' | 'PERCENTAGE' | 'MIXED' | 'UNKNOWN';

export interface CommissionRecordInput {
  commissionType: CommissionType | string;
  amountMinor?: number | null;
  percentageBasisPoints?: number | null;
  basisGrossNet: CommissionBasis | string;
  exclusions?: string;
  eligibleCategory?: string;
  verificationStatus?: string;
  extractionStatus?: string;
  exactWording?: string;
  pageNumber?: number | null;
  reviewRequired?: boolean;
  agreementStatus?: string;
}

export interface VerifiedFeeInput {
  amountMinor: number;
  currency: string;
  academicYear: string;
  studentStatus: string;
  sourceUrl: string;
  verificationStatus: string;
}

export interface CommissionCalculation {
  status: 'CALCULATED' | 'BLOCKED' | 'UNCONFIRMED';
  amountMinor: number | null;
  currency: string | null;
  formula: string | null;
  blockers: string[];
  warnings: string[];
  requiresManualVerification: true;
}

const PHD_EXCLUSION = /\b(phd|doctor|doctoral|research degree)\b[^.]{0,120}\b(not|no|excluded|excl|ineligible)\b|\b(not|no|excluded|ineligible)\b[^.]{0,60}\b(phd|doctor|doctoral|research degree)\b/i;

export function calculateCommission(input: {
  record: CommissionRecordInput;
  fee?: VerifiedFeeInput | null;
  netFeeMinor?: number | null;
}): CommissionCalculation {
  const { record, fee, netFeeMinor } = input;
  const blockers: string[] = [];
  const warnings: string[] = [];

  const agreementEligible = record.agreementStatus === 'ELIGIBLE_CONFIRMED';
  // Only a negative eligibility decision is a hard block. An unconfirmed
  // agreement is reported as "unconfirmed — manual verification required".
  const definitivelyIneligible = record.agreementStatus === 'NOT_ELIGIBLE_CONFIRMED'
    || record.agreementStatus === 'EXCLUDED_BY_SUPPLIED_STRUCTURE';
  if (!agreementEligible) {
    blockers.push(
      record.agreementStatus === 'NOT_ELIGIBLE_CONFIRMED'
        ? 'The agreement record confirms that this university’s PhD is not commissionable.'
        : record.agreementStatus === 'EXCLUDED_BY_SUPPLIED_STRUCTURE'
          ? 'The commission structure excludes this university; do not calculate a payable amount.'
          : 'Commission eligibility is unconfirmed — manual verification required.',
    );
  }

  const verifiedRecord = record.verificationStatus === 'VERIFIED_OFFICIAL' || record.verificationStatus === 'CONFIRMED';
  if (!verifiedRecord) blockers.push('The commission record itself has not been verified against a cited source page.');
  if (record.reviewRequired) blockers.push('The commission record still requires human review.');
  if (!record.exactWording?.trim()) blockers.push('No exact source wording is recorded.');
  if (!record.pageNumber) blockers.push('No source page number is cited.');
  if (record.extractionStatus === 'CONFLICT') blockers.push('Conflicting commission terms have been recorded; resolve the conflict before calculating.');

  if (record.commissionType === 'UNKNOWN') blockers.push('The commission type (fixed or percentage) is unknown.');
  if (record.basisGrossNet === 'UNKNOWN' || record.basisGrossNet === 'NOT_STATED') {
    blockers.push('The gross/net basis is not stated, so a payable amount cannot be computed.');
  }
  if (PHD_EXCLUSION.test(`${record.exclusions ?? ''} ${record.eligibleCategory ?? ''}`)) {
    blockers.push('The recorded exclusions appear to exclude PhD/doctoral enrolments.');
  }

  if (record.commissionType === 'FIXED' || record.commissionType === 'MIXED') {
    if (typeof record.amountMinor !== 'number' || record.amountMinor <= 0) {
      blockers.push('A fixed commission is indicated but no positive amount is recorded.');
    }
  }

  const needsPercentage = record.commissionType === 'PERCENTAGE' || record.commissionType === 'MIXED';
  if (needsPercentage && (typeof record.percentageBasisPoints !== 'number' || record.percentageBasisPoints <= 0)) {
    blockers.push('A percentage commission is indicated but no percentage is recorded.');
  }

  if (needsPercentage) {
    if (!fee) {
      blockers.push('No verified tuition-fee record is linked, so a percentage cannot be applied.');
    } else {
      if (fee.verificationStatus !== 'VERIFIED_OFFICIAL') blockers.push('The tuition-fee record is not verified from an official source.');
      if (!fee.sourceUrl) blockers.push('The tuition-fee record has no source URL.');
      if (!fee.academicYear) blockers.push('The fee academic year is missing.');
      if (record.basisGrossNet === 'NET') {
        if (typeof netFeeMinor !== 'number' || netFeeMinor <= 0) {
          blockers.push('A net basis is stated, but the net fee after deductions is not provided.');
        } else if (netFeeMinor > fee.amountMinor) {
          blockers.push('The net fee cannot exceed the gross fee.');
        }
      }
    }
  }

  if (blockers.length) {
    return {
      status: definitivelyIneligible ? 'BLOCKED' : 'UNCONFIRMED',
      amountMinor: null,
      currency: fee?.currency ?? null,
      formula: null,
      blockers,
      warnings,
      requiresManualVerification: true,
    };
  }

  let amountMinor = 0;
  const parts: string[] = [];

  if (record.commissionType === 'FIXED' || record.commissionType === 'MIXED') {
    amountMinor += record.amountMinor ?? 0;
    parts.push(`fixed £${((record.amountMinor ?? 0) / 100).toFixed(2)}`);
  }

  if (needsPercentage && fee) {
    const basisAmount = record.basisGrossNet === 'NET' ? (netFeeMinor ?? 0) : fee.amountMinor;
    const percentageAmount = Math.round((basisAmount * (record.percentageBasisPoints ?? 0)) / 10000);
    amountMinor += percentageAmount;
    parts.push(
      `${((record.percentageBasisPoints ?? 0) / 100).toFixed(2)}% of the ${String(record.basisGrossNet).toLowerCase()} fee (${(basisAmount / 100).toFixed(2)} ${fee.currency})`,
    );
  }

  warnings.push('Calculated amount is provisional until authorised review against the source document.');
  return {
    status: 'CALCULATED',
    amountMinor,
    currency: fee?.currency ?? 'GBP',
    formula: `£${(amountMinor / 100).toFixed(2)} = ${parts.join(' + ')}`,
    blockers,
    warnings,
    requiresManualVerification: true,
  };
}

export function normaliseQuoteText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9£%.,;:()\-'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A commission record may only cite a page whose extracted text contains the
 * quoted wording. This is the safeguard against invented clauses and page
 * numbers.
 */
export function validateQuoteAgainstPage(quote: string, pageText: string): {
  matches: boolean;
  coverage: number;
  reason: string;
} {
  const normalisedQuote = normaliseQuoteText(quote);
  const normalisedPage = normaliseQuoteText(pageText);
  if (normalisedQuote.length < 12) {
    return { matches: false, coverage: 0, reason: 'Quote is too short to verify.' };
  }
  if (!normalisedPage) {
    return { matches: false, coverage: 0, reason: 'The cited page has no extracted text.' };
  }
  if (normalisedPage.includes(normalisedQuote)) {
    return { matches: true, coverage: 1, reason: 'Exact quoted wording found on the cited page.' };
  }
  // Tolerant check for PDF line breaks/hyphenation: compute word coverage in order.
  const quoteWords = normalisedQuote.split(' ').filter(Boolean);
  const pageWords = new Set(normalisedPage.split(' ').filter(Boolean));
  const found = quoteWords.filter((word) => pageWords.has(word)).length;
  const coverage = quoteWords.length ? found / quoteWords.length : 0;
  return {
    matches: false,
    coverage,
    reason:
      coverage >= 0.9
        ? 'Most words appear on the page but the exact wording was not matched. Check line breaks and edit the quote to the exact source wording.'
        : 'Quoted wording was not found on the cited page. Do not rely on this record.',
  };
}

export function formatMinorUnits(amountMinor: number | null | undefined, currency = 'GBP'): string | null {
  if (typeof amountMinor !== 'number') return null;
  return (amountMinor / 100).toLocaleString('en-GB', { style: 'currency', currency });
}
