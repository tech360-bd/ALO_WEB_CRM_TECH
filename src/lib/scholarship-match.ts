/**
 * Scholarship matching — /ai/scholarship-match
 *
 * Deterministic scoring over verified scholarship records. Kept pure and free of
 * I/O so the rules can be unit-tested, and deliberately conservative: a
 * scholarship only scores on criteria it actually publishes. Nothing here
 * estimates a chance of award.
 */

export interface ScholarshipRecord {
  id: string;
  slug: string;
  name: string;
  country: string;
  university: string;
  fundingAmount: string;
  fundingType: string;
  studyLevel: string;
  subject: string;
  eligibility: string;
  courseEligibility: string;
  academicRequirements: string;
  englishRequirements: string;
  nationalityRequirements: string;
  deadline: string;
  deadlineDate: string | Date | null;
  officialSourceUrl: string;
  officialSourceName: string;
  verificationStatus: string;
  lastVerifiedAt: string | Date | null;
}

export interface ScholarshipProfile {
  studyLevel?: string;
  subject?: string;
  countries?: string[];
  fundingType?: string;
  nationality?: string;
  gpa?: number | null;
  englishScore?: number | null;
}

export type CriterionState = 'matched' | 'not_matched' | 'unknown';

export interface Criterion {
  label: string;
  state: CriterionState;
  /** What the scholarship publishes for this criterion, verbatim. */
  published?: string;
  /** What the student declared, verbatim. */
  declared?: string;
  note?: string;
}

export interface ScholarshipMatch {
  scholarship: ScholarshipRecord;
  matchScore: number;
  criteria: Criterion[];
  concerns: string[];
  openForApplications: boolean | null;
}

/** Weights sum to 100. Criteria the scholarship does not publish are skipped. */
const WEIGHTS = {
  country: 25,
  studyLevel: 20,
  subject: 20,
  fundingType: 15,
  nationality: 10,
  deadline: 10,
} as const;

const FUNDING_ALIASES: Record<string, string[]> = {
  full: ['full_funding', 'full funding', 'fully funded', 'full'],
  partial: ['partial', 'tuition_waiver', 'tuition waiver', 'partial funding'],
  stipend: ['living_stipend', 'living stipend', 'stipend'],
};

