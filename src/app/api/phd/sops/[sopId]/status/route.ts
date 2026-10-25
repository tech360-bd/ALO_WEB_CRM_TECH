import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { transitionSop } from '@/lib/phd/services/sop';
import { sopStatusSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST — moves the statement along the review trail. Blocking defects stop the move.
export const POST = phdRoute<{ sopId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, sopStatusSchema);
  const sop = await transitionSop(actor, params.sopId, input.status, input.comments);
  return phdJson({ success: true, sop });
});
