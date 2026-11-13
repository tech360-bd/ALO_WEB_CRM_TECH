import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { calculateCommissionForRecord } from '@/lib/phd/services/commission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const calculateSchema = z.object({
  feeId: z.string().max(64).optional().nullable(),
  netFeeMinor: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
});

/**
 * POST /api/phd/commission/records/[recordId]/calculate
 *
 * Returns a calculation ONLY when the fee input and the contractual conditions are
 * present. Missing inputs produce an explicit refusal instead of a guessed amount.
 */
export const POST = phdRoute<{ recordId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, calculateSchema);
  const result = await calculateCommissionForRecord(actor, params.recordId, input);
  return phdJson({ success: true, ...result });
});
