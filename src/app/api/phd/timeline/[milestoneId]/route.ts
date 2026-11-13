import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { updateMilestone } from '@/lib/phd/services/timeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const milestoneSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

// PATCH /api/phd/timeline/[milestoneId]
export const PATCH = phdRoute<{ milestoneId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, milestoneSchema);
  const milestone = await updateMilestone(actor, params.milestoneId, input);
  return phdJson({ success: true, milestone });
});
