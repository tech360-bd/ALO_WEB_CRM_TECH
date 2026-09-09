import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/appointments
// Returns student's appointments with pagination and filters
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const status = searchParams.get('status') || '';
      const type = searchParams.get('type') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const where: Record<string, unknown> = { studentId: profile.id };
      if (status) where.status = status;
      if (type) where.type = type;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [appointments, total] = await Promise.all([
        db.aloAppointment.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.aloAppointment.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: appointments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch appointments';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/appointments
// Book a new appointment
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { title, type, date, time, duration, counselor, notes } = body;

      if (!date || !time) {
        return NextResponse.json(
          { success: false, error: 'Date and time are required.' },
          { status: 400 }
        );
      }

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const appointment = await db.aloAppointment.create({
        data: {
          studentId: profile.id,
          title: title || 'Counseling Session',
          type: type || 'counseling',
          date,
          time,
          duration: duration || '30 minutes',
          status: 'upcoming',
          counselor: counselor || profile.counselorName || '',
          notes: notes || '',
        },
      });

      // Audit log
      await logAuditAction(auth, 'APPOINTMENT_BOOKED', 'AloAppointment', appointment.id, {
        date,
        time,
        type: type || 'counseling',
      });

      return NextResponse.json({ success: true, data: appointment }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to book appointment';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/appointments
// Cancel or reschedule an appointment
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, status, date, time, notes } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Appointment id is required.' },
          { status: 400 }
        );
      }

      // Verify student owns this appointment
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const existing = await db.aloAppointment.findUnique({ where: { id } });
      if (!existing || existing.studentId !== profile.id) {
        return NextResponse.json(
          { success: false, error: 'Appointment not found.' },
          { status: 404 }
        );
      }

      if (existing.status === 'cancelled') {
        return NextResponse.json(
          { success: false, error: 'Cannot modify a cancelled appointment.' },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (status !== undefined) updateData.status = status;
      if (date !== undefined) updateData.date = date;
      if (time !== undefined) updateData.time = time;
      if (notes !== undefined) updateData.notes = notes;

      const updated = await db.aloAppointment.update({
        where: { id },
        data: updateData,
      });

      // Audit log
      await logAuditAction(auth, 'APPOINTMENT_UPDATED', 'AloAppointment', id, {
        updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update appointment';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
