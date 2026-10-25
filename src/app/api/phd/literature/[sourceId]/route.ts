import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { getLiteratureSource, verifyLiteratureSource } from '@/lib/phd/services/literature';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const verifySchema = z.object({
  verificationStatus: z.enum(['VERIFIED_OFFICIAL', 'SECONDARY_SOURCE_ONLY', 'NOT_YET_VERIFIED']),
});

// GET /api/phd/literature/[sourceId]
export const GET = phdRoute<{ sourceId: string }>(async ({ actor, params }) => {
  const source = await getLiteratureSource(actor, params.sourceId);
  return phdJson({ success: true, source });
});

// PATCH /api/phd/literature/[sourceId] — records a checked status. A verifier or
// administrator role is required by the service for official verification.
export const PATCH = phdRoute<{ sourceId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, verifySchema);
  const source = await verifyLiteratureSource(actor, params.sourceId, input.verificationStatus);
  return phdJson({ success: true, source });
});
