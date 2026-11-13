import { db } from '@/lib/db';
import { TOPIC_CATALOGUE, getTopicArea, validateCatalogue } from '../topics/catalogue';
import { generateTopicCandidates, type TopicGenerationRequest } from '../topics/generator';
import { scoreTopic, type CriterionScore } from '../topics/scoring';
import { computeProfileCompletion, getOrCreateProfile, parseMethods } from './profile';
import { getProjectForActor } from './projects';
import type { PhdActor } from '../auth';
import { recordPhdAudit } from '../audit';
import { PhdAccessError } from '../auth';

export async function ensureCatalogueSeeded(): Promise<{ areas: number; created: number }> {
  const validation = validateCatalogue();
  if (!validation.valid) {
    throw new Error(`Topic catalogue is invalid: ${validation.errors.slice(0, 5).join('; ')}`);
  }
  const existingCodes = new Set(
    (await db.phdTopicArea.findMany({ select: { code: true } })).map((row) => row.code),
  );
  const missing = TOPIC_CATALOGUE.filter((area) => !existingCodes.has(area.code));
  if (missing.length === 0) return { areas: existingCodes.size, created: 0 };
  let created = 0;
  for (const area of missing) {
    const result = await db.phdTopicArea.upsert({
      where: { code: area.code },
      create: {
        code: area.code,
        discipline: area.discipline,
        name: area.name,
        subfield: area.subfield,
        summary: area.summary,
        keywords: area.keywords.join(', '),
        problems: area.problems.map((problem) => problem.statement).join('\n'),
        theories: area.theories.join('\n'),
        methods: area.methods.join(', '),
        dataSources: area.dataSources,
        risks: area.risks,
        ethics: area.ethics,
        contributions: area.contributions,
        searchStrategy: area.searchStrategy,
      },
      update: {},
    });
    if (result) created += 1;
  }
  return { areas: existingCodes.size + created, created };
}

async function scoringContext(projectId: string, profile: Awaited<ReturnType<typeof getOrCreateProfile>>) {
  const [topicAreaCount, totalSources, verifiedSources, verifiedSupervisorMatches, verifiedSupervisors, verifiedProgrammes, verifiedFunding] = await Promise.all([
    db.phdTopicArea.count(),
    db.phdLiteratureSource.count({ where: { projectId } }),
    db.phdLiteratureSource.count({ where: { projectId, verificationStatus: 'VERIFIED_OFFICIAL' } }),
    db.phdSupervisorMatch.count({ where: { projectId, supervisor: { verificationStatus: 'VERIFIED_OFFICIAL' }, fitScore: { gte: 45 } } }),
    db.phdSupervisor.count({ where: { verificationStatus: 'VERIFIED_OFFICIAL' } }),
    db.phdProgramme.count({ where: { verificationStatus: 'VERIFIED_OFFICIAL' } }),
    db.phdFundingEligibility.count({ where: { applicantStatus: 'ELIGIBLE', opportunity: { verificationStatus: 'VERIFIED_OFFICIAL' } } }),
  ]);
  return {
    profileCompleteness: computeProfileCompletion(profile) / 100,
    degreeSubject: profile.degreeSubject,
    preferredMethods: profile.preferredMethods,
    existingResearchIdea: profile.existingResearchIdea,
    researchSetting: profile.researchSetting,
    fundingRequirement: profile.fundingRequirement,
    verifiedLiteratureCount: verifiedSources,
    totalLiteratureCount: totalSources,
    gapVerified: false,
    verifiedSupervisorMatches,
    verifiedSupervisorRecords: verifiedSupervisors,
    verifiedProgrammeCount: verifiedProgrammes,
    dataAccessConfirmed: false,
    requiresLabOrFieldwork: false,
    ethicsPlanPresent: true,
    fundingRouteVerified: verifiedFunding > 0,
    catalogueAreas: topicAreaCount,
  };
}

