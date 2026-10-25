import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { createDeadline, listDeadlines } from '@/lib/phd/services/funding';
import { deadlineCreateSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — deadlines carry an assessed state (upcoming / closing soon / expired /
// date not published / needs verification). An expired date is never "open".
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const deadlines = await listDeadlines(actor, params.projectId);
  return phdJson({ success: true, deadlines });
});

// POST — an applicant may add their own deadline; the service records who created it.
export const POST = phdRoute<{ projectId: string }>(async ({ actor, req, params }) => {
  const body = await readPhdJson(req, deadlineCreateSchema.omit({ projectId: true }));
  const deadline = await createDeadline(actor, { ...body, projectId: params.projectId });
  return phdJson({ success: true, deadline }, 201);
});
