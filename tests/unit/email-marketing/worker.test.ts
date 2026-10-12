// Outbox worker behaviour (src/lib/email-marketing/worker.ts), run against an in-memory store.
// The in-memory store mirrors the guards in store.ts (conditional claims, status-guarded campaign
// transitions). Database behaviour itself is NOT covered here.
import { describe, expect, it } from 'vitest';
import {
  runOutboxBatch,
  type CampaignForSend,
  type CampaignStatus,
  type EventType,
  type MessageSender,
  type OutboxItemForSend,
  type OutboxStore,
  type OutgoingMessage,
  type SendResult,
  type WorkerConfig,
} from '@/lib/email-marketing/worker';
import type { TemplateValues } from '@/lib/email-marketing/templating';

const T0 = new Date('2026-10-08T06:00:00.000Z');
const ATTEMPT_TYPES: EventType[] = ['sent', 'soft_failure', 'hard_failure', 'failed'];
const BASE_CONFIG: WorkerConfig = {
  testMode: false,
  testRecipients: [],
  hourlyCap: 100,
  dailyCap: 1000,
  batchSize: 10,
  maxAttempts: 3,
};

interface MemItem {
  id: string;
  campaignId: string;
  email: string;
  status: string;
  attempts: number;
  nextAttemptAt: Date;
  lockedAt: Date | null;
  lockToken: string | null;
  recipientVars: TemplateValues;
  lastErrorCode: string | null;
  smtpMessageId: string | null;
}

interface MemCampaign extends CampaignForSend {
  queuedAt: Date;
  lastErrorCode: string | null;
}

interface MemEvent {
  campaignId: string | null;
  email: string;
  type: EventType;
  code: string | null;
  at: Date;
}

class MemoryWorld {
  now: Date;
  readonly campaigns = new Map<string, MemCampaign>();
  readonly items: MemItem[] = [];
  readonly suppressions = new Map<string, string>();
  readonly events: MemEvent[] = [];

  constructor(now: Date) {
    this.now = now;
  }

  addCampaign(input: { id: string; recipients: string[]; status?: CampaignStatus; testMode?: boolean }): void {
    this.campaigns.set(input.id, {
      id: input.id,
      name: 'Spring intake',
      subject: 'Hello {{first_name}}',
      html: '<p>Hi {{first_name}} &amp; welcome</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
      text: null,
      status: input.status ?? 'queued',
      testMode: input.testMode ?? false,
      queuedAt: T0,
      lastErrorCode: null,
    });
    for (const email of input.recipients) {
      this.items.push({
        id: `${input.id}:${email}`,
        campaignId: input.id,
        email,
        status: 'queued',
        attempts: 0,
        nextAttemptAt: T0,
        lockedAt: null,
        lockToken: null,
        recipientVars: { first_name: 'Ann' },
        lastErrorCode: null,
        smtpMessageId: null,
      });
    }
  }

  item(email: string): MemItem {
    const found = this.items.find((row) => row.email === email);
    if (!found) throw new Error(`no item for ${email}`);
    return found;
  }

  eventCount(type: EventType): number {
    return this.events.filter((event) => event.type === type).length;
  }

}

