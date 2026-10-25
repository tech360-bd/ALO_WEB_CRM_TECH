import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { restoreProposalVersion } from '@/lib/phd/services/proposals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const restoreSchema = z.object({ versionId: z.string().min(1).max(64) });

// POST /api/phd/proposals/[proposalId]/restore — restores an earlier version as a
// new version (history is never destroyed).
export const POST = phdRoute<{ proposalId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, restoreSchema);
  const proposal = await restoreProposalVersion(actor, params.proposalId, input.versionId);
  return phdJson({ success: true, proposal });
});
