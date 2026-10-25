import { phdJson } from '@/lib/phd/api';
import { phdRoute } from '@/lib/phd/routes';
import { getDashboard } from '@/lib/phd/services/dashboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/phd/dashboard — real database counts only; no sample records.
export const GET = phdRoute(async ({ actor }) => {
  const dashboard = await getDashboard(actor);
  return phdJson({ success: true, dashboard });
});
