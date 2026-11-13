import { phdJson, readPhdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { listVersions, restoreVersion } from '@/lib/phd/services/sop';
import { sopRestoreSchema } from '@/lib/phd/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — saved versions, newest first.
export const GET = phdRoute<{ sopId: string }>(async ({ actor, params }) => {
  const versions = await listVersions(actor, params.sopId);
  return phdJson({ success: true, versions });
});

// POST — restores a version into the live sections (as a new version).
export const POST = phdRoute<{ sopId: string }>(async ({ actor, req, params }) => {
  const input = await readPhdJson(req, sopRestoreSchema);
  const result = await restoreVersion(actor, params.sopId, input.versionId);
  return phdJson({ success: true, ...result });
});
