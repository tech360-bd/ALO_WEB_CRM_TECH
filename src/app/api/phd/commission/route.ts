import { phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { canVerify, PhdAccessError } from '@/lib/phd/auth';
import { commissionSummary, listCommissionAgreements, listCommissionDocuments } from '@/lib/phd/services/commission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/phd/commission — business-operations view of the supplied Spring 2027
 * commission structure. Academic eligibility is a separate dataset: nothing here
 * is used in supervisor matching or proposal scoring.
 */
export const GET = phdRoute(async ({ actor }) => {
  if (!canVerify(actor)) {
    throw new PhdAccessError('Only a data verifier or administrator can open the commission tracker.', 403);
  }
  const [summary, agreements, documents] = await Promise.all([
    commissionSummary(),
    listCommissionAgreements(),
    listCommissionDocuments(),
  ]);
  return phdJson({ success: true, summary, agreements, documents });
});