function memoryStore(world: MemoryWorld): OutboxStore {
  return {
      async recoverStaleLocks(olderThan: Date) {
        let count = 0;
        for (const row of world.items) {
          if (row.status === 'sending' && row.lockedAt !== null && row.lockedAt < olderThan) {
            row.status = 'queued';
            row.lockedAt = null;
            row.lockToken = null;
            count += 1;
          }
        }
        return count;
      },
      async countAttemptsSince(since: Date) {
        return world.events.filter((event) => ATTEMPT_TYPES.includes(event.type) && event.at >= since).length;
      },
      async listActiveCampaigns() {
        return Array.from(world.campaigns.values())
          .filter((campaign) => campaign.status === 'queued' || campaign.status === 'sending')
          .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime())
          .map((campaign) => ({ ...campaign }));
      },
      async countDue(campaignId: string, now: Date, allowedEmails: string[] | null) {
        return world.items.filter(
          (row) =>
            row.campaignId === campaignId &&
            row.status === 'queued' &&
            row.nextAttemptAt <= now &&
            (allowedEmails === null || allowedEmails.includes(row.email))
        ).length;
      },
      async countPending(campaignId: string) {
        return world.items.filter(
          (row) => row.campaignId === campaignId && (row.status === 'queued' || row.status === 'sending')
        ).length;
      },
      async claimDue(campaignId: string, limit: number, now: Date, lockToken: string, allowedEmails: string[] | null) {
        const due = world.items
          .filter(
            (row) =>
              row.campaignId === campaignId &&
              row.status === 'queued' &&
              row.nextAttemptAt <= now &&
              (allowedEmails === null || allowedEmails.includes(row.email))
          )
          .slice(0, limit);
        for (const row of due) {
          row.status = 'sending';
          row.lockedAt = now;
          row.lockToken = lockToken;
        }
        const claimed: OutboxItemForSend[] = due.map((row) => ({
          id: row.id,
          campaignId: row.campaignId,
          email: row.email,
          recipientVars: row.recipientVars,
          attempts: row.attempts,
        }));
        return claimed;
      },
      async isSuppressed(email: string) {
        return world.suppressions.has(email);
      },
      async suppress(email: string, reason) {
        if (!world.suppressions.has(email)) world.suppressions.set(email, reason);
      },
      async markSent(itemId: string, smtpMessageId: string, attempts: number) {
        const row = world.items.find((candidate) => candidate.id === itemId);
        if (!row) throw new Error('missing item');
        Object.assign(row, { status: 'sent', attempts, smtpMessageId, lastErrorCode: null, lockedAt: null, lockToken: null });
      },
      async markTerminal(itemId: string, status: 'failed' | 'suppressed' | 'skipped', code: string, attempts: number) {
        const row = world.items.find((candidate) => candidate.id === itemId);
        if (!row) throw new Error('missing item');
        Object.assign(row, { status, attempts, lastErrorCode: code, lockedAt: null, lockToken: null });
      },
      async requeue(itemId: string, attempts: number, nextAttemptAt: Date, code: string | null) {
        const row = world.items.find((candidate) => candidate.id === itemId);
        if (!row) throw new Error('missing item');
        Object.assign(row, { status: 'queued', attempts, nextAttemptAt, lastErrorCode: code, lockedAt: null, lockToken: null });
      },
      async setCampaignStatus(campaignId: string, status: 'sending' | 'paused' | 'sent', code: string | null) {
        const campaign = world.campaigns.get(campaignId);
        // Same guard as the Prisma store: never override an operator pause or cancel.
        if (!campaign || (campaign.status !== 'queued' && campaign.status !== 'sending')) return;
        campaign.status = status;
        campaign.lastErrorCode = code;
      },
      async recordEvent(event) {
        world.events.push({ campaignId: event.campaignId, email: event.email, type: event.type, code: event.code ?? null, at: world.now });
      },
  };
}

function scriptedSender(script: Record<string, SendResult[]> = {}) {
  const delivered: OutgoingMessage[] = [];
  const calls: string[] = [];
  let counter = 0;
  const sender: MessageSender = {
    async send(message) {
      calls.push(message.to);
      const queued = script[message.to];
      const result: SendResult = queued && queued.length > 0 ? queued.shift()! : { ok: true, messageId: `<m${++counter}@test>` };
      if (result.ok) delivered.push(message);
      return result;
    },
  };
  return { sender, delivered, calls };
}

function run(world: MemoryWorld, sender: MessageSender, overrides: Partial<WorkerConfig> = {}) {
  let lock = 0;
  return runOutboxBatch({
    store: memoryStore(world),
    sender,
    config: { ...BASE_CONFIG, ...overrides },
    buildUnsubscribeUrl: (email, campaignId) => `https://app.test/api/email/unsubscribe?c=${campaignId}&e=${encodeURIComponent(email)}`,
    now: () => world.now,
    newLockToken: () => `lock-${++lock}`,
  });
}

describe('outbox worker: normal delivery', () => {
  it('sends each due item, marks it sent, and completes the campaign', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com', 'bob@example.com'] });
    const { sender, delivered } = scriptedSender();

    const summary = await run(world, sender);

    expect(summary.sent).toBe(2);
    expect(world.item('ann@example.com').status).toBe('sent');
    expect(world.item('bob@example.com').status).toBe('sent');
    expect(world.campaigns.get('c1')?.status).toBe('sent');
    expect(world.eventCount('sent')).toBe(2);
    expect(summary.completedCampaigns).toEqual(['c1']);
    expect(delivered).toHaveLength(2);
  });

  it('adds List-Unsubscribe headers, a per-recipient unsubscribe link, and escaped HTML', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'] });
    const { sender, delivered } = scriptedSender();

    await run(world, sender);

    const message = delivered[0];
    expect(message.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(message.headers['List-Unsubscribe']).toBe(
      '<https://app.test/api/email/unsubscribe?c=c1&e=ann%40example.com>'
    );
    // HTML-mode values are escaped, so the & in the href becomes &amp;
    expect(message.html).toContain('href="https://app.test/api/email/unsubscribe?c=c1&amp;e=ann%40example.com"');
    // The template's own &amp; is literal text and is left as written
    expect(message.html).toContain('Hi Ann &amp; welcome');
    expect(message.subject).toBe('Hello Ann');
  });

  it('always includes the unsubscribe URL in the text part, even when only the HTML had it', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'] });
    const { sender, delivered } = scriptedSender();

    await run(world, sender);

    expect(delivered[0].text).toContain('https://app.test/api/email/unsubscribe?c=c1&e=ann%40example.com');
  });

  it('leaves a campaign that is not yet due alone, and does not complete it', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'] });
    world.items[0].nextAttemptAt = new Date(T0.getTime() + 60_000);
    const { sender, calls } = scriptedSender();

    const summary = await run(world, sender);

    expect(calls).toHaveLength(0);
    expect(summary.completedCampaigns).toEqual([]);
    // Nothing has been claimed yet, so the campaign is still "queued", not "sending".
    expect(world.campaigns.get('c1')?.status).toBe('queued');
  });
});

