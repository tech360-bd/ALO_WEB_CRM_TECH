import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// Keep the legacy endpoint path, but route every new session through the same
// target validation, reason capture, expiry, cookie and audit transaction.
export { POST } from '@/app/api/portal-auth/acting-as/start/route';

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  if (!auth.roles.some((role) => role.toLowerCase() === 'super_admin') || auth.actingAsSessionId) {
    return NextResponse.json({ success: false, error: 'A non-acting Super Admin session is required.' }, { status: 403 });
  }

  try {
    const logs = await db.portalAuditLog.findMany({
      where: { action: { in: ['ACTING_AS_START', 'ACTING_AS_STOP'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, logs, count: logs.length });
  } catch {
    return NextResponse.json({ success: false, error: 'Acting-As audit history is temporarily unavailable.' }, { status: 503 });
  }
}
