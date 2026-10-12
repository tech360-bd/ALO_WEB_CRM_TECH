import { db } from '@/lib/db';
import type { TemplateVariable, TemplateValues } from './templating';
import type {
  CampaignForSend,
  CampaignStatus,
  EventType,
  OutboxItemForSend,
  OutboxStore,
  SuppressionReason,
} from './worker';

/** Prisma-backed implementation of OutboxStore. Each claim is guarded by a unique lock token. */

const ACTIVE_CAMPAIGN_STATUSES = ['queued', 'sending'] as const;
const ATTEMPT_EVENT_TYPES = ['sent', 'soft_failure', 'hard_failure', 'failed'] as const;
const PASSTHROUGH_VARIABLES: readonly TemplateVariable[] = ['first_name', 'last_name', 'company'];

export function parseRecipientVars(raw: string | null): TemplateValues {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const record = parsed as Record<string, unknown>;
  const values: TemplateValues = {};
  for (const key of PASSTHROUGH_VARIABLES) {
    const value = record[key];
    if (typeof value === 'string') values[key] = value.slice(0, 200);
  }
  return values;
}

export const prismaOutboxStore: OutboxStore = {
  async recoverStaleLocks(olderThan: Date): Promise<number> {
    const result = await db.emailOutboxItem.updateMany({
      where: { status: 'sending', lockedAt: { lt: olderThan } },
      data: { status: 'queued', lockedAt: null, lockToken: null },
    });
    return result.count;
  },

  async countAttemptsSince(since: Date): Promise<number> {
    return db.emailEvent.count({
      where: { type: { in: [...ATTEMPT_EVENT_TYPES] }, createdAt: { gte: since } },
    });
  },

  async listActiveCampaigns(): Promise<CampaignForSend[]> {
    const rows = await db.emailCampaign.findMany({
      where: { status: { in: [...ACTIVE_CAMPAIGN_STATUSES] } },
      orderBy: [{ queuedAt: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, subject: true, html: true, text: true, status: true, testMode: true },
    });
    return rows.map((row) => ({ ...row, status: row.status as CampaignStatus }));
  },

  async countDue(campaignId: string, now: Date, allowedEmails: string[] | null): Promise<number> {
    return db.emailOutboxItem.count({
      where: {
        campaignId,
        status: 'queued',
        nextAttemptAt: { lte: now },
        ...(allowedEmails ? { email: { in: allowedEmails } } : {}),
      },
    });
  },

  async countPending(campaignId: string): Promise<number> {
    return db.emailOutboxItem.count({
      where: { campaignId, status: { in: ['queued', 'sending'] } },
    });
  },

  async claimDue(campaignId, limit, now, lockToken, allowedEmails): Promise<OutboxItemForSend[]> {
    const dueWhere = {
      campaignId,
      status: 'queued',
      nextAttemptAt: { lte: now },
      ...(allowedEmails ? { email: { in: allowedEmails } } : {}),
    };
    const candidates = await db.emailOutboxItem.findMany({
      where: dueWhere,
      orderBy: { nextAttemptAt: 'asc' },
      take: limit,
      select: { id: true },
    });
    for (const candidate of candidates) {
      // Only the process that wins this conditional update sends the item.
      await db.emailOutboxItem.updateMany({
        where: { id: candidate.id, status: 'queued' },
        data: { status: 'sending', lockedAt: now, lockToken },
      });
    }
    const claimed = await db.emailOutboxItem.findMany({
      where: { campaignId, lockToken, status: 'sending' },
      select: { id: true, campaignId: true, email: true, recipientVars: true, attempts: true },
    });
    return claimed.map((row) => ({
      id: row.id,
      campaignId: row.campaignId,
      email: row.email,
      recipientVars: parseRecipientVars(row.recipientVars),
      attempts: row.attempts,
    }));
  },

  async isSuppressed(email: string): Promise<boolean> {
    const hit = await db.emailSuppression.findUnique({ where: { email }, select: { id: true } });
    return hit !== null;
  },

  async suppress(email: string, reason: SuppressionReason, source: string): Promise<void> {
    // The first reason recorded is kept. A later event never overwrites it.
    await db.emailSuppression.upsert({
      where: { email },
      create: { email, reason, source },
      update: {},
    });
  },

  async markSent(itemId: string, smtpMessageId: string, attempts: number, now: Date): Promise<void> {
    await db.emailOutboxItem.update({
      where: { id: itemId },
      data: { status: 'sent', attempts, sentAt: now, smtpMessageId, lastErrorCode: null, lockedAt: null, lockToken: null },
    });
  },

  async markTerminal(itemId, status, code, attempts): Promise<void> {
    await db.emailOutboxItem.update({
      where: { id: itemId },
      data: { status, attempts, lastErrorCode: code, lockedAt: null, lockToken: null },
    });
  },

  async requeue(itemId: string, attempts: number, nextAttemptAt: Date, code: string | null): Promise<void> {
    await db.emailOutboxItem.update({
      where: { id: itemId },
      data: { status: 'queued', attempts, nextAttemptAt, lastErrorCode: code, lockedAt: null, lockToken: null },
    });
  },

  async setCampaignStatus(campaignId, status, code, now): Promise<void> {
    await db.emailCampaign.updateMany({
      where: { id: campaignId, status: { in: [...ACTIVE_CAMPAIGN_STATUSES] } },
      data: {
        status,
        lastErrorCode: code,
        ...(status === 'sent' ? { completedAt: now } : {}),
      },
    });
  },

  async recordEvent(event: { campaignId: string; email: string; type: EventType; code?: string | null }): Promise<void> {
    await db.emailEvent.create({
      data: {
        campaignId: event.campaignId,
        email: event.email,
        type: event.type,
        code: event.code ?? null,
      },
    });
  },
};
