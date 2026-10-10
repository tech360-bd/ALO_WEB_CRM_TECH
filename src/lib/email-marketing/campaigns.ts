import { db } from '@/lib/db';
import { normalizeEmail } from './addresses';
import type { EmailMarketingConfig } from './config';
import {
  cleanText,
  MAX_CAMPAIGN_RECIPIENTS,
  serviceFailure,
  templateFailure,
  type DraftCampaignInput,
  type ServiceResult,
} from './draft-input';
import { validateTemplate } from './templating';

/**
 * Campaign lifecycle service used by the /api/email/campaigns routes.
 * Every state change is a conditional update, so two admins clicking at once cannot
 * queue the same campaign twice or override a pause or cancel.
 */

export { MAX_CAMPAIGN_RECIPIENTS } from './draft-input';
export { parseDraftInput } from './draft-input';
export type { ServiceResult } from './draft-input';

const CHUNK = 500;
const ACTIVE_STATUSES = ['draft', 'queued', 'sending', 'paused'] as const;

interface DraftRecipient {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
}

export interface DraftResult {
  campaignId: string;
  status: 'draft';
  recipientCount: number;
  skipped: {
    invalidEmail: number;
    duplicate: number;
    suppressed: number;
    outsideTestList: number;
  };
  testModeRestricted: boolean;
}

/**
 * Creates a draft with its outbox rows. Nothing is sent. Suppressed addresses are
 * excluded here and again at send time. In test mode, only the allowlist is kept.
 */
export async function createDraftCampaign(
  input: DraftCampaignInput,
  actor: { userId: string },
  config: EmailMarketingConfig,
  now: Date = new Date()
): Promise<ServiceResult<DraftResult>> {
  const templateProblem = validateTemplate({ subject: input.subject, html: input.html, text: input.text });
  if (templateProblem) return templateFailure(templateProblem);

  const skipped = { invalidEmail: 0, duplicate: 0, suppressed: 0, outsideTestList: 0 };
  const byEmail = new Map<string, DraftRecipient>();
  for (const row of input.recipients) {
    const email = normalizeEmail(row.email);
    if (!email) {
      skipped.invalidEmail += 1;
      continue;
    }
    if (byEmail.has(email)) {
      skipped.duplicate += 1;
      continue;
    }
    byEmail.set(email, {
      email,
      first_name: cleanText(row.first_name, 100) ?? '',
      last_name: cleanText(row.last_name, 100) ?? '',
      company: cleanText(row.company, 100) ?? '',
    });
  }

  const testModeRestricted = config.testMode || input.testMode;
  if (testModeRestricted && config.testRecipients.length === 0) {
    return serviceFailure(409, 'TEST_RECIPIENTS_REQUIRED');
  }
  let candidates = Array.from(byEmail.values());
  if (testModeRestricted) {
    const allowlist = new Set(config.testRecipients);
    const kept = candidates.filter((row) => allowlist.has(row.email));
    skipped.outsideTestList = candidates.length - kept.length;
    candidates = kept;
  }

  const suppressed = new Set<string>();
  for (let offset = 0; offset < candidates.length; offset += CHUNK) {
    const chunk = candidates.slice(offset, offset + CHUNK).map((row) => row.email);
    const hits = await db.emailSuppression.findMany({ where: { email: { in: chunk } }, select: { email: true } });
    for (const hit of hits) suppressed.add(hit.email);
  }
  const eligible = candidates.filter((row) => !suppressed.has(row.email));
  skipped.suppressed = candidates.length - eligible.length;

  if (eligible.length === 0) return serviceFailure(422, 'NO_ELIGIBLE_RECIPIENTS', { skipped });
  if (eligible.length > MAX_CAMPAIGN_RECIPIENTS) {
    return serviceFailure(422, 'TOO_MANY_ELIGIBLE_RECIPIENTS', { max: MAX_CAMPAIGN_RECIPIENTS, eligible: eligible.length });
  }

  const campaign = await db.$transaction(
    async (tx) => {
      const created = await tx.emailCampaign.create({
        data: {
          name: input.name,
          subject: input.subject,
          html: input.html,
          text: input.text,
          status: 'draft',
          testMode: input.testMode,
          consentAttestedBy: actor.userId,
          consentAttestedAt: now,
          consentBasis: input.consentBasis,
          recipientCount: eligible.length,
          createdById: actor.userId,
        },
        select: { id: true },
      });
      for (let offset = 0; offset < eligible.length; offset += CHUNK) {
        await tx.emailOutboxItem.createMany({
          data: eligible.slice(offset, offset + CHUNK).map((row) => ({
            campaignId: created.id,
            email: row.email,
            recipientVars: JSON.stringify({ first_name: row.first_name, last_name: row.last_name, company: row.company }),
            status: 'draft',
          })),
        });
      }
      return created;
    },
    { timeout: 60000 }
  );

  return {
    ok: true,
    value: {
      campaignId: campaign.id,
      status: 'draft',
      recipientCount: eligible.length,
      skipped,
      testModeRestricted,
    },
  };
}

/**
 * Moves a draft into the outbox. Requires the operator to repeat the exact recipient
 * count and subject, so a queue cannot be triggered by a stray click.
 */
