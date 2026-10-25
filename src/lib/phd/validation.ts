import { z } from 'zod';
import {
  APPLICATION_STATUSES,
  COMMISSION_BASIS,
  COMMISSION_TYPES,
  DEADLINE_STATUSES,
  DISCIPLINES,
  DOCUMENT_TYPES,
  FUNDING_REQUIREMENTS,
  FUNDING_STATUSES,
  FUNDING_TYPES,
  METHOD_OPTIONS,
  OFFER_STATUSES,
  OUTREACH_STATUSES,
  PROPOSAL_STATUSES,
  SOURCE_AUTHORITIES,
  STUDY_MODES,
  SUPERVISOR_AVAILABILITY,
  VERIFICATION_STATUSES,
} from './constants';

/**
 * API input contracts. Every write route parses with these schemas so an
 * unexpected status value, oversized string or malformed date cannot reach the
 * database. Unknown keys are stripped, not persisted.
 */

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max = 20000) => z.string().max(max).optional().nullable();
const methodCodes = METHOD_OPTIONS.map((method) => method.code);
const isoDate = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const profileUpdateSchema = z.object({
  highestQualification: trimmed(120).optional(),
  degreeSubject: trimmed(160).optional(),
  awardingInstitution: trimmed(200).optional(),
  gradeAwarded: trimmed(80).optional(),
  gpa: trimmed(40).optional(),
  classification: trimmed(80).optional(),
  relevantModules: optionalText(4000),
  dissertationTitle: trimmed(400).optional(),
  methodsExperience: optionalText(4000),
  publications: optionalText(4000),
  researchExperience: optionalText(4000),
  employmentHistory: optionalText(6000),
  englishTestStatus: z.enum(['NOT_TAKEN', 'TAKEN', 'EXEMPT', 'UNKNOWN']).optional(),
  englishTestType: trimmed(80).optional(),
  englishTestScore: trimmed(40).optional(),
  englishTestDate: isoDate.optional().nullable(),
  primaryDiscipline: z.enum(DISCIPLINES).optional(),
  existingResearchIdea: optionalText(4000),
  preferredMethods: z.array(z.enum(methodCodes as [string, ...string[]])).max(6).optional(),
  researchSetting: optionalText(1000),
  studyMode: z.enum(STUDY_MODES).optional(),
  desiredStart: trimmed(80).optional(),
  locationPreferences: trimmed(500).optional(),
  fundingRequirement: z.enum(FUNDING_REQUIREMENTS).optional(),
  budgetRange: trimmed(200).optional(),
  equipmentNeeds: optionalText(2000),
  currentStage: z.enum([
    'TOPIC_DISCOVERY', 'PROPOSAL_DEVELOPMENT', 'SUPERVISOR_OUTREACH', 'APPLICATION_PREPARATION', 'OFFER_RECEIVED',
  ]).optional(),
  existingDocuments: optionalText(1000),
  preferredContact: z.enum(['EMAIL', 'PHONE', 'PORTAL']).optional(),
  personalDeadlines: optionalText(1000),
  subjects: z.array(trimmed(120)).max(20).optional(),
  targetUniversities: z.array(trimmed(120)).max(30).optional(),
  locations: z.array(trimmed(120)).max(20).optional(),
  privacyAccepted: z.boolean().optional(),
  onboardingStep: z.number().int().min(1).max(8).optional(),
});

export const topicGenerateSchema = z.object({
  projectId: z.string().min(1).max(64).optional(),
  discipline: z.enum(DISCIPLINES).optional(),
  selectedAreaCodes: z.array(trimmed(64)).max(24).optional(),
  maxCandidates: z.number().int().min(5).max(24).optional(),
  settingOverride: trimmed(160).optional(),
  methodOverride: z.enum(methodCodes as [string, ...string[]]).optional(),
  useAiEnrichment: z.boolean().optional(),
});

export const topicEvaluationSchema = z.object({
  weights: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
  overrides: z.array(z.object({
    criterion: z.enum([
      'academicFit', 'problemImportance', 'gapEvidence', 'feasibility', 'dataAccess',
      'doctoralContribution', 'supervisorAlignment', 'fundingResources', 'riskEthics', 'motivation',
    ]),
    score: z.number().int().min(0).max(5),
    explanation: trimmed(1000).min(5),
  })).max(10).optional(),
});

