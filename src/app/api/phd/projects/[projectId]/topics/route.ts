import { phdJson, enforceRateLimit, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { generateAndSaveTopics, listTopics } from '@/lib/phd/services/topics';
import { topicGenerateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/topics — candidates and their criterion scores.
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const topics = await listTopics(actor, params.projectId);
  return phdJson({ success: true, topics });
});

// POST /api/phd/projects/[projectId]/topics — deterministic topic generation.
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  enforceRateLimit(req, actor, 'phd-topics', 10, 60_000);
  const input = await readPhdJson(req, topicGenerateSchema);
  const result = await generateAndSaveTopics(actor, params.projectId, input);
  return phdJson({ success: true, ...result }, 201);
});
