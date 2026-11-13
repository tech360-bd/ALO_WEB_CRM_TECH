import { assessDeadline } from './deadlines';

export interface FundingOpportunityInput {
  name: string;
  fundingType: string;
  eligibility?: string;
  nationalityRestrictions?: string;
  subjectRestrictions?: string;
  tuitionCoverage?: string;
  stipendAmountMinor?: number | null;
  currency?: string;
  closingDate?: Date | string | null;
  closingTimezone?: string;
  verificationStatus: string;
  sourceUrl?: string | null;
  supervisorContactRequired?: boolean | null;
  separateAdmissionRequired?: boolean | null;
  notes?: string;
}

export interface FundingAssessment {
  canBeDescribedAsFullyFunded: boolean;
  fundingType: string;
  deadlineStatus: string;
  isExpired: boolean;
  isOpen: boolean;
  eligibilityVerified: boolean;
  internationalEligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_VERIFICATION';
  stipendDisplay: string;
  warnings: string[];
  missingEvidence: string[];
}

const FULL_TUITION_TERMS = /(full tuition|tuition fees (are )?(fully )?covered|all tuition|fees? (are )?(fully )?(paid|covered))/i;

export function assessFunding(opportunity: FundingOpportunityInput, now: Date = new Date()): FundingAssessment {
  const warnings: string[] = [];
  const missingEvidence: string[] = [];
  const deadline = assessDeadline(
    {
      dueDate: opportunity.closingDate ?? null,
      kind: 'FUNDING',
      verificationStatus: opportunity.verificationStatus,
      sourceUrl: opportunity.sourceUrl ?? null,
    },
    now,
  );

  const tuitionCoverage = opportunity.tuitionCoverage ?? '';
  const hasStipend = typeof opportunity.stipendAmountMinor === 'number' && opportunity.stipendAmountMinor > 0;
  const official = opportunity.verificationStatus === 'VERIFIED_OFFICIAL';
  const fullTerms = FULL_TUITION_TERMS.test(tuitionCoverage) || /full/i.test(tuitionCoverage);

  const canBeDescribedAsFullyFunded = official && opportunity.fundingType === 'FULLY_FUNDED' && fullTerms && hasStipend && !deadline.isExpired;
  if (opportunity.fundingType === 'FULLY_FUNDED' && !canBeDescribedAsFullyFunded) {
    missingEvidence.push('“Fully funded” is not supported by all of: official source, full tuition coverage, a published stipend, and an unexpired deadline.');
  }
  if (!official) {
    missingEvidence.push('The funding terms have not been verified from an official source.');
  }
  if (!hasStipend && opportunity.fundingType === 'FULLY_FUNDED') {
    missingEvidence.push('No stipend amount is published; a tuition-only award is not “fully funded” in the ordinary sense.');
  }
  if (deadline.isExpired) warnings.push('This opportunity has expired. It must not be presented as open.');
  if (deadline.needsVerification) warnings.push('The closing date needs verification before the opportunity can be treated as open.');

  const restrictions = `${opportunity.nationalityRestrictions ?? ''} ${opportunity.eligibility ?? ''}`.toLowerCase();
  let internationalEligibility: FundingAssessment['internationalEligibility'] = 'NEEDS_VERIFICATION';
  if (/no international|home( students)? only|uk (only|nationals)|domestic only/.test(restrictions)) {
    internationalEligibility = 'NOT_ELIGIBLE';
  } else if (/international (students )?(are )?(eligible|welcome)|open to (all )?(nationalities|international)/.test(restrictions) && official) {
    internationalEligibility = 'ELIGIBLE';
  }
  if (internationalEligibility === 'NEEDS_VERIFICATION') {
    missingEvidence.push('Eligibility of international applicants is not explicitly evidenced. Do not assume it.');
  }

  let stipendDisplay = 'Stipend not published';
  if (hasStipend) {
    stipendDisplay = `${(opportunity.stipendAmountMinor! / 100).toLocaleString('en-GB', { style: 'currency', currency: opportunity.currency || 'GBP' })} ${opportunity.currency || 'GBP'}`;
  }

  return {
    canBeDescribedAsFullyFunded,
    fundingType: canBeDescribedAsFullyFunded ? 'FULLY_FUNDED' : opportunity.fundingType === 'FULLY_FUNDED' ? 'PARTIALLY_FUNDED_OR_UNVERIFIED' : opportunity.fundingType,
    deadlineStatus: deadline.status,
    isExpired: deadline.isExpired,
    isOpen: deadline.isOpen,
    eligibilityVerified: official && internationalEligibility !== 'NEEDS_VERIFICATION',
    internationalEligibility,
    stipendDisplay,
    warnings,
    missingEvidence,
  };
}

export interface EligibilityCriterion {
  criterion: string;
  value: string;
  applicantStatus?: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'UNKNOWN';
}

export function summariseEligibility(criteria: EligibilityCriterion[]): {
  overall: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_VERIFICATION';
  blockers: string[];
  unknowns: string[];
} {
  const blockers = criteria
    .filter((criterion) => criterion.applicantStatus === 'NOT_ELIGIBLE')
    .map((criterion) => `${criterion.criterion}: ${criterion.value}`);
  const unknowns = criteria
    .filter((criterion) => !criterion.applicantStatus || criterion.applicantStatus === 'UNKNOWN' || criterion.applicantStatus === 'NEEDS_VERIFICATION')
    .map((criterion) => `${criterion.criterion}: ${criterion.value}`);
  if (blockers.length) return { overall: 'NOT_ELIGIBLE', blockers, unknowns };
  if (unknowns.length) return { overall: 'NEEDS_VERIFICATION', blockers, unknowns };
  return { overall: 'ELIGIBLE', blockers, unknowns };
}
