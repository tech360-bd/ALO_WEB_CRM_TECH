import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE ATTENDANCE API
// GET  — List EmployeeAttendance records for the authenticated employee
// POST — Create a check-in/check-out record
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '30');
      const sortBy = searchParams.get('sortBy') || 'date';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.employeeId || auth.userId;

      // Build where clause
      const where: Record<string, unknown> = { employeeId };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) (where.date as Record<string, unknown>).gte = startDate;
        if (endDate) (where.date as Record<string, unknown>).lte = endDate;
      }
      if (status) where.status = status;

      const [records, total] = await Promise.all([
        db.employeeAttendance.findMany({
          where,
          orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.employeeAttendance.count({ where }),
      ]);

      // Calculate summary stats
      const totalPresent = await db.employeeAttendance.count({
        where: { employeeId, status: 'present' },
      });
      const totalAbsent = await db.employeeAttendance.count({
        where: { employeeId, status: 'absent' },
      });
      const totalLate = await db.employeeAttendance.count({
        where: { employeeId, status: 'late' },
      });
      const totalLeave = await db.employeeAttendance.count({
        where: { employeeId, status: 'leave' },
      });

      const avgHoursResult = await db.employeeAttendance.aggregate({
        where: { employeeId, status: { in: ['present', 'late'] } },
        _avg: { hoursWorked: true },
      });

      return NextResponse.json({
        success: true,
        data: records,
        summary: {
          totalPresent,
          totalAbsent,
          totalLate,
          totalLeave,
          avgHoursPerDay: avgHoursResult._avg.hoursWorked || 0,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Employee attendance GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          summary: { totalPresent: 0, totalAbsent: 0, totalLate: 0, totalLeave: 0, avgHoursPerDay: 0 },
          pagination: { page: 1, limit: 30, total: 0, totalPages: 0 },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load attendance records' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { action, checkIn, checkOut, date, note } = body;

      if (!action || !date) {
        return NextResponse.json(
          { success: false, error: 'action (check_in or check_out) and date are required' },
          { status: 400 }
        );
      }

      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.employeeId || auth.userId;

      if (action === 'check_in') {
        // Check if there's already a record for today
        const existing = await db.employeeAttendance.findFirst({
          where: { employeeId, date },
        });

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Already checked in for this date' },
            { status: 400 }
          );
        }

        const record = await db.employeeAttendance.create({
          data: {
            employeeId,
            date,
            checkIn: checkIn || new Date().toTimeString().substring(0, 8),
            checkOut: '',
            status: 'present',
            hoursWorked: 0,
            note: note || '',
          },
        });

        await logAuditAction(auth, 'check_in', 'EmployeeAttendance', record.id, {
          date,
          checkIn: record.checkIn,
        });

        return NextResponse.json({
          success: true,
          data: record,
          message: 'Checked in successfully',
        });
      }

      if (action === 'check_out') {
        const existing = await db.employeeAttendance.findFirst({
          where: { employeeId, date },
        });

        if (!existing) {
          return NextResponse.json(
            { success: false, error: 'No check-in record found for this date' },
            { status: 400 }
          );
        }

        if (existing.checkOut) {
          return NextResponse.json(
            { success: false, error: 'Already checked out for this date' },
            { status: 400 }
          );
        }

        const checkOutTime = checkOut || new Date().toTimeString().substring(0, 8);

        // Calculate hours worked
        const checkInParts = existing.checkIn.split(':').map(Number);
        const checkOutParts = checkOutTime.split(':').map(Number);
        const hoursWorked = Math.max(
          0,
          (checkOutParts[0] + checkOutParts[1] / 60) - (checkInParts[0] + checkInParts[1] / 60)
        );

        const updated = await db.employeeAttendance.update({
          where: { id: existing.id },
          data: {
            checkOut: checkOutTime,
            hoursWorked: Math.round(hoursWorked * 100) / 100,
            note: note || existing.note,
          },
        });

        await logAuditAction(auth, 'check_out', 'EmployeeAttendance', existing.id, {
          date,
          checkOut: checkOutTime,
          hoursWorked,
        });

        return NextResponse.json({
          success: true,
          data: updated,
          message: 'Checked out successfully',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action. Use check_in or check_out' },
        { status: 400 }
      );
    } catch (error) {
      console.error('Employee attendance POST error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to record attendance' },
        { status: 500 }
      );
    }
  })(request);
}
