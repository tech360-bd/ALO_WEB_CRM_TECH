// GET /api/super-admin/dashboard
//
// Single source of truth for the Super Admin operating dashboard.
// Previously this route returned fabricated fallbacks (`studentCount || 1420`,
// `newStudentsToday: 18`, `aiJobsRunning: 8`). Those are gone: every value now
// comes from a real query and an unreadable source is reported as unavailable.

import { NextResponse } from 'next/server';
import { withAuth, type AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { getOperatingMetrics } from '@/lib/super-admin/metrics';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const metrics = await getOperatingMetrics(auth.name || auth.actorName || null);
    // Reading the whole business overview is itself a sensitive event.
    await logAuditAction(auth, 'SUPER_ADMIN_DASHBOARD_VIEWED', 'SuperAdminDashboard', 'overview', {
      kpiCount: metrics.kpis.length,
      unavailableKpis: metrics.kpis.filter((kpi) => !kpi.available).map((kpi) => kpi.key),
    });
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[super-admin/dashboard] metrics aggregation failed', error);
    return NextResponse.json(
      { success: false, error: 'Dashboard metrics are temporarily unavailable.' },
      { status: 503 },
    );
  }
}

export const GET = withAuth(handleGet);
