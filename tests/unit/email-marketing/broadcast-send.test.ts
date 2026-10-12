// Phase 0 fix: sendBroadcast must never report recipients as "sent" for a channel with no transport,
// and an email broadcast must queue only recipients with recorded consent (default-deny).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  broadcast: null as Record<string, unknown> | null,
  leads: [] as Array<{ id: string; name: string; email: string }>,
  consents: [] as Array<{ contactId: string }>,
  prefs: [] as Array<{ ownerId: string; optOutAt: Date | null; marketingAllowed: boolean; emailAllowed: boolean }>,
  suppressed: [] as Array<{ email: string }>,
  createdCampaigns: [] as Array<Record<string, unknown>>,
  createdItems: [] as Array<Record<string, unknown>>,
  recipientWrites: 0,
}));

vi.mock('@/lib/db', () => {
  const tx = {
    emailCampaign: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.createdCampaigns.push(data);
        return { id: 'camp-1' };
      }),
    },
    emailOutboxItem: {
      createMany: vi.fn(async ({ data }: { data: Array<Record<string, unknown>> }) => {
        state.createdItems.push(...data);
        return { count: data.length };
      }),
    },
  };
  return {
    db: {
      broadcast: { findUnique: vi.fn(async () => state.broadcast) },
      emailCampaign: { findUnique: vi.fn(async () => null) },
      marketingLead: { findMany: vi.fn(async () => state.leads) },
      student: { findMany: vi.fn(async () => []) },
      communicationConsent: { findMany: vi.fn(async () => state.consents) },
      communicationPreference: { findMany: vi.fn(async () => state.prefs) },
      emailSuppression: { findMany: vi.fn(async () => state.suppressed) },
      aloAuditLog: { create: vi.fn(async () => ({})) },
      crmAuditLog: { create: vi.fn(async () => ({})) },
      broadcastRecipient: {
        create: vi.fn(async () => {
          state.recipientWrites += 1;
          return {};
        }),
        updateMany: vi.fn(async () => {
          state.recipientWrites += 1;
          return { count: 0 };
        }),
      },
      communicationThread: { create: vi.fn(async () => ({ id: 'thread-1' })) },
      communicationMessage: { create: vi.fn(async () => ({})) },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    },
  };
});

import { db } from '@/lib/db';
import { sendBroadcast } from '@/lib/communication/broadcast-engine';

const APPROVED = { id: 'b1', title: 'UK intake', messageBody: 'Applications close soon.', audienceType: 'all_leads', audienceFilterJson: '{}', createdBy: 'marketer', approvalStatus: 'approved', channel: 'whatsapp' };
const ENV_KEYS = ['EMAIL_TEST_MODE', 'EMAIL_TEST_RECIPIENTS', 'EMAIL_SENDING_ENABLED', 'APP_URL', 'NEXT_PUBLIC_APP_URL'] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.EMAIL_TEST_MODE = 'false';
  process.env.EMAIL_SENDING_ENABLED = 'false';
  delete process.env.EMAIL_TEST_RECIPIENTS;
  state.broadcast = { ...APPROVED };
  state.leads = [];
  state.consents = [];
  state.prefs = [];
  state.suppressed = [];
  state.createdCampaigns = [];
  state.createdItems = [];
  state.recipientWrites = 0;
  vi.clearAllMocks();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('sendBroadcast channel gate', () => {
  it('refuses WhatsApp (no transport) and writes no "sent" recipient rows', async () => {
    await expect(sendBroadcast('b1', 'user-1')).rejects.toThrow(/CHANNEL_NOT_CONNECTED: whatsapp/);
    expect(state.recipientWrites).toBe(0);
    expect(db.broadcastRecipient.updateMany).not.toHaveBeenCalled();
  });

  it('refuses portal delivery without creating false sent records', async () => {
    state.broadcast = { ...APPROVED, channel: 'portal' };
    await expect(sendBroadcast('b1', 'user-1')).rejects.toThrow(/CHANNEL_NOT_CONNECTED: portal/);
    expect(state.recipientWrites).toBe(0);
    expect(db.communicationMessage.create).not.toHaveBeenCalled();
  });

  it('refuses SMS the same way', async () => {
    state.broadcast = { ...APPROVED, channel: 'sms' };
    await expect(sendBroadcast('b1', 'user-1')).rejects.toThrow(/CHANNEL_NOT_CONNECTED: sms/);
    expect(state.recipientWrites).toBe(0);
  });

  it('still refuses an unapproved broadcast before anything else', async () => {
    state.broadcast = { ...APPROVED, approvalStatus: 'pending', channel: 'email' };
    await expect(sendBroadcast('b1', 'user-1')).rejects.toThrow(/must be approved/);
    expect(state.createdCampaigns).toHaveLength(0);
  });
});

