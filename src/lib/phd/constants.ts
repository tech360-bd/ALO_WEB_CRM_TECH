/**
 * UK PhD Proposal Builder — shared vocabulary.
 *
 * All persisted status values are plain strings (existing project convention)
 * and every write path validates against these unions. Keeping one source of
 * truth prevents the UI, API and database from drifting apart and lets the
 * verification workflow show an explicit, finite status vocabulary.
 */

export const PHD_ROLES = [
  'APPLICANT',
  'RESEARCH_ADVISER',
  'DATA_VERIFIER',
  'ADMINISTRATOR',
] as const;
export type PhdRole = (typeof PHD_ROLES)[number];

export const PHD_PERMISSIONS = {
  ADMIN: 'phd.admin',
  VERIFY: 'phd.verify',
  ADVISER: 'phd.adviser',
  EXPORT: 'phd.export',
} as const;

/**
 * Verification vocabulary required by the specification. `NOT_FOUND` must never
 * be silently converted into `CONFIRMED_UNAVAILABLE`: a programme that was not
 * located is *not* a programme that has been proved not to exist.
 */
export const VERIFICATION_STATUSES = [
  'VERIFIED_OFFICIAL',
  'VERIFIED_MAY_BE_OUTDATED',
  'SECONDARY_SOURCE_ONLY',
  'NOT_YET_VERIFIED',
  'SOURCE_UNAVAILABLE',
  'PROGRAMME_NOT_FOUND',
  'CONFIRMED_UNAVAILABLE',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  VERIFIED_OFFICIAL: 'Verified from official source',
  VERIFIED_MAY_BE_OUTDATED: 'Verified but may be outdated',
  SECONDARY_SOURCE_ONLY: 'Secondary source only',
  NOT_YET_VERIFIED: 'Not yet verified',
  SOURCE_UNAVAILABLE: 'Source unavailable',
  PROGRAMME_NOT_FOUND: 'Programme not found',
  CONFIRMED_UNAVAILABLE: 'Confirmed unavailable',
};

export const VERIFICATION_EXPLANATIONS: Record<VerificationStatus, string> = {
  VERIFIED_OFFICIAL:
    'The specific claim was read on the institution’s own domain on the date recorded. This does not verify any other fact about the institution.',
  VERIFIED_MAY_BE_OUTDATED:
    'The claim was once verified but the retrieval or review is old enough that it may no longer reflect the current offer.',
  SECONDARY_SOURCE_ONLY:
    'A non-official source supports the claim. It is not sufficient for deadlines, fees or formal requirements.',
  NOT_YET_VERIFIED: 'No adequate source has been recorded for this specific claim yet.',
  SOURCE_UNAVAILABLE: 'The page or document could not be retrieved. The claim remains unknown.',
  PROGRAMME_NOT_FOUND:
    'The programme was not located in the sources searched. This is not proof that it does not exist.',
  CONFIRMED_UNAVAILABLE:
    'An authoritative source explicitly states that the offer is unavailable (for example a closure notice).',
};

export const SOURCE_AUTHORITIES = [
  'OFFICIAL_PRIMARY',
  'OFFICIAL_SECONDARY',
  'PEER_REVIEWED',
  'SCHOLARLY_INDEX',
  'GOVERNMENT',
  'INDUSTRY',
  'SECONDARY',
  'UNKNOWN',
] as const;
export type SourceAuthority = (typeof SOURCE_AUTHORITIES)[number];

export const SUPERVISOR_AVAILABILITY = [
  'ACCEPTING_STUDENTS',
  'POTENTIAL_RESEARCH_FIT',
  'AVAILABILITY_UNCLEAR',
  'NOT_ACCEPTING',
  'FORMERLY_AFFILIATED',
] as const;
export type SupervisorAvailability = (typeof SUPERVISOR_AVAILABILITY)[number];

export const SUPERVISOR_AVAILABILITY_LABELS: Record<SupervisorAvailability, string> = {
  ACCEPTING_STUDENTS: 'Accepting students — explicitly confirmed',
  POTENTIAL_RESEARCH_FIT: 'Potential research fit — availability not confirmed',
  AVAILABILITY_UNCLEAR: 'Availability unclear',
  NOT_ACCEPTING: 'Not accepting — supported by current evidence',
  FORMERLY_AFFILIATED: 'Formerly affiliated — current affiliation needs verification',
};

