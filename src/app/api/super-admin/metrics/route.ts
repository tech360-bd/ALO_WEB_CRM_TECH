// GET /api/super-admin/metrics — KPI cards only (lighter poll target).

import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { getOperatingMetrics } from '@/lib/super-admin/metrics';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  try {
    const { kpis, generatedAt, warnings } = await getOperatingMetrics(auth.actorName || null);
    return NextResponse.json({ success: true, generatedAt, kpis, warnings });
  } catch (error) {
    console.error('[super-admin/metrics] failed', error);
    return NextResponse.json({ success: false, error: 'Metrics are temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
