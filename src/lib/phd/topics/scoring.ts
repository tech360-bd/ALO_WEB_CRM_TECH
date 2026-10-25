import {
  DEFAULT_TOPIC_WEIGHTS,
  TOPIC_EVALUATION_CRITERIA,
  type TopicCriterionKey,
} from '../constants';

/**
 * Transparent, explainable topic scoring.
 *
 * The engine never hides uncertainty in a single number: it returns criterion
 * scores, a written reason for each score, explicit missing evidence, and a
 * completeness indicator. A topic with no verified supervisor or literature
 * evidence cannot score highly on those criteria, regardless of how persuasive
 * its prose is.
 */

export interface ScoringEvidenceContext {
  profileCompleteness: number; // 0..1
  degreeSubject?: string;
  preferredMethods?: string;
  existingResearchIdea?: string;
  researchSetting?: string;
  fundingRequirement?: string;
  verifiedLiteratureCount: number;
  totalLiteratureCount: number;
  /** True only when the gap section has been reviewed against a documented search. */
  gapVerified: boolean;
  verifiedSupervisorMatches: number;
  verifiedSupervisorRecords: number;
  verifiedProgrammeCount: number;
  dataAccessConfirmed: boolean;
  requiresLabOrFieldwork: boolean;
  ethicsPlanPresent: boolean;
  fundingRouteVerified: boolean;
}

export interface TopicScoringInput {
  title: string;
  keywords: string[];
  methodology: string;
  theoryFramework: string;
  ethics: string;
  dataNeeds: string;
  areaDiscipline: 'BUSINESS' | 'ENGINEERING';
  profile?: {
    degreeSubject?: string;
    relevantModules?: string;
    methodsExperience?: string;
    preferredMethods?: string;
    existingResearchIdea?: string;
    researchSetting?: string;
    fundingRequirement?: string;
  };
  context: ScoringEvidenceContext;
}

export interface CriterionScore {
  criterion: TopicCriterionKey;
  label: string;
  score: number; // 0..5
  weight: number;
  weightedPoints: number;
  explanation: string;
  missingEvidence: string[];
}

export interface TopicScoreResult {
  criteria: CriterionScore[];
  overall: number; // 0..100 weighted
  label: 'Fragile' | 'Developing' | 'Credible draft' | 'Strong draft';
  completeness: number; // 0..1
  uncertaintyNotes: string[];
  disclaimer: string;
}

const METHOD_RESOURCE_INTENSITY: Record<string, { score: number; note: string }> = {
  LAB_EXPERIMENT: { score: 2, note: 'Requires laboratory access, safety approval and equipment time.' },
  MATERIALS_CHARACTERISATION: { score: 2, note: 'Requires specialist characterisation facilities and trained operators.' },
  FIELD_MEASUREMENT: { score: 3, note: 'Requires site access, seasonal coverage and field safety arrangements.' },
  PROTOTYPE_VALIDATION: { score: 2, note: 'Requires build time, parts, instrumentation and repeated testing.' },
  NUMERICAL_SIMULATION: { score: 3, note: 'Requires validated models and sufficient compute.' },
  FEA_CFD: { score: 3, note: 'Requires HPC or licensed solvers and validation data.' },
  INTERVIEWS_THEMATIC: { score: 4, note: 'Requires recruitment, consent, transcription and reflexive analysis.' },
  SURVEY_STATISTICS: { score: 4, note: 'Requires a representative sample and adequate response rate.' },
  ARCHIVAL_SECONDARY: { score: 4, note: 'Requires lawful access to the archive or licensed dataset.' },
  ECONOMETRICS: { score: 3, note: 'Requires a dataset capable of supporting causal identification.' },
  CASE_STUDY: { score: 4, note: 'Requires organisational access and case-boundary justification.' },
  MIXED_METHODS: { score: 3, note: 'Requires integration of two designs and additional researcher capacity.' },
  EXPERIMENT_BEHAVIOURAL: { score: 3, note: 'Requires ethics approval, participant recruitment and careful manipulation checks.' },
  DESIGN_SCIENCE: { score: 4, note: 'Requires a real problem owner and evaluated artefact.' },
};

function clamp(value: number): number {
  return Math.max(0, Math.min(5, Math.round(value)));
}

function keywordOverlap(source: string, keywords: string[]): number {
  const hay = source.toLowerCase();
  if (!hay.trim() || keywords.length === 0) return 0;
  const hits = keywords.filter((keyword) => hay.includes(keyword.toLowerCase())).length;
  return hits / keywords.length;
}

