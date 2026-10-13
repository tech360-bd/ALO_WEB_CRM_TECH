import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, requirePermission } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateAttendanceSchema = z.object({
  checkOut: z.string().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'LEAVE', 'HOLIDAY', 'OVERTIME']).optional(),
  notes: z.string().optional(),
  overtimeMinutes: z.number().int().min(0).optional(),
  lateMinutes: z.number().int().min(0).optional(),
  earlyLeaveMinutes: z.number().int().min(0).optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — Get attendance by ID                                            */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const record = await db.attendance.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance record.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update attendance (check-out, status change)                    */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, 'employee.attendance.manage');
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await db.attendance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await db.attendance.update({
      where: { id },
      data: parsed.data,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      resource: 'Attendance',
      resourceId: id,
      details: { employeeId: existing.employeeId, date: existing.date, changes: parsed.data },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance record.' },
      { status: 500 },
    );
  }
}