export const TOPIC_EVALUATION_CRITERIA = [
  {
    key: 'academicFit',
    label: 'Fit with academic background',
    description: 'How well the applicant’s qualification, subject and methods experience support this topic.',
  },
  {
    key: 'problemImportance',
    label: 'Importance and clarity of the problem',
    description: 'Whether the practical or theoretical problem is specific, consequential and clearly stated.',
  },
  {
    key: 'gapEvidence',
    label: 'Evidence for the research gap',
    description: 'Whether a documented search supports the claimed gap. Unverified gaps score low.',
  },
  {
    key: 'feasibility',
    label: 'Feasibility within available time',
    description: 'Whether the scope, access and analysis can credibly be completed in doctoral time.',
  },
  {
    key: 'dataAccess',
    label: 'Access to data, facilities or participants',
    description: 'Strength of evidence that the required data, equipment, software or participants can be accessed.',
  },
  {
    key: 'doctoralContribution',
    label: 'Suitability for a doctoral contribution',
    description: 'Whether the work supports an original, examinable contribution rather than a consultancy report.',
  },
  {
    key: 'supervisorAlignment',
    label: 'Alignment with verified supervisor expertise',
    description: 'Only verified supervisor records count. An absence of verified expertise scores zero.',
  },
  {
    key: 'fundingResources',
    label: 'Funding and resource considerations',
    description: 'Whether plausible funding routes and resource requirements have been identified and checked.',
  },
  {
    key: 'riskEthics',
    label: 'Ethical and technical risks',
    description: 'Higher scores mean risks are lower and mitigations are specific and credible.',
  },
  {
    key: 'motivation',
    label: 'Applicant motivation',
    description: 'Consistency between the topic and the applicant’s stated interests and career objectives.',
  },
] as const;

export type TopicCriterionKey = (typeof TOPIC_EVALUATION_CRITERIA)[number]['key'];

export const DEFAULT_TOPIC_WEIGHTS: Record<TopicCriterionKey, number> = {
  academicFit: 4,
  problemImportance: 4,
  gapEvidence: 5,
  feasibility: 4,
  dataAccess: 3,
  doctoralContribution: 5,
  supervisorAlignment: 3,
  fundingResources: 2,
  riskEthics: 2,
  motivation: 3,
};

export const BUSINESS_AREAS = [
  'BUS-AI-TRANSFORMATION',
  'BUS-DIGITAL-MODELS',
  'BUS-ACCOUNTING-GOVERNANCE',
  'BUS-FINANCE-FINTECH',
  'BUS-MARKETING-CONSUMER',
  'BUS-HRM-WELLBEING',
  'BUS-ENTREPRENEURSHIP-SME',
  'BUS-INTERNATIONAL-MANAGEMENT',
  'BUS-SUPPLY-CHAIN',
  'BUS-ESG-SUSTAINABILITY',
  'BUS-ANALYTICS-DECISION',
  'BUS-INNOVATION-PRODUCTIVITY',
] as const;

export const ENGINEERING_AREAS = [
  'ENG-RENEWABLE-ENERGY',
  'ENG-ELECTRICAL-POWER',
  'ENG-CIVIL-STRUCTURAL',
  'ENG-MECHANICAL-MANUFACTURING',
  'ENG-MATERIALS-CORROSION',
  'ENG-ROBOTICS-CONTROL',
  'ENG-CHEMICAL-PROCESS',
  'ENG-WATER-CLIMATE',
  'ENG-COMPUTATIONAL-MODELLING',
  'ENG-AI-ENGINEERING',
  'ENG-INDUSTRIAL-OPTIMISATION',
  'ENG-SUSTAINABLE-CIRCULAR',
] as const;

