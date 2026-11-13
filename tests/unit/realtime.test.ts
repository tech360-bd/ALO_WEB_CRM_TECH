// Realtime (SSE) layer contracts (spec s86, s69, s91).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    portalNotification: { findMany: vi.fn() },
    studentNotification: { findMany: vi.fn() },
  },
}));

import { db } from '@/lib/db';
import {
  REALTIME_DEFAULT_POLL_MS,
  REALTIME_MAX_POLL_MS,
  REALTIME_MIN_POLL_MS,
  clampPollInterval,
  fetchNewNotifications,
  heartbeatFrame,
  toServerSentEvent,
} from '@/lib/realtime';

const portalFindMany = db.portalNotification.findMany as unknown as ReturnType<typeof vi.fn>;
const studentFindMany = db.studentNotification.findMany as unknown as ReturnType<typeof vi.fn>;

function row(id: string, createdAt: Date, extra: Record<string, unknown> = {}) {
  return { id, title: `Title ${id}`, message: `Message ${id}`, type: 'INFO', actionUrl: `/x/${id}`, isRead: false, createdAt, ...extra };
}

beforeEach(() => {
  vi.clearAllMocks();
  portalFindMany.mockResolvedValue([]);
  studentFindMany.mockResolvedValue([]);
});

describe('Scope correctness — one identity only (s69)', () => {
  it('queries only the portal table for a portal identity', async () => {
    await fetchNewNotifications({ portalUserId: 'user-1' });
    expect(portalFindMany).toHaveBeenCalledTimes(1);
    expect(studentFindMany).not.toHaveBeenCalled();
  });

  it('queries only the student table for a student identity', async () => {
    await fetchNewNotifications({ studentId: 'stu-1' });
    expect(studentFindMany).toHaveBeenCalledTimes(1);
    expect(portalFindMany).not.toHaveBeenCalled();
  });

  it('queries neither table for an empty identity, returning nothing', async () => {
    const result = await fetchNewNotifications({});
    expect(result).toEqual([]);
    expect(portalFindMany).not.toHaveBeenCalled();
    expect(studentFindMany).not.toHaveBeenCalled();
  });

  it('treats null identities as absent rather than as a wildcard', async () => {
    const result = await fetchNewNotifications({ portalUserId: null, studentId: null });
    expect(result).toEqual([]);
    expect(portalFindMany).not.toHaveBeenCalled();
    expect(studentFindMany).not.toHaveBeenCalled();
  });

  it('treats an empty-string identity as absent — never an unfiltered scan', async () => {
    await fetchNewNotifications({ portalUserId: '', studentId: '' });
    expect(portalFindMany).not.toHaveBeenCalled();
    expect(studentFindMany).not.toHaveBeenCalled();
  });

  it('filters strictly on the resolved identity', async () => {
    await fetchNewNotifications({ portalUserId: 'user-1', studentId: 'stu-1' });
    expect(portalFindMany.mock.calls[0][0].where.userId).toBe('user-1');
    expect(studentFindMany.mock.calls[0][0].where.studentId).toBe('stu-1');
  });

  it('merges both sources for a dual identity without cross-contamination', async () => {
    portalFindMany.mockResolvedValue([row('p1', new Date('2026-10-18T01:00:00Z'))]);
    studentFindMany.mockResolvedValue([row('s1', new Date('2026-10-18T02:00:00Z'))]);
    const result = await fetchNewNotifications({ portalUserId: 'user-1', studentId: 'stu-1' });
    expect(result.map((item) => [item.id, item.source])).toEqual([
      ['p1', 'portal'],
      ['s1', 'student'],
    ]);
  });
});

