import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { reviewSourceEvidence } from '@/lib/phd/services/sources';
import { verificationUpdateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH /api/phd/sources/[evidenceId] — records a review decision and appends an
// immutable verification event (status is never overwritten silently).
export const PATCH = phdRoute<{ evidenceId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, verificationUpdateSchema);
  const evidence = await reviewSourceEvidence(actor, params.evidenceId, input);
  return phdJson({ success: true, evidence });
});
