import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  policy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: { counselorTask: { findUnique: (...args: unknown[]) => mocks.findUnique(...args), create: (...args: unknown[]) => mocks.create(...args) } } }));
vi.mock('@/lib/communication/business-hours-store', () => ({ loadBusinessHoursPolicy: (...args: unknown[]) => mocks.policy(...args) }));
vi.mock('@/lib/communication/unified-engine', () => ({ AFTER_HOURS_MESSAGE: 'Static approved after-hours acknowledgement.' }));

import { handleAfterHoursMessage } from '@/lib/communication/after-hours';
import { defaultBusinessHoursConfig } from '@/lib/communication/business-hours';

const defaultHours = defaultBusinessHoursConfig({});

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T06:00:00.000Z')); // Friday, 12:00 Asia/Dhaka
  mocks.findUnique.mockResolvedValue(null);
  mocks.create.mockResolvedValue({ id: 'follow-up-1' });
  mocks.policy.mockResolvedValue({ config: defaultHours, hasPersistedSchedule: true, scheduleReadAvailable: true });
});
afterEach(() => vi.useRealTimers());

describe('after-hours outbound acknowledgement eligibility', () => {
  it('returns the static acknowledgement only after a linked follow-up is durably created', async () => {
    const result = await handleAfterHoursMessage({ channel: 'whatsapp', message: 'Hello', leadId: 'lead-1' });
    expect(result).toMatchObject({ autoReply: 'Static approved after-hours acknowledgement.', taskCreated: true, followUpQueued: true, taskId: 'follow-up-1' });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0][0].data.dueDate).toBe('2026-10-24T03:00:00.000Z');
  });

  it('does not treat a default/fallback schedule as persisted auto-reply approval', async () => {
    mocks.policy.mockResolvedValue({ config: defaultHours, hasPersistedSchedule: false, scheduleReadAvailable: true });
    const result = await handleAfterHoursMessage({ channel: 'whatsapp', message: 'Hello', leadId: 'lead-1' });
    expect(result).toMatchObject({ autoReply: null, followUpQueued: true });
  });

  it('fails closed on a database schedule-read error even if the fallback day enables acknowledgements', async () => {
    mocks.policy.mockResolvedValue({ config: defaultHours, hasPersistedSchedule: false, scheduleReadAvailable: false });
    const result = await handleAfterHoursMessage({ channel: 'whatsapp', message: 'Hello', leadId: 'lead-1' });
    expect(result).toMatchObject({ autoReply: null, followUpQueued: true });
  });

  it('does not expose a sendable acknowledgement when no linked follow-up target exists', async () => {
    const result = await handleAfterHoursMessage({ channel: 'whatsapp', message: 'Hello' });
    expect(result).toMatchObject({ autoReply: null, followUpQueued: false, taskCreated: false });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('reuses an existing idempotent follow-up before returning the acknowledgement', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'already-queued' });
    const result = await handleAfterHoursMessage({ channel: 'facebook_messenger', message: 'Hello', studentId: 'student-1' });
    expect(result).toMatchObject({ autoReply: 'Static approved after-hours acknowledgement.', taskCreated: false, followUpQueued: true, taskId: 'already-queued' });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
