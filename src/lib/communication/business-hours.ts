/**
 * Shared business-time policy for ALO Education.
 *
 * The persisted UCC schedule (when present) is authoritative. Environment
 * defaults are deliberately conservative and configurable; all calculations
 * use IANA time zones rather than the host's local timezone.
 */

export interface BusinessHoursDay {
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // HH:mm in `timeZone`
  endTime: string; // HH:mm in `timeZone`
  isWorkDay: boolean;
  afterHoursAiAuto: boolean;
}

export interface BusinessHoursConfig {
  timeZone: string;
  days: BusinessHoursDay[];
  holidays: string[]; // YYYY-MM-DD in `timeZone`
}

export type BusinessHoursEnv = Record<string, string | undefined>;

const BD_WORKING_DAYS = [0, 1, 2, 3, 4, 6]; // Sunday–Thursday and Saturday; Friday closed
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function formatter(timeZone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    throw new Error(`Invalid business-hours timezone: ${timeZone}`);
  }
}

function localParts(date: Date, timeZone: string): LocalDateTime {
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid business-hours date');
  const parts = formatter(timeZone).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') };
}

function weekdayOf({ year, month, day }: Pick<LocalDateTime, 'year' | 'month' | 'day'>): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function dateKey({ year, month, day }: Pick<LocalDateTime, 'year' | 'month' | 'day'>): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseTime(value: string, label: string): number {
  if (!TIME_RE.test(value)) throw new Error(`${label} must use HH:mm`);
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function parseDays(value: string | undefined): Set<number> {
  if (value === undefined || value.trim() === '') return new Set(BD_WORKING_DAYS);
  const values = value.split(',').map((part) => part.trim());
  if (!values.length || values.some((part) => !/^[0-6]$/.test(part))) {
    throw new Error('ALO_BUSINESS_WORKING_DAYS must be a comma-separated list of weekdays 0–6');
  }
  return new Set(values.map(Number));
}

function parseHolidays(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  const days = [...new Set(value.split(',').map((day) => day.trim()))];
  if (days.some((day) => !DATE_RE.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`)) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day)) {
    throw new Error('ALO_BUSINESS_HOLIDAYS must be comma-separated YYYY-MM-DD dates');
  }
  return days;
}

/** Build defaults (09:00–18:00 Asia/Dhaka, Friday closed) from runtime config. */
export function defaultBusinessHoursConfig(env: BusinessHoursEnv = process.env): BusinessHoursConfig {
  const timeZone = (env.ALO_BUSINESS_TIMEZONE || 'Asia/Dhaka').trim();
  formatter(timeZone); // fail at configuration time, not on a later callback
  const startTime = env.ALO_BUSINESS_OPEN_TIME || '09:00';
  const endTime = env.ALO_BUSINESS_CLOSE_TIME || '18:00';
  const start = parseTime(startTime, 'ALO_BUSINESS_OPEN_TIME');
  const end = parseTime(endTime, 'ALO_BUSINESS_CLOSE_TIME');
  if (start >= end) throw new Error('Business opening time must be earlier than closing time');
  const workDays = parseDays(env.ALO_BUSINESS_WORKING_DAYS);
  return {
    timeZone,
    days: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startTime,
      endTime,
      isWorkDay: workDays.has(dayOfWeek),
      afterHoursAiAuto: true,
    })),
    holidays: parseHolidays(env.ALO_BUSINESS_HOLIDAYS),
  };
}

/**
 * Overlay the configured UCC per-day schedule and HRM holiday dates on defaults.
 * Bad stored rows fail closed for that day instead of silently opening it.
 */
export function businessHoursConfigFromRecords(
  schedule: readonly Partial<BusinessHoursDay>[] = [],
  holidays: readonly string[] = [],
  env: BusinessHoursEnv = process.env,
): BusinessHoursConfig {
  const defaults = defaultBusinessHoursConfig(env);
  const days = [...defaults.days];
  const rowSignatures = new Map<number, string>();
  const ambiguousDays = new Set<number>();
  for (const row of schedule) {
    if (!Number.isInteger(row.dayOfWeek) || row.dayOfWeek! < 0 || row.dayOfWeek! > 6) continue;
    const dayOfWeek = row.dayOfWeek!;
    const startTime = row.startTime ?? defaults.days[dayOfWeek].startTime;
    const endTime = row.endTime ?? defaults.days[dayOfWeek].endTime;
    const signature = JSON.stringify([startTime, endTime, row.isWorkDay === true, row.afterHoursAiAuto !== false]);
    const previousSignature = rowSignatures.get(dayOfWeek);
    if (previousSignature !== undefined && previousSignature !== signature) {
      ambiguousDays.add(dayOfWeek);
      days[dayOfWeek] = { ...defaults.days[dayOfWeek], isWorkDay: false, afterHoursAiAuto: false };
      continue;
    }
    rowSignatures.set(dayOfWeek, signature);
    if (ambiguousDays.has(dayOfWeek)) continue;
    try {
      if (parseTime(startTime, 'startTime') >= parseTime(endTime, 'endTime')) throw new Error('invalid window');
      days[dayOfWeek] = {
        dayOfWeek,
        startTime,
        endTime,
        isWorkDay: row.isWorkDay === true,
        afterHoursAiAuto: row.afterHoursAiAuto !== false,
      };
    } catch {
      days[dayOfWeek] = { ...days[dayOfWeek], isWorkDay: false, afterHoursAiAuto: false };
    }
  }
  const allHolidays = [...new Set([...defaults.holidays, ...holidays])];
  if (allHolidays.some((day) => !DATE_RE.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`)) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day)) {
    throw new Error('Holiday calendar contains an invalid YYYY-MM-DD date');
  }
  return { timeZone: defaults.timeZone, days, holidays: allHolidays };
}