describe('outbox worker: suppression and test mode', () => {
  it('re-checks suppression at send time, so an unsubscribe after enqueue still wins', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com', 'bob@example.com'] });
    world.suppressions.set('bob@example.com', 'unsubscribed');
    const { sender, calls } = scriptedSender();

    const summary = await run(world, sender);

    expect(calls).toEqual(['ann@example.com']);
    expect(world.item('bob@example.com').status).toBe('suppressed');
    expect(summary.suppressed).toBe(1);
  });

  it('global test mode sends only to allowlisted addresses and holds the rest queued (not sent, not skipped)', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['qa@example.com', 'real@example.com'] });
    const { sender, calls } = scriptedSender();

    const summary = await run(world, sender, { testMode: true, testRecipients: ['qa@example.com'] });

    expect(calls).toEqual(['qa@example.com']);
    expect(summary.restrictedToTestRecipients).toBe(true);
    expect(world.item('real@example.com').status).toBe('queued');
    expect(world.campaigns.get('c1')?.status).toBe('sending');
  });

  it('global test mode with an empty allowlist sends nothing', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['qa@example.com'] });
    const { sender, calls } = scriptedSender();

    await run(world, sender, { testMode: true, testRecipients: [] });

    expect(calls).toHaveLength(0);
    expect(world.item('qa@example.com').status).toBe('queued');
  });

  it('a campaign flagged as test restricts sending even when global test mode is off', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['qa@example.com', 'real@example.com'], testMode: true });
    const { sender, calls } = scriptedSender();

    await run(world, sender, { testMode: false, testRecipients: ['qa@example.com'] });

    expect(calls).toEqual(['qa@example.com']);
  });

  it('ignores paused and cancelled campaigns entirely', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'], status: 'paused' });
    world.addCampaign({ id: 'c2', recipients: ['bob@example.com'], status: 'cancelled' });
    const { sender, calls } = scriptedSender();

    const summary = await run(world, sender);

    expect(calls).toHaveLength(0);
    expect(summary.campaignsConsidered).toBe(0);
  });
});

describe('outbox worker: caps', () => {
  it('stops at the hourly cap and pauses the campaign with CAP_REACHED when items are still due', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com', 'e@example.com'] });
    const { sender, calls } = scriptedSender();

    const first = await run(world, sender, { hourlyCap: 2, batchSize: 10 });
    expect(calls).toHaveLength(2);
    expect(first.budgetAtStart).toBe(2);
    expect(world.campaigns.get('c1')?.status).toBe('sending');

    const second = await run(world, sender, { hourlyCap: 2, batchSize: 10 });
    expect(calls).toHaveLength(2);
    expect(second.pausedCampaigns).toEqual([{ campaignId: 'c1', code: 'CAP_REACHED' }]);
    expect(world.campaigns.get('c1')).toMatchObject({ status: 'paused', lastErrorCode: 'CAP_REACHED' });
    expect(world.eventCount('cap_reached')).toBe(1);
  });

  it('counts attempts in the last 24 hours against the daily cap, including failed attempts', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['a@example.com', 'b@example.com', 'c@example.com'] });
    const earlier = new Date(T0.getTime() - 23 * 60 * 60 * 1000);
    for (let i = 0; i < 3; i++) {
      world.events.push({ campaignId: null, email: `old${i}@example.com`, type: 'soft_failure', code: 'SMTP_TEMPORARY_FAILURE', at: earlier });
    }
    const { sender, calls } = scriptedSender();

    const summary = await run(world, sender, { dailyCap: 4, hourlyCap: 100 });

    expect(summary.budgetAtStart).toBe(1);
    expect(calls).toHaveLength(1);
  });

  it('does not count attempts older than 24 hours', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['a@example.com'] });
    const old = new Date(T0.getTime() - 25 * 60 * 60 * 1000);
    world.events.push({ campaignId: null, email: 'x@example.com', type: 'sent', code: null, at: old });
    const { sender, calls } = scriptedSender();

    const summary = await run(world, sender, { dailyCap: 1, hourlyCap: 100 });

    expect(summary.budgetAtStart).toBe(1);
    expect(calls).toHaveLength(1);
  });
});

