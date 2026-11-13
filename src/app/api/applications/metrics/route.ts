import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { canReadApplicationDashboard, getApplicationDashboardMetrics } from '@/lib/application-manager/dashboard-metrics';
import { db } from '@/lib/db';

export const GET = withAuth(async (_req, auth) => {
  if (!canReadApplicationDashboard(auth)) return NextResponse.json({ success: false, error: 'Forbidden: Application Manager metrics permission required.' }, { status: 403 });
  try {
    const { metrics, total, active, canViewB2B: hasB2bAccess } = await getApplicationDashboardMetrics(auth);
    const enriched: Record<string, any> = { ...metrics, total, active };
    if (hasB2bAccess) {
      enriched.confidentialB2bCases = metrics.b2b || 0;
      enriched.b2bProviders = await db.b2bProvider.count();
    }
    return NextResponse.json({ success: true, data: enriched, metrics: enriched, kpis: enriched, meta: { canViewB2B: hasB2bAccess } });
  } catch (error) {
    console.error('[applications.metrics] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to load Application Manager metrics.' }, { status: 503 });
  }
});
