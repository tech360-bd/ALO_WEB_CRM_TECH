import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { buildTimelineForProject, listTimelines } from '@/lib/phd/services/timeline';
import { timelineRequestSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/timeline
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const timelines = await listTimelines(actor, params.projectId);
  return phdJson({ success: true, timelines });
});

// POST — builds a suggested plan. It is labelled as a suggestion, never as an
// official university deadline.
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const schema = z.object({
    startDate: timelineRequestSchema.shape.startDate,
    mode: timelineRequestSchema.shape.mode,
    totalMonths: timelineRequestSchema.shape.totalMonths,
    methodology: timelineRequestSchema.shape.methodology,
  });
  const body = await readPhdJson(req, schema);
  const timeline = await buildTimelineForProject(actor, { ...body, projectId: params.projectId });
  return phdJson({ success: true, timeline }, 201);
});
