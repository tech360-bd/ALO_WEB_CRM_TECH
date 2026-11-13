import { phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { reviewSop } from '@/lib/phd/services/sop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — the content review report: evidence, generic wording, wrong university,
// word limit and disclosure. It never scores authorship.
export const GET = phdRoute<{ sopId: string }>(async ({ actor, params }) => {
  const result = await reviewSop(actor, params.sopId);
  return phdJson({ success: true, ...result });
});
