import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { createProposal, listProposals } from '@/lib/phd/services/proposals';
import { proposalCreateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/proposals
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const proposals = await listProposals(actor, params.projectId);
  return phdJson({ success: true, proposals });
});

// POST /api/phd/projects/[projectId]/proposals — one proposal per programme is
// allowed; the service applies the 20 default sections.
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const body = await readPhdJson(req, proposalCreateSchema.omit({ projectId: true }));
  const proposal = await createProposal(actor, { ...body, projectId: params.projectId });
  return phdJson({ success: true, proposal }, 201);
});
