// GET /api/super-admin/approvals — Approval Center feed.
// Combines the canonical ApprovalRequest table with AI jobs that are waiting
// for a human decision, so the Super Admin sees one queue.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import type { ApprovalRow } from '@/lib/super-admin/types';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const status = (url.searchParams.get('status') || 'pending').trim().toLowerCase().slice(0, 30);

  try {
    const [approvals, aiWaiting] = await Promise.all([
      db.approvalRequest.findMany({
        where: status === 'all' ? {} : { status },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 200,
      }),
      db.aiTask.findMany({
        where: { status: 'WAITING' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, taskCode: true, agentName: true, department: true, action: true, priority: true, createdAt: true },
      }).catch(() => []),
    ]);

    const rows: ApprovalRow[] = [
      ...approvals.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        requestedByName: row.requestedByName,
        status: row.status,
        priority: row.priority,
        entityType: row.entityType,
        entityId: row.entityId,
        createdAt: row.createdAt.toISOString(),
        deadline: row.deadline?.toISOString() || null,
      })),
      ...aiWaiting.map((task) => ({
        id: `ai-task:${task.id}`,
        type: 'AI_AGENT_ACTION',
        title: `${task.agentName} — ${task.action}`,
        description: `AI task ${task.taskCode} is waiting for human approval before it can run.`,
        requestedByName: 'ALO AI Agent Network',
        status: 'pending',
        priority: task.priority.toLowerCase(),
        entityType: 'AiTask',
        entityId: task.id,
        createdAt: task.createdAt.toISOString(),
        deadline: null,
      })),
    ];

    return NextResponse.json({
      success: true,
      approvals: rows,
      counts: {
        pending: rows.filter((row) => row.status === 'pending').length,
        aiWaiting: aiWaiting.length,
        critical: rows.filter((row) => row.priority === 'critical' || row.priority === 'urgent').length,
      },
    });
  } catch (error) {
    console.error('[super-admin/approvals] failed', error);
    return NextResponse.json({ success: false, error: 'Approval Center is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
