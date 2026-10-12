/**
 * Outbox worker. One call to runOutboxBatch() claims a small batch of due items
 * and sends them. Database and SMTP access are injected, so the same logic runs in
 * production (Prisma + nodemailer) and in unit tests (in-memory).
 *
 * Guarantees enforced here:
 *   - test mode: only allowlisted addresses are claimed; everything else stays queued
 *   - suppression is checked again immediately before every send
 *   - the caps are checked before each batch; if exhausted, the campaign is paused with a reason
 *   - an item is marked SENT only after the transport accepted it
 *   - hard bounces are suppressed; soft and unknown failures retry with backoff
 *   - an auth failure stops the whole campaign rather than retrying
 *
 * Known limit: delivery is at-least-once. If the process dies after SMTP accepts a
 * message but before the row is updated, a stale-lock release can send it again.
 */
import { derivePlainText, renderTemplate, type TemplateValues } from './templating';
import { remainingBudget, retryDelayMs, STALE_LOCK_MS, HOUR_MS, DAY_MS } from './policy';
import type { FailureKind } from './failures';

export type CampaignStatus = 'draft' | 'queued' | 'sending' | 'paused' | 'sent' | 'cancelled';

export interface CampaignForSend {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string | null;
  status: CampaignStatus;
  testMode: boolean;
}

export interface OutboxItemForSend {
  id: string;
  campaignId: string;
  email: string;
  recipientVars: TemplateValues;
  attempts: number;
}

export type EventType =
  | 'sent'
  | 'soft_failure'
  | 'hard_failure'
  | 'failed'
  | 'suppressed'
  | 'unsubscribed'
  | 'auth_failure'
  | 'cap_reached';

export type SuppressionReason = 'unsubscribed' | 'hard_bounce' | 'complaint' | 'manual';

export interface OutboxStore {
  recoverStaleLocks(olderThan: Date): Promise<number>;
  /** Counts SMTP attempts (sent, soft, hard, failed) since the given time. */
  countAttemptsSince(since: Date): Promise<number>;
  listActiveCampaigns(): Promise<CampaignForSend[]>;
  /** Due items for a campaign. When allowedEmails is non-null, only those addresses count. */
  countDue(campaignId: string, now: Date, allowedEmails: string[] | null): Promise<number>;
  /** All items still waiting (queued or in flight), regardless of test restrictions. */
  countPending(campaignId: string): Promise<number>;
  claimDue(
    campaignId: string,
    limit: number,
    now: Date,
    lockToken: string,
    allowedEmails: string[] | null
  ): Promise<OutboxItemForSend[]>;
  isSuppressed(email: string): Promise<boolean>;
  suppress(email: string, reason: SuppressionReason, source: string): Promise<void>;
  markSent(itemId: string, smtpMessageId: string, attempts: number, now: Date): Promise<void>;
  markTerminal(itemId: string, status: 'failed' | 'suppressed' | 'skipped', code: string, attempts: number, now: Date): Promise<void>;
  requeue(itemId: string, attempts: number, nextAttemptAt: Date, code: string | null): Promise<void>;
  /** Only moves campaigns that are currently queued or sending. Never overrides an operator pause or cancel. */
  setCampaignStatus(campaignId: string, status: 'sending' | 'paused' | 'sent', code: string | null, now: Date): Promise<void>;
  recordEvent(event: { campaignId: string; email: string; type: EventType; code?: string | null }): Promise<void>;
}

export interface OutgoingMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; kind: FailureKind; code: string };

export interface MessageSender {
  send(message: OutgoingMessage): Promise<SendResult>;
}

export interface WorkerConfig {
  testMode: boolean;
  testRecipients: string[];
  hourlyCap: number;
  dailyCap: number;
  batchSize: number;
  maxAttempts: number;
}

export interface WorkerDeps {
  store: OutboxStore;
  sender: MessageSender;
  config: WorkerConfig;
  buildUnsubscribeUrl: (email: string, campaignId: string) => string;
  now: () => Date;
  newLockToken: () => string;
}

export interface WorkerSummary {
  recoveredLocks: number;
  budgetAtStart: number;
  campaignsConsidered: number;
  sent: number;
  softFailures: number;
  hardFailures: number;
  terminalFailures: number;
  suppressed: number;
  pausedCampaigns: Array<{ campaignId: string; code: string }>;
  completedCampaigns: string[];
  restrictedToTestRecipients: boolean;
  stoppedForAuth: boolean;
}

function emptySummary(): WorkerSummary {
  return {
    recoveredLocks: 0,
    budgetAtStart: 0,
    campaignsConsidered: 0,
    sent: 0,
    softFailures: 0,
    hardFailures: 0,
    terminalFailures: 0,
    suppressed: 0,
    pausedCampaigns: [],
    completedCampaigns: [],
    restrictedToTestRecipients: false,
    stoppedForAuth: false,
  };
}

type ItemOutcome = 'attempted' | 'not_attempted' | 'auth';