export function readQueueConfirmation(body: unknown): { recipientCount: number; subject: string } | null {
  if (!body || typeof body !== 'object') return null;
  const confirm = body as Record<string, unknown>;
  if (typeof confirm.recipientCount !== 'number' || !Number.isInteger(confirm.recipientCount)) return null;
  if (typeof confirm.subject !== 'string') return null;
  return { recipientCount: confirm.recipientCount, subject: confirm.subject };
}

export async function queueCampaign(
  campaignId: string,
  confirmation: unknown,
  now: Date = new Date()
): Promise<ServiceResult<{ campaignId: string; status: 'queued'; queued: number }>> {
  const confirm = readQueueConfirmation(confirmation);
  if (!confirm) return serviceFailure(400, 'CONFIRMATION_REQUIRED');

  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, subject: true, recipientCount: true },
  });
  if (!campaign) return serviceFailure(404, 'NOT_FOUND');
  if (campaign.status !== 'draft') return serviceFailure(409, 'INVALID_STATE', { status: campaign.status });
  if (campaign.recipientCount === 0) return serviceFailure(409, 'NO_RECIPIENTS');
  if (confirm.recipientCount !== campaign.recipientCount || confirm.subject !== campaign.subject) {
    return serviceFailure(409, 'CONFIRMATION_MISMATCH');
  }

  const queued = await db.$transaction(
    async (tx) => {
      const moved = await tx.emailCampaign.updateMany({
        where: { id: campaignId, status: 'draft' },
        data: { status: 'queued', queuedAt: now, lastErrorCode: null },
      });
      if (moved.count !== 1) return null;
      const items = await tx.emailOutboxItem.updateMany({
        where: { campaignId, status: 'draft' },
        data: { status: 'queued', nextAttemptAt: now },
      });
      return items.count;
    },
    { timeout: 60000 }
  );
  if (queued === null) return serviceFailure(409, 'INVALID_STATE');

  return { ok: true, value: { campaignId, status: 'queued', queued } };
}

export type CampaignAction = 'pause' | 'resume' | 'cancel';

export const CAMPAIGN_ACTIONS: readonly CampaignAction[] = ['pause', 'resume', 'cancel'];

export async function transitionCampaign(
  campaignId: string,
  action: CampaignAction,
  now: Date = new Date()
): Promise<ServiceResult<{ campaignId: string; status: string }>> {
  if (action === 'pause') {
    const result = await db.emailCampaign.updateMany({
      where: { id: campaignId, status: { in: ['queued', 'sending'] } },
      data: { status: 'paused', lastErrorCode: 'PAUSED_BY_OPERATOR' },
    });
    if (result.count !== 1) return serviceFailure(409, 'INVALID_STATE');
    return { ok: true, value: { campaignId, status: 'paused' } };
  }

  if (action === 'resume') {
    const result = await db.emailCampaign.updateMany({
      where: { id: campaignId, status: 'paused' },
      data: { status: 'queued', lastErrorCode: null },
    });
    if (result.count !== 1) return serviceFailure(409, 'INVALID_STATE');
    return { ok: true, value: { campaignId, status: 'queued' } };
  }

  const cancelled = await db.$transaction(async (tx) => {
    const moved = await tx.emailCampaign.updateMany({
      where: { id: campaignId, status: { in: [...ACTIVE_STATUSES] } },
      data: { status: 'cancelled', completedAt: now, lastErrorCode: 'CANCELLED_BY_OPERATOR' },
    });
    if (moved.count !== 1) return false;
    await tx.emailOutboxItem.updateMany({
      where: { campaignId, status: { in: ['draft', 'queued'] } },
      data: { status: 'skipped', lastErrorCode: 'CAMPAIGN_CANCELLED', lockedAt: null, lockToken: null },
    });
    return true;
  });
  if (!cancelled) return serviceFailure(409, 'INVALID_STATE');
  return { ok: true, value: { campaignId, status: 'cancelled' } };
}

const CAMPAIGN_SUMMARY_SELECT = {
  id: true,
  name: true,
  subject: true,
  status: true,
  testMode: true,
  broadcastId: true,
  recipientCount: true,
  consentBasis: true,
  consentAttestedAt: true,
  queuedAt: true,
  completedAt: true,
  lastErrorCode: true,
  createdAt: true,
} as const;

export async function listCampaigns() {
  return db.emailCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: CAMPAIGN_SUMMARY_SELECT,
  });
}

export const OUTBOX_STATUSES = ['draft', 'queued', 'sending', 'sent', 'failed', 'suppressed', 'skipped'] as const;

export async function getCampaignDetail(campaignId: string) {
  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId },
    select: CAMPAIGN_SUMMARY_SELECT,
  });
  if (!campaign) return null;

  const grouped = await db.emailOutboxItem.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: { _all: true },
  });
  const outbox: Record<string, number> = Object.fromEntries(OUTBOX_STATUSES.map((status) => [status, 0]));
  for (const row of grouped) outbox[row.status] = row._count._all;

  const eventGroups = await db.emailEvent.groupBy({
    by: ['type'],
    where: { campaignId },
    _count: { _all: true },
  });
  const events: Record<string, number> = {};
  for (const row of eventGroups) events[row.type] = row._count._all;

  return { campaign, outbox, events };
}