export const METHOD_OPTIONS = [
  { code: 'INTERVIEWS_THEMATIC', label: 'Interviews and thematic analysis', discipline: 'BOTH' },
  { code: 'SURVEY_STATISTICS', label: 'Surveys and statistical analysis', discipline: 'BOTH' },
  { code: 'CASE_STUDY', label: 'Case studies', discipline: 'BOTH' },
  { code: 'ARCHIVAL_SECONDARY', label: 'Archival and secondary-data analysis', discipline: 'BOTH' },
  { code: 'ECONOMETRICS', label: 'Econometric analysis', discipline: 'BUSINESS' },
  { code: 'EXPERIMENT_BEHAVIOURAL', label: 'Experiments and behavioural research', discipline: 'BOTH' },
  { code: 'MIXED_METHODS', label: 'Mixed-methods designs', discipline: 'BOTH' },
  { code: 'DESIGN_SCIENCE', label: 'Design science and business analytics', discipline: 'BUSINESS' },
  { code: 'LONGITUDINAL_COMPARATIVE', label: 'Comparative or longitudinal studies', discipline: 'BOTH' },
  { code: 'LAB_EXPERIMENT', label: 'Laboratory experiments', discipline: 'ENGINEERING' },
  { code: 'PROTOTYPE_VALIDATION', label: 'Prototype design and validation', discipline: 'ENGINEERING' },
  { code: 'NUMERICAL_SIMULATION', label: 'Numerical modelling and simulation', discipline: 'ENGINEERING' },
  { code: 'FEA_CFD', label: 'Computational or finite-element analysis', discipline: 'ENGINEERING' },
  { code: 'FIELD_MEASUREMENT', label: 'Field measurements', discipline: 'ENGINEERING' },
  { code: 'MATERIALS_CHARACTERISATION', label: 'Materials characterisation', discipline: 'ENGINEERING' },
  { code: 'CONTROL_SYSTEM', label: 'Control-system development', discipline: 'ENGINEERING' },
  { code: 'BENCHMARKING', label: 'Benchmarking and performance testing', discipline: 'ENGINEERING' },
  { code: 'RELIABILITY_OPTIMISATION', label: 'Reliability, optimisation or life-cycle analysis', discipline: 'ENGINEERING' },
  { code: 'MIXED_COMPUTATIONAL_EXPERIMENTAL', label: 'Mixed computational and experimental methods', discipline: 'ENGINEERING' },
] as const;

export const STUDY_MODES = ['FULL_TIME', 'PART_TIME', 'UNDECIDED'] as const;
export const DISCIPLINES = ['BUSINESS', 'ENGINEERING', 'BOTH', 'UNDECIDED'] as const;
export const FUNDING_REQUIREMENTS = ['REQUIRED', 'PREFERRED', 'SELF_FUNDED', 'UNDECIDED'] as const;

export const FUNDING_TYPES = [
  'FULLY_FUNDED',
  'PARTIALLY_FUNDED',
  'STIPEND',
  'TUITION_WAIVER',
  'OTHER',
  'UNKNOWN',
] as const;

