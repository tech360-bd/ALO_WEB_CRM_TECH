/**
 * POST /api/university-catalogue/coverage/decide
 * ---------------------------------------------
 * Super Admin approval / rejection of staged course-month data.
 *
 * Body: { action: 'APPROVE' | 'REJECT', coverageKeys?: string[], reason?: string }
 *
 * Two independent authorization layers:
 *   1. the route guard (requireMonitoringAdmin) resolves the session and role,
 *   2. the publish library re-resolves the actor from the database, so a forged
 *      request body cannot impersonate a Super Admin.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMonitoringAdmin } from '@/lib/university-monitoring-auth';
import { approveCoverage, rejectCoverage, AuthorizationError } from '@/lib/verified-catalogue/publish';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;

  let body: { action?: string; coverageKeys?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'A JSON body is required.' }, { status: 400 });
  }

  const action = String(body.action ?? '').toUpperCase();
  if (action !== 'APPROVE' && action !== 'REJECT') {
    return NextResponse.json({ success: false, error: "action must be 'APPROVE' or 'REJECT'." }, { status: 400 });
  }
  const coverageKeys = Array.isArray(body.coverageKeys)
    ? body.coverageKeys.filter((key): key is string => typeof key === 'string' && key.length <= 191)
    : undefined;
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 2000) : '';
  const actorUserId = guard.actor?.userId;
  if (!actorUserId) {
    return NextResponse.json({ success: false, error: 'An authenticated Super Admin is required.' }, { status: 403 });
  }

  try {
    if (action === 'APPROVE') {
      const result = await approveCoverage(db, { actorUserId, coverageKeys, note: reason || 'API approval' });
      return NextResponse.json({ success: true, ...result });
    }
    if (!reason) {
      return NextResponse.json({ success: false, error: 'A reason is required to reject verified data.' }, { status: 400 });
    }
    const result = await rejectCoverage(db, { actorUserId, coverageKeys, reason });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'The decision could not be recorded.' }, { status: 500 });
  }
}
