import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRACTICE_WINDOW_HOURS,
  MAX_PRACTICE_WINDOW_HOURS,
  canPractise,
  configuredWindowHours,
  createPracticeWindow,
  describePracticeWindow,
  extendPracticeWindow,
} from '@/lib/interview/practice-window';

const NOW = new Date('2026-10-24T12:00:00.000Z');
const hours = (n: number) => n * 3_600_000;

describe('practice window configuration', () => {
  it('defaults to 72 hours when unset or invalid', () => {
    expect(configuredWindowHours(undefined)).toBe(DEFAULT_PRACTICE_WINDOW_HOURS);
    expect(configuredWindowHours('abc')).toBe(72);
    expect(configuredWindowHours(0)).toBe(72);
    expect(configuredWindowHours(-5)).toBe(72);
  });

  it('honours a configured value and clamps it to the ceiling', () => {
    expect(configuredWindowHours('24')).toBe(24);
    expect(configuredWindowHours(99999)).toBe(MAX_PRACTICE_WINDOW_HOURS);
  });

  it('creates a window of exactly the configured length', () => {
    const created = createPracticeWindow(NOW, 72);
    expect(created.startsAt).toEqual(NOW);
    expect(created.expiresAt.getTime() - created.startsAt.getTime()).toBe(hours(72));
  });
});

describe('describePracticeWindow', () => {
  const started = { startsAt: NOW, expiresAt: new Date(NOW.getTime() + hours(72)) };

  it('reports NOT_STARTED when no window exists', () => {
    const state = describePracticeWindow(null, NOW);
    expect(state.status).toBe('NOT_STARTED');
    expect(state.effectiveEndsAt).toBeNull();
    expect(canPractise(state)).toBe(false);
  });

  it('reports ACTIVE with the remaining time', () => {
    const state = describePracticeWindow(started, new Date(NOW.getTime() + hours(40)));
    expect(state.status).toBe('ACTIVE');
    expect(state.remainingHours).toBe(32);
    expect(state.expiringSoon).toBe(false);
    expect(canPractise(state)).toBe(true);
  });

  it('turns amber inside the final hours without blocking practice', () => {
    const state = describePracticeWindow(started, new Date(NOW.getTime() + hours(65)));
    expect(state.status).toBe('EXPIRING');
    expect(state.expiringSoon).toBe(true);
    expect(canPractise(state)).toBe(true);
  });

  it('reports EXPIRED at and after the deadline and blocks new sessions', () => {
    const exact = describePracticeWindow(started, new Date(started.expiresAt));
    expect(exact.status).toBe('EXPIRED');
    expect(exact.remainingMs).toBe(0);
    expect(canPractise(exact)).toBe(false);

    const later = describePracticeWindow(started, new Date(started.expiresAt.getTime() + hours(10)));
    expect(later.status).toBe('EXPIRED');
    expect(canPractise(later)).toBe(false);
  });

  it('honours a counselor extension past the original expiry', () => {
    const extended = {
      ...started,
      extendedUntil: new Date(started.expiresAt.getTime() + hours(48)),
    };
    const state = describePracticeWindow(extended, new Date(started.expiresAt.getTime() + hours(1)));
    expect(state.status).toBe('EXTENDED');
    expect(state.extended).toBe(true);
    expect(state.remainingHours).toBe(47);
    expect(canPractise(state)).toBe(true);
  });

  it('ignores an extension that is earlier than the original expiry', () => {
    const state = describePracticeWindow(
      { ...started, extendedUntil: new Date(NOW.getTime() + hours(10)) },
      new Date(NOW.getTime() + hours(20)),
    );
    expect(state.extended).toBe(false);
    expect(state.status).toBe('ACTIVE');
  });

  it('reports CLOSED when a counselor ended practice early, even inside the dates', () => {
    const state = describePracticeWindow({ ...started, closedAt: NOW }, new Date(NOW.getTime() + hours(5)));
    expect(state.status).toBe('CLOSED');
    expect(canPractise(state)).toBe(false);
  });

  it('always states that practice history is retained', () => {
    expect(describePracticeWindow(started, NOW).historyRetained).toBe(true);
    expect(describePracticeWindow(null, NOW).historyRetained).toBe(true);
  });
});

describe('extendPracticeWindow', () => {
  const started = { startsAt: NOW, expiresAt: new Date(NOW.getTime() + hours(72)) };

  it('extends from the existing end while the window is still open', () => {
    const result = extendPracticeWindow(started, new Date(NOW.getTime() + hours(10)), 24);
    expect(result.extendedUntil.getTime()).toBe(started.expiresAt.getTime() + hours(24));
  });

  it('extends from now when the window already lapsed, giving the full extension', () => {
    const afterExpiry = new Date(started.expiresAt.getTime() + hours(100));
    const result = extendPracticeWindow(started, afterExpiry, 48);
    expect(result.extendedUntil.getTime()).toBe(afterExpiry.getTime() + hours(48));
    expect(result.extraHours).toBe(48);
  });

  it('extends from a previous extension rather than the original expiry', () => {
    const record = { ...started, extendedUntil: new Date(started.expiresAt.getTime() + hours(48)) };
    const result = extendPracticeWindow(record, new Date(NOW.getTime() + hours(10)), 24);
    expect(result.extendedUntil.getTime()).toBe(record.extendedUntil.getTime() + hours(24));
  });

  it('clamps an absurd extension request', () => {
    const result = extendPracticeWindow(started, NOW, 999_999);
    expect(result.extraHours).toBe(MAX_PRACTICE_WINDOW_HOURS);
  });
});