export const PROPOSAL_STATUSES = ['DRAFT', 'IN_REVIEW', 'READY_FOR_REVIEW', 'SUBMITTED', 'ARCHIVED'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const APPLICATION_STATUSES = [
  'RESEARCHING',
  'TOPIC_SELECTED',
  'SUPERVISOR_IDENTIFIED',
  'SUPERVISOR_CONTACTED',
  'AWAITING_RESPONSE',
  'PROPOSAL_IN_PROGRESS',
  'DOCUMENTS_IN_PROGRESS',
  'READY_TO_SUBMIT',
  'SUBMITTED',
  'INTERVIEW',
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
  'REJECTED',
  'WITHDRAWN',
  'FUNDING_PENDING',
  'FUNDING_AWARDED',
  'CLOSED',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  RESEARCHING: 'Researching',
  TOPIC_SELECTED: 'Topic selected',
  SUPERVISOR_IDENTIFIED: 'Supervisor identified',
  SUPERVISOR_CONTACTED: 'Supervisor contacted',
  AWAITING_RESPONSE: 'Awaiting response',
  PROPOSAL_IN_PROGRESS: 'Proposal in progress',
  DOCUMENTS_IN_PROGRESS: 'Documents in progress',
  READY_TO_SUBMIT: 'Ready to submit',
  SUBMITTED: 'Submitted',
  INTERVIEW: 'Interview',
  CONDITIONAL_OFFER: 'Conditional offer',
  UNCONDITIONAL_OFFER: 'Unconditional offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  FUNDING_PENDING: 'Funding pending',
  FUNDING_AWARDED: 'Funding awarded',
  CLOSED: 'Closed',
};

export const FUNDING_STATUSES = [
  'NOT_STARTED',
  'RESEARCHING',
  'PREPARING',
  'SUBMITTED',
  'PENDING',
  'AWARDED',
  'REJECTED',
  'WITHDRAWN',
] as const;
export const OFFER_STATUSES = ['NONE', 'CONDITIONAL', 'UNCONDITIONAL', 'REJECTED', 'WITHDRAWN'] as const;
export const OUTREACH_STATUSES = [
  'DRAFTED',
  'REVIEWED',
  'SENT',
  'REPLIED',
  'FOLLOW_UP_DUE',
  'INTERESTED',
  'UNAVAILABLE',
  'CLOSED',
] as const;
export const DEADLINE_STATUSES = [
  'UPCOMING',
  'CLOSING_SOON',
  'EXPIRED',
  'DATE_NOT_PUBLISHED',
  'NEEDS_VERIFICATION',
] as const;

export const DOCUMENT_TYPES = [
  'ACADEMIC_CV',
  'RESEARCH_PROPOSAL',
  'PERSONAL_STATEMENT',
  'DEGREE_CERTIFICATE',
  'ACADEMIC_TRANSCRIPT',
  'ENGLISH_EVIDENCE',
  'ACADEMIC_REFERENCE',
  'PROFESSIONAL_REFERENCE',
  'PASSPORT_ID',
  'WRITING_SAMPLE',
  'PORTFOLIO',
  'ETHICS_DATA_ACCESS',
  'FUNDING_DOCUMENT',
  'PROGRAMME_SPECIFIC',
  'OTHER',
] as const;

export const PROPOSAL_SECTIONS = [
  { key: 'title', title: 'Working title', guidance: 'A precise, searchable working title. State that it may change.' },
  { key: 'abstract', title: 'Abstract or executive summary', guidance: 'Problem, gap, aim, method and contribution in plain language.' },
  { key: 'background', title: 'Background and context', guidance: 'Establish the field using verified sources, not assertion.' },
  { key: 'problem', title: 'Problem statement', guidance: 'A specific, consequential problem. Distinguish evidence from inference.' },
  { key: 'rationale', title: 'Research rationale and significance', guidance: 'Why this matters now, to whom, and what is missing.' },
  { key: 'literature', title: 'Preliminary literature review', guidance: 'Synthesise rather than list. Cite only sources you have checked.' },
  { key: 'gap', title: 'Research gap and justification', guidance: 'Describe the documented search that supports the gap; label it provisional until verified.' },
  { key: 'aim', title: 'Aim and objectives', guidance: 'One aim, measurable objectives.' },
  { key: 'questions', title: 'Research questions or hypotheses', guidance: 'Questions must be answerable with the proposed design.' },
  { key: 'framework', title: 'Conceptual, theoretical or technical framework', guidance: 'Explain why the framework fits the question.' },
  { key: 'methodology', title: 'Research design and methodology', guidance: 'Justify the design and explain alternatives considered.' },
  { key: 'data', title: 'Data sources, participants, equipment or experimental setup', guidance: 'Specific sources, access routes, facilities and fallbacks.' },
  { key: 'analysis', title: 'Data analysis plan', guidance: 'Techniques, assumptions, software and validation.' },
  { key: 'ethics', title: 'Ethics, safety, privacy and data management', guidance: 'Approvals, consent, storage, retention and risk controls.' },
  { key: 'feasibility', title: 'Feasibility and risk mitigation', guidance: 'Time, access, technical and ethical risks with mitigations.' },
  { key: 'contribution', title: 'Expected original contribution', guidance: 'State the theoretical, methodological or empirical contribution precisely.' },
  { key: 'implications', title: 'Potential practical, industrial or policy implications', guidance: 'Reasonable implications, not overclaims.' },
  { key: 'timetable', title: 'Project timetable', guidance: 'Milestones consistent with the programme duration.' },
  { key: 'bibliography', title: 'Preliminary bibliography', guidance: 'Only verified sources. Incomplete entries are flagged.' },
  { key: 'appendices', title: 'Appendices', guidance: 'Only where the programme permits or requires them.' },
] as const;

export type ProposalSectionKey = (typeof PROPOSAL_SECTIONS)[number]['key'];

export const COMMISSION_TYPES = ['FIXED', 'PERCENTAGE', 'MIXED', 'UNKNOWN'] as const;
export const COMMISSION_BASIS = ['GROSS', 'NET', 'NOT_STATED', 'UNKNOWN'] as const;
export const COMMISSION_STATUSES = [
  'ELIGIBLE_CONFIRMED',
  'NOT_ELIGIBLE_CONFIRMED',
  'EXCLUDED_BY_SUPPLIED_STRUCTURE',
  'UNCONFIRMED',
] as const;

export const REGENT_UNIVERSITY_LONDON = 'Regents University London';

/** Safe upper bounds for uploaded material. */
export const UPLOAD_LIMITS = {
  maxBytes: 15 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
  ],
  allowedExtensions: ['pdf', 'docx', 'xlsx', 'txt', 'csv', 'png', 'jpg', 'jpeg'],
} as const;

export const PHD_ROUTE_PREFIX = '/phd';
