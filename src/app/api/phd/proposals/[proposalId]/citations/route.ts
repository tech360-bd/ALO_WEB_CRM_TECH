import { z } from 'zod';
import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute, queryParam } from '@/lib/phd/routes';
import { attachCitation, removeCitation } from '@/lib/phd/services/proposals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const attachSchema = z.object({
  sourceId: z.string().max(64).optional().nullable(),
  sectionKey: z.string().trim().min(1).max(64),
  rawText: z.string().trim().min(3).max(2000),
  claimText: z.string().max(2000).optional(),
});

// POST /api/phd/proposals/[proposalId]/citations — validated against the stored
// evidence library; an unverifiable citation is retained but flagged.
export const POST = phdRoute<{ proposalId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, attachSchema);
  const citation = await attachCitation(actor, params.proposalId, input);
  return phdJson({ success: true, citation }, 201);
});

// DELETE /api/phd/proposals/[proposalId]/citations?citationId=…
export const DELETE = phdRoute<{ proposalId: string }>(async ({ actor, req, params }) => {
  const citationId = queryParam(req, 'citationId', 64);
  const result = await removeCitation(actor, params.proposalId, citationId);
  return phdJson({ success: true, ...result });
});
