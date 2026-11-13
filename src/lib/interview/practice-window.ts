// ============================================================================
// ALO Interview Practice Window (spec §38 "72-HOUR INTERVIEW WINDOW")
//
// The specification asks for a *configurable* practice window that starts when
// the preparation pack is generated/downloaded, shows remaining time on the
// student dashboard, and — when it lapses — moves the student to a
// counselor-controlled extension rather than deleting practice records.
//
// This module is pure: no database, no clock of its own. Callers pass `now`, so
// every boundary is testable and a countdown can never drift because of a
// server-side default.
// ============================================================================

export const DEFAULT_PRACTICE_WINDOW_HOURS = 72;

/** Hard ceiling for a counselor extension, and for the configured default. */
export const MAX_PRACTICE_WINDOW_HOURS = 24 * 30;

const HOUR_MS = 3_600_000;

export type PracticeWindowStatus = 'NOT_STARTED' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'EXTENDED' | 'CLOSED';

export interface PracticeWindowRecord {
  id?: string;
  studentId?: string;
  applicationId?: string;
  startsAt: Date | string;
  expiresAt: Date | string;
  extendedUntil?: Date | string | null;
  extensionCount?: number;
  closedAt?: Date | string | null;
  packGeneratedAt?: Date | string | null;
}

export interface PracticeWindowState {
  status: PracticeWindowStatus;
  /** Effective end of access (extension wins when it is later). */
  effectiveEndsAt: string | null;
  startsAt: string | null;
  remainingMs: number;
  remainingHours: number;
  /** True when the countdown should turn amber in the UI. */
  expiringSoon: boolean;
  extended: boolean;
  expired: boolean;
  /** Practice history is never deleted — this says so explicitly. */
  historyRetained: true;
}

/** Read the configured default window length, clamped to sane bounds. */
export function configuredWindowHours(raw: string | number | null | undefined = process.env.INTERVIEW_PRACTICE_WINDOW_HOURS): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_PRACTICE_WINDOW_HOURS;
  return Math.min(Math.floor(value), MAX_PRACTICE_WINDOW_HOURS);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The amber threshold: the final 12 hours of a 72-hour window. */
export function expiringSoonThresholdMs(hours: number): number {
  return Math.max(HOUR_MS, Math.min(12 * HOUR_MS, Math.floor((hours * HOUR_MS) / 6)));
}

/**
 * Resolve a window into a status + remaining time.
 *
 * A closed window is CLOSED regardless of dates (a counselor can end practice
 * early). An extension later than the original expiry is honoured; an expired
 * window stays EXPIRED until a counselor extends it.
 */
export function describePracticeWindow(
  record: PracticeWindowRecord | null | undefined,
  now: Date,
  windowHours: number = DEFAULT_PRACTICE_WINDOW_HOURS,
): PracticeWindowState {
  if (!record) {
    return {
      status: 'NOT_STARTED',
      effectiveEndsAt: null,
      startsAt: null,
      remainingMs: 0,
      remainingHours: 0,
      expiringSoon: false,
      extended: false,
      expired: false,
      historyRetained: true,
    };
  }

  const startsAt = toDate(record.startsAt);
  const expiresAt = toDate(record.expiresAt);
  const extendedUntil = toDate(record.extendedUntil);
  const closedAt = toDate(record.closedAt);

  const extended = Boolean(extendedUntil && expiresAt && extendedUntil.getTime() > expiresAt.getTime());
  const effectiveEnd = extendedUntil && expiresAt
    ? new Date(Math.max(expiresAt.getTime(), extendedUntil.getTime()))
    : extendedUntil ?? expiresAt;

  const remainingMs = effectiveEnd ? Math.max(0, effectiveEnd.getTime() - now.getTime()) : 0;
  const expired = remainingMs <= 0;

  let status: PracticeWindowStatus;
  if (closedAt) status = 'CLOSED';
  else if (expired) status = 'EXPIRED';
  else if (extended) status = 'EXTENDED';
  else if (remainingMs <= expiringSoonThresholdMs(windowHours)) status = 'EXPIRING';
  else status = 'ACTIVE';

  return {
    status,
    effectiveEndsAt: effectiveEnd ? effectiveEnd.toISOString() : null,
    startsAt: startsAt ? startsAt.toISOString() : null,
    remainingMs,
    remainingHours: Math.floor(remainingMs / HOUR_MS),
    expiringSoon: !expired && status !== 'CLOSED' && remainingMs <= expiringSoonThresholdMs(windowHours),
    extended,
    expired,
    historyRetained: true,
  };
}

/** Compute a new window from a start instant. */
export function createPracticeWindow(
  now: Date,
  windowHours: number = DEFAULT_PRACTICE_WINDOW_HOURS,
): { startsAt: Date; expiresAt: Date; hours: number } {
  const hours = Math.min(Math.max(1, Math.floor(windowHours)), MAX_PRACTICE_WINDOW_HOURS);
  return { startsAt: now, expiresAt: new Date(now.getTime() + hours * HOUR_MS), hours };
}

/**
 * Counselor extension. Extends from whichever is later — now or the current
 * end — so an extension granted after expiry still gives the student the full
 * number of additional days.
 */
export function extendPracticeWindow(
  record: PracticeWindowRecord,
  now: Date,
  extraHours: number,
): { extendedUntil: Date; extraHours: number } {
  const hours = Math.min(Math.max(1, Math.floor(extraHours)), MAX_PRACTICE_WINDOW_HOURS);
  const currentEnd = toDate(record.extendedUntil) ?? toDate(record.expiresAt) ?? now;
  const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
  return { extendedUntil: new Date(base.getTime() + hours * HOUR_MS), extraHours: hours };
}

/** Whether a student may start a new practice session right now. */
export function canPractise(state: PracticeWindowState): boolean {
  return state.status === 'ACTIVE' || state.status === 'EXPIRING' || state.status === 'EXTENDED';
}
