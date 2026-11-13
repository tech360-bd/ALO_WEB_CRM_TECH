import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { createCommissionRecord } from '@/lib/phd/services/commission';
import { commissionRecordSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/phd/commission/records — records one university-specific term with
// its exact source wording and page number. Never generalises a rate.
export const POST = phdRoute(async ({ actor, req }) => {
  const input = await readPhdJson(req, commissionRecordSchema);
  const record = await createCommissionRecord(actor, input);
  return phdJson({ success: true, record }, 201);
});