describe('Cursor semantics — reconnects neither replay nor drop (s86)', () => {
  it('uses a strict greater-than cursor, so the last seen row is not re-sent', async () => {
    const since = new Date('2026-10-18T00:00:00Z');
    await fetchNewNotifications({ portalUserId: 'user-1', since });
    expect(portalFindMany.mock.calls[0][0].where.createdAt).toEqual({ gt: since });
    expect(portalFindMany.mock.calls[0][0].where.createdAt.gte).toBeUndefined();
  });

  it('defaults the cursor to the last 24 hours when none is supplied', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T12:00:00Z'));
    await fetchNewNotifications({ portalUserId: 'user-1' });
    expect(portalFindMany.mock.calls[0][0].where.createdAt.gt.toISOString()).toBe('2026-10-17T12:00:00.000Z');
    vi.useRealTimers();
  });

  it('orders oldest-first so the client cursor can advance safely', async () => {
    portalFindMany.mockResolvedValue([
      row('late', new Date('2026-10-18T05:00:00Z')),
      row('early', new Date('2026-10-18T01:00:00Z')),
    ]);
    const result = await fetchNewNotifications({ portalUserId: 'user-1' });
    expect(result.map((item) => item.id)).toEqual(['early', 'late']);
    expect(portalFindMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'asc' });
  });

  it('sorts across both sources by real timestamp, not by source', async () => {
    portalFindMany.mockResolvedValue([row('p-late', new Date('2026-10-18T09:00:00Z'))]);
    studentFindMany.mockResolvedValue([row('s-early', new Date('2026-10-18T03:00:00Z'))]);
    const result = await fetchNewNotifications({ portalUserId: 'u', studentId: 's' });
    expect(result.map((item) => item.id)).toEqual(['s-early', 'p-late']);
  });
});

describe('Query bounds', () => {
  it('clamps the limit to a sane maximum', async () => {
    await fetchNewNotifications({ portalUserId: 'u', limit: 100000 });
    expect(portalFindMany.mock.calls[0][0].take).toBe(200);
  });

  it('clamps a zero or negative limit to at least one row', async () => {
    await fetchNewNotifications({ portalUserId: 'u', limit: 0 });
    expect(portalFindMany.mock.calls[0][0].take).toBe(1);
    await fetchNewNotifications({ portalUserId: 'u', limit: -5 });
    expect(portalFindMany.mock.calls[1][0].take).toBe(1);
  });

  it('defaults the limit to 50', async () => {
    await fetchNewNotifications({ portalUserId: 'u' });
    expect(portalFindMany.mock.calls[0][0].take).toBe(50);
  });

  it('selects only display fields, never credentials or internal notes', async () => {
    await fetchNewNotifications({ portalUserId: 'u', studentId: 's' });
    for (const call of [portalFindMany.mock.calls[0][0], studentFindMany.mock.calls[0][0]]) {
      expect(Object.keys(call.select).sort()).toEqual(
        ['actionUrl', 'createdAt', 'id', 'isRead', 'message', 'title', 'type'].sort(),
      );
    }
  });
});

describe('Payload normalisation', () => {
  it('serialises createdAt to an ISO string for the wire', async () => {
    portalFindMany.mockResolvedValue([row('p1', new Date('2026-10-18T01:02:03Z'))]);
    const [item] = await fetchNewNotifications({ portalUserId: 'u' });
    expect(item.createdAt).toBe('2026-10-18T01:02:03.000Z');
  });

  it('replaces a null actionUrl with an empty string', async () => {
    portalFindMany.mockResolvedValue([row('p1', new Date(), { actionUrl: null })]);
    const [item] = await fetchNewNotifications({ portalUserId: 'u' });
    expect(item.actionUrl).toBe('');
  });

  it('passes the read state through unchanged', async () => {
    portalFindMany.mockResolvedValue([row('p1', new Date(), { isRead: true })]);
    const [item] = await fetchNewNotifications({ portalUserId: 'u' });
    expect(item.isRead).toBe(true);
  });
});