function localTimeToUtc(parts: LocalDateTime, timeZone: string): Date {
  const targetWallClock = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  let guess = targetWallClock;
  // Iteratively correct the UTC guess using the zone's actual offset. This also
  // avoids assuming Dhaka is always UTC+6 if the timezone database changes.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = localParts(new Date(guess), timeZone);
    const observedWallClock = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute);
    const correction = targetWallClock - observedWallClock;
    if (correction === 0) break;
    guess += correction;
  }
  return new Date(guess);
}

function dayFor(date: Date, config: BusinessHoursConfig): { parts: LocalDateTime; day: BusinessHoursDay; key: string } {
  const parts = localParts(date, config.timeZone);
  const day = config.days[weekdayOf(parts)];
  return { parts, day, key: dateKey(parts) };
}

export function isWithinBusinessHours(date: Date, config = defaultBusinessHoursConfig()): boolean {
  const { parts, day, key } = dayFor(date, config);
  if (!day?.isWorkDay || config.holidays.includes(key)) return false;
  const currentMinutes = parts.hour * 60 + parts.minute;
  return currentMinutes >= parseTime(day.startTime, 'startTime') && currentMinutes < parseTime(day.endTime, 'endTime');
}

export function isAfterBusinessHours(date: Date, config = defaultBusinessHoursConfig()): boolean {
  return !isWithinBusinessHours(date, config);
}

/** Return the current instant while open, otherwise the next configured opening. */
export function nextBusinessOpening(date: Date, config = defaultBusinessHoursConfig()): Date {
  if (isWithinBusinessHours(date, config)) return new Date(date);
  const current = localParts(date, config.timeZone);
  const baseDay = new Date(Date.UTC(current.year, current.month - 1, current.day));
  for (let offset = 0; offset <= 370; offset += 1) {
    const calendarDay = new Date(baseDay.getTime() + offset * 86_400_000);
    const parts: LocalDateTime = {
      year: calendarDay.getUTCFullYear(), month: calendarDay.getUTCMonth() + 1, day: calendarDay.getUTCDate(), hour: 0, minute: 0,
    };
    const day = config.days[weekdayOf(parts)];
    if (!day?.isWorkDay || config.holidays.includes(dateKey(parts))) continue;
    const openMinutes = parseTime(day.startTime, 'startTime');
    const opening = localTimeToUtc({ ...parts, hour: Math.floor(openMinutes / 60), minute: openMinutes % 60 }, config.timeZone);
    if (opening.getTime() >= date.getTime()) return opening;
  }
  throw new Error('No business opening found within the next 370 days');
}

/** Add elapsed business minutes, deferring time outside the configured window. */
export function addBusinessMinutes(start: Date, minutes: number, config = defaultBusinessHoursConfig()): Date {
  if (!Number.isFinite(minutes) || minutes < 0) throw new Error('Business minutes must be a non-negative finite number');
  if (minutes === 0) return new Date(start);
  let remainingMs = minutes * 60_000;
  let cursor = new Date(start);
  for (let dayCount = 0; dayCount <= 370; dayCount += 1) {
    if (!isWithinBusinessHours(cursor, config)) cursor = nextBusinessOpening(cursor, config);
    const { parts, day } = dayFor(cursor, config);
    const endMinutes = parseTime(day.endTime, 'endTime');
    const close = localTimeToUtc({ ...parts, hour: Math.floor(endMinutes / 60), minute: endMinutes % 60 }, config.timeZone);
    const availableMs = Math.max(0, close.getTime() - cursor.getTime());
    if (remainingMs <= availableMs) return new Date(cursor.getTime() + remainingMs);
    remainingMs -= availableMs;
    cursor = nextBusinessOpening(new Date(close.getTime() + 1), config);
  }
  throw new Error('Unable to add business minutes within the next 370 days');
}

export function dayScheduleAt(date: Date, config = defaultBusinessHoursConfig()): BusinessHoursDay {
  return dayFor(date, config).day;
}

/** Count elapsed minutes only inside configured business windows. */
export function businessMinutesBetween(start: Date, end: Date, config = defaultBusinessHoursConfig()): number {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw new Error('Invalid business-hours date');
  if (end.getTime() <= start.getTime()) return 0;
  let cursor = new Date(start);
  let totalMinutes = 0;
  for (let dayCount = 0; dayCount <= 370 && cursor.getTime() < end.getTime(); dayCount += 1) {
    if (!isWithinBusinessHours(cursor, config)) cursor = nextBusinessOpening(cursor, config);
    if (cursor.getTime() >= end.getTime()) return totalMinutes;
    const { parts, day } = dayFor(cursor, config);
    const closeMinutes = parseTime(day.endTime, 'endTime');
    const close = localTimeToUtc({ ...parts, hour: Math.floor(closeMinutes / 60), minute: closeMinutes % 60 }, config.timeZone);
    const segmentEnd = Math.min(close.getTime(), end.getTime());
    totalMinutes += Math.max(0, segmentEnd - cursor.getTime()) / 60_000;
    cursor = nextBusinessOpening(new Date(close.getTime() + 1), config);
  }
  return totalMinutes;
}

export function localDateKey(date: Date, timeZone = 'Asia/Dhaka'): string {
  return dateKey(localParts(date, timeZone));
}
