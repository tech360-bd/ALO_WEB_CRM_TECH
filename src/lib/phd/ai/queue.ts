import { z } from 'zod';
import { db } from '@/lib/db';
import { PhdAccessError, mapPhdRole, type PhdActor } from '../auth';
import { recordPhdAudit } from '../audit';
import { generateStructured, AiNotConfiguredError } from './client';
import { sectionDraftSchema } from './schemas';
import { wrapUntrusted } from './safety';
import { getOrCreateProfile } from '../services/profile';
import { generateAndSaveTopics } from '../services/topics';
import { runSupervisorMatching } from '../services/supervisors';
import { qualityReportForProposal } from '../services/proposals';
import { PROPOSAL_SECTIONS } from '../constants';
import { countWords } from '../proposals/sections';

/**
 * Server-side research job queue.
 *
 * Jobs are persisted so a request can enqueue work and return immediately. A
 * worker (`POST /api/phd/jobs/run`) claims queued jobs, enforces a timeout and
 * retries transient failures up to `maxAttempts`. A job that needs a capability
 * this deployment does not have (an official-source crawler, a literature index)
 * is marked BLOCKED with an explanation instead of fabricating a result.
 */

export const PHD_JOB_KINDS = [
  'TOPIC_GENERATION',
  'LITERATURE_SCAN',
  'SUPERVISOR_MATCH',
  'PROPOSAL_DRAFT',
  'QUALITY_REVIEW',
  'SOURCE_CHECK',
] as const;

export type PhdJobKind = (typeof PHD_JOB_KINDS)[number];

export interface JobEnqueueInput {
  actor: PhdActor;
  kind: PhdJobKind;
  projectId?: string | null;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
  maxAttempts?: number;
}

export interface JobRunSummary {
  id: string;
  kind: string;
  status: 'SUCCEEDED' | 'FAILED' | 'BLOCKED' | 'QUEUED';
  message: string;
  attempts: number;
  result?: unknown;
}

const payloadSchemas: Partial<Record<PhdJobKind, z.ZodTypeAny>> = {
  TOPIC_GENERATION: z.object({
    discipline: z.string().max(20).optional(),
    selectedAreaCodes: z.array(z.string().max(40)).max(24).optional(),
    maxCandidates: z.number().int().min(1).max(24).optional(),
    methodOverride: z.string().max(60).optional(),
    settingOverride: z.string().max(120).optional(),
  }),
  PROPOSAL_DRAFT: z.object({
    proposalId: z.string().min(5).max(64),
    sectionKey: z.string().min(2).max(60),
    /** AI drafts never overwrite content unless the user explicitly asks. */
    applyToSection: z.boolean().optional(),
  }),
  QUALITY_REVIEW: z.object({ proposalId: z.string().min(5).max(64) }),
  SUPERVISOR_MATCH: z.object({ topicId: z.string().min(5).max(64).optional() }),
};

export async function enqueueJob(input: JobEnqueueInput): Promise<{ job: { id: string; status: string }; deduped: boolean }> {
  const payloadSchema = payloadSchemas[input.kind];
  const payload = payloadSchema ? payloadSchema.parse(input.payload ?? {}) : (input.payload ?? {});

  if (input.dedupeKey) {
    const existing = await db.phdResearchJob.findUnique({ where: { dedupeKey: input.dedupeKey } });
    if (existing) return { job: { id: existing.id, status: existing.status }, deduped: true };
  }

  if (input.projectId) {
    const project = await db.phdProject.findUnique({ where: { id: input.projectId }, select: { userId: true, adviserId: true } });
    const allowed =
      project &&
      (project.userId === input.actor.userId ||
        input.actor.role === 'ADMINISTRATOR' ||
        project.adviserId === input.actor.userId);
    if (!allowed) throw new PhdAccessError('Project not found or access denied.', 404);
  }

  const job = await db.phdResearchJob.create({
    data: {
      projectId: input.projectId ?? null,
      kind: input.kind,
      status: 'QUEUED',
      maxAttempts: Math.min(5, Math.max(1, input.maxAttempts ?? 3)),
      result: '',
      error: '',
      payload: JSON.stringify(payload),
      requestedById: input.actor.userId,
      ...(input.dedupeKey ? { dedupeKey: input.dedupeKey.slice(0, 120) } : {}),
    },
  });

  await recordPhdAudit({
    actor: input.actor,
    action: 'JOB_ENQUEUED',
    entityType: 'PhdResearchJob',
    entityId: job.id,
    projectId: input.projectId ?? undefined,
    details: { kind: input.kind },
  });

  return { job: { id: job.id, status: job.status }, deduped: false };
}

