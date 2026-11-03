/** Acknowledge/resolve an escalation — session-bound, RBAC-guarded. */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import type { AuthContext } from '@/lib/auth-middleware';
import { STAFF_POLICIES, staffGuardDenied } from '@/lib/api/staff-endpoint-guard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
const POLICY = STAFF_POLICIES.communicationTasks;
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'];

export const PATCH = withAuth(async (request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) => {
  const denied = staffGuardDenied(auth, POLICY, { write: true, request });
  if (denied) return denied;
  try {
    const { id } = await (context?.params ?? Promise.resolve({ id: '' }));
    if (!id) return NextResponse.json({ error: 'Escalation id is required' }, { status: 400, headers: NO_STORE });
    const body = (await request.json()) as Record<string, unknown>;
    if (!STATUSES.includes(String(body.status))) {
      return NextResponse.json({ error: 'status must be OPEN, ACKNOWLEDGED, RESOLVED, or CLOSED' }, { status: 400, headers: NO_STORE });
    }
    const existing = await db.escalationEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Escalation not found' }, { status: 404, headers: NO_STORE });

    const status = String(body.status);
    const data: Record<string, unknown> = { status };
    if (typeof body.actionTaken === 'string') data.actionTaken = body.actionTaken;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      data.resolvedAt = typeof body.resolvedAt === 'string' && !Number.isNaN(Date.parse(body.resolvedAt)) ? new Date(body.resolvedAt) : new Date();
    }

    const escalation = await db.escalationEvent.update({ where: { id }, data });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'COMMUNICATION_ESCALATION_UPDATED',
        entityType: 'EscalationEvent',
        entityId: id,
        metadata: JSON.stringify({ status, actorRole: auth.roles.join(',') }),
      },
    });
    return NextResponse.json({ escalation }, { headers: NO_STORE });
  } catch (error) {
    console.error('[communication-escalations] update failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, error: 'Escalation update could not be completed.' }, { status: 503, headers: NO_STORE });
  }
});
