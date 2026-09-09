import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE LEAVE API
// GET  — List leave requests (CounselorTasks with type='leave')
// POST — Create a leave request
// PUT  — Approve or reject a leave request (manager action)
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      const where: Record<string, unknown> = {
        employeeId,
        type: 'leave',
      };

      if (status) where.status = status;

      const [leaves, total] = await Promise.all([
        db.counselorTask.findMany({
          where,
          orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.counselorTask.count({ where }),
      ]);

      // Count leave statuses
      const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
        db.counselorTask.count({ where: { employeeId, type: 'leave', status: 'pending' } }),
        db.counselorTask.count({ where: { employeeId, type: 'leave', status: 'approved' } }),
        db.counselorTask.count({ where: { employeeId, type: 'leave', status: 'rejected' } }),
      ]);

      return NextResponse.json({
        success: true,
        data: leaves,
        summary: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Employee leave GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          summary: { pending: 0, approved: 0, rejected: 0, total: 0 },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load leave requests' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { title, description, leaveType, startDate, endDate } = body;

      if (!title) {
        return NextResponse.json(
          { success: false, error: 'Leave title/reason is required' },
          { status: 400 }
        );
      }

      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      const leave = await db.counselorTask.create({
        data: {
          employeeId,
          title: `[${leaveType || 'general'}] ${title}`,
          description: description || '',
          type: 'leave',
          priority: 'medium',
          status: 'pending',
          dueDate: startDate || '',
          // Store leave details in description
          ...((description) ? {} : { description: `Leave Type: ${leaveType || 'general'}\nStart: ${startDate || 'TBD'}\nEnd: ${endDate || 'TBD'}` }),
        },
      });

      await logAuditAction(auth, 'create_leave_request', 'CounselorTask', leave.id, {
        title: leave.title,
        leaveType: leaveType || 'general',
        startDate,
        endDate,
      });

      return NextResponse.json({
        success: true,
        data: leave,
        message: 'Leave request submitted successfully',
      });
    } catch (error) {
      console.error('Employee leave POST error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to submit leave request' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { id, status, note } = body;

      if (!id || !status) {
        return NextResponse.json(
          { success: false, error: 'Leave id and new status are required' },
          { status: 400 }
        );
      }

      if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Status must be approved or rejected' },
          { status: 400 }
        );
      }

      // Check if user has permission to approve/reject
      const isManager = auth.roles.some(r =>
        ['super_admin', 'manager', 'hr', 'branch_manager', 'ceo'].includes(r)
      );

      if (!isManager) {
        return NextResponse.json(
          { success: false, error: 'Only managers can approve/reject leave requests' },
          { status: 403 }
        );
      }

      const existingLeave = await db.counselorTask.findUnique({
        where: { id },
      });

      if (!existingLeave || existingLeave.type !== 'leave') {
        return NextResponse.json(
          { success: false, error: 'Leave request not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {
        status,
      };
      if (note) {
        updateData.description = `${existingLeave.description}\n---\n${status === 'approved' ? 'Approved' : 'Rejected'} by ${auth.name} on ${new Date().toISOString()}\nNote: ${note}`;
      }
      if (status === 'approved') {
        updateData.completedAt = new Date();
      }

      const updated = await db.counselorTask.update({
        where: { id },
        data: updateData,
      });

      await logAuditAction(auth, `leave_${status}`, 'CounselorTask', id, {
        previousStatus: existingLeave.status,
        newStatus: status,
        note: note || '',
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Leave request ${status}`,
      });
    } catch (error) {
      console.error('Employee leave PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update leave request' },
        { status: 500 }
      );
    }
  })(request);
}