async function actorFor(userId: string): Promise<PhdActor | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, permissions: true },
  });
  if (!user) return null;
  let permissions: string[] = [];
  try {
    const parsed = user.permissions ? JSON.parse(user.permissions) : [];
    permissions = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    permissions = [];
  }
  const roles = [user.role.toLowerCase()];
  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: mapPhdRole(roles, permissions),
    permissions,
    roles,
    authentication: 'NEXTAUTH',
  };
}

function assertProjectForJob(projectId: string | null): string {
  if (!projectId) throw new PhdAccessError('This job requires a project.', 422);
  return projectId;
}

async function runTopicGeneration(actor: PhdActor, projectId: string, payload: Record<string, unknown>) {
  const result = await generateAndSaveTopics(actor, projectId, {
    discipline: payload.discipline as string | undefined,
    selectedAreaCodes: payload.selectedAreaCodes as string[] | undefined,
    maxCandidates: payload.maxCandidates as number | undefined,
    methodOverride: payload.methodOverride as string | undefined,
    settingOverride: payload.settingOverride as string | undefined,
  });
  return {
    summary: `Generated ${result.topics.length} provisional topic candidate(s). Every candidate remains source-required until supporting literature is added.`,
    data: { count: result.topics.length, notes: result.notes, skippedAreas: result.skippedAreas },
  };
}

async function runSupervisorMatch(actor: PhdActor, projectId: string, payload: Record<string, unknown>) {
  const result = await runSupervisorMatching(actor, projectId, (payload.topicId as string | undefined) ?? null);
  return {
    summary: result.matches.length
      ? `Compared ${result.matches.length} supervisor record(s) with the selected topic. A match score is not evidence of availability or admission likelihood.`
      : result.note ?? 'No supervisor records are available to compare.',
    data: { count: result.matches.length },
  };
}

async function runQualityReview(actor: PhdActor, payload: Record<string, unknown>) {
  const report = await qualityReportForProposal(actor, String(payload.proposalId));
  return { summary: 'Quality checks completed against saved content only.', data: report };
}

