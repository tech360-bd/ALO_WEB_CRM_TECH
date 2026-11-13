import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { reviewCommissionRecord } from '@/lib/phd/services/commission';
import { commissionReviewSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/phd/commission/records/[recordId]/review — verifier decision.
export const POST = phdRoute<{ recordId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, commissionReviewSchema);
  const record = await reviewCommissionRecord(actor, params.recordId, input);
  return phdJson({ success: true, record });
});
