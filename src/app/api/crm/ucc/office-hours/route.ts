// ============================================================
// /api/crm/ucc/office-hours
// GET  — Fetch office hours schedule + live open/closed status
// POST — Update office hours schedule (ADMIN, SUPER_ADMIN only)
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  dayOfWeek: day,
  startTime: '10:00',
  endTime: '18:00',
  isWorkDay: day >= 0 && day <= 4, // Sun–Thu (Bangladesh business week)
  afterHoursAiAuto: true,
}));

function isCurrentlyOpen(schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string; isWorkDay: boolean }>): boolean {
  try {
    const now = new Date();
    // Get current Dhaka time
    const dhakaTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const dayStr = dhakaTime.find((p) => p.type === 'weekday')?.value || '';
    const hourStr = dhakaTime.find((p) => p.type === 'hour')?.value || '00';
    const minStr = dhakaTime.find((p) => p.type === 'minute')?.value || '00';

    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const currentDay = dayMap[dayStr] ?? now.getDay();
    const currentTime = `${hourStr.padStart(2, '0')}:${minStr.padStart(2, '0')}`;

    const todayHours = schedule.find((h) => h.dayOfWeek === currentDay);
    if (!todayHours?.isWorkDay) return false;

    return currentTime >= todayHours.startTime && currentTime <= todayHours.endTime;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const officeHours = await db.uccOfficeHours.findMany({ orderBy: { dayOfWeek: 'asc' } });

    const schedule = officeHours.length > 0 ? officeHours : DEFAULT_SCHEDULE;
    const open = isCurrentlyOpen(schedule);

    return NextResponse.json({
      success: true,
      officeHours: schedule,
      isCurrentlyOpen: open,
      isDefault: officeHours.length === 0,
      timezone: 'Asia/Dhaka',
      dayNames: DAY_NAMES,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!['SUPER_ADMIN', 'ADMIN'].includes(primaryRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden — only ADMIN and SUPER_ADMIN can update office hours.' }, { status: 403 });
    }

    const { schedule } = await request.json() as { schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string; isWorkDay: boolean; afterHoursAiAuto?: boolean }> };
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return NextResponse.json({ success: false, error: 'schedule must be a non-empty array.' }, { status: 400 });
    }

    for (const day of schedule) {
      if (day.dayOfWeek < 0 || day.dayOfWeek > 6) continue;
      const uniqueId = `day_${day.dayOfWeek}`;
      await db.uccOfficeHours.upsert({
        where: { id: uniqueId },
        update: {
          startTime: day.startTime,
          endTime: day.endTime,
          isWorkDay: day.isWorkDay,
          afterHoursAiAuto: day.afterHoursAiAuto ?? true,
        },
        create: {
          id: uniqueId,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isWorkDay: day.isWorkDay,
          afterHoursAiAuto: day.afterHoursAiAuto ?? true,
        },
      });
    }

    await logAuditAction(auth, 'OFFICE_HOURS_UPDATED', 'UccOfficeHours', 'system', { schedule });

    return NextResponse.json({ success: true, message: 'Office hours saved successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
