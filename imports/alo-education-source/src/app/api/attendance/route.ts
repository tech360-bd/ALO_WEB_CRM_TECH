import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'LEAVE', 'HOLIDAY', 'OVERTIME'];
const DEVICE_SOURCES = ['WEB', 'MOBILE', 'BIOMETRIC', 'MANUAL'];

const createAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn: z.string().optional(),
  status: z.enum(ATTENDANCE_STATUSES).default('PRESENT'),
  branch: z.string().optional(),
  deviceSource: z.enum(DEVICE_SOURCES).default('WEB'),
  notes: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — List attendance records with filters, pagination                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  // Build filters
  const filters: Record<string, unknown>[] = [];

  if (sp.get('employeeId')) filters.push({ employeeId: sp.get('employeeId') });
  if (sp.get('date')) filters.push({ date: sp.get('date') });
  if (sp.get('status')) filters.push({ status: sp.get('status') });
  if (sp.get('branch')) filters.push({ branch: sp.get('branch') });

  // Non-admin employees see only their own attendance
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    const employee = await db.employeeHR.findFirst({ where: { userId: auth.user.id } });
    if (employee) {
      filters.push({ employeeId: employee.id });
    }
  }

  const where = filters.length > 0 ? { AND: filters } : {};

  try {
    const [data, total] = await Promise.all([
      db.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip,
      }),
      db.attendance.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create/check-in attendance record                                 */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Only the employee themselves, HR, or admin can create attendance
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && parsed.data.employeeId !== auth.user.id) {
      const employee = await db.employeeHR.findFirst({ where: { userId: auth.user.id } });
      const isHr = employee?.designation === 'HR Manager';
      if (!isHr) {
        return NextResponse.json(
          { success: false, error: 'Access denied. You can only create your own attendance records.' },
          { status: 403 },
        );
      }
    }

    // Check for existing record (unique constraint: employeeId + date)
    const existing = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: parsed.data.employeeId,
          date: parsed.data.date,
        },
      },
    });

    if (existing) {
      // Update check-in if not already set
      const updates: Record<string, unknown> = {};
      if (parsed.data.checkIn && !existing.checkIn) {
        updates.checkIn = parsed.data.checkIn;
      }
      if (parsed.data.status && parsed.data.status !== existing.status) {
        updates.status = parsed.data.status;
      }
      if (parsed.data.branch) updates.branch = parsed.data.branch;
      if (parsed.data.notes) updates.notes = parsed.data.notes;

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { success: false, error: 'Attendance record already exists for this date.' },
          { status: 400 },
        );
      }

      const updated = await db.attendance.update({
        where: { id: existing.id },
        data: updates,
      });

      await auditLog({
        userId: auth.user.id,
        action: 'UPDATE',
        resource: 'Attendance',
        resourceId: existing.id,
        details: { employeeId: parsed.data.employeeId, date: parsed.data.date, updates },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Create new record
    const record = await db.attendance.create({
      data: {
        employeeId: parsed.data.employeeId,
        date: parsed.data.date,
        checkIn: parsed.data.checkIn || null,
        status: parsed.data.status,
        branch: parsed.data.branch || null,
        deviceSource: parsed.data.deviceSource,
        notes: parsed.data.notes || null,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'Attendance',
      resourceId: record.id,
      details: { employeeId: parsed.data.employeeId, date: parsed.data.date, status: parsed.data.status },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error && error.message.includes('Unique')
      ? 'Attendance record already exists for this employee and date.'
      : 'Failed to create attendance record.';
    console.error('Error creating attendance:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
