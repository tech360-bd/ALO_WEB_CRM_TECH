import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { addApplicationTask } from '@/lib/phd/services/applications';
import { applicationTaskSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/phd/applications/[applicationId]/tasks
export const POST = phdRoute<{ applicationId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, applicationTaskSchema);
  const task = await addApplicationTask(actor, params.applicationId, input);
  return phdJson({ success: true, task }, 201);
});
