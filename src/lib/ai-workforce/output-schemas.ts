/**
 * ALO AI Workforce — structured output contracts (§22).
 *
 * Model output is never trusted. Every structured AI result is parsed against
 * one of these Zod contracts before it can reach business logic, a tool, or the
 * database. Invalid output is rejected and the gateway falls back; it is never
 * silently coerced.
 */
import { z } from 'zod';

const confidence = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const leadQualificationSchema = z.object({
  tier: z.enum(['HOT', 'WARM', 'COLD', 'UNQUALIFIED']),
  score: z.number().int().min(0).max(100),
  intent: z.enum(['STUDY_ABROAD', 'ENGLISH_TEST', 'INFORMATION_ONLY', 'SPAM', 'UNKNOWN']),
  missingFields: z.array(z.string().min(1).max(60)).max(30),
  rationale: z.array(z.string().min(1).max(240)).min(1).max(12),
  recommendedAction: z.enum(['CALL_NOW', 'SCHEDULE_FOLLOW_UP', 'REQUEST_INFORMATION', 'NURTURE', 'DISQUALIFY']),
  confidence,
});
export type LeadQualification = z.infer<typeof leadQualificationSchema>;

export const profileAnalysisSchema = z.object({
  completeness: z.number().int().min(0).max(100),
  missingFields: z.array(z.string().min(1).max(60)).max(40),
  strengths: z.array(z.string().min(1).max(240)).max(12),
  risks: z.array(z.string().min(1).max(240)).max(12),
  summary: z.string().min(1).max(2000),
  counselorBriefing: z.array(z.string().min(1).max(240)).max(12),
  confidence,
});
export type ProfileAnalysis = z.infer<typeof profileAnalysisSchema>;

export const courseMatchSchema = z.object({
  matches: z
    .array(
      z.object({
        courseId: z.string().min(1).max(191),
        courseTitle: z.string().min(1).max(300),
        universityName: z.string().max(300).default(''),
        country: z.string().max(120).default(''),
        score: z.number().min(0).max(100),
        eligible: z.boolean(),
        blockers: z.array(z.string().min(1).max(240)).max(10),
        reasons: z.array(z.string().min(1).max(240)).max(10),
      })
    )
    .max(50),
  evaluated: z.number().int().min(0),
  constraints: z.array(z.string().min(1).max(240)).max(20),
  confidence,
});
export type CourseMatch = z.infer<typeof courseMatchSchema>;

export const scholarshipMatchSchema = z.object({
  matches: z
    .array(
      z.object({
        scholarshipId: z.string().min(1).max(191),
        name: z.string().min(1).max(300),
        provider: z.string().max(300).default(''),
        amount: z.number().min(0).default(0),
        currency: z.string().max(12).default(''),
        eligible: z.boolean(),
        deadline: z.string().max(120).default(''),
        deadlineStatus: z.enum(['OPEN', 'CLOSING_SOON', 'EXPIRED', 'UNKNOWN']),
        blockers: z.array(z.string().min(1).max(240)).max(10),
      })
    )
    .max(50),
  evaluated: z.number().int().min(0),
  confidence,
});
export type ScholarshipMatch = z.infer<typeof scholarshipMatchSchema>;

export const checklistSchema = z.object({
  items: z
    .array(
      z.object({
        key: z.string().min(1).max(80),
        label: z.string().min(1).max(200),
        status: z.enum(['MISSING', 'PENDING_REVIEW', 'PROVIDED', 'REJECTED', 'NOT_REQUIRED']),
        required: z.boolean(),
        note: z.string().max(400).default(''),
      })
    )
    .min(1)
    .max(60),
  missingCount: z.number().int().min(0),
  readiness: z.number().int().min(0).max(100),
  nextActions: z.array(z.string().min(1).max(240)).max(20),
  escalate: z.boolean(),
  confidence,
});
export type Checklist = z.infer<typeof checklistSchema>;

export const crmCleanupSchema = z.object({
  issues: z
    .array(
      z.object({
        entity: z.string().min(1).max(80),
        entityId: z.string().min(1).max(191),
        issue: z.string().min(1).max(240),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        proposedFix: z.string().min(1).max(240),
      })
    )
    .max(200),
  scanned: z.number().int().min(0),
  summary: z.string().min(1).max(2000),
  confidence,
});
export type CrmCleanup = z.infer<typeof crmCleanupSchema>;

export const contentDraftSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  metaTitle: z.string().min(1).max(200),
  metaDescription: z.string().min(1).max(320),
  body: z.string().min(50),
  outline: z.array(z.string().min(1).max(200)).min(1).max(30),
  keywords: z.array(z.string().min(1).max(80)).max(30),
  seoScore: z.number().int().min(0).max(100),
  seoIssues: z.array(z.string().min(1).max(240)).max(30),
  sources: z.array(z.string().min(1).max(500)).max(30),
  confidence,
});
export type ContentDraft = z.infer<typeof contentDraftSchema>;

export const qaValidationSchema = z.object({
  passed: z.boolean(),
  missingFields: z.array(z.string().min(1).max(80)).max(40),
  contradictions: z.array(z.string().min(1).max(240)).max(30),
  unsafeFlags: z.array(z.string().min(1).max(120)).max(30),
  score: z.number().int().min(0).max(100),
  confidence,
});
export type QaValidation = z.infer<typeof qaValidationSchema>;

export const reportSummarySchema = z.object({
  title: z.string().min(1).max(200),
  period: z.string().min(1).max(120),
  metrics: z.array(z.object({ label: z.string().min(1).max(120), value: z.number(), unit: z.string().max(24).default('') })).max(60),
  highlights: z.array(z.string().min(1).max(240)).max(20),
  concerns: z.array(z.string().min(1).max(240)).max(20),
  confidence,
});
export type ReportSummary = z.infer<typeof reportSummarySchema>;

export const universityResearchSchema = z.object({
  universities: z
    .array(
      z.object({
        universityId: z.string().min(1).max(191),
        name: z.string().min(1).max(300),
        country: z.string().max(120).default(''),
        ranking: z.number().int().min(0).default(0),
        ieltsMin: z.number().min(0).default(0),
        sourceUrl: z.string().max(500).default(''),
        lastVerifiedAt: z.string().max(80).default(''),
        verificationStatus: z.string().max(80).default(''),
      })
    )
    .max(50),
  evaluated: z.number().int().min(0),
  citations: z.array(z.string().min(1).max(500)).max(60),
  confidence,
});
export type UniversityResearch = z.infer<typeof universityResearchSchema>;

export const OUTPUT_SCHEMAS = {
  'lead.qualification': leadQualificationSchema,
  'profile.analysis': profileAnalysisSchema,
  'course.match': courseMatchSchema,
  'scholarship.match': scholarshipMatchSchema,
  'checklist': checklistSchema,
  'crm.cleanup': crmCleanupSchema,
  'content.draft': contentDraftSchema,
  'qa.validation': qaValidationSchema,
  'report.summary': reportSummarySchema,
  'university.research': universityResearchSchema,
} as const;

export type OutputSchemaKey = keyof typeof OUTPUT_SCHEMAS;

export function getOutputSchema(key: string): z.ZodTypeAny | undefined {
  return (OUTPUT_SCHEMAS as Record<string, z.ZodTypeAny>)[key];
}
