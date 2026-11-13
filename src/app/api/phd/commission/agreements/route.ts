import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { listCommissionAgreements, upsertCommissionAgreement } from '@/lib/phd/services/commission';
import { commissionAgreementSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/commission/agreements
export const GET = phdRoute(async () => {
  const agreements = await listCommissionAgreements();
  return phdJson({ success: true, agreements });
});

// POST — records the per-university PhD commission status. Regent's University
// London is never marked commissionable for PhD on the strength of the supplied
// Spring 2027 structure; the service enforces that and requires manual review.
export const POST = phdRoute(async ({ actor, req }) => {
  const input = await readPhdJson(req, commissionAgreementSchema);
  const agreement = await upsertCommissionAgreement(actor, input);
  return phdJson({ success: true, agreement }, 201);
});