export const literatureSourceSchema = z.object({
  title: trimmed(500).min(3),
  authors: trimmed(1000).min(2),
  year: z.number().int().min(1900).max(new Date().getUTCFullYear() + 1).optional().nullable(),
  venue: trimmed(300).optional(),
  publisher: trimmed(300).optional(),
  doi: trimmed(200).optional().nullable(),
  url: z.string().url().max(2000).optional().nullable(),
  sourceType: z.enum([
    'JOURNAL_ARTICLE', 'BOOK', 'BOOK_CHAPTER', 'CONFERENCE_PAPER', 'THESIS', 'REPORT',
    'OFFICIAL_STATISTICS', 'PREPRINT', 'STANDARD', 'OTHER',
  ]).optional(),
  abstract: optionalText(8000),
  notes: optionalText(4000),
  researchQuestion: optionalText(2000),
  methods: optionalText(2000),
  findings: optionalText(4000),
  limitations: optionalText(2000),
  relevance: optionalText(2000),
  supportDirection: z.enum(['SUPPORTS', 'CONTRADICTS', 'MIXED', 'CONTEXT']).optional(),
  verificationStatus: z.enum(['NOT_YET_VERIFIED', 'VERIFIED_OFFICIAL', 'SECONDARY_SOURCE_ONLY']).optional(),
});

export const evidenceClaimSchema = z.object({
  claim: trimmed(2000).min(5),
  sourceId: z.string().max(64).optional().nullable(),
  supportType: z.enum(['VERIFIED_FACT', 'SOURCE_REPORTED', 'AI_SYNTHESIS', 'HYPOTHESIS', 'UNVERIFIED']).default('UNVERIFIED'),
  location: trimmed(300).optional(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  notes: optionalText(2000),
});

export const supervisorCreateSchema = z.object({
  universityId: z.string().min(1).max(64),
  schoolId: z.string().max(64).optional().nullable(),
  fullName: trimmed(200).min(2),
  roleTitle: trimmed(200).optional(),
  department: trimmed(300).optional(),
  profileUrl: z.string().url().max(500),
  researchInterests: trimmed(4000).min(10),
  methods: optionalText(2000),
  facilities: optionalText(1000),
  contactEmail: z.string().email().max(255).optional().nullable(),
  contactSourceUrl: z.string().url().max(500).optional().nullable(),
  availabilityStatus: z.enum(SUPERVISOR_AVAILABILITY).default('AVAILABILITY_UNCLEAR'),
  availabilityEvidence: optionalText(2000),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('NOT_YET_VERIFIED'),
  lastVerifiedAt: isoDate.optional().nullable(),
  publications: z.array(z.object({
    title: trimmed(500).min(3),
    year: z.number().int().min(1900).max(new Date().getUTCFullYear() + 1).optional().nullable(),
    venue: trimmed(300).optional(),
    doi: trimmed(200).optional().nullable(),
    url: z.string().url().max(500).optional().nullable(),
    verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  })).max(50).optional(),
  expertise: z.array(trimmed(100)).max(30).optional(),
  notes: optionalText(2000),
});

export const outreachDraftSchema = z.object({
  supervisorId: z.string().min(1).max(64),
  applications: z.array(trimmed(200)).max(10).optional(),
});

export const outreachUpdateSchema = z.object({
  status: z.enum(OUTREACH_STATUSES),
  notes: optionalText(2000),
  responseSummary: optionalText(2000),
  nextFollowUpAt: isoDate.optional().nullable(),
});

export const proposalCreateSchema = z.object({
  projectId: z.string().min(1).max(64),
  programmeId: z.string().max(64).optional().nullable(),
  topicId: z.string().max(64).optional().nullable(),
  title: trimmed(300).min(5),
});

export const proposalUpdateSchema = z.object({
  title: trimmed(300).min(5).optional(),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  sections: z.array(z.object({
    sectionKey: trimmed(64).min(1),
    content: z.string().max(60000),
    title: trimmed(300).optional(),
    sortOrder: z.number().int().min(0).max(50).optional(),
    required: z.boolean().optional(),
  })).max(30).optional(),
  changeSummary: trimmed(500).optional(),
  createVersion: z.boolean().optional(),
});

export const proposalExportSchema = z.object({
  format: z.enum(['docx', 'pdf']),
});

export const applicationCreateSchema = z.object({
  projectId: z.string().min(1).max(64),
  programmeId: z.string().min(1).max(64),
  topicId: z.string().max(64).optional().nullable(),
  proposalId: z.string().max(64).optional().nullable(),
  supervisorId: z.string().max(64).optional().nullable(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  notes: optionalText(2000),
});

export const applicationUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  fundingStatus: z.enum(FUNDING_STATUSES).optional(),
  offerStatus: z.enum(OFFER_STATUSES).optional(),
  submittedAt: isoDate.optional().nullable(),
  applicationReference: trimmed(100).optional(),
  interviewAt: isoDate.optional().nullable(),
  offerConditions: optionalText(2000),
  fundingDecision: optionalText(1000),
  nextAction: trimmed(300).optional(),
  nextActionDueAt: isoDate.optional().nullable(),
  notes: optionalText(4000),
});

