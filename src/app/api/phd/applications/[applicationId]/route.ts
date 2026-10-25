import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { applicationChecklist, getApplication, updateApplication } from '@/lib/phd/services/applications';
import { applicationUpdateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/applications/[applicationId]?checklist=1
export const GET = phdRoute<{ applicationId: string }>(async ({ actor, req, params }) => {
  const includeChecklist = new URL(req.url).searchParams.get('checklist') === '1';
  const application = await getApplication(actor, params.applicationId);
  if (!includeChecklist) return phdJson({ success: true, application });
  const checklist = await applicationChecklist(actor, params.applicationId);
  return phdJson({ success: true, application, checklist });
});

// PATCH — application and funding statuses are separate fields; one never
// overwrites the other.
export const PATCH = phdRoute<{ applicationId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, applicationUpdateSchema);
  const application = await updateApplication(actor, params.applicationId, input);
  return phdJson({ success: true, application });
});
