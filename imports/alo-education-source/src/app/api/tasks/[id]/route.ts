import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth as requireAuthApi } from '@/lib/api-auth';
import { requireAuth, isErrorResponse, auditLog, requirePermission } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VALID_TRANSITIONS: Record<string, string[]> = {
  TODO: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['TODO', 'BLOCKED', 'IN_REVIEW', 'CANCELLED'],
  BLOCKED: ['IN_PROGRESS', 'CANCELLED'],
  IN_REVIEW: ['IN_PROGRESS', 'DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  assigneeId: z.string().optional(),
  department: z.string().optional(),
  dueDate: z.string().optional().transform(v => v ? new Date(v) : null),
  reminderSent: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — Get task by ID with related notes                               */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const taskData = await db.task.findUnique({ where: { id } });
    if (!taskData) {
      return NextResponse.json(
        { success: false, error: 'Task not found.' },
        { status: 404 },
      );
    }

    // Fetch related notes
    const notes = await db.note.findMany({
      where: { entityType: 'TASK', entityId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { ...taskData, notes },
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update task with status transition validation                   */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requirePermission(req, 'employee.task.manage');
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Task not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Validate status transitions
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status];
      if (!allowed.includes(parsed.data.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid transition: ${existing.status} → ${parsed.data.status}. Allowed: ${allowed.join(', ') || 'none'}` },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Set completedAt when status changes to DONE
    if (parsed.data.status === 'DONE') {
      updateData.completedAt = new Date();
    } else if (parsed.data.status && parsed.data.status !== 'DONE') {
      updateData.completedAt = null;
    }

    const updated = await db.task.update({
      where: { id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      resource: 'Task',
      resourceId: id,
      details: { taskId: existing.taskId, changes: parsed.data },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Cancel task (set status to CANCELLED)                          */
/* ------------------------------------------------------------------ */

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requirePermission(req, 'employee.task.manage');
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Task not found.' },
        { status: 404 },
      );
    }

    if (existing.status === 'DONE' || existing.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Task is already done or cancelled.' },
        { status: 400 },
      );
    }

    const updated = await db.task.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'DELETE',
      resource: 'Task',
      resourceId: id,
      details: { taskId: existing.taskId, previousStatus: existing.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error cancelling task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel task.' },
      { status: 500 },
    );
  }
}