describe('SSE framing (s86)', () => {
  it('emits event, id and data lines terminated by a blank line', () => {
    const frame = toServerSentEvent('notification', { id: 'n1' }, 'n1');
    expect(frame).toBe('event: notification\nid: n1\ndata: {"id":"n1"}\n\n');
  });

  it('omits the id line when no id is given', () => {
    expect(toServerSentEvent('heartbeat', {})).toBe('event: heartbeat\ndata: {}\n\n');
  });

  it('produces a frame a browser EventSource can parse', () => {
    const frame = toServerSentEvent('notification', { title: 'Offer received' }, 'x');
    const lines = frame.split('\n');
    expect(lines[0]).toMatch(/^event: /);
    expect(lines.some((line) => line.startsWith('data: '))).toBe(true);
    // Must end with the blank line that terminates an SSE message.
    expect(frame.endsWith('\n\n')).toBe(true);
  });

  it('never emits a raw newline inside a data line', () => {
    const frame = toServerSentEvent('notification', { message: 'line one\nline two' }, 'x');
    const dataLines = frame.split('\n').filter((line) => line.startsWith('data:'));
    expect(dataLines).toHaveLength(1);
    // The newline survives as an escaped sequence, so no content is lost.
    expect(dataLines[0]).toContain('line one\\nline two');
  });

  it('round-trips structured data through JSON', () => {
    const payload = { id: 'n1', title: 'Visa update', isRead: false, createdAt: '2026-10-18T00:00:00.000Z' };
    const frame = toServerSentEvent('notification', payload, 'n1');
    const dataLine = frame.split('\n').find((line) => line.startsWith('data: '))!;
    expect(JSON.parse(dataLine.slice('data: '.length))).toEqual(payload);
  });

  it('emits a comment-only heartbeat frame that carries no event', () => {
    const frame = heartbeatFrame();
    expect(frame.startsWith(':')).toBe(true);
    expect(frame).toMatch(/^: heartbeat \d{4}-\d{2}-\d{2}T/);
    expect(frame.endsWith('\n\n')).toBe(true);
    expect(frame).not.toContain('event:');
    expect(frame).not.toContain('data:');
  });
});

describe('Poll interval clamping (s86)', () => {
  it('exposes the documented bounds', () => {
    expect(REALTIME_DEFAULT_POLL_MS).toBe(15_000);
    expect(REALTIME_MIN_POLL_MS).toBe(5_000);
    expect(REALTIME_MAX_POLL_MS).toBe(120_000);
  });

  it('passes through a value inside the bounds', () => {
    expect(clampPollInterval(30_000)).toBe(30_000);
    expect(clampPollInterval(REALTIME_MIN_POLL_MS)).toBe(REALTIME_MIN_POLL_MS);
    expect(clampPollInterval(REALTIME_MAX_POLL_MS)).toBe(REALTIME_MAX_POLL_MS);
  });

  it('raises a too-fast interval to the minimum, protecting the database', () => {
    expect(clampPollInterval(1)).toBe(REALTIME_MIN_POLL_MS);
    expect(clampPollInterval(1000)).toBe(REALTIME_MIN_POLL_MS);
  });

  it('lowers a too-slow interval to the maximum', () => {
    expect(clampPollInterval(999_999)).toBe(REALTIME_MAX_POLL_MS);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty string', ''],
    ['NaN text', 'fast'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['zero', 0],
    ['negative', -1000],
  ])('falls back to the default for %s', (_label, value) => {
    expect(clampPollInterval(value)).toBe(REALTIME_DEFAULT_POLL_MS);
  });

  it('accepts a numeric string from a query parameter', () => {
    expect(clampPollInterval('30000')).toBe(30_000);
    expect(clampPollInterval('1')).toBe(REALTIME_MIN_POLL_MS);
  });

  it('rounds a fractional interval to whole milliseconds', () => {
    expect(clampPollInterval(1234.7)).toBe(REALTIME_MIN_POLL_MS);
    expect(clampPollInterval(30000.4)).toBe(30_000);
  });
});
