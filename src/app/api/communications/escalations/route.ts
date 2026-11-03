/** SLA/communication escalations — session-bound, RBAC-guarded. */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import type { AuthContext } from '@/lib/auth-middleware';
import { STAFF_POLICIES, staffGuardDenied } from '@/lib/api/staff-endpoint-guard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
const POLICY = STAFF_POLICIES.communicationTasks;
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function safeError(error: unknown) {
  console.error('[communication-escalations] request failed', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ success: false, error: 'Escalation request could not be completed.' }, { status: 503, headers: NO_STORE });
}

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: false });
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    const where: Record<string, string> = {};
    for (const field of ['status', 'type', 'counselorId'] as const) {
      const value = params.get(field);
      if (value) where[field] = value;
    }
    const escalations = await db.escalationEvent.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ escalations }, { headers: NO_STORE });
  } catch (error) { return safeError(error); }
});

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: true, request });
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = typeof body.type === 'string' ? body.type.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!type || !message) return NextResponse.json({ error: 'type and message are required' }, { status: 400, headers: NO_STORE });
    const optional = (key: string) => typeof body[key] === 'string' ? String(body[key]) : null;
    const escalation = await db.escalationEvent.create({
      data: {
        type,
        level: Number.isFinite(Number(body.level)) ? Math.min(3, Math.max(1, Number(body.level))) : 1,
        communicationId: optional('communicationId'),
        slaEventId: optional('slaEventId'),
        studentId: optional('studentId'),
        counselorId: optional('counselorId'),
        supervisorId: optional('supervisorId'),
        message,
        status: 'OPEN',
      },
    });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'COMMUNICATION_ESCALATION_CREATED',
        entityType: 'EscalationEvent',
        entityId: escalation.id,
        metadata: JSON.stringify({ type, actorRole: auth.roles.join(',') }),
      },
    });
    return NextResponse.json({ escalation }, { status: 201, headers: NO_STORE });
  } catch (error) { return safeError(error); }
});
