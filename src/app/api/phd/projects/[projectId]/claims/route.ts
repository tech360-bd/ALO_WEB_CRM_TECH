import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { addEvidenceClaim } from '@/lib/phd/services/literature';
import { evidenceClaimSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/phd/projects/[projectId]/claims — an evidence claim must declare its
// support type (verified fact / source-reported / AI synthesis / hypothesis).
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, evidenceClaimSchema);
  const claim = await addEvidenceClaim(actor, params.projectId, input);
  return phdJson({ success: true, claim }, 201);
});
