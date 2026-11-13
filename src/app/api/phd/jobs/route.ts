import { z } from 'zod';
import { phdJson, enforceRateLimit, readPhdJson } from '@/lib/phd/api';
import { PhdAccessError, canAdminister } from '@/lib/phd/auth';
import { phdRoute, queryParam } from '@/lib/phd/routes';
import { PHD_JOB_KINDS, enqueueJob, describeJobKind } from '@/lib/phd/ai/queue';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const enqueueSchema = z.object({
  kind: z.enum(PHD_JOB_KINDS),
  projectId: z.string().min(1).max(64).optional().nullable(),
  payload: z.record(z.string(), z.unknown()).optional(),
  dedupeKey: z.string().min(1).max(120).optional(),
});

/**
 * GET /api/phd/jobs — the caller's own research jobs (administrators may filter
 * by status). A job's payload and result are never returned for another user's
 * project: project ownership is enforced when the job is enqueued and again here.
 */
export const GET = phdRoute(async ({ actor, req }) => {
  const status = queryParam(req, 'status', 20) || undefined;
  const limit = Math.min(50, Math.max(1, Number.parseInt(queryParam(req, 'limit', 4), 10) || 20));

  const projects = await db.phdProject.findMany({
    where: canAdminister(actor) ? {} : { userId: actor.userId },
    select: { id: true },
    take: 200,
  });
  const projectIds = projects.map((project) => project.id);

  const jobs = await db.phdResearchJob.findMany({
    where: {
      ...(canAdminister(actor) ? {} : { projectId: { in: projectIds } }),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      projectId: true,
      kind: true,
      status: true,
      progress: true,
      attempts: true,
      maxAttempts: true,
      error: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
    },
  });

  return phdJson({
    success: true,
    jobs: jobs.map((job) => ({ ...job, description: describeJobKind(job.kind) })),
    kinds: PHD_JOB_KINDS.map((kind) => ({ kind, description: describeJobKind(kind) })),
    note: 'Jobs never invent results. Work that needs a capability this deployment lacks is marked BLOCKED with the reason.',
  });
});

/**
 * POST /api/phd/jobs — enqueue a research job.
 *
 * Enqueueing is not execution: a worker (or an administrator via
 * `/api/phd/jobs/run`) claims the job. Deduplication is optional and keyed by the
 * caller-supplied `dedupeKey` so a double click cannot queue the same work twice.
 */
export const POST = phdRoute(async ({ actor, req }) => {
  enforceRateLimit(req, actor, 'phd-jobs-enqueue', 20, 60_000);
  const input = await readPhdJson(req, enqueueSchema);

  if (!canAdminister(actor) && !input.projectId) {
    throw new PhdAccessError('A project is required to queue this job.', 422);
  }

  const result = await enqueueJob({
    actor,
    kind: input.kind,
    projectId: input.projectId ?? null,
    payload: input.payload,
    ...(input.dedupeKey ? { dedupeKey: `phd:${actor.userId}:${input.dedupeKey}` } : {}),
  });

  return phdJson({ success: true, ...result }, result.deduped ? 200 : 201);
});
