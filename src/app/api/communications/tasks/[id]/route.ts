/** Communication task status updates — session-bound, RBAC-guarded. */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import type { AuthContext } from '@/lib/auth-middleware';
import { STAFF_POLICIES, staffGuardDenied } from '@/lib/api/staff-endpoint-guard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
const POLICY = STAFF_POLICIES.communicationTasks;
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

export const PATCH = withAuth(async (request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) => {
  const denied = staffGuardDenied(auth, POLICY, { write: true, request });
  if (denied) return denied;
  try {
    const { id } = await (context?.params ?? Promise.resolve({ id: '' }));
    if (!id) return NextResponse.json({ error: 'Task id is required' }, { status: 400, headers: NO_STORE });
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await db.communicationTask.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404, headers: NO_STORE });

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(String(body.status))) return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: NO_STORE });
      data.status = String(body.status);
      if (data.status === 'RESOLVED') {
        data.resolvedAt = new Date();
        if (typeof body.resolution === 'string') data.resolution = body.resolution;
      }
    }
    if (typeof body.resolution === 'string' && body.status !== 'RESOLVED') data.resolution = body.resolution;
    if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(body.priority))) data.priority = String(body.priority);
    if (body.deadline !== undefined) data.deadline = typeof body.deadline === 'string' && !Number.isNaN(Date.parse(body.deadline)) ? new Date(body.deadline) : null;
    if (typeof body.assignedTo === 'string') data.assignedTo = body.assignedTo;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No permitted fields to update' }, { status: 400, headers: NO_STORE });

    const task = await db.communicationTask.update({ where: { id }, data });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'COMMUNICATION_TASK_UPDATED',
        entityType: 'CommunicationTask',
        entityId: id,
        metadata: JSON.stringify({ fields: Object.keys(data), actorRole: auth.roles.join(',') }),
      },
    });
    return NextResponse.json({ task }, { headers: NO_STORE });
  } catch (error) {
    console.error('[communication-tasks] update failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, error: 'Communication task update could not be completed.' }, { status: 503, headers: NO_STORE });
  }
});