describe('sendBroadcast email channel (queue, default-deny consent)', () => {
  beforeEach(() => {
    state.broadcast = { ...APPROVED, channel: 'email' };
    state.leads = [
      { id: 'L1', name: 'Ann Rahman', email: 'ann@example.com' },
      { id: 'L2', name: 'Bob', email: 'bob@example.com' },
      { id: 'L3', name: 'Cy', email: 'cy@example.com' },
      { id: 'L4', name: 'Dee', email: 'dee@example.com' },
    ];
    // L1: positive email consent. L3 and L4 also have consent, but L3 has opted out and L4 is suppressed.
    // L2 has NO consent row, only a default-valued preference row. That must not count as consent.
    state.consents = [{ contactId: 'L1' }, { contactId: 'L3' }, { contactId: 'L4' }];
    state.prefs = [
      { ownerId: 'L2', optOutAt: null, marketingAllowed: true, emailAllowed: true },
      { ownerId: 'L3', optOutAt: new Date('2026-09-01T00:00:00Z'), marketingAllowed: true, emailAllowed: true },
    ];
    state.suppressed = [{ email: 'dee@example.com' }];
  });

  it('queues only the consented, non-opted-out, unsuppressed recipient and reports why others were skipped', async () => {
    const result = await sendBroadcast('b1', 'user-1');

    expect(result).toMatchObject({
      channel: 'email',
      status: 'queued',
      campaignId: 'camp-1',
      queued: 1,
      skipped: { optedOut: 1, noRecordedConsent: 1, suppressed: 1, invalidEmail: 0, duplicate: 0, outsideTestList: 0 },
    });
    expect(result).not.toHaveProperty('sent');
    expect(state.createdItems.map((row) => row.email)).toEqual(['ann@example.com']);
    expect(state.createdItems[0]).toMatchObject({ status: 'queued' });
    expect(state.createdCampaigns[0]).toMatchObject({ status: 'queued', broadcastId: 'b1', testMode: false, recipientCount: 1 });
  });

  it('does not write any "sent" recipient rows or mark the broadcast as sent for email', async () => {
    await sendBroadcast('b1', 'user-1');
    expect(state.recipientWrites).toBe(0);
    expect(db.broadcast.findUnique).toHaveBeenCalled();
  });

  it('returns the existing campaign instead of queueing a second copy', async () => {
    vi.mocked(db.emailCampaign.findUnique).mockResolvedValueOnce({ id: 'camp-existing', recipientCount: 1 } as never);
    const result = await sendBroadcast('b1', 'user-1');
    expect(result).toMatchObject({ status: 'already_queued', campaignId: 'camp-existing' });
    expect(state.createdCampaigns).toHaveLength(0);
  });

  it('in test mode with no test recipients configured, refuses to queue anything', async () => {
    process.env.EMAIL_TEST_MODE = 'true';
    process.env.EMAIL_TEST_RECIPIENTS = '';
    await expect(sendBroadcast('b1', 'user-1')).rejects.toThrow('TEST_RECIPIENTS_REQUIRED');
    expect(state.createdCampaigns).toHaveLength(0);
  });

  it('in test mode, queues only allowlisted consented recipients', async () => {
    process.env.EMAIL_TEST_MODE = 'true';
    process.env.EMAIL_TEST_RECIPIENTS = 'qa@example.com';
    const result = await sendBroadcast('b1', 'user-1');
    expect(result).toMatchObject({ status: 'queued', queued: 0, testModeRestricted: true });
    expect(state.createdItems).toHaveLength(0);
  });

  it('refuses an audience type that has no email resolution, rather than queuing an empty or wrong list', async () => {
    state.broadcast = { ...APPROVED, channel: 'email', audienceType: 'visa_pending' };
    await expect(sendBroadcast('b1', 'user-1')).rejects.toThrow('AUDIENCE_NOT_SUPPORTED_FOR_EMAIL:visa_pending');
  });
});
