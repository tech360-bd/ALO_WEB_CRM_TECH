import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM TASKS API — CounselorTask CRUD with filters & pagination
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get('employeeId') || '';
      const status = searchParams.get('status') || '';
      const priority = searchParams.get('priority') || '';
      const type = searchParams.get('type') || '';
      const search = searchParams.get('search') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      const where: Record<string, unknown> = {};

      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (type) where.type = type;
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const [data, total] = await Promise.all([
        db.counselorTask.findMany({
          where,
          orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.counselorTask.count({ where }),
      ]);

      const overdueCount = await db.counselorTask.count({
        where: {
          status: 'pending',
          dueDate: { lt: new Date().toISOString().split('T')[0], not: '' },
        },
      });

      const statusCounts = await db.counselorTask.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      return NextResponse.json({
        success: true,
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        meta: { overdueCount, statusCounts },
      });
    } catch (error) {
      console.error('Tasks GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load tasks' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { employeeId, studentId, leadId, title, description, type, priority, dueDate } = body;

      if (!employeeId || !title) {
        return NextResponse.json({ success: false, error: 'employeeId and title are required' }, { status: 400 });
      }

      const task = await db.counselorTask.create({
        data: {
          employeeId: employeeId || auth.userId,
          studentId: studentId || '',
          leadId: leadId || '',
          title,
          description: description || '',
          type: type || 'follow_up',
          priority: priority || 'medium',
          status: 'pending',
          dueDate: dueDate || '',
        },
      });

      await logAuditAction(auth, 'create_task', 'CounselorTask', task.id, { title, type, priority });

      return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (error) {
      console.error('Tasks POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, title, description, status, priority, type, dueDate, markComplete } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: 'Task id is required' }, { status: 400 });
      }

      const existing = await db.counselorTask.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (type !== undefined) updateData.type = type;
      if (dueDate !== undefined) updateData.dueDate = dueDate;

      if (markComplete || status === 'completed') {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      }

      const task = await db.counselorTask.update({
        where: { id },
        data: updateData,
      });

      await logAuditAction(auth, 'update_task', 'CounselorTask', id, {
        before: { status: existing.status, priority: existing.priority },
        after: updateData,
      });

      return NextResponse.json({ success: true, data: task });
    } catch (error) {
      console.error('Tasks PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
    }
  })(request);
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ success: false, error: 'Task id is required' }, { status: 400 });
      }

      const existing = await db.counselorTask.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }

      await db.counselorTask.delete({ where: { id } });
      await logAuditAction(auth, 'delete_task', 'CounselorTask', id, { title: existing.title });

      return NextResponse.json({ success: true, message: 'Task deleted' });
    } catch (error) {
      console.error('Tasks DELETE error:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
    }
  })(request);
}