describe('outbox worker: failures', () => {
  it('a hard bounce fails the item and suppresses the address', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['gone@example.com', 'ok@example.com'] });
    const { sender } = scriptedSender({
      'gone@example.com': [{ ok: false, kind: 'hard', code: 'SMTP_RECIPIENT_REJECTED' }],
    });

    const summary = await run(world, sender);

    expect(world.item('gone@example.com')).toMatchObject({ status: 'failed', lastErrorCode: 'SMTP_RECIPIENT_REJECTED', attempts: 1 });
    expect(world.suppressions.get('gone@example.com')).toBe('hard_bounce');
    expect(summary.hardFailures).toBe(1);
    expect(world.campaigns.get('c1')?.status).toBe('sent');
  });

  it('an unclassified policy rejection is retried, never suppressed', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'] });
    const { sender } = scriptedSender({
      'ann@example.com': [{ ok: false, kind: 'unknown', code: 'SMTP_POLICY_REJECTED' }],
    });

    await run(world, sender);

    expect(world.item('ann@example.com')).toMatchObject({ status: 'queued', attempts: 1, lastErrorCode: 'SMTP_POLICY_REJECTED' });
    expect(world.suppressions.has('ann@example.com')).toBe(false);
  });

  it('a soft failure is retried after backoff, then fails once maxAttempts is reached', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'] });
    const { sender, calls } = scriptedSender({
      'ann@example.com': [
        { ok: false, kind: 'soft', code: 'SMTP_TEMPORARY_FAILURE' },
        { ok: false, kind: 'soft', code: 'SMTP_TEMPORARY_FAILURE' },
        { ok: false, kind: 'soft', code: 'SMTP_TEMPORARY_FAILURE' },
      ],
    });

    await run(world, sender, { maxAttempts: 3 });
    expect(world.item('ann@example.com')).toMatchObject({ status: 'queued', attempts: 1 });
    expect(world.item('ann@example.com').nextAttemptAt.getTime()).toBe(T0.getTime() + 5 * 60 * 1000);

    // Not yet due: no second attempt.
    world.now = new Date(T0.getTime() + 60 * 1000);
    await run(world, sender, { maxAttempts: 3 });
    expect(calls).toHaveLength(1);

    world.now = new Date(T0.getTime() + 6 * 60 * 1000);
    await run(world, sender, { maxAttempts: 3 });
    expect(world.item('ann@example.com')).toMatchObject({ status: 'queued', attempts: 2 });

    world.now = new Date(T0.getTime() + 60 * 60 * 1000);
    const last = await run(world, sender, { maxAttempts: 3 });
    expect(world.item('ann@example.com')).toMatchObject({ status: 'failed', attempts: 3, lastErrorCode: 'SMTP_TEMPORARY_FAILURE' });
    expect(last.terminalFailures).toBe(1);
    expect(world.suppressions.has('ann@example.com')).toBe(false);
    expect(world.campaigns.get('c1')?.status).toBe('sent');
  });

  it('an auth failure pauses the campaign, stops further sends, and does not spend attempts', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['a@example.com', 'b@example.com', 'c@example.com'] });
    const { sender, calls } = scriptedSender({
      'a@example.com': [{ ok: false, kind: 'auth', code: 'SMTP_AUTH_FAILED' }],
    });

    const summary = await run(world, sender, { batchSize: 10 });

    expect(calls).toEqual(['a@example.com']);
    expect(summary.stoppedForAuth).toBe(true);
    expect(world.campaigns.get('c1')).toMatchObject({ status: 'paused', lastErrorCode: 'SMTP_AUTH_FAILED' });
    for (const email of ['a@example.com', 'b@example.com', 'c@example.com']) {
      expect(world.item(email)).toMatchObject({ status: 'queued', attempts: 0 });
    }
  });

  it('releases items left in flight by a crashed worker and sends them', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'] });
    world.items[0].status = 'sending';
    world.items[0].lockedAt = new Date(T0.getTime() - 20 * 60 * 1000);
    world.items[0].lockToken = 'dead-worker';
    const { sender } = scriptedSender();

    const summary = await run(world, sender);

    expect(summary.recoveredLocks).toBe(1);
    expect(world.item('ann@example.com').status).toBe('sent');
  });

  it('does not release a lock that is still fresh', async () => {
    const world = new MemoryWorld(T0);
    world.addCampaign({ id: 'c1', recipients: ['ann@example.com'] });
    world.items[0].status = 'sending';
    world.items[0].lockedAt = new Date(T0.getTime() - 60 * 1000);
    const { sender, calls } = scriptedSender();

    const summary = await run(world, sender);

    expect(summary.recoveredLocks).toBe(0);
    expect(calls).toHaveLength(0);
    expect(world.item('ann@example.com').status).toBe('sending');
  });
});