export async function runOutboxBatch(deps: WorkerDeps): Promise<WorkerSummary> {
  const { store, config } = deps;
  const now = deps.now();
  const summary = emptySummary();

  summary.recoveredLocks = await store.recoverStaleLocks(new Date(now.getTime() - STALE_LOCK_MS));
  const attemptsLastHour = await store.countAttemptsSince(new Date(now.getTime() - HOUR_MS));
  const attemptsLast24h = await store.countAttemptsSince(new Date(now.getTime() - DAY_MS));
  let budget = remainingBudget(config, attemptsLastHour, attemptsLast24h);
  summary.budgetAtStart = budget;

  const campaigns = await store.listActiveCampaigns();
  summary.campaignsConsidered = campaigns.length;

  for (const campaign of campaigns) {
    const restricted = config.testMode || campaign.testMode;
    if (restricted) summary.restrictedToTestRecipients = true;
    const allowedEmails = restricted ? config.testRecipients : null;

    const due = await store.countDue(campaign.id, now, allowedEmails);
    if (due === 0) {
      if ((await store.countPending(campaign.id)) === 0) {
        await store.setCampaignStatus(campaign.id, 'sent', null, now);
        summary.completedCampaigns.push(campaign.id);
      }
      continue;
    }

    if (budget <= 0) {
      await store.setCampaignStatus(campaign.id, 'paused', 'CAP_REACHED', now);
      await store.recordEvent({ campaignId: campaign.id, email: '', type: 'cap_reached', code: 'CAP_REACHED' });
      summary.pausedCampaigns.push({ campaignId: campaign.id, code: 'CAP_REACHED' });
      continue;
    }

    if (campaign.status === 'queued') {
      await store.setCampaignStatus(campaign.id, 'sending', null, now);
    }

    const batch = await store.claimDue(
      campaign.id,
      Math.min(config.batchSize, budget),
      now,
      deps.newLockToken(),
      allowedEmails
    );

    let authFailed = false;
    for (const item of batch) {
      if (authFailed) {
        await store.requeue(item.id, item.attempts, now, null);
        continue;
      }
      const outcome = await deliverOne(deps, campaign, item, now, summary);
      if (outcome === 'auth') authFailed = true;
      else if (outcome === 'attempted') budget -= 1;
    }

    if (authFailed) {
      summary.stoppedForAuth = true;
      await store.setCampaignStatus(campaign.id, 'paused', 'SMTP_AUTH_FAILED', now);
      summary.pausedCampaigns.push({ campaignId: campaign.id, code: 'SMTP_AUTH_FAILED' });
      break;
    }

    if ((await store.countPending(campaign.id)) === 0) {
      await store.setCampaignStatus(campaign.id, 'sent', null, now);
      summary.completedCampaigns.push(campaign.id);
    }
  }

  return summary;
}

async function deliverOne(
  deps: WorkerDeps,
  campaign: CampaignForSend,
  item: OutboxItemForSend,
  now: Date,
  summary: WorkerSummary
): Promise<ItemOutcome> {
  const { store, sender, config } = deps;

  // Re-check suppression at send time. An unsubscribe between enqueue and send must still win.
  if (await store.isSuppressed(item.email)) {
    await store.markTerminal(item.id, 'suppressed', 'SUPPRESSED', item.attempts, now);
    await store.recordEvent({ campaignId: campaign.id, email: item.email, type: 'suppressed', code: 'SUPPRESSED' });
    summary.suppressed += 1;
    return 'not_attempted';
  }

  const unsubscribeUrl = deps.buildUnsubscribeUrl(item.email, campaign.id);
  const values: TemplateValues = {
    ...item.recipientVars,
    email: item.email,
    campaign_name: campaign.name,
    unsubscribe_url: unsubscribeUrl,
  };
  const message: OutgoingMessage = {
    to: item.email,
    subject: renderTemplate(campaign.subject, values, 'text'),
    html: renderTemplate(campaign.html, values, 'html'),
    text: renderTemplate(campaign.text ?? derivePlainText(campaign.html), values, 'text'),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };

  const result = await sender.send(message);
  const attempts = item.attempts + 1;

  if (result.ok) {
    await store.markSent(item.id, result.messageId, attempts, now);
    await store.recordEvent({ campaignId: campaign.id, email: item.email, type: 'sent' });
    summary.sent += 1;
    return 'attempted';
  }

  if (result.kind === 'auth') {
    // Nothing was sent and the attempt does not count against the recipient.
    await store.requeue(item.id, item.attempts, now, result.code);
    await store.recordEvent({ campaignId: campaign.id, email: '', type: 'auth_failure', code: result.code });
    return 'auth';
  }

  if (result.kind === 'hard') {
    await store.markTerminal(item.id, 'failed', result.code, attempts, now);
    await store.suppress(item.email, 'hard_bounce', 'smtp');
    await store.recordEvent({ campaignId: campaign.id, email: item.email, type: 'hard_failure', code: result.code });
    summary.hardFailures += 1;
    return 'attempted';
  }

  // soft or unknown
  if (attempts >= config.maxAttempts) {
    await store.markTerminal(item.id, 'failed', result.code, attempts, now);
    await store.recordEvent({ campaignId: campaign.id, email: item.email, type: 'failed', code: result.code });
    summary.terminalFailures += 1;
    return 'attempted';
  }

  await store.requeue(item.id, attempts, new Date(now.getTime() + retryDelayMs(attempts)), result.code);
  await store.recordEvent({ campaignId: campaign.id, email: item.email, type: 'soft_failure', code: result.code });
  summary.softFailures += 1;
  return 'attempted';
}
