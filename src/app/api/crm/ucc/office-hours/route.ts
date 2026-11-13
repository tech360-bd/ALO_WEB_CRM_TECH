// ============================================================
// /api/crm/ucc/office-hours
// GET  — Fetch office hours schedule + live open/closed status
// POST — Update office hours schedule (ADMIN, SUPER_ADMIN only)
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { businessHoursConfigFromRecords, defaultBusinessHoursConfig, isWithinBusinessHours } from '@/lib/communication/business-hours';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SCHEDULE = defaultBusinessHoursConfig().days;

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const privilegedRoles = [...(auth.roles || []), auth.userType || ''].map((role) => role.toUpperCase());
    const canManageOfficeHours = privilegedRoles.some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role)) || auth.permissions.includes('settings.office_hours.manage');
    const [officeHours, holidayRows] = await Promise.all([
      db.uccOfficeHours.findMany({ orderBy: { dayOfWeek: 'asc' } }),
      db.hrmAttendanceHoliday.findMany({ where: { isHoliday: true }, select: { date: true }, take: 1000 }),
    ]);
    const schedule = officeHours.length > 0 ? officeHours : DEFAULT_SCHEDULE;
    const config = businessHoursConfigFromRecords(schedule, holidayRows.map((row) => row.date));
    const now = new Date();
    const scheduleSignatures = new Map<number, string>();
    let scheduleConflict = false;
    for (const row of officeHours) {
      const signature = JSON.stringify([row.startTime, row.endTime, row.isWorkDay, row.afterHoursAiAuto]);
      const previous = scheduleSignatures.get(row.dayOfWeek);
      if (previous !== undefined && previous !== signature) scheduleConflict = true;
      else scheduleSignatures.set(row.dayOfWeek, signature);
    }
    const legacyDefaultReviewRequired = scheduleSignatures.size === 7 && !scheduleConflict && officeHours.every((row) =>
      row.startTime === '10:00' && row.endTime === '19:00' && row.isWorkDay === [0, 1, 2, 3, 4, 6].includes(row.dayOfWeek),
    );

    return NextResponse.json({
      success: true,
      officeHours: schedule,
      holidays: config.holidays,
      isCurrentlyOpen: isWithinBusinessHours(now, config),
      isDefault: officeHours.length === 0,
      timezone: config.timeZone,
      canManageOfficeHours,
      legacyDefaultReviewRequired,
      scheduleConflict,
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

    const privilegedRoles = [...(auth.roles || []), auth.userType || ''].map((role) => role.toUpperCase());
    if (!privilegedRoles.some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role)) && !auth.permissions.includes('settings.office_hours.manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden — only ADMIN and SUPER_ADMIN can update office hours.' }, { status: 403 });
    }

    const parsed = await request.json().catch(() => null) as { schedule?: Array<{ dayOfWeek: number; startTime: string; endTime: string; isWorkDay: boolean; afterHoursAiAuto?: boolean }> } | null;
    const schedule = parsed?.schedule;
    if (!Array.isArray(schedule) || schedule.length !== 7) {
      return NextResponse.json({ success: false, error: 'schedule must contain exactly one entry for each weekday (0–6).' }, { status: 400 });
    }
    if (schedule.some((day) => !day || typeof day !== 'object' || Array.isArray(day))) {
      return NextResponse.json({ success: false, error: 'Each schedule entry must be an object.' }, { status: 400 });
    }
    const seenDays = new Set<number>();
    if (!schedule.some((day) => day?.isWorkDay === true)) {
      return NextResponse.json({ success: false, error: 'At least one business day must remain open for SLA scheduling.' }, { status: 400 });
    }
    for (const day of schedule) {
      if (!Number.isInteger(day.dayOfWeek) || day.dayOfWeek < 0 || day.dayOfWeek > 6 || seenDays.has(day.dayOfWeek)) {
        return NextResponse.json({ success: false, error: 'Each weekday 0–6 must appear exactly once.' }, { status: 400 });
      }
      if (typeof day.isWorkDay !== 'boolean' || typeof day.startTime !== 'string' || typeof day.endTime !== 'string' || (day.afterHoursAiAuto !== undefined && typeof day.afterHoursAiAuto !== 'boolean')) {
        return NextResponse.json({ success: false, error: 'Every day requires startTime, endTime and isWorkDay; afterHoursAiAuto, when present, must be boolean.' }, { status: 400 });
      }
      seenDays.add(day.dayOfWeek);
    }
    try {
      businessHoursConfigFromRecords(schedule);
    } catch (error) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid office hours.' }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      for (const day of schedule) {
        const uniqueId = `day_${day.dayOfWeek}`;
        const values = {
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isWorkDay: day.isWorkDay,
          afterHoursAiAuto: day.afterHoursAiAuto ?? true,
        };
        // The legacy table has no unique constraint on dayOfWeek. Update every
        // existing row for that weekday (without deleting data) so duplicate
        // historical rows cannot leave an ambiguous active schedule.
        const updated = await tx.uccOfficeHours.updateMany({ where: { dayOfWeek: day.dayOfWeek }, data: values });
        if (updated.count === 0) {
          await tx.uccOfficeHours.upsert({ where: { id: uniqueId }, update: values, create: { id: uniqueId, ...values } });
        }
      }
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'OFFICE_HOURS_UPDATED',
          entityType: 'UccOfficeHours',
          entityId: 'system',
          metadata: JSON.stringify({ schedule }),
          ipAddress: '',
          userAgent: '',
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Office hours saved successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
