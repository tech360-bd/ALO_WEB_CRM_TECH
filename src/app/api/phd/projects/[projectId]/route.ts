import { phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { projectDetail } from '@/lib/phd/services/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/projects/[projectId] — ownership-checked project overview.
export const GET = phdRoute<{ projectId: string }>(async ({ actor, params }) => {
  const detail = await projectDetail(actor, params.projectId);
  return phdJson({ success: true, ...detail });
});
