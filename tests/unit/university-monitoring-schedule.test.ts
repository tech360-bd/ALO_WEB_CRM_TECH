import { describe, expect, it, vi } from 'vitest';

// Pure scheduling coverage must run even when DB integration is unavailable.
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/university-monitoring-engine', () => ({ runMonitoringCycle: vi.fn() }));

import { computeNextRunAt, MONITORING_INTERVAL_DAYS } from '@/lib/university-monitoring-runner';

describe('monitoring elapsed-time schedule', () => {
  it.each([
    ['2026-08-01T12:00:00.000Z', '2026-08-08T12:00:00.000Z'],
    ['2026-10-17T23:30:00+06:00', '2026-10-24T17:30:00.000Z'],
    // These intervals cross US DST boundaries; elapsed days remain 24 hours.
    ['2026-03-07T12:00:00-05:00', '2026-03-14T17:00:00.000Z'],
    ['2026-10-31T12:00:00-04:00', '2026-11-07T16:00:00.000Z'],
  ])('schedules exactly seven elapsed days after %s', (input, expected) => {
    const from = new Date(input);
    const original = from.getTime();
    const next = computeNextRunAt(from);
    expect(next.toISOString()).toBe(expected);
    expect(next.getTime() - original).toBe(MONITORING_INTERVAL_DAYS * 86_400_000);
    expect(from.getTime()).toBe(original);
    expect(next).not.toBe(from);
  });
});