export const applicationTaskSchema = z.object({
  title: trimmed(300).min(3),
  category: z.enum(['DOCUMENT', 'SUPERVISOR', 'FUNDING', 'PROPOSAL', 'SUBMISSION', 'INTERVIEW', 'OTHER']).optional(),
  dueAt: isoDate.optional().nullable(),
  status: z.enum(['OPEN', 'DONE', 'BLOCKED', 'CANCELLED']).optional(),
  notes: optionalText(2000),
});

export const documentUploadMetaSchema = z.object({
  projectId: z.string().min(1).max(64),
  documentType: z.enum(DOCUMENT_TYPES),
  applicationId: z.string().max(64).optional().nullable(),
  requirementId: z.string().max(64).optional().nullable(),
});

export const fundingCreateSchema = z.object({
  universityId: z.string().max(64).optional().nullable(),
  name: trimmed(300).min(3),
  department: trimmed(300).optional(),
  officialUrl: z.string().url().max(2000),
  fundingType: z.enum(FUNDING_TYPES).default('UNKNOWN'),
  eligibility: optionalText(4000),
  nationalityRestrictions: optionalText(1000),
  subjectRestrictions: optionalText(1000),
  tuitionCoverage: trimmed(300).optional(),
  stipendAmountMinor: z.number().int().min(0).max(100_000_000).optional().nullable(),
  currency: trimmed(8).optional(),
  duration: trimmed(120).optional(),
  applicationRequirements: optionalText(3000),
  closingDate: isoDate.optional().nullable(),
  closingTimezone: trimmed(64).optional(),
  separateAdmissionRequired: z.boolean().optional().nullable(),
  supervisorContactRequired: z.boolean().optional().nullable(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  notes: optionalText(2000),
});

export const deadlineCreateSchema = z.object({
  projectId: z.string().max(64).optional().nullable(),
  title: trimmed(300).min(3),
  kind: z.enum(['APPLICATION', 'FUNDING', 'DOCUMENT', 'INTERVIEW', 'PERSONAL']).optional(),
  dueDate: isoDate.optional().nullable(),
  timezone: trimmed(64).optional(),
  status: z.enum(DEADLINE_STATUSES).optional(),
  sourceUrl: z.string().url().max(2000).optional().nullable(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  reminderDays: z.number().int().min(1).max(180).optional(),
  notes: optionalText(2000),
});

export const commissionRecordSchema = z.object({
  documentId: z.string().max(64).optional().nullable(),
  universityId: z.string().max(64).optional().nullable(),
  universityNameRaw: trimmed(300).min(2),
  pageNumber: z.number().int().min(1).max(5000).optional().nullable(),
  exactWording: trimmed(8000).min(12),
  commissionType: z.enum(COMMISSION_TYPES).default('UNKNOWN'),
  amountMinor: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  percentageBasisPoints: z.number().int().min(0).max(1_000_000).optional().nullable(),
  basisGrossNet: z.enum(COMMISSION_BASIS).default('UNKNOWN'),
  eligibleCategory: optionalText(2000),
  exclusions: optionalText(3000),
  paymentMilestone: optionalText(2000),
  effectivePeriod: trimmed(200).optional(),
  clawbackTerms: optionalText(2000),
  conditions: z.array(z.object({
    category: z.enum(['EXCLUSION', 'PAYMENT', 'CLAWBACK', 'VERIFICATION', 'DEADLINE', 'AMOUNT_BASIS', 'ELIGIBILITY', 'OTHER']),
    condition: trimmed(2000).min(3),
    pageNumber: z.number().int().min(1).max(5000).optional().nullable(),
  })).max(30).optional(),
});

export const commissionReviewSchema = z.object({
  verificationStatus: z.enum(['CONFIRMED_UNVERIFIED', 'VERIFIED_OFFICIAL', 'CONFLICT', 'REJECTED']),
  notes: optionalText(2000),
});

export const commissionAgreementSchema = z.object({
  universityId: z.string().max(64).optional().nullable(),
  universityNameRaw: trimmed(300).min(2),
  phdCommissionStatus: z.enum([
    'ELIGIBLE_CONFIRMED', 'NOT_ELIGIBLE_CONFIRMED', 'EXCLUDED_BY_SUPPLIED_STRUCTURE', 'UNCONFIRMED',
  ]),
  sourcePage: z.number().int().min(1).max(5000).optional().nullable(),
  exactWording: optionalText(4000),
  reason: optionalText(2000),
  documentId: z.string().max(64).optional().nullable(),
  recordId: z.string().max(64).optional().nullable(),
});

export const verificationUpdateSchema = z.object({
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  notes: optionalText(2000),
  conflictNotes: optionalText(2000),
  nextVerificationAt: isoDate.optional().nullable(),
});

export const evidenceCreateSchema = z.object({
  entityType: z.enum(['UNIVERSITY', 'PROGRAMME', 'SUPERVISOR', 'FUNDING', 'FEE', 'DEADLINE', 'COMMISSION', 'LITERATURE']),
  entityId: z.string().min(1).max(64),
  fieldName: trimmed(80).optional(),
  claim: trimmed(2000).min(5),
  sourceUrl: z.string().url().max(2000).optional().nullable(),
  sourceAuthority: z.enum(SOURCE_AUTHORITIES).default('UNKNOWN'),
  excerpt: optionalText(4000),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('NOT_YET_VERIFIED'),
  universityId: z.string().max(64).optional().nullable(),
  nextVerificationAt: isoDate.optional().nullable(),
});

export const timelineRequestSchema = z.object({
  projectId: z.string().min(1).max(64),
  startDate: isoDate,
  mode: z.enum(['FULL_TIME', 'PART_TIME']),
  totalMonths: z.number().int().min(12).max(96).optional(),
  methodology: trimmed(80).optional(),
});

export const notificationUpdateSchema = z.object({
  read: z.boolean(),
});

export const jobRequestSchema = z.object({
  projectId: z.string().max(64).optional().nullable(),
  kind: z.enum([
    'TOPIC_DISCOVERY', 'LITERATURE_SYNTHESIS', 'UNIVERSITY_RESEARCH', 'SUPERVISOR_MATCH',
    'PROPOSAL_GENERATION', 'FUNDING_DISCOVERY', 'DEADLINE_MONITOR', 'COMMISSION_EXTRACTION',
    'CHECKLIST_GENERATION', 'SOURCE_VERIFICATION',
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

// ── Statement of purpose (SOP builder) ──────────────────────────────────────

export const sopCreateSchema = z.object({
  projectId: z.string().min(1).max(64),
  universityId: z.string().min(1).max(64).optional().nullable(),
  programmeId: z.string().min(1).max(64).optional().nullable(),
  title: trimmed(200).optional(),
  targetWords: z.number().int().min(300).max(5000).optional(),
  wordLimit: z.number().int().min(100).max(10_000).optional().nullable(),
  aiDisclosureRequired: z.boolean().optional().nullable(),
});

const personalFactsSchema = z.object({
  motivation: optionalText(4000),
  whyProgramme: optionalText(4000),
  whyUniversity: optionalText(4000),
  achievements: z.array(trimmed(300)).max(20).optional(),
  careerPlan: optionalText(4000),
  professionalContext: optionalText(4000),
  aiUse: optionalText(2000),
  reviewerNotes: optionalText(2000),
});

export const sopUpdateSchema = z.object({
  title: trimmed(200).min(3).optional(),
  targetWords: z.number().int().min(300).max(5000).optional(),
  wordLimit: z.number().int().min(100).max(10_000).optional().nullable(),
  aiDisclosureRequired: z.boolean().optional().nullable(),
  personalFacts: personalFactsSchema.optional(),
  notes: optionalText(4000),
});

export const sopSectionsSchema = z.object({
  sections: z
    .array(
      z.object({
        sectionKey: z.string().min(2).max(60),
        content: z.string().max(20_000),
      }),
    )
    .min(1)
    .max(12),
  changeSummary: optionalText(300),
});

export const sopStatusSchema = z.object({
  status: z.enum(['DRAFT', 'STUDENT_REVIEWED', 'FINAL_APPROVED', 'REQUIREMENTS_VERIFIED']),
  comments: optionalText(2000),
});

export const sopRestoreSchema = z.object({ versionId: z.string().min(1).max(64) });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type TopicGenerateInput = z.infer<typeof topicGenerateSchema>;
export type LiteratureSourceInput = z.infer<typeof literatureSourceSchema>;
export type SupervisorCreateInput = z.infer<typeof supervisorCreateSchema>;
export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>;
export type CommissionRecordInput = z.infer<typeof commissionRecordSchema>;
