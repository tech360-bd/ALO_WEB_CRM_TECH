import { z } from 'zod';
import { phdJson, enforceRateLimit, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { listSupervisorMatches, runSupervisorMatching } from '@/lib/phd/services/supervisors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const matchSchema = z.object({ topicId: z.string().max(64).optional().nullable() });

// GET — saved fit assessments from the last scoring run (no write, no audit event).
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const result = await listSupervisorMatches(actor, params.projectId);
  return phdJson({ success: true, ...result });
});

// POST /api/phd/projects/[projectId]/supervisors/match — recorded-evidence only.
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  enforceRateLimit(req, actor, 'phd-supervisor-match', 10, 60_000);
  const body = await readPhdJson(req, matchSchema).catch(() => ({ topicId: null }));
  const result = await runSupervisorMatching(actor, params.projectId, body.topicId ?? null);
  return phdJson({ success: true, ...result });
});