async function runProposalDraft(actor: PhdActor, projectId: string, payload: Record<string, unknown>) {
  const proposalId = String(payload.proposalId);
  const sectionKey = String(payload.sectionKey);
  const section = PROPOSAL_SECTIONS.find((entry) => entry.key === sectionKey);
  if (!section) throw new PhdAccessError('Unknown proposal section.', 422);

  const proposal = await db.phdProposal.findUnique({
    where: { id: proposalId },
    include: {
      project: { include: { selectedTopic: { include: { questions: true, objectives: true, methodologies: true } } } },
      sections: true,
      university: true,
    },
  });
  if (!proposal || (proposal.project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR')) {
    throw new PhdAccessError('Proposal not found or access denied.', 404);
  }
  if (proposal.projectId !== projectId) throw new PhdAccessError('Project does not match the job.', 422);

  const profile = await getOrCreateProfile(actor.userId);
  const sources = await db.phdLiteratureSource.findMany({
    where: { projectId },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, authors: true, year: true, findings: true, verificationStatus: true },
  });

  const topic = proposal.project.selectedTopic;
  const evidenceBlock = sources.length
    ? sources
        .map(
          (source) =>
            `- [${source.id}] ${source.authors || 'Unknown author'} (${source.year ?? 'n.d.'}) ${source.title}. Recorded findings: ${source.findings || 'not recorded'}. Verification: ${source.verificationStatus}.`,
        )
        .join('\n')
    : 'No literature sources have been saved for this project yet.';

  const untrusted = wrapUntrusted(
    'applicant_notes_and_evidence',
    [
      `Applicant subject: ${profile.degreeSubject || 'not provided'}`,
      `Topic title: ${topic?.workingTitle ?? 'not selected'}`,
      `Main question: ${topic?.mainQuestion ?? 'not drafted'}`,
      `Provisional gap: ${topic?.provisionalGap ?? 'not drafted'}`,
      `Saved evidence:`,
      evidenceBlock,
    ].join('\n'),
    { maxChars: 5000 },
  );

  const generated = await generateStructured({
    task: `Draft the "${section.title}" section of a UK PhD research proposal. Follow the section brief exactly. Write in the applicant's voice, in British English, and do not claim that any cited work exists unless it is listed in the evidence block. Where a claim is not supported by saved evidence, phrase it as a hypothesis or state that evidence is required. Return JSON matching the schema.`,
    prompt: [
      `Section brief: ${section.guidance}`,
      `Referencing style: ${proposal.referencingStyle || 'not specified by the university'}.`,
      `University requirement source: ${proposal.requirementsSourceUrl || 'not verified'}.`,
      untrusted.text,
      'Return JSON with keys: sectionKey, draft, evidenceUsed (each with claim, evidenceId from the list above or null, label SOURCE_REPORTED|AI_SYNTHESIS|HYPOTHESIS), unresolvedGaps, wordCount.',
    ].join('\n\n'),
    schema: sectionDraftSchema,
    maxTokens: 1600,
  });

  const draft = generated.data;
  if (draft.sectionKey !== sectionKey) throw new Error('The draft returned a different section key and was not saved.');

  const apply = payload.applyToSection === true;
  let applied = false;
  if (apply) {
    const existing = proposal.sections.find((row) => row.sectionKey === sectionKey);
    if (existing) {
      await db.phdProposalSection.update({
        where: { proposalId_sectionKey: { proposalId, sectionKey } },
        data: { content: draft.draft },
      });
      applied = true;
    }
    for (const item of draft.evidenceUsed) {
      if (!item.evidenceId) continue;
      const source = sources.find((candidate) => candidate.id === item.evidenceId);
      if (!source) continue;
      await db.phdEvidenceClaim.create({
        data: {
          projectId,
          sourceId: source.id,
          claim: item.claim,
          supportType: item.label,
          location: section.title,
          notes: `Drafted by AI for section "${section.title}". Not verified. Review before citing.`,
          confidence: 'LOW',
        },
      });
    }
  }

  await recordPhdAudit({
    actor,
    action: applied ? 'AI_DRAFT_APPLIED' : 'AI_DRAFT_GENERATED',
    entityType: 'PhdProposal',
    entityId: proposalId,
    projectId,
    details: { sectionKey, provider: generated.provider, model: generated.model, applied },
  });

  return {
    summary: applied
      ? `Draft applied to "${section.title}". Every AI-labelled claim remains unverified.`
      : `Draft generated for "${section.title}" (${countWords(draft.draft)} words). It was not written to the proposal; review and apply it explicitly.`,
    data: { ...draft, provider: generated.provider, model: generated.model, attempts: generated.attempts, applied },
  };
}

const BLOCKED_CAPABILITIES: Partial<Record<PhdJobKind, string>> = {
  LITERATURE_SCAN:
    'No literature index (Crossref, Scopus, Web of Science or a university repository API) is configured for this deployment, so no search was performed and no references were invented. Add sources manually or connect an index, then re-run.',
  SOURCE_CHECK:
    'Automatic official-page checking is not configured. The Source Verification Centre records manual verification with URL, retrieval date and reviewer; it will not synthesise a check.',
};

