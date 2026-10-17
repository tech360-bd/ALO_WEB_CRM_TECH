import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || '';
    const date = searchParams.get('date') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [attendance, total] = await Promise.all([
      db.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            select: { id: true, employeeId: true, firstName: true, lastName: true, profilePhoto: true }
          }
        }
      }),
      db.attendance.count({ where })
    ]);

    // Summary stats
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
    const todayPresent = await db.attendance.count({
      where: { date: { gte: todayStart, lte: todayEnd }, status: 'present' }
    });
    const todayLate = await db.attendance.count({
      where: { date: { gte: todayStart, lte: todayEnd }, status: 'late' }
    });
    const todayAbsent = await db.attendance.count({
      where: { date: { gte: todayStart, lte: todayEnd }, status: 'absent' }
    });

    return NextResponse.json({
      attendance,
      summary: {
        todayPresent,
        todayLate,
        todayAbsent,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { employeeId, action, note, location } = body;

    if (!employeeId || !action) {
      return NextResponse.json(
        { error: 'Employee ID and action (clock_in/clock_out) are required' },
        { status: 400 }
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    if (action === 'clock_in') {
      // Check if already clocked in today
      const existing = await db.attendance.findFirst({
        where: {
          employeeId,
          date: { gte: startOfDay, lte: endOfDay }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Already clocked in today', attendance: existing },
          { status: 400 }
        );
      }

      const now = new Date();
      const isLate = now.getHours() >= 10; // After 10 AM is late
      const status = isLate ? 'late' : 'present';

      const attendance = await db.attendance.create({
        data: {
          employeeId,
          date: new Date(new Date().setHours(0, 0, 0, 0)),
          clockIn: now,
          status,
          location: location || null,
          note: note || null,
          source: 'self',
        },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeId: true } }
        }
      });

      return NextResponse.json(attendance, { status: 201 });

    } else if (action === 'clock_out') {
      const existing = await db.attendance.findFirst({
        where: {
          employeeId,
          date: { gte: startOfDay, lte: endOfDay }
        }
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'No clock-in record found for today' },
          { status: 400 }
        );
      }

      if (existing.clockOut) {
        return NextResponse.json(
          { error: 'Already clocked out today' },
          { status: 400 }
        );
      }

      const now = new Date();
      const clockIn = existing.clockIn!;
      const totalMs = now.getTime() - new Date(clockIn).getTime();
      const totalHours = totalMs / (1000 * 60 * 60);

      const attendance = await db.attendance.update({
        where: { id: existing.id },
        data: {
          clockOut: now,
          totalHours: Math.round(totalHours * 100) / 100,
          note: note || existing.note,
        },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeId: true } }
        }
      });

      return NextResponse.json(attendance);

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use clock_in or clock_out' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
