import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { createApplication, listApplications } from '@/lib/phd/services/applications';
import { applicationCreateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId]/applications — includes shortlisted
// programmes still in RESEARCHING status.
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const applications = await listApplications(actor, params.projectId);
  return phdJson({ success: true, applications });
});

// POST /api/phd/projects/[projectId]/applications
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const body = await readPhdJson(req, applicationCreateSchema.omit({ projectId: true }));
  const application = await createApplication(actor, { ...body, projectId: params.projectId });
  return phdJson({ success: true, application }, 201);
});
