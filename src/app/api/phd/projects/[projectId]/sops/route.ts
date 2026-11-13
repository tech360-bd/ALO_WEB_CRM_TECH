import { phdJson, enforceRateLimit, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { createSop, listSops } from '@/lib/phd/services/sop';
import { sopCreateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/sops — statements for this project.
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const sops = await listSops(actor, params.projectId);
  return phdJson({ success: true, sops });
});

// POST — creates one statement per (project, university, programme).
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  enforceRateLimit(req, actor, 'phd-sop-create', 10, 60_000);
  const input = await readPhdJson(req, sopCreateSchema.omit({ projectId: true }));
  const sop = await createSop(actor, { ...input, projectId: params.projectId });
  return phdJson({ success: true, sop }, 201);
});
