import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';

// ─── GET: List appointments ──────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp);

    const where: Record<string, unknown> = {};
    if (sp.get('counselorId')) where.counselorId = sp.get('counselorId');
    if (sp.get('studentId')) where.studentId = sp.get('studentId');
    if (sp.get('status')) where.status = sp.get('status');

    // Date range filter
    const dateFrom = sp.get('dateFrom');
    const dateTo = sp.get('dateTo');
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.scheduledAt = dateFilter;
    }

    // Students see only own appointments
    if (auth.user.role === 'STUDENT') {
      where.studentId = auth.user.id;
    }

    const [data, total] = await Promise.all([
      db.appointment.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      db.appointment.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing appointments:', error);
    return NextResponse.json({ success: false, error: 'Failed to list appointments.' }, { status: 500 });
  }
}

// ─── POST: Create appointment ────────────────────────────────

const createAppointmentSchema = z.object({
  studentId: z.string().optional(),
  counselorId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().default('CONSULTATION'),
  scheduledAt: z.string().min(1, 'Scheduled date is required').transform(v => new Date(v)),
  duration: z.number().int().min(5).max(480).default(30),
  meetingLink: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Check date is in the future
    if (parsed.data.scheduledAt <= new Date()) {
      return NextResponse.json({ success: false, error: 'Appointment must be scheduled in the future.' }, { status: 400 });
    }

    // Students set their own studentId
    const studentId = auth.user.role === 'STUDENT' ? auth.user.id : (parsed.data.studentId || undefined);
    const counselorId = parsed.data.counselorId || undefined;

    const appointment = await db.appointment.create({
      data: {
        studentId,
        counselorId,
        title: parsed.data.title,
        description: parsed.data.description || undefined,
        type: parsed.data.type,
        status: 'SCHEDULED',
        scheduledAt: parsed.data.scheduledAt,
        duration: parsed.data.duration,
        meetingLink: parsed.data.meetingLink || undefined,
        location: parsed.data.location || undefined,
        notes: parsed.data.notes || undefined,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'APPOINTMENT_CREATE',
      resource: 'Appointment',
      resourceId: appointment.id,
      details: { title: parsed.data.title, scheduledAt: parsed.data.scheduledAt.toISOString() },
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ success: false, error: 'Failed to create appointment.' }, { status: 500 });
  }
}

// ─── PATCH: Update appointment status ────────────────────────

const patchAppointmentSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
  meetingLink: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = patchAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.appointment.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Appointment not found.' }, { status: 404 });
    }

    // Only owner (student) or counselor can update
    if (auth.user.role === 'STUDENT' && existing.studentId !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'You can only update your own appointments.' }, { status: 403 });
    }
    if (existing.counselorId && existing.counselorId !== auth.user.id && auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only the assigned counselor can update this appointment.' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status };
    if (parsed.data.notes) updateData.notes = parsed.data.notes;
    if (parsed.data.meetingLink) updateData.meetingLink = parsed.data.meetingLink;

    const appointment = await db.appointment.update({
      where: { id: parsed.data.id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'APPOINTMENT_UPDATE',
      resource: 'Appointment',
      resourceId: parsed.data.id,
      details: { from: existing.status, to: parsed.data.status },
    });

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ success: false, error: 'Failed to update appointment.' }, { status: 500 });
  }
}

// ─── DELETE: Cancel appointment ──────────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Appointment ID is required (query param).' }, { status: 400 });
    }

    const existing = await db.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Appointment not found.' }, { status: 404 });
    }

    if (existing.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Appointment is already cancelled.' }, { status: 400 });
    }

    const appointment = await db.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: auth.user.id,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'APPOINTMENT_CANCEL',
      resource: 'Appointment',
      resourceId: id,
      details: { title: existing.title },
    });

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel appointment.' }, { status: 500 });
  }
}
