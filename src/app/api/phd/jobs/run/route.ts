import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { PhdAccessError, canAdminister } from '@/lib/phd/auth';
import { phdRoute } from '@/lib/phd/routes';
import { drainQueue, runJob } from '@/lib/phd/ai/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const runSchema = z.object({
  jobId: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(5).optional(),
});

/**
 * POST /api/phd/jobs/run — worker / administrator entry point.
 *
 * Administrator-only: a job executes with the identity of the user who queued it,
 * so letting any applicant trigger the queue would let them run someone else's
 * work. With no `jobId` the oldest queued jobs are drained (bounded by `limit`).
 */
export const POST = phdRoute(async ({ actor, req }) => {
  if (!canAdminister(actor)) {
    throw new PhdAccessError('Only an administrator can run the research job queue.', 403);
  }
  const body: z.infer<typeof runSchema> = await readPhdJson(req, runSchema).catch(() => ({}));

  if (body.jobId) {
    const summary = await runJob(body.jobId, { timeoutMs: 45_000 });
    return phdJson({ success: true, results: [summary] });
  }

  const results = await drainQueue({ limit: body.limit ?? 2, timeoutMs: 45_000 });
  return phdJson({ success: true, results });
});