export function scoreTopic(
  input: TopicScoringInput,
  weights: Partial<Record<TopicCriterionKey, number>> = {},
): TopicScoreResult {
  const ctx = input.context;
  const effectiveWeights = { ...DEFAULT_TOPIC_WEIGHTS, ...weights };
  const missing = (items: string[]) => items.filter(Boolean);
  const criteria: CriterionScore[] = [];

  const add = (
    criterion: TopicCriterionKey,
    score: number,
    explanation: string,
    gaps: string[] = [],
  ) => {
    const weight = Math.max(1, Math.min(5, effectiveWeights[criterion] ?? 1));
    criteria.push({
      criterion,
      label: TOPIC_EVALUATION_CRITERIA.find((item) => item.key === criterion)?.label ?? criterion,
      score: clamp(score),
      weight,
      weightedPoints: clamp(score) * weight,
      explanation,
      missingEvidence: gaps,
    });
  };

  const backgroundText = [input.profile?.degreeSubject, input.profile?.relevantModules, input.profile?.methodsExperience]
    .filter(Boolean)
    .join(' ');
  const overlap = keywordOverlap(backgroundText, input.keywords);
  add(
    'academicFit',
    ctx.profileCompleteness === 0 ? 1 : 1 + overlap * 4,
    overlap > 0
      ? `The applicant’s recorded background shares ${Math.round(overlap * 100)}% of the topic keywords. This is a lexical check, not an admissions judgement.`
      : 'No keyword overlap was found between the recorded background and the topic. The applicant may still be suitable, but the connection has not been evidenced.',
    missing([
      !input.profile?.degreeSubject ? 'Degree subject is empty.' : '',
      !input.profile?.relevantModules ? 'Relevant modules are empty.' : '',
    ]),
  );

  add(
    'problemImportance',
    ctx.totalLiteratureCount === 0 ? 1 : 2 + Math.min(2, Math.log2(1 + ctx.totalLiteratureCount) / 2),
    'The problem is stated in the canvas, but its scale and consequence cannot be scored highly until sources or official data evidence it.',
    ['No verified source yet establishes the scale or consequence of the problem.'],
  );

  add(
    'gapEvidence',
    ctx.gapVerified ? 5 : ctx.verifiedLiteratureCount >= 15 ? 3 : ctx.verifiedLiteratureCount >= 5 ? 2 : 1,
    ctx.gapVerified
      ? 'A documented search has been reviewed and the gap is retained in its revised form.'
      : 'The gap is provisional. Without a completed, documented search, a low score is the honest score.',
    ctx.gapVerified ? [] : ['Gap statement is provisional and unverified.'],
  );

  const intensity = METHOD_RESOURCE_INTENSITY[input.methodology] ?? { score: 3, note: 'Resource requirement has not been evidenced.' };
  add(
    'feasibility',
    intensity.score,
    `Method resource intensity is assessed for ${input.methodology}. ${intensity.note}`,
    ['Programme duration and supervision capacity are not yet confirmed.'],
  );

  add(
    'dataAccess',
    ctx.dataAccessConfirmed ? 5 : ctx.requiresLabOrFieldwork ? 1 : 2,
    ctx.dataAccessConfirmed
      ? 'Written access to the required data, equipment or participants is recorded.'
      : 'Access has not been confirmed. A proposal that depends on unavailable facilities is not feasible, however elegant it reads.',
    ctx.dataAccessConfirmed ? [] : ['Data/equipment/participant access is unconfirmed.'],
  );

  add(
    'doctoralContribution',
    input.theoryFramework && input.methodology ? (ctx.gapVerified ? 4 : 2) : 1,
    ctx.gapVerified
      ? 'A specified framework and method can support an examinable contribution; the precise claim still requires supervisor review.'
      : 'Framework and method are present, but a doctoral contribution cannot be demonstrated before the gap is verified.',
    ctx.gapVerified ? [] : ['Contribution claim has not been tested against a literature synthesis.'],
  );

  add(
    'supervisorAlignment',
    ctx.verifiedSupervisorMatches >= 3 ? 5 : ctx.verifiedSupervisorMatches >= 1 ? 4 : 0,
    ctx.verifiedSupervisorMatches >= 1
      ? `${ctx.verifiedSupervisorMatches} verified supervisor record(s) show relevant expertise. Availability is not implied.`
      : ctx.verifiedSupervisorRecords > 0
        ? 'The directory contains records, but none has been verified as a research fit for this topic.'
        : 'No verified supervisor records exist yet. The score is zero rather than an optimistic placeholder.',
    ctx.verifiedSupervisorMatches >= 1 ? [] : ['No verified supervisor expertise match.'],
  );

  add(
    'fundingResources',
    ctx.fundingRouteVerified
      ? 5
      : input.profile?.fundingRequirement === 'REQUIRED'
        ? 0
        : ctx.verifiedProgrammeCount > 0
          ? 2
          : 1,
    ctx.fundingRouteVerified
      ? 'A verified funding opportunity applicable to this applicant has been recorded.'
      : input.profile?.fundingRequirement === 'REQUIRED'
        ? 'Funding is recorded as required, but no verified eligible funding route exists yet. This is a blocking risk.'
        : 'Funding need is not yet resolved; no eligible route has been verified.',
    ctx.fundingRouteVerified ? [] : ['No verified funding eligibility.'],
  );

  add(
    'riskEthics',
    ctx.ethicsPlanPresent ? (ctx.requiresLabOrFieldwork ? 3 : 4) : 1,
    ctx.ethicsPlanPresent
      ? 'An ethics plan is present. It still requires programme-level approval and, for lab/fieldwork, a safety assessment.'
      : 'No ethics plan is recorded, so the risk score cannot be favourable.',
    ctx.ethicsPlanPresent ? [] : ['Ethics and risk plan missing.'],
  );

  const motivationOverlap = keywordOverlap(
    [input.profile?.existingResearchIdea, input.profile?.researchSetting].filter(Boolean).join(' '),
    input.keywords,
  );
  add(
    'motivation',
    input.profile?.existingResearchIdea ? 2 + motivationOverlap * 3 : 2,
    input.profile?.existingResearchIdea
      ? 'Motivation is inferred from consistency between the applicant’s stated idea/setting and the topic keywords. Only the applicant can confirm it.'
      : 'The applicant has not recorded an existing research idea, so motivation cannot be assessed.',
    input.profile?.existingResearchIdea ? [] : ['Applicant motivation not recorded.'],
  );

  const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
  const weighted = criteria.reduce((sum, item) => sum + item.weightedPoints, 0);
  const overall = Math.round((weighted / (totalWeight * 5)) * 100);

  const uncertaintyNotes: string[] = [];
  if (ctx.totalLiteratureCount === 0) uncertaintyNotes.push('No literature has been recorded for this topic.');
  if (!ctx.gapVerified) uncertaintyNotes.push('The research gap has not been verified through a documented literature search.');
  if (ctx.verifiedSupervisorMatches === 0) uncertaintyNotes.push('No verified supervisor match supports this topic yet.');
  if (!ctx.fundingRouteVerified) uncertaintyNotes.push('No verified funding route is attached.');
  if (ctx.profileCompleteness < 0.5) uncertaintyNotes.push('The applicant profile is incomplete, weakening fit and feasibility judgements.');

  const completeness = Math.round(
    [
      ctx.profileCompleteness,
      Math.min(1, ctx.verifiedLiteratureCount / 10),
      ctx.gapVerified ? 1 : 0,
      ctx.verifiedSupervisorMatches > 0 ? 1 : 0,
      ctx.dataAccessConfirmed ? 1 : 0,
      ctx.ethicsPlanPresent ? 1 : 0,
      ctx.fundingRouteVerified ? 1 : 0,
    ].reduce((a, b) => a + b, 0) / 7 * 100,
  ) / 100;

  return {
    criteria,
    overall,
    label: overall >= 80 ? 'Strong draft' : overall >= 60 ? 'Credible draft' : overall >= 40 ? 'Developing' : 'Fragile',
    completeness,
    uncertaintyNotes,
    disclaimer:
      'This is a structured self-assessment, not an admissions prediction, an originality judgement or a supervisor decision. Criterion scores must be reviewed with evidence.',
  };
}

export interface ComparisonRow {
  topicId: string;
  title: string;
  overall: number;
  completeness: number;
  label: string;
  scores: Record<string, number>;
  weakest: string[];
}

export function compareTopics(topics: Array<{ topicId: string; result: TopicScoreResult; title: string }>): ComparisonRow[] {
  return topics.map(({ topicId, result, title }) => ({
    topicId,
    title,
    overall: result.overall,
    completeness: result.completeness,
    label: result.label,
    scores: Object.fromEntries(result.criteria.map((criterion) => [criterion.criterion, criterion.score])),
    weakest: [...result.criteria].sort((a, b) => a.score - b.score).slice(0, 3).map((criterion) => criterion.label),
  }));
}
