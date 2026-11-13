import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { canReadApplicationDashboard, getApplicationDashboardMetrics } from '@/lib/application-manager/dashboard-metrics';

export const GET = withAuth(async (_req, auth) => {
  if (!canReadApplicationDashboard(auth)) return NextResponse.json({ success: false, error: 'Forbidden: Application Manager dashboard permission required.' }, { status: 403 });
  try {
    const { metrics, total, active, canViewB2B } = await getApplicationDashboardMetrics(auth);
    return NextResponse.json({ success: true, data: metrics, metrics, kpis: metrics, total, active, meta: { canViewB2B } });
  } catch (error) {
    console.error('[applications.dashboard] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to load Application Manager metrics.' }, { status: 503 });
  }
});
