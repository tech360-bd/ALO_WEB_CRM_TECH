import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute, queryParam } from '@/lib/phd/routes';
import { createSourceEvidence, listSourceEvidence } from '@/lib/phd/services/sources';
import { evidenceCreateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/sources — verification queue (verifier/administrator only).
export const GET = phdRoute(async ({ actor, req }) => {
  const result = await listSourceEvidence(actor, {
    status: queryParam(req, 'status', 40) || undefined,
    entityType: queryParam(req, 'entityType', 40) || undefined,
    page: Number.parseInt(queryParam(req, 'page', 6), 10) || 1,
    pageSize: Number.parseInt(queryParam(req, 'pageSize', 6), 10) || 25,
  });
  return phdJson({ success: true, ...result });
});

// POST /api/phd/sources — records a claim with its exact source and excerpt.
export const POST = phdRoute(async ({ actor, req }) => {
  const input = await readPhdJson(req, evidenceCreateSchema);
  const evidence = await createSourceEvidence(actor, input);
  return phdJson({ success: true, evidence }, 201);
});
