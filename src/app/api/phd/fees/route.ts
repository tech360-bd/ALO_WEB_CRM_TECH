import { phdJson } from '@/lib/phd/api';
import { phdRoute, queryParam } from '@/lib/phd/routes';
import { listFees } from '@/lib/phd/services/funding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/phd/fees — tuition fee records. Each row keeps its academic year,
 * student status (home / international) and fee basis; home and international
 * amounts are never merged into one figure.
 */
export const GET = phdRoute(async ({ req }) => {
  const fees = await listFees({
    universityId: queryParam(req, 'universityId', 64) || undefined,
    academicYear: queryParam(req, 'academicYear', 20) || undefined,
  });
  return phdJson({ success: true, fees });
});
