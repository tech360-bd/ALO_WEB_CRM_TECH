import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM APPOINTMENTS API — Appointment CRUD with filters
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const studentId = searchParams.get('studentId') || '';
      const status = searchParams.get('status') || '';
      const type = searchParams.get('type') || '';
      const dateFrom = searchParams.get('dateFrom') || '';
      const dateTo = searchParams.get('dateTo') || '';
      const search = searchParams.get('search') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      const where: Record<string, unknown> = {};

      if (studentId) where.studentId = studentId;
      if (status) where.status = status;
      if (type) where.type = type;
      if (dateFrom || dateTo) {
        const scheduledFilter: Record<string, unknown> = {};
        if (dateFrom) scheduledFilter.gte = new Date(dateFrom);
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          scheduledFilter.lte = endDate;
        }
        where.scheduledAt = scheduledFilter;
      }
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { notes: { contains: search } },
          { meetLink: { contains: search } },
        ];
      }

      const [data, total] = await Promise.all([
        db.appointment.findMany({
          where,
          orderBy: { scheduledAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.appointment.count({ where }),
      ]);

      const [todayCount, upcomingCount, completedCount, cancelledCount] = await Promise.all([
        db.appointment.count({
          where: {
            scheduledAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        db.appointment.count({ where: { status: 'scheduled', scheduledAt: { gte: new Date() } } }),
        db.appointment.count({ where: { status: 'completed' } }),
        db.appointment.count({ where: { status: 'cancelled' } }),
      ]);

      return NextResponse.json({
        success: true,
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        meta: { todayCount, upcomingCount, completedCount, cancelledCount },
      });
    } catch (error) {
      console.error('Appointments GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load appointments' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { studentId, title, type, scheduledAt, meetLink, notes } = body;

      if (!studentId || !title || !scheduledAt) {
        return NextResponse.json(
          { success: false, error: 'studentId, title, and scheduledAt are required' },
          { status: 400 }
        );
      }

      const appointment = await db.appointment.create({
        data: {
          studentId,
          title,
          type: type || 'counseling',
          status: 'scheduled',
          scheduledAt: new Date(scheduledAt),
          meetLink: meetLink || '',
          notes: notes || '',
        },
      });

      await logAuditAction(auth, 'create_appointment', 'Appointment', appointment.id, {
        title, type, scheduledAt,
      });

      return NextResponse.json({ success: true, data: appointment }, { status: 201 });
    } catch (error) {
      console.error('Appointments POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create appointment' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, title, type, status, scheduledAt, meetLink, notes } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: 'Appointment id is required' }, { status: 400 });
      }

      const existing = await db.appointment.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (type !== undefined) updateData.type = type;
      if (status !== undefined) updateData.status = status;
      if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
      if (meetLink !== undefined) updateData.meetLink = meetLink;
      if (notes !== undefined) updateData.notes = notes;

      const appointment = await db.appointment.update({ where: { id }, data: updateData });

      await logAuditAction(auth, 'update_appointment', 'Appointment', id, {
        before: { status: existing.status },
        after: updateData,
      });

      return NextResponse.json({ success: true, data: appointment });
    } catch (error) {
      console.error('Appointments PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update appointment' }, { status: 500 });
    }
  })(request);
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ success: false, error: 'Appointment id is required' }, { status: 400 });
      }

      const existing = await db.appointment.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }

      await db.appointment.delete({ where: { id } });
      await logAuditAction(auth, 'delete_appointment', 'Appointment', id, { title: existing.title });

      return NextResponse.json({ success: true, message: 'Appointment deleted' });
    } catch (error) {
      console.error('Appointments DELETE error:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete appointment' }, { status: 500 });
    }
  })(request);
}
