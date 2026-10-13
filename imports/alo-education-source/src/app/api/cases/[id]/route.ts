import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, requirePermission } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'WAITING_APPROVAL', 'ESCALATED', 'RESOLVED', 'CLOSED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'URGENT'];
const VALID_RISKS = ['LOW', 'MEDIUM', 'HIGH'];

const updateCaseSchema = z.object({
  type: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'WAITING_APPROVAL', 'ESCALATED', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  nextAction: z.string().optional(),
  dueDate: z.string().optional().transform(v => v ? new Date(v) : null),
  ownerId: z.string().optional(),
  resolution: z.string().optional(),
  escalationReason: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — Get case by ID with timeline (notes + tasks)                   */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const caseData = await db.case.findUnique({ where: { id } });
    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found.' },
        { status: 404 },
      );
    }

    // Students can only see their own cases
    if (auth.user.role === 'STUDENT' && caseData.studentId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied.' },
        { status: 403 },
      );
    }

    // Fetch related notes and tasks for timeline
    const [notes, tasks, slaRecords] = await Promise.all([
      db.note.findMany({
        where: { entityType: 'CASE', entityId: id },
        orderBy: { createdAt: 'desc' },
      }),
      db.task.findMany({
        where: { caseId: id },
        orderBy: { createdAt: 'desc' },
      }),
      db.slaRecord.findMany({
        where: { entityType: 'CASE', entityId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...caseData, notes, tasks, slaRecords },
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update case fields, handle status transitions                  */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, 'employee.case.manage');
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Case not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Handle status transitions
    if (parsed.data.status && parsed.data.status !== existing.status) {
      // If status changes to RESOLVED or CLOSED, complete any running SLA records
      if (parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED') {
        await db.slaRecord.updateMany({
          where: { entityType: 'CASE', entityId: id, status: 'RUNNING' },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }

      // If status changes to ESCALATED, update SLA records
      if (parsed.data.status === 'ESCALATED') {
        await db.slaRecord.updateMany({
          where: { entityType: 'CASE', entityId: id, status: 'RUNNING' },
          data: { status: 'ESCALATED', escalatedAt: new Date() },
        });
      }
    }

    const updated = await db.case.update({
      where: { id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      resource: 'Case',
      resourceId: id,
      details: { changes: parsed.data },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update case.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Soft-close case (set status to CANCELLED)                    */
/* ------------------------------------------------------------------ */

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, 'employee.case.manage');
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Case not found.' },
        { status: 404 },
      );
    }

    if (existing.status === 'CLOSED' || existing.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Case is already closed or cancelled.' },
        { status: 400 },
      );
    }

    const updated = await db.case.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Cancel running SLA records
    await db.slaRecord.updateMany({
      where: { entityType: 'CASE', entityId: id, status: 'RUNNING' },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'DELETE',
      resource: 'Case',
      resourceId: id,
      details: { caseId: existing.caseId, previousStatus: existing.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error cancelling case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel case.' },
      { status: 500 },
    );
  }
}