export interface StoredTopicResult {
  id: string;
  workingTitle: string;
  areaCode: string;
  noveltyStatus: string;
  confidence: string;
  scores: Array<{ criterion: string; score: number; weight: number; explanation: string }>;
  overall: number;
  completeness: number;
  label: string;
  uncertaintyNotes: string[];
}

export async function generateAndSaveTopics(
  actor: PhdActor,
  projectId: string,
  input: Omit<TopicGenerationRequest, 'projectId'>,
): Promise<{ topics: StoredTopicResult[]; notes: string[]; skippedAreas: string[] }> {
  await ensureCatalogueSeeded();
  const profile = await getOrCreateProfile(actor.userId);

  const request: TopicGenerationRequest = {
    projectId,
    discipline: input.discipline ?? profile.primaryDiscipline,
    selectedAreaCodes: input.selectedAreaCodes,
    maxCandidates: input.maxCandidates ?? 8,
    settingOverride: input.settingOverride ?? undefined,
    methodOverride: input.methodOverride ?? undefined,
    profile: {
      highestQualification: profile.highestQualification,
      degreeSubject: profile.degreeSubject,
      classification: profile.classification,
      relevantModules: profile.relevantModules || undefined,
      dissertationTitle: profile.dissertationTitle || undefined,
      methodsExperience: profile.methodsExperience || undefined,
      publications: profile.publications || undefined,
      researchExperience: profile.researchExperience || undefined,
      employmentHistory: profile.employmentHistory || undefined,
      primaryDiscipline: profile.primaryDiscipline,
      existingResearchIdea: profile.existingResearchIdea || undefined,
      preferredMethods: parseMethods(profile.preferredMethods).join(','),
      researchSetting: profile.researchSetting || undefined,
      studyMode: profile.studyMode,
      desiredStart: profile.desiredStart,
      locationPreferences: profile.locationPreferences,
      fundingRequirement: profile.fundingRequirement,
      equipmentNeeds: profile.equipmentNeeds || undefined,
      englishTestStatus: profile.englishTestStatus,
      interests: profile.interests?.map((interest) => interest.value) ?? [],
    },
  };

  const generated = generateTopicCandidates(request);
  const context = await scoringContext(projectId, profile);
  const stored: StoredTopicResult[] = [];

  for (const topic of generated.topics) {
    const area = getTopicArea(topic.areaCode);
    if (!area) continue;
    const existing = await db.phdTopicCandidate.findUnique({ where: { dedupeKey: topic.dedupeKey } });
    if (existing) {
      stored.push(await summariseTopic(existing.id));
      continue;
    }
    const result = scoreTopic({
      title: topic.workingTitle,
      keywords: topic.keywords,
      methodology: topic.methodology.methods,
      theoryFramework: topic.theoryFramework,
      ethics: topic.ethics,
      dataNeeds: topic.dataNeeds,
      areaDiscipline: area.discipline,
      profile: {
        degreeSubject: profile.degreeSubject,
        relevantModules: profile.relevantModules,
        methodsExperience: profile.methodsExperience,
        preferredMethods: profile.preferredMethods,
        existingResearchIdea: profile.existingResearchIdea,
        researchSetting: profile.researchSetting,
        fundingRequirement: profile.fundingRequirement,
      },
      context: { ...context, requiresLabOrFieldwork: area.discipline === 'ENGINEERING' },
    });

    const created = await db.phdTopicCandidate.create({
      data: {
        projectId,
        areaCode: topic.areaCode,
        dedupeKey: topic.dedupeKey,
        workingTitle: topic.workingTitle,
        plainLanguage: topic.plainLanguage,
        researchField: topic.researchField,
        researchSubfield: topic.researchSubfield,
        problemStatement: topic.problemStatement,
        initialEvidence: topic.initialEvidence,
        provisionalGap: topic.provisionalGap,
        mainQuestion: topic.mainQuestion,
        aim: topic.aim,
        theoryFramework: topic.theoryFramework,
        methodology: topic.methodology.design,
        dataNeeds: topic.dataNeeds,
        feasibilityRisks: topic.feasibilityRisks,
        ethics: topic.ethics,
        scholarlyContribution: topic.scholarlyContribution,
        practicalContribution: topic.practicalContribution,
        potentialMatches: topic.potentialMatches,
        preliminaryReading: topic.preliminaryReading,
        confidence: topic.confidence,
        evidenceQuality: topic.evidenceQuality,
        unresolvedQuestions: topic.unresolvedQuestions.join('\n'),
        noveltyStatus: topic.noveltyStatus,
        provenance: 'GENERATED',
        questions: {
          create: [
            { text: topic.mainQuestion, kind: 'MAIN', order: 0 },
            ...topic.supportingQuestions.map((question, index) => ({ text: question, kind: 'SUPPORTING', order: index + 1 })),
          ],
        },
        objectives: {
          create: topic.objectives.map((objective, index) => ({ text: objective.text, measure: objective.measure, order: index + 1 })),
        },
        methodologies: {
          create: [{
            paradigm: topic.methodology.paradigm,
            design: topic.methodology.design,
            methods: topic.methodology.methods,
            rationale: topic.methodology.rationale,
            resources: topic.methodology.resources,
            risks: topic.methodology.risks,
            isSelected: true,
          }],
        },
      },
    });

    await db.phdTopicEvaluation.createMany({
      data: result.criteria.map((criterion: CriterionScore) => ({
        topicId: created.id,
        criterion: criterion.criterion,
        score: criterion.score,
        weight: criterion.weight,
        explanation: `[Automatic baseline] ${criterion.explanation}${criterion.missingEvidence.length ? ` Missing: ${criterion.missingEvidence.join(' ')}` : ''}`,
        evidenceStatus: 'AUTO_BASELINE',
        evaluatedBy: actor.userId,
      })),
    });

    stored.push({
      id: created.id,
      workingTitle: created.workingTitle,
      areaCode: created.areaCode,
      noveltyStatus: created.noveltyStatus,
      confidence: created.confidence,
      scores: result.criteria.map((criterion) => ({
        criterion: criterion.criterion,
        score: criterion.score,
        weight: criterion.weight,
        explanation: criterion.explanation,
      })),
      overall: result.overall,
      completeness: result.completeness,
      label: result.label,
      uncertaintyNotes: result.uncertaintyNotes,
    });
  }

  await recordPhdAudit({
    actor,
    action: 'TOPICS_GENERATED',
    entityType: 'PhdProject',
    entityId: projectId,
    projectId,
    details: { requested: generated.topics.length, stored: stored.length },
  });

  return { topics: stored, notes: generated.notes, skippedAreas: generated.skippedAreas };
}

