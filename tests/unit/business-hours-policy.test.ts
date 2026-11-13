import { describe, expect, it } from 'vitest';
import { businessHoursConfigFromRecords, defaultBusinessHoursConfig, isWithinBusinessHours, nextBusinessOpening } from '@/lib/communication/business-hours';

const config = defaultBusinessHoursConfig({});

describe('Asia/Dhaka office-hours default and safe legacy handling', () => {
  it('defaults to Saturday–Thursday, 09:00–18:00 Asia/Dhaka with Friday closed', () => {
    expect(config.timeZone).toBe('Asia/Dhaka');
    expect(config.days.map((day) => [day.dayOfWeek, day.startTime, day.endTime, day.isWorkDay])).toEqual([
      [0, '09:00', '18:00', true],
      [1, '09:00', '18:00', true],
      [2, '09:00', '18:00', true],
      [3, '09:00', '18:00', true],
      [4, '09:00', '18:00', true],
      [5, '09:00', '18:00', false],
      [6, '09:00', '18:00', true],
    ]);
  });

  it('uses Dhaka wall-clock boundaries, including the Friday closure', () => {
    expect(isWithinBusinessHours(new Date('2026-10-19T03:00:00.000Z'), config)).toBe(true); // Mon 09:00
    expect(isWithinBusinessHours(new Date('2026-10-19T12:00:00.000Z'), config)).toBe(false); // Mon 18:00
    expect(isWithinBusinessHours(new Date('2026-10-23T05:00:00.000Z'), config)).toBe(false); // Fri 11:00
    expect(isWithinBusinessHours(new Date('2026-10-24T04:00:00.000Z'), config)).toBe(true); // Sat 10:00
  });

  it('moves a Friday callback deadline to Saturday at 09:00 Dhaka time', () => {
    expect(nextBusinessOpening(new Date('2026-10-23T06:00:00.000Z'), config).toISOString()).toBe('2026-10-24T03:00:00.000Z');
  });

  it('fails closed for a weekday with conflicting duplicate rows', () => {
    const conflicting = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkDay: true, afterHoursAiAuto: true },
      { dayOfWeek: 1, startTime: '10:00', endTime: '19:00', isWorkDay: true, afterHoursAiAuto: true },
    ];
    const loaded = businessHoursConfigFromRecords(conflicting, [], {});
    expect(loaded.days[1]).toMatchObject({ isWorkDay: false, afterHoursAiAuto: false });
  });

  it('does not silently rewrite an explicitly persisted legacy 10:00–19:00 schedule', () => {
    const legacySchedule = config.days.map((day) => ({ ...day, startTime: '10:00', endTime: '19:00' }));
    const loaded = businessHoursConfigFromRecords(legacySchedule, [], {});
    expect(loaded.days[0]).toMatchObject({ startTime: '10:00', endTime: '19:00', isWorkDay: true });
    expect(loaded.days[5]).toMatchObject({ startTime: '10:00', endTime: '19:00', isWorkDay: false });
  });
});

describe('business-hours persisted-policy status', () => {
  it('distinguishes an empty schedule from a persisted schedule without writes', async () => {
    const { loadBusinessHoursPolicy } = await import('@/lib/communication/business-hours-store');
    const emptyStore = {
      uccOfficeHours: { findMany: async () => [] },
      hrmAttendanceHoliday: { findMany: async () => [] },
    };
    const empty = await loadBusinessHoursPolicy(emptyStore);
    expect(empty).toMatchObject({ hasPersistedSchedule: false, scheduleReadAvailable: true });
    expect(empty.config.days[5].isWorkDay).toBe(false);

    const partialStore = {
      uccOfficeHours: { findMany: async () => [{ dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorkDay: false, afterHoursAiAuto: true }] },
      hrmAttendanceHoliday: { findMany: async () => [] },
    };
    const partial = await loadBusinessHoursPolicy(partialStore);
    expect(partial.hasPersistedSchedule).toBe(false);
    expect(partial.scheduleReadAvailable).toBe(true);

    const persistedStore = {
      uccOfficeHours: { findMany: async () => config.days.map((day) => ({ ...day, startTime: '10:00', endTime: '19:00' })) },
      hrmAttendanceHoliday: { findMany: async () => [] },
    };
    const persisted = await loadBusinessHoursPolicy(persistedStore);
    expect(persisted).toMatchObject({ hasPersistedSchedule: true, scheduleReadAvailable: true });
    expect(persisted.config.days[0].startTime).toBe('10:00');
  });

  it('marks the schedule unavailable when the database policy read fails', async () => {
    const { loadBusinessHoursPolicy } = await import('@/lib/communication/business-hours-store');
    const unavailableStore = {
      uccOfficeHours: { findMany: async () => { throw new Error('db unavailable'); } },
      hrmAttendanceHoliday: { findMany: async () => [] },
    };
    const result = await loadBusinessHoursPolicy(unavailableStore);
    expect(result).toMatchObject({ hasPersistedSchedule: false, scheduleReadAvailable: false });
  });
});
