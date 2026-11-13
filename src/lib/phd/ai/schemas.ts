import { z } from 'zod';

/**
 * Output contracts for AI-assisted jobs. Every model response is parsed with one
 * of these schemas before it touches the database. A response that does not fit
 * is rejected — it is never partially applied.
 *
 * These schemas deliberately contain no fields for "verified" status, evidence
 * tier or citation identifiers: the model cannot mint verification.
 */

export const topicDraftSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(20).max(220),
        plainLanguage: z.string().min(40).max(1200),
        problem: z.string().min(40).max(2000),
        provisionalGap: z.string().min(40).max(2000),
        mainQuestion: z.string().min(20).max(400),
        supportingQuestions: z.array(z.string().min(10).max(400)).min(2).max(6),
        aim: z.string().min(20).max(600),
        objectives: z
          .array(z.object({ text: z.string().min(15).max(400), measure: z.string().min(10).max(400) }))
          .min(2)
          .max(6),
        theoryFramework: z.string().min(10).max(800),
        methodology: z.string().min(20).max(1200),
        dataNeeds: z.string().min(10).max(800),
        feasibilityRisks: z.string().min(10).max(800),
        ethics: z.string().min(10).max(800),
        scholarlyContribution: z.string().min(20).max(800),
        practicalContribution: z.string().min(20).max(800),
        uncertainty: z.array(z.string().min(5).max(300)).min(1).max(6),
      }),
    )
    .min(1)
    .max(12),
});

export type TopicDraftResponse = z.infer<typeof topicDraftSchema>;

export const sectionDraftSchema = z.object({
  sectionKey: z.string().min(1).max(60),
  draft: z.string().min(80).max(20000),
  /** Claims the draft relies on, each tied to a provided evidence id or marked unresolved. */
  evidenceUsed: z
    .array(
      z.object({
        claim: z.string().min(10).max(600),
        evidenceId: z.string().max(64).nullable(),
        label: z.enum(['SOURCE_REPORTED', 'AI_SYNTHESIS', 'HYPOTHESIS']),
      }),
    )
    .max(30),
  unresolvedGaps: z.array(z.string().min(5).max(400)).max(10),
  wordCount: z.number().int().min(0).max(50000),
});

export type SectionDraftResponse = z.infer<typeof sectionDraftSchema>;

export const critiqueSchema = z.object({
  strengths: z.array(z.string().min(5).max(400)).max(10),
  risks: z.array(z.string().min(5).max(400)).max(10),
  missingEvidence: z.array(z.string().min(5).max(400)).max(10),
  checks: z
    .array(
      z.object({
        id: z.string().min(3).max(60),
        verdict: z.enum(['PASS', 'WARN', 'FAIL', 'NOT_APPLICABLE']),
        note: z.string().min(5).max(500),
      }),
    )
    .max(20),
});

export type CritiqueResponse = z.infer<typeof critiqueSchema>;

export const verificationSuggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        field: z.string().min(2).max(60),
        question: z.string().min(10).max(400),
        officialSourceHint: z.string().max(300).nullable(),
      }),
    )
    .max(15),
});

export type VerificationSuggestionResponse = z.infer<typeof verificationSuggestionSchema>;
