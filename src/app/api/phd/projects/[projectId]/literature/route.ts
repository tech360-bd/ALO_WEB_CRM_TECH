import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute, queryParam } from '@/lib/phd/routes';
import { addLiteratureSource, listLiteratureSources } from '@/lib/phd/services/literature';
import { literatureSourceSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/literature — searchable evidence library.
export const GET = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const result = await listLiteratureSources(actor, params.projectId, {
    search: queryParam(req, 'search', 120) || undefined,
    verificationStatus: queryParam(req, 'verificationStatus', 40) || undefined,
    page: Number.parseInt(queryParam(req, 'page', 6), 10) || 1,
    pageSize: Number.parseInt(queryParam(req, 'pageSize', 6), 10) || 20,
  });
  return phdJson({ success: true, ...result });
});

// POST /api/phd/projects/[projectId]/literature — a source record is stored with
// its verification status; it is never presented as verified by default.
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, literatureSourceSchema);
  const source = await addLiteratureSource(actor, params.projectId, input);
  return phdJson({ success: true, source }, 201);
});
