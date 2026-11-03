/** Communication tasks — session-bound, RBAC-guarded, same-origin writes. */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import type { AuthContext } from '@/lib/auth-middleware';
import { STAFF_POLICIES, staffGuardDenied } from '@/lib/api/staff-endpoint-guard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
const POLICY = STAFF_POLICIES.communicationTasks;
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function safeError(error: unknown) {
  console.error('[communication-tasks] request failed', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ success: false, error: 'Communication task request could not be completed.' }, { status: 503, headers: NO_STORE });
}

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: false });
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    const where: Record<string, string> = {};
    for (const field of ['assignedTo', 'status', 'studentId', 'priority'] as const) {
      const value = params.get(field);
      if (value) where[field] = value;
    }
    const tasks = await db.communicationTask.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ tasks }, { headers: NO_STORE });
  } catch (error) { return safeError(error); }
});

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: true, request });
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400, headers: NO_STORE });
    const optional = (key: string) => typeof body[key] === 'string' ? String(body[key]) : null;
    const task = await db.communicationTask.create({
      data: {
        title,
        description: optional('description'),
        communicationMessageId: optional('communicationMessageId'),
        socialInboxMessageId: optional('socialInboxMessageId'),
        studentId: optional('studentId'),
        applicationId: optional('applicationId'),
        assignedTo: optional('assignedTo'),
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(body.priority)) ? String(body.priority) : 'MEDIUM',
        status: 'OPEN',
        source: ['COMMUNICATION', 'AI_CLASSIFICATION', 'ESCALATION', 'MANUAL'].includes(String(body.source)) ? String(body.source) : 'COMMUNICATION',
        deadline: typeof body.deadline === 'string' && !Number.isNaN(Date.parse(body.deadline)) ? new Date(body.deadline) : null,
        createdBy: auth.actorUserId || auth.userId,
      },
    });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'COMMUNICATION_TASK_CREATED',
        entityType: 'CommunicationTask',
        entityId: task.id,
        metadata: JSON.stringify({ actorRole: auth.roles.join(',') }),
      },
    });
    return NextResponse.json({ task }, { status: 201, headers: NO_STORE });
  } catch (error) { return safeError(error); }
});
