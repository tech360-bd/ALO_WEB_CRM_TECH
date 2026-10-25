import { SUPERVISOR_AVAILABILITY, type SupervisorAvailability } from '../constants';

/**
 * Supervisor fit scoring.
 *
 * Rules encoded here:
 *  - A published profile or a relevant paper does NOT imply availability.
 *  - Fit is never presented as agreement to supervise.
 *  - Missing evidence is surfaced, not smoothed over.
 *  - Nobody is ranked "best" on title, institution prestige or publication count.
 */

export interface SupervisorMatchInput {
  supervisor: {
    id: string;
    fullName: string;
    roleTitle: string;
    department: string;
    universityName: string;
    researchInterests: string;
    methods: string;
    expertise: string[];
    publications: Array<{ title: string; venue?: string | null; year?: number | null; verificationStatus?: string }>;
    availabilityStatus: SupervisorAvailability | string;
    verificationStatus: string;
    profileUrl: string;
    contactEmail?: string | null;
    lastVerifiedAt?: Date | string | null;
  };
  topic: {
    title: string;
    mainQuestion: string;
    keywords: string[];
    methodology: string;
    theoryFramework: string;
  };
}

export interface SupervisorMatchResult {
  supervisorId: string;
  fitScore: number;
  fitLabel: 'LOW' | 'MEDIUM' | 'HIGH';
  keywordAlignment: number;
  methodAlignment: number;
  publicationAlignment: number;
  disciplineAlignment: number;
  matchedKeywords: string[];
  unmatchedKeywords: string[];
  rationale: string;
  mismatches: string[];
  missingEvidence: string[];
  availabilityAtMatch: string;
  isAvailabilityConfirmed: boolean;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'their', 'about', 'using', 'study',
  'research', 'phd', 'university', 'school', 'department', 'business', 'management', 'engineering',
  'a', 'an', 'of', 'in', 'on', 'to', 'as', 'by', 'at', 'or', 'is', 'are', 'be', 'we', 'our',
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function overlapRatio(topicTokens: string[], corpus: Set<string>): { ratio: number; matched: string[] } {
  const unique = [...new Set(topicTokens)];
  if (unique.length === 0) return { ratio: 0, matched: [] };
  const matched = unique.filter((token) => corpus.has(token));
  return { ratio: matched.length / unique.length, matched };
}

const METHOD_SYNONYMS: Record<string, string[]> = {
  INTERVIEWS_THEMATIC: ['interview', 'qualitative', 'thematic', 'ethnograph', 'narrative'],
  SURVEY_STATISTICS: ['survey', 'quantitative', 'statistical', 'regression', 'psychometric'],
  CASE_STUDY: ['case study', 'case-study', 'longitudinal', 'comparative'],
  ARCHIVAL_SECONDARY: ['archival', 'secondary data', 'panel data', 'documentary'],
  ECONOMETRICS: ['econometric', 'causal', 'instrumental', 'panel', 'regression'],
  EXPERIMENT_BEHAVIOURAL: ['experiment', 'behavioural', 'behavioral', 'randomised', 'randomized'],
  MIXED_METHODS: ['mixed method', 'mixed-method', 'qualitative and quantitative'],
  DESIGN_SCIENCE: ['design science', 'artefact', 'artifact', 'design-based'],
  LONGITUDINAL_COMPARATIVE: ['longitudinal', 'comparative', 'panel'],
  LAB_EXPERIMENT: ['laboratory', 'experimental', 'test bench', 'test-bench'],
  PROTOTYPE_VALIDATION: ['prototype', 'validation', 'demonstrator'],
  NUMERICAL_SIMULATION: ['simulation', 'numerical', 'modelling', 'modeling'],
  FEA_CFD: ['finite element', 'cfd', 'computational fluid'],
  FIELD_MEASUREMENT: ['field measurement', 'fieldwork', 'field work', 'monitoring'],
  MATERIALS_CHARACTERISATION: ['characterisation', 'characterization', 'microscopy', 'spectroscopy'],
  CONTROL_SYSTEM: ['control', 'automation', 'robotic'],
  BENCHMARKING: ['benchmark', 'performance testing'],
  RELIABILITY_OPTIMISATION: ['reliability', 'optimisation', 'optimization', 'maintenance'],
  MIXED_COMPUTATIONAL_EXPERIMENTAL: ['experimental and computational', 'simulation and experiment'],
};

export function matchSupervisor(input: SupervisorMatchInput): SupervisorMatchResult {
  const { supervisor, topic } = input;
  const topicTokens = [
    ...topic.keywords,
    ...tokens(topic.title),
    ...tokens(topic.mainQuestion).slice(0, 12),
  ].map((token) => token.toLowerCase());

  const interestCorpus = new Set([
    ...tokens(supervisor.researchInterests),
    ...tokens(supervisor.expertise.join(' ')),
    ...tokens(supervisor.department),
  ]);
  const interest = overlapRatio(topicTokens, interestCorpus);

  const publicationCorpus = new Set(
    supervisor.publications.flatMap((publication) => tokens(`${publication.title} ${publication.venue ?? ''}`)),
  );
  const publication = overlapRatio(topicTokens, publicationCorpus);

  const methodTerms = METHOD_SYNONYMS[topic.methodology] ?? [topic.methodology.toLowerCase()];
  const methodText = `${supervisor.methods} ${supervisor.researchInterests} ${supervisor.publications.map((p) => p.title).join(' ')}`.toLowerCase();
  const methodHits = methodTerms.filter((term) => methodText.includes(term));
  const methodRatio = methodTerms.length ? methodHits.length / methodTerms.length : 0;

  const deptTokens = tokens(`${supervisor.department} ${supervisor.roleTitle}`);
  const disciplineCorpus = new Set([...deptTokens, ...tokens(supervisor.universityName)]);
  const topicTopicTokens = new Set(tokens(`${topic.title} ${topic.theoryFramework}`));
  let disciplineHits = 0;
  for (const token of deptTokens) if (topicTopicTokens.has(token)) disciplineHits += 1;
  const disciplineRatio = deptTokens.length ? Math.min(1, disciplineHits / 2) : 0;

  const keywordAlignment = Math.round(interest.ratio * 100);
  const publicationAlignment = Math.round(publication.ratio * 100);
  const methodAlignment = Math.round(methodRatio * 100);
  const disciplineAlignment = Math.round(disciplineRatio * 100);

  const fitScore = Math.round(
    keywordAlignment * 0.4 + publicationAlignment * 0.25 + methodAlignment * 0.2 + disciplineAlignment * 0.15,
  );
  const fitLabel = fitScore >= 70 ? 'HIGH' : fitScore >= 45 ? 'MEDIUM' : 'LOW';

  const matchedKeywords = [...new Set(interest.matched)].slice(0, 10);
  const unmatchedKeywords = [...new Set(topic.keywords.map((keyword) => keyword.toLowerCase()))]
    .filter((keyword) => !interestCorpus.has(keyword) && !matchedKeywords.includes(keyword))
    .slice(0, 8);

  const missingEvidence: string[] = [];
  if (supervisor.verificationStatus !== 'VERIFIED_OFFICIAL') {
    missingEvidence.push('The supervisor profile has not been verified from the official university domain.');
  }
  if (!supervisor.publications.length) {
    missingEvidence.push('No publications are recorded, so publication alignment is zero rather than assumed.');
  }
  if (supervisor.availabilityStatus !== 'ACCEPTING_STUDENTS') {
    missingEvidence.push('Supervision availability has not been explicitly confirmed.');
  }
  if (!supervisor.methods.trim()) {
    missingEvidence.push('The supervisor’s methods expertise is not evidenced.');
  }
  if (!supervisor.contactEmail) {
    missingEvidence.push('No officially published email address is recorded. Do not guess an address.');
  }

  const mismatches: string[] = [];
  if (unmatchedKeywords.length) {
    mismatches.push(`Topic keywords not found in the recorded profile: ${unmatchedKeywords.join(', ')}.`);
  }
  if (methodAlignment === 0) {
    mismatches.push('No evidence that the supervisor uses the proposed methodology.');
  }
  if (publicationAlignment < 20) {
    mismatches.push('Recent publications do not lexically overlap with the proposed topic; check manually before contacting.');
  }

  const availability = (SUPERVISOR_AVAILABILITY as readonly string[]).includes(supervisor.availabilityStatus)
    ? supervisor.availabilityStatus
    : 'AVAILABILITY_UNCLEAR';
  const isAvailabilityConfirmed = availability === 'ACCEPTING_STUDENTS';

  const rationaleParts = [
    `Fit is computed from recorded evidence only (profile interests, methods and publications).`,
    matchedKeywords.length
      ? `Recorded expertise overlaps on: ${matchedKeywords.slice(0, 6).join(', ')}.`
      : 'No substantive lexical overlap was found in the supervisor’s recorded expertise.',
    publicationAlignment > 0
      ? `Publication titles overlap on ${publicationAlignment}% of topic terms.`
      : 'No publication overlap was found.',
    `Availability status at match time: ${availability.replaceAll('_', ' ').toLowerCase()}.`,
    isAvailabilityConfirmed
      ? 'Acceptance is still not inferred: only a direct reply can confirm supervision.'
      : 'This is a research-fit signal only; the supervisor has not agreed to supervise.',
  ];

  return {
    supervisorId: supervisor.id,
    fitScore,
    fitLabel,
    keywordAlignment,
    methodAlignment,
    publicationAlignment,
    disciplineAlignment,
    matchedKeywords,
    unmatchedKeywords,
    rationale: rationaleParts.join(' '),
    mismatches,
    missingEvidence,
    availabilityAtMatch: availability,
    isAvailabilityConfirmed,
  };
}

export interface OutreachEmailInput {
  applicantName: string;
  applicantBackground: string;
  universityName: string;
  programmeName?: string;
  supervisorName: string;
  topicTitle: string;
  mainQuestion: string;
  methodologyLabel: string;
  /** Only publications already verified in the evidence library should be passed. */
  verifiedPublications?: Array<{ title: string; year?: number | null }>;
  attachments?: string[];
  applicantEmail?: string;
}

export interface OutreachEmailDraft {
  subject: string;
  body: string;
  warnings: string[];
  attachments: string[];
}

/**
 * Builds a supervisor-contact draft. It never claims the applicant has read a
 * paper, never invents a publication, and always requires explicit review
 * before sending. Nothing here sends email.
 */
export function buildOutreachEmail(input: OutreachEmailInput): OutreachEmailDraft {
  const warnings: string[] = [
    'Draft only. Review every factual statement and add your own words before sending.',
    'Do not send until you have checked the supervisor’s current profile and availability.',
    'This system does not send email automatically and does not mass-contact supervisors.',
  ];
  if (!input.verifiedPublications?.length) {
    warnings.push('No verified publication is cited. Do not claim to have read work you have not checked.');
  }
  const publicationLine = input.verifiedPublications?.length
    ? `Your recorded work on “${input.verifiedPublications[0].title}”${input.verifiedPublications[0].year ? ` (${input.verifiedPublications[0].year})` : ''} appears relevant to this question. I would be grateful for your view on whether the direction is well framed.`
    : 'I have not cited a specific paper here because I have not yet verified one in your record; I would welcome a pointer to your most relevant recent work.';

  const attachments = input.attachments?.length
    ? input.attachments
    : ['Research proposal draft (PDF)', 'Academic CV (PDF)', 'Academic transcript'];

  const body = `Dear ${input.supervisorName},

I am ${input.applicantName || '[your name]'}, and I am preparing an application for doctoral research${input.programmeName ? ` on the ${input.programmeName}` : ''} at ${input.universityName}.

Background: ${input.applicantBackground || '[add your highest qualification, subject and relevant research experience]'}

Proposed research: “${input.topicTitle}”. The central question is: ${input.mainQuestion} I propose to address it using ${input.methodologyLabel.toLowerCase()}, with the design and resource requirements set out in the attached proposal.

${publicationLine}

Could you tell me whether this area falls within your current supervision interests, and whether you are considering new doctoral students for the intake I am targeting? If the fit is not right, I would be grateful for advice on a more appropriate colleague or research group.

I have attached ${attachments.join(', ')}. I am happy to provide anything else that would help.

With thanks for your time and consideration,

${input.applicantName || '[your name]'}
${input.applicantEmail ?? ''}

---
Draft generated from saved project data. No email has been sent.`;

  return {
    subject: `Prospective PhD applicant: ${input.topicTitle}${input.programmeName ? ` (${input.programmeName})` : ''}`,
    body,
    warnings,
    attachments,
  };
}
