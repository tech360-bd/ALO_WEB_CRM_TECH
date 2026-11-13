import { phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { qualityReportForProposal } from '@/lib/phd/services/proposals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/proposals/[proposalId]/quality — alignment checks, unsupported
// claims and the programme's verified requirements (or the general-draft label).
export const GET = phdRoute<{ proposalId: string }>(async ({ actor, params }) => {
  const result = await qualityReportForProposal(actor, params.proposalId);
  return phdJson({
    success: true,
    report: result.report,
    requirements: result.requirements,
  });
});
