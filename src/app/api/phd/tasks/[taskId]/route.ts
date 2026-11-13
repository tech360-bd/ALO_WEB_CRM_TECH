import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { updateTaskStatus } from '@/lib/phd/services/applications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const statusSchema = z.object({ status: z.enum(['OPEN', 'DONE', 'BLOCKED', 'CANCELLED']) });

// PATCH /api/phd/tasks/[taskId]
export const PATCH = phdRoute<{ taskId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, statusSchema);
  const task = await updateTaskStatus(actor, params.taskId, input.status);
  return phdJson({ success: true, task });
});
