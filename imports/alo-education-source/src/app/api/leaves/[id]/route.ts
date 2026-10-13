import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, requirePermission } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  rejectionReason: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — Get leave by ID                                                  */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const record = await db.leaveRequest.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching leave:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave request.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Approve/reject/cancel leave                                     */
/*    RBAC: only HR_MANAGER, SUPER_ADMIN, ADMIN, or employee's manager     */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await db.leaveRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Cancelling: the employee can cancel their own pending request
    if (parsed.data.status === 'CANCELLED') {
      if (existing.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: 'Only pending requests can be cancelled.' },
          { status: 400 },
        );
      }
      // Allow self-cancel or admin
      const employee = await db.employeeHR.findFirst({ where: { userId: auth.user.id } });
      const isSelf = employee?.id === existing.employeeId;
      const isAdmin = auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'ADMIN';
      if (!isSelf && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Access denied. You can only cancel your own pending requests.' },
          { status: 403 },
        );
      }

      const updated = await db.leaveRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      await auditLog({
        userId: auth.user.id,
        action: 'UPDATE',
        resource: 'LeaveRequest',
        resourceId: id,
        details: { status: 'CANCELLED' },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Approve/reject: check RBAC
    const employee = await db.employeeHR.findFirst({ where: { id: existing.employeeId } });
    const canApprove =
      auth.user.role === 'SUPER_ADMIN' ||
      auth.user.role === 'ADMIN' ||
      auth.user.role === 'HR_MANAGER' ||
      (employee && employee.userId === auth.user.id); // fallback

    // Check if the approver is the employee's manager
    const approverEmp = await db.employeeHR.findFirst({ where: { userId: auth.user.id } });
    const isManager = approverEmp?.designation === 'HR Manager' || approverEmp?.department === employee?.department;

    if (!canApprove && !isManager) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only HR Manager, Super Admin, Admin, or the employee\'s manager can approve leave.' },
        { status: 403 },
      );
    }

    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending requests can be approved or rejected.' },
        { status: 400 },
      );
    }

    if (parsed.data.status === 'REJECTED' && !parsed.data.rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required.' },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      approvedBy: auth.user.id,
      approvedAt: new Date(),
    };
    if (parsed.data.rejectionReason) {
      updateData.rejectionReason = parsed.data.rejectionReason;
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: updateData,
    });

    // Create notification for the employee
    if (employee?.userId) {
      try {
        await db.notification.create({
          data: {
            userId: employee.userId,
            type: 'LEAVE_UPDATE',
            title: `Leave Request ${parsed.data.status}`,
            message: `Your ${existing.type} leave request (${existing.startDate} to ${existing.endDate}) has been ${parsed.data.status?.toLowerCase()}.`,
            data: JSON.stringify({ leaveRequestId: id }),
          },
        });
      } catch {
        // Notification failure should not break the flow
      }
    }

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      resource: 'LeaveRequest',
      resourceId: id,
      details: { status: parsed.data.status, employeeId: existing.employeeId },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating leave:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update leave request.' },
      { status: 500 },
    );
  }
}