export function scoreScholarship(
  scholarship: ScholarshipRecord,
  profile: ScholarshipProfile,
  now: Date = new Date(),
): ScholarshipMatch {
  const criteria: Criterion[] = [];
  const concerns: string[] = [];
  let earned = 0;
  let possible = 0;

  /**
   * Records a criterion and folds it into the score.
   *
   * An `unknown` criterion — one the provider does not publish — is displayed
   * but deliberately excluded from BOTH sides of the ratio. Treating it as met
   * would inflate scores for awards with thin records; treating it as unmet
   * would punish them for a documentation gap rather than for the student's
   * profile. Excluding it keeps the score honest.
   */
  const award = (weight: number, criterion: Criterion) => {
    criteria.push(criterion);
    if (criterion.state === 'unknown') return;
    possible += weight;
    if (criterion.state === 'matched') earned += weight;
  };

  // Country
  if (profile.countries && profile.countries.length > 0) {
    const published = scholarship.country?.trim();
    if (!published) {
      award(WEIGHTS.country, { label: 'Country', state: 'unknown', note: 'No country published for this scholarship.' });
    } else {
      const publishedKey = normalise(published);
      const matched = profile.countries.some((country) => {
        const key = normalise(country);
        return key.length > 0 && (publishedKey.includes(key) || key.includes(publishedKey));
      });
      award(WEIGHTS.country, {
        label: 'Country',
        state: matched ? 'matched' : 'not_matched',
        published,
        declared: profile.countries.join(', '),
      });
      if (!matched) concerns.push(`This scholarship is published for ${published}, not your selected destination.`);
    }
  }

  // Study level
  if (profile.studyLevel) {
    const published = [scholarship.studyLevel, scholarship.eligibility].filter(Boolean).join(' ').trim();
    if (!published) {
      award(WEIGHTS.studyLevel, { label: 'Study level', state: 'unknown', note: 'No study level published.' });
    } else {
      const matched = matchesLevel(published, profile.studyLevel);
      award(WEIGHTS.studyLevel, {
        label: 'Study level',
        state: matched ? 'matched' : 'not_matched',
        published: scholarship.studyLevel || 'See eligibility text',
        declared: profile.studyLevel,
      });
      if (!matched) concerns.push(`Published eligibility does not mention ${profile.studyLevel} study.`);
    }
  }

  // Subject
  if (profile.subject) {
    const published = [scholarship.subject, scholarship.courseEligibility].filter(Boolean).join(' ').trim();
    if (!published) {
      award(WEIGHTS.subject, {
        label: 'Subject',
        state: 'unknown',
        note: 'No subject restriction published — treated as open to all fields, but confirm with the provider.',
      });
    } else {
      const matched = published.toLowerCase().includes(profile.subject.toLowerCase());
      award(WEIGHTS.subject, { label: 'Subject', state: matched ? 'matched' : 'not_matched', published, declared: profile.subject });
      if (!matched) concerns.push(`Subject restriction published ("${truncate(published, 90)}") does not mention ${profile.subject}.`);
    }
  }

  // Funding type
  if (profile.fundingType) {
    const published = scholarship.fundingType?.trim();
    if (!published) {
      award(WEIGHTS.fundingType, { label: 'Funding type', state: 'unknown', note: 'No funding type published.' });
    } else {
      const matched = matchesFunding(published, profile.fundingType);
      award(WEIGHTS.fundingType, {
        label: 'Funding type',
        state: matched ? 'matched' : 'not_matched',
        published,
        declared: profile.fundingType,
      });
    }
  }

  // Nationality
  if (profile.nationality) {
    const published = scholarship.nationalityRequirements?.trim();
    if (!published) {
      award(WEIGHTS.nationality, { label: 'Nationality', state: 'unknown', note: 'No nationality restriction published.' });
    } else {
      const matched = published.toLowerCase().includes(profile.nationality.toLowerCase());
      award(WEIGHTS.nationality, {
        label: 'Nationality',
        state: matched ? 'matched' : 'not_matched',
        published,
        declared: profile.nationality,
      });
      if (!matched) concerns.push(`Nationality requirement published ("${truncate(published, 90)}") does not list ${profile.nationality}.`);
    }
  }

  // Deadline — always evaluated so closed awards never outrank open ones.
  const deadlineState = deadlineStateFor(scholarship, now);
  award(WEIGHTS.deadline, {
    label: 'Deadline',
    state: deadlineState.open === null ? 'unknown' : deadlineState.open ? 'matched' : 'not_matched',
    published: scholarship.deadline || (deadlineState.open === null ? 'No deadline published' : undefined),
    note: deadlineState.open === false ? 'Application window has closed.' : undefined,
  });
  if (deadlineState.open === false) concerns.push('The published deadline has passed.');

  const matchScore = possible > 0 ? Math.round((earned / possible) * 100) : 0;

  const verificationStatus = String(scholarship.verificationStatus || '').trim().toLowerCase();
  if (verificationStatus && verificationStatus !== 'verified' && verificationStatus !== 'verified_recent') {
    concerns.push(`Verification status is "${scholarship.verificationStatus}" — confirm details with the provider before applying.`);
  }

  return {
    scholarship,
    matchScore,
    criteria,
    concerns,
    openForApplications: deadlineState.open,
  };
}

export function rankScholarships(
  scholarships: ScholarshipRecord[],
  profile: ScholarshipProfile,
  now: Date = new Date(),
): ScholarshipMatch[] {
  return scholarships
    .map((scholarship) => scoreScholarship(scholarship, profile, now))
    .sort((a, b) => {
      // Open awards first, then by score, then by name for a stable order.
      const openA = a.openForApplications === true ? 0 : a.openForApplications === null ? 1 : 2;
      const openB = b.openForApplications === true ? 0 : b.openForApplications === null ? 1 : 2;
      if (openA !== openB) return openA - openB;
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.scholarship.name.localeCompare(b.scholarship.name);
    });
}

function deadlineStateFor(scholarship: ScholarshipRecord, now: Date): { open: boolean | null } {
  const raw = scholarship.deadlineDate;
  if (!raw) return { open: null };
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return { open: null };
  return { open: date.getTime() >= now.getTime() };
}

function matchesLevel(published: string, level: string): boolean {
  const haystack = published.toLowerCase();
  const needle = level.toLowerCase();
  if (haystack.includes(needle)) return true;
  const aliases: Record<string, string[]> = {
    undergraduate: ['bachelor', 'undergraduate', 'bachelors'],
    postgraduate: ['master', 'postgraduate', 'masters', 'mba', 'phd', 'doctoral'],
    masters: ['master', 'postgraduate', 'msc', 'ma ', 'mba'],
    phd: ['phd', 'doctoral', 'doctorate'],
    foundation: ['foundation', 'pathway', 'pre-sessional', 'pre masters'],
  };
  return (aliases[needle] ?? []).some((alias) => haystack.includes(alias));
}

function matchesFunding(published: string, preference: string): boolean {
  const haystack = published.toLowerCase();
  if (haystack.includes(preference.toLowerCase())) return true;
  return (FUNDING_ALIASES[preference.toLowerCase()] ?? []).some((alias) => haystack.includes(alias));
}

/** Lower-cases and strips separators so "united-kingdom" matches "United Kingdom". */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
