import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE TASKS API
// GET  — List CounselorTasks for the authenticated employee
// POST — Create a new task
// PUT  — Update a task (mark complete, update fields)
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const priority = searchParams.get('priority') || '';
      const type = searchParams.get('type') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Get employeeId from EmployeeProfile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      const where: Record<string, unknown> = { employeeId };

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
        ];
      }
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (type) where.type = type;

      const [tasks, total] = await Promise.all([
        db.counselorTask.findMany({
          where,
          orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.counselorTask.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Employee tasks GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load tasks' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { title, description, type, priority, status, dueDate, studentId, leadId } = body;

      if (!title) {
        return NextResponse.json(
          { success: false, error: 'Task title is required' },
          { status: 400 }
        );
      }

      // Get employeeId from EmployeeProfile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      const task = await db.counselorTask.create({
        data: {
          employeeId,
          title,
          description: description || '',
          type: type || 'follow_up',
          priority: priority || 'medium',
          status: status || 'pending',
          dueDate: dueDate || '',
          studentId: studentId || '',
          leadId: leadId || '',
        },
      });

      await logAuditAction(auth, 'create_task', 'CounselorTask', task.id, {
        title: task.title,
        type: task.type,
        priority: task.priority,
      });

      return NextResponse.json({
        success: true,
        data: task,
        message: 'Task created successfully',
      });
    } catch (error) {
      console.error('Employee tasks POST error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create task' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { id, title, description, type, priority, status, dueDate, completedAt } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Task id is required' },
          { status: 400 }
        );
      }

      // Get employeeId for ownership check
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      const existingTask = await db.counselorTask.findUnique({
        where: { id },
      });

      if (!existingTask) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }

      if (existingTask.employeeId !== employeeId && !auth.roles.includes('super_admin')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to update this task' },
          { status: 403 }
        );
      }

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (type !== undefined) updateData.type = type;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'completed') {
          updateData.completedAt = completedAt || new Date();
        }
      }

      const updatedTask = await db.counselorTask.update({
        where: { id },
        data: updateData,
      });

      await logAuditAction(auth, 'update_task', 'CounselorTask', id, {
        updatedFields: Object.keys(updateData),
      });

      return NextResponse.json({
        success: true,
        data: updatedTask,
        message: 'Task updated successfully',
      });
    } catch (error) {
      console.error('Employee tasks PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update task' },
        { status: 500 }
      );
    }
  })(request);
}
