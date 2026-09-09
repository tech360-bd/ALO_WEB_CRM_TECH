import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get('employeeId') || '';
      const status = searchParams.get('status') || '';
      const priority = searchParams.get('priority') || '';
      const search = searchParams.get('search') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      const where: Record<string, unknown> = { type: 'support' };
      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (search) where.OR = [{ title: { contains: search } }, { description: { contains: search } }];

      const [data, total] = await Promise.all([
        db.counselorTask.findMany({
          where, orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit, take: limit,
        }),
        db.counselorTask.count({ where }),
      ]);

      const [openCount, urgentCount, resolvedToday] = await Promise.all([
        db.counselorTask.count({ where: { type: 'support', status: 'pending' } }),
        db.counselorTask.count({ where: { type: 'support', priority: 'high', status: 'pending' } }),
        db.counselorTask.count({ where: { type: 'support', status: 'completed', completedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      ]);

      return NextResponse.json({
        success: true, data, total, page,
        totalPages: Math.ceil(total / limit),
        meta: { openCount, urgentCount, resolvedToday },
      });
    } catch (error) {
      console.error('Support GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load support tickets' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { employeeId, studentId, title, description, priority, dueDate } = body;
      if (!employeeId || !title) {
        return NextResponse.json({ success: false, error: 'employeeId and title required' }, { status: 400 });
      }
      const task = await db.counselorTask.create({
        data: {
          employeeId, studentId: studentId || '', title, description: description || '',
          type: 'support', priority: priority || 'medium', status: 'pending', dueDate: dueDate || '',
        },
      });
      await logAuditAction(auth, 'create_support_ticket', 'CounselorTask', task.id, { title, priority });
      return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (error) {
      console.error('Support POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create support ticket' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, status, priority, title, description, markResolved } = body;
      if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
      const existing = await db.counselorTask.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (status) updateData.status = status;
      if (markResolved || status === 'completed') {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      }

      const task = await db.counselorTask.update({ where: { id }, data: updateData });
      await logAuditAction(auth, 'update_support_ticket', 'CounselorTask', id, { before: existing.status, after: updateData });
      return NextResponse.json({ success: true, data: task });
    } catch (error) {
      console.error('Support PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
    }
  })(request);
}
