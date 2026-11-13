import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { getSop, updateSop } from '@/lib/phd/services/sop';
import { sopUpdateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/sops/[sopId] — full statement with sections, versions and reviews.
export const GET = phdRoute<{ sopId: string }>(async ({ actor, params }) => {
  const sop = await getSop(actor, params.sopId);
  return phdJson({ success: true, sop });
});

// PATCH — title, word settings, personal facts and notes (owner only).
export const PATCH = phdRoute<{ sopId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, sopUpdateSchema);
  const sop = await updateSop(actor, params.sopId, input);
  return phdJson({ success: true, sop });
});