/** Topic candidates for a project, newest first, with their evaluations. */
export async function listTopics(actor: PhdActor, projectId: string) {
  const project = await getProjectForActor(actor, projectId);
  const topics = await db.phdTopicCandidate.findMany({
    where: { projectId: project.id },
    orderBy: [{ isSelected: 'desc' }, { createdAt: 'desc' }],
    include: { evaluations: true, questions: true, objectives: true },
    take: 60,
  });
  return topics.map((topic) => ({
    id: topic.id,
    workingTitle: topic.workingTitle,
    areaCode: topic.areaCode,
    researchField: topic.researchField,
    researchSubfield: topic.researchSubfield,
    mainQuestion: topic.mainQuestion,
    isSelected: topic.isSelected,
    confidence: topic.confidence,
    noveltyStatus: topic.noveltyStatus,
    evidenceQuality: topic.evidenceQuality,
    createdAt: topic.createdAt,
    evaluations: topic.evaluations.map((evaluation) => ({
      criterion: evaluation.criterion,
      score: evaluation.score,
      explanation: evaluation.explanation,
    })),
    questionCount: topic.questions.length,
    objectiveCount: topic.objectives.length,
  }));
}

export async function summariseTopic(topicId: string): Promise<StoredTopicResult> {
  const topic = await db.phdTopicCandidate.findUniqueOrThrow({
    where: { id: topicId },
    include: { evaluations: true },
  });
  const evaluations = topic.evaluations;
  const totalWeight = evaluations.reduce((sum, evaluation) => sum + evaluation.weight, 0);
  const weighted = evaluations.reduce((sum, evaluation) => sum + evaluation.score * evaluation.weight, 0);
  const overall = totalWeight ? Math.round((weighted / (totalWeight * 5)) * 100) : 0;
  return {
    id: topic.id,
    workingTitle: topic.workingTitle,
    areaCode: topic.areaCode,
    noveltyStatus: topic.noveltyStatus,
    confidence: topic.confidence,
    scores: evaluations.map((evaluation) => ({
      criterion: evaluation.criterion,
      score: evaluation.score,
      weight: evaluation.weight,
      explanation: evaluation.explanation,
    })),
    overall,
    completeness: 0,
    label: overall >= 80 ? 'Strong draft' : overall >= 60 ? 'Credible draft' : overall >= 40 ? 'Developing' : 'Fragile',
    uncertaintyNotes: evaluations
      .filter((evaluation) => evaluation.score <= 2)
      .map((evaluation) => `${evaluation.criterion}: ${evaluation.explanation}`),
  };
}

