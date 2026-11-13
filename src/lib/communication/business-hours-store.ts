import { db } from '@/lib/db';
import { businessHoursConfigFromRecords, defaultBusinessHoursConfig, type BusinessHoursConfig } from './business-hours';

interface BusinessHoursStore {
  uccOfficeHours: { findMany(args?: Record<string, unknown>): Promise<Array<Record<string, unknown>>> };
  hrmAttendanceHoliday: { findMany(args?: Record<string, unknown>): Promise<Array<{ date: string }>> };
}

/** Require one unambiguous persisted entry for every Dhaka weekday. */
function hasCompletePersistedSchedule(rows: readonly Partial<{
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkDay: boolean;
  afterHoursAiAuto: boolean;
}>[]): boolean {
  const signatures = new Map<number, string>();
  for (const row of rows) {
    if (!Number.isInteger(row.dayOfWeek) || row.dayOfWeek! < 0 || row.dayOfWeek! > 6) continue;
    const signature = JSON.stringify([row.startTime, row.endTime, row.isWorkDay, row.afterHoursAiAuto]);
    const previous = signatures.get(row.dayOfWeek!);
    if (previous !== undefined && previous !== signature) return false;
    signatures.set(row.dayOfWeek!, signature);
  }
  return signatures.size === 7;
}

/**
 * Load the persisted schedule and holiday calendar. `scheduleReadAvailable`
 * distinguishes an empty-but-readable table from a database/configuration error;
 * outbound automation must not treat a fallback as admin approval.
 */
export async function loadBusinessHoursPolicy(client: BusinessHoursStore = db): Promise<{
  config: BusinessHoursConfig;
  hasPersistedSchedule: boolean;
  scheduleReadAvailable: boolean;
}> {
  let schedule: Array<Record<string, unknown>> = [];
  try {
    schedule = await client.uccOfficeHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
    const holidayRows = await client.hrmAttendanceHoliday.findMany({
      where: { isHoliday: true },
      select: { date: true },
      take: 1000,
    });
    return {
      config: businessHoursConfigFromRecords(
        schedule as Array<{
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          isWorkDay: boolean;
          afterHoursAiAuto: boolean;
        }>,
        holidayRows.map((row) => row.date),
      ),
      hasPersistedSchedule: hasCompletePersistedSchedule(schedule as Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isWorkDay: boolean;
        afterHoursAiAuto: boolean;
      }>),
      scheduleReadAvailable: true,
    };
  } catch (error) {
    // Intake and SLA display can continue with safe defaults. The accompanying
    // status prevents those defaults from authorizing an outbound reply.
    console.error('[business-hours] persisted schedule unavailable; using configured defaults', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    const config = schedule.length > 0
      ? businessHoursConfigFromRecords(schedule as Array<{
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          isWorkDay: boolean;
          afterHoursAiAuto: boolean;
        }>)
      : defaultBusinessHoursConfig();
    return { config, hasPersistedSchedule: false, scheduleReadAvailable: false };
  }
}

/** Load the configured/default schedule for calculations that do not send. */
export async function loadBusinessHoursConfig(client: BusinessHoursStore = db): Promise<BusinessHoursConfig> {
  return (await loadBusinessHoursPolicy(client)).config;
}