async function execute(job: {
  id: string;
  kind: string;
  projectId: string | null;
  payload: string | null;
  requestedById: string;
}): Promise<{ summary: string; data?: unknown }> {
  const actor = await actorFor(job.requestedById);
  if (!actor) throw new PhdAccessError('The user who requested this job no longer exists.', 404);
  const payload = job.payload ? (JSON.parse(job.payload) as Record<string, unknown>) : {};
  const blocked = BLOCKED_CAPABILITIES[job.kind as PhdJobKind];
  if (blocked) throw Object.assign(new Error(blocked), { blocked: true });

  switch (job.kind as PhdJobKind) {
    case 'TOPIC_GENERATION':
      return runTopicGeneration(actor, assertProjectForJob(job.projectId), payload);
    case 'SUPERVISOR_MATCH':
      return runSupervisorMatch(actor, assertProjectForJob(job.projectId), payload);
    case 'PROPOSAL_DRAFT':
      return runProposalDraft(actor, assertProjectForJob(job.projectId), payload);
    case 'QUALITY_REVIEW':
      return runQualityReview(actor, payload);
    default:
      throw Object.assign(new Error(`Unsupported job kind: ${job.kind}`), { blocked: true });
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`The job exceeded its ${Math.round(ms / 1000)}s time limit.`)), ms);
      if (typeof timer === 'object' && 'unref' in timer) (timer as { unref: () => void }).unref();
    }),
  ]);
}

export async function runJob(jobId: string, options: { timeoutMs?: number } = {}): Promise<JobRunSummary> {
  const job = await db.phdResearchJob.findUnique({ where: { id: jobId } });
  if (!job) throw new PhdAccessError('Job not found.', 404);
  if (job.status !== 'QUEUED') {
    return {
      id: job.id,
      kind: job.kind,
      status: job.status as JobRunSummary['status'],
      message: 'Job was not queued.',
      attempts: job.attempts,
    };
  }

  await db.phdResearchJob.update({
    where: { id: job.id },
    data: { status: 'RUNNING', attempts: { increment: 1 }, startedAt: new Date() },
  });

  try {
    const outcome = await withTimeout(execute(job), options.timeoutMs ?? 60_000);
    await db.phdResearchJob.update({
      where: { id: job.id },
      data: { status: 'SUCCEEDED', progress: 100, completedAt: new Date(), result: JSON.stringify(outcome) },
    });
    return {
      id: job.id,
      kind: job.kind,
      status: 'SUCCEEDED',
      message: outcome.summary,
      attempts: job.attempts + 1,
      result: outcome.data,
    };
  } catch (error) {
    const blocked = Boolean(error && typeof error === 'object' && 'blocked' in error);
    const notConfigured = error instanceof AiNotConfiguredError;
    const message = error instanceof Error ? error.message : 'The job failed without a message.';
    const attempts = job.attempts + 1;
    const finalFailure = blocked || notConfigured || attempts >= job.maxAttempts;
    const status: JobRunSummary['status'] = blocked || notConfigured ? 'BLOCKED' : finalFailure ? 'FAILED' : 'QUEUED';
    await db.phdResearchJob.update({
      where: { id: job.id },
      data: { status, error: message.slice(0, 2000), completedAt: status === 'QUEUED' ? null : new Date() },
    });
    return { id: job.id, kind: job.kind, status, message, attempts };
  }
}

/** Claim and run the oldest queued jobs (scheduler/administrator entry point). */
export async function drainQueue(options: { limit?: number; timeoutMs?: number } = {}): Promise<JobRunSummary[]> {
  const limit = Math.min(10, Math.max(1, options.limit ?? 2));
  const due = await db.phdResearchJob.findMany({
    where: { status: 'QUEUED' },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true },
  });
  const summaries: JobRunSummary[] = [];
  for (const job of due) summaries.push(await runJob(job.id, { timeoutMs: options.timeoutMs }));
  return summaries;
}

export function describeJobKind(kind: string): string {
  switch (kind) {
    case 'TOPIC_GENERATION':
      return 'Provisional topic generation (deterministic catalogue + profile)';
    case 'SUPERVISOR_MATCH':
      return 'Supervisor fit comparison against verified records';
    case 'PROPOSAL_DRAFT':
      return 'AI-assisted section draft (never auto-applied)';
    case 'QUALITY_REVIEW':
      return 'Proposal quality and requirement checks';
    case 'LITERATURE_SCAN':
      return 'Literature search (blocked: no index configured)';
    case 'SOURCE_CHECK':
      return 'Official-source check (blocked: no crawler configured)';
    default:
      return kind;
  }
}