export async function getTopicDetail(actor: PhdActor, topicId: string) {
  const topic = await db.phdTopicCandidate.findUnique({
    where: { id: topicId },
    include: {
      questions: { orderBy: { order: 'asc' } },
      objectives: { orderBy: { order: 'asc' } },
      methodologies: true,
      evaluations: { orderBy: { criterion: 'asc' } },
      area: true,
      project: true,
    },
  });
  if (!topic || (topic.project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR' && topic.project.adviserId !== actor.userId)) {
    throw new PhdAccessError('Topic not found or access denied.', 404);
  }
  return topic;
}

export async function selectTopic(actor: PhdActor, topicId: string) {
  const topic = await getTopicDetail(actor, topicId);
  if (topic.project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR') {
    throw new PhdAccessError('Only the project owner can select a topic.', 403);
  }
  await db.$transaction([
    db.phdTopicCandidate.updateMany({ where: { projectId: topic.projectId }, data: { isSelected: false } }),
    db.phdTopicCandidate.update({ where: { id: topicId }, data: { isSelected: true } }),
    db.phdProject.update({ where: { id: topic.projectId }, data: { selectedTopicId: topicId, researchQuestion: topic.mainQuestion } }),
  ]);
  await recordPhdAudit({ actor, action: 'TOPIC_SELECTED', entityType: 'PhdTopicCandidate', entityId: topicId, projectId: topic.projectId });
  return { selected: topicId, projectId: topic.projectId };
}

export async function applyEvaluationOverrides(
  actor: PhdActor,
  topicId: string,
  overrides: Array<{ criterion: string; score: number; explanation: string }>,
) {
  const topic = await getTopicDetail(actor, topicId);
  if (topic.project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR') {
    throw new PhdAccessError('Only the project owner can score this topic.', 403);
  }
  for (const override of overrides) {
    await db.phdTopicEvaluation.upsert({
      where: { topicId_criterion: { topicId, criterion: override.criterion } },
      create: {
        topicId,
        criterion: override.criterion,
        score: override.score,
        weight: 3,
        explanation: override.explanation,
        evidenceStatus: 'USER_ASSESSED',
        evaluatedBy: actor.userId,
      },
      update: {
        score: override.score,
        explanation: override.explanation,
        evidenceStatus: 'USER_ASSESSED',
        evaluatedBy: actor.userId,
      },
    });
  }
  await recordPhdAudit({ actor, action: 'TOPIC_SCORES_UPDATED', entityType: 'PhdTopicCandidate', entityId: topicId, projectId: topic.projectId, details: { criteria: overrides.length } });
  return summariseTopic(topicId);
}
