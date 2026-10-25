import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { loadProposal, updateProposal } from '@/lib/phd/services/proposals';
import { proposalUpdateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/proposals/[proposalId] — full proposal with sections and citations.
export const GET = phdRoute<{ proposalId: string }>(async ({ actor, params }) => {
  const proposal = await loadProposal(actor, params.proposalId);
  return phdJson({ success: true, proposal });
});

// PATCH — validated section update. A version snapshot is created when requested.
export const PATCH = phdRoute<{ proposalId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, proposalUpdateSchema);
  const proposal = await updateProposal(actor, params.proposalId, input);
  return phdJson({ success: true, proposal });
});
