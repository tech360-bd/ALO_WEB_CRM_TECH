import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute, queryParam } from '@/lib/phd/routes';
import { createSupervisor, listSupervisors } from '@/lib/phd/services/supervisors';
import { supervisorCreateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/phd/supervisors — the supervisor directory.
 *
 * Authenticated only: records can contain institutional contact details. Every
 * record carries its own verification status and availability status; a profile
 * existing is never presented as an offer to supervise.
 */
export const GET = phdRoute(async ({ req }) => {
  const result = await listSupervisors({
    search: queryParam(req, 'search', 120) || undefined,
    universityId: queryParam(req, 'universityId', 64) || undefined,
    availability: queryParam(req, 'availability', 40) || undefined,
    page: Number.parseInt(queryParam(req, 'page', 6), 10) || 1,
    pageSize: Number.parseInt(queryParam(req, 'pageSize', 6), 10) || 25,
  });
  return phdJson({ success: true, ...result });
});

// POST /api/phd/supervisors — verifier/administrator only (enforced in the service).
export const POST = phdRoute(async ({ actor, req }) => {
  const input = await readPhdJson(req, supervisorCreateSchema);
  const supervisor = await createSupervisor(actor, input);
  return phdJson({ success: true, supervisor }, 201);
});
