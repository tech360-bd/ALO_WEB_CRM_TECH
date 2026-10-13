import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/ai/tasks/[id]/approve
 * Body: { action: 'approve' | 'reject' | 'escalate' | 'retry', note?: string }
 * Requires: SUPER_ADMIN or ADMIN role
 *
 * Actions:
 * - approve: Set task to COMPLETED, mark approved
 * - reject: Set task to REJECTED, record reason
 * - escalate: Set task to ESCALATED
 * - retry: Reset task to QUEUED for re-processing
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { error, user } = await requireRole(request, ['SUPER_ADMIN', 'ADMIN']);
    if (error) return error;

    const { id } = await context.params;
    const body = await request.json();
    const { action, note } = body as { action?: string; note?: string };

    const validActions = ['approve', 'reject', 'escalate', 'retry', 'edit'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, { status: 400 });
    }

    const task = await db.aiTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 'PENDING_APPROVAL' && task.status !== 'FAILED' && task.status !== 'REJECTED') {
      if (action === 'retry' && (task.status === 'COMPLETED' || task.status === 'FAILED')) {
        // Allow retry on completed/failed tasks
      } else {
        return NextResponse.json({ error: `Cannot ${action} task with status: ${task.status}` }, { status: 400 });
      }
    }

    const userId = user?.id;

    let newStatus: string;
    let updateData: Record<string, unknown> = {};
    switch (action) {
      case 'approve':
        newStatus = 'COMPLETED';
        break;
      case 'reject':
        newStatus = 'REJECTED';
        break;
      case 'escalate':
        newStatus = 'ESCALATED';
        break;
      case 'retry':
        newStatus = 'QUEUED';
        updateData = { error: null, startedAt: null, completedAt: null };
        break;
      case 'edit':
        // Edit: keep PENDING_APPROVAL status, allow updating the result/note
        newStatus = task.status; // keep current status
        const { result: editResult } = body as { result?: string };
        if (editResult) updateData.result = editResult;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await db.aiTask.update({
      where: { id },
      data: {
        status: newStatus,
        approvalStatus: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : action === 'escalate' ? 'ESCALATED' : action === 'edit' ? 'EDITED' : 'RETRY',
        approvedById: userId,
        approvedAt: action !== 'retry' ? new Date() : null,
        approvalNote: note ?? null,
        ...updateData,
      },
    });

    // Log the approval action
    await db.aiTaskLog.create({
      data: {
        taskId: id,
        event: `APPROVAL_${action.toUpperCase()}`,
        level: 'INFO',
        message: `Task ${action}ed by ${userId}. Note: ${note ?? 'none'}`,
      },
    });

    // If approved, update agent success counter
    if (action === 'approve' && task.agentId) {
      await db.aiAgent.update({
        where: { id: task.agentId },
        data: {
          taskSuccessCount: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
