import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute, queryFlag, queryParam } from '@/lib/phd/routes';
import { createFundingOpportunity, listFunding } from '@/lib/phd/services/funding';
import { fundingCreateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/phd/funding — funding opportunities with an assessment object.
 * Expired opportunities are excluded unless explicitly requested, and nothing is
 * labelled "fully funded" unless the official terms support it.
 */
export const GET = phdRoute(async ({ req }) => {
  const opportunities = await listFunding({
    universityId: queryParam(req, 'universityId', 64) || undefined,
    includeExpired: queryFlag(req, 'includeExpired'),
  });
  return phdJson({ success: true, opportunities });
});

// POST /api/phd/funding — verifier/administrator only (enforced in the service).
export const POST = phdRoute(async ({ actor, req }) => {
  const input = await readPhdJson(req, fundingCreateSchema);
  const opportunity = await createFundingOpportunity(actor, input);
  return phdJson({ success: true, opportunity }, 201);
});
