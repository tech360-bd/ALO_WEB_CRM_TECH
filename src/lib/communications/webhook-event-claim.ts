import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';

const CLAIM_LEASE_MS = 5 * 60 * 1000;

type ClaimInput = {
  provider: string;
  eventId: string;
  eventType: string;
  payload: string;
  signature?: string | null;
  verified: boolean;
};

export type WebhookEventClaim =
  | { claimed: true; id: string; token: string }
  | { claimed: false; reason: 'missing_id' | 'already_processed' | 'in_progress' };

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'P2002';
}

/**
 * Claim one provider event before creating any CRM side effects.
 *
 * WebhookEvent(provider,eventId) is the durable idempotency key. A short lease
 * lets a provider retry recover after a worker crash without allowing two live
 * workers to process the same event concurrently. A claim is not consent and
 * does not link an identity.
 */
export async function claimWebhookEvent(input: ClaimInput): Promise<WebhookEventClaim> {
  const provider = input.provider.trim().toUpperCase();
  const eventId = input.eventId.trim();
  if (!provider || !eventId) return { claimed: false, reason: 'missing_id' };

  const token = randomUUID();
  const now = new Date();
  try {
    const created = await db.webhookEvent.create({
      data: {
        provider,
        eventId,
        eventType: input.eventType.slice(0, 191),
        payload: input.payload,
        signature: input.signature || null,
        verified: input.verified,
        processed: false,
        processingAt: now,
        processingToken: token,
      },
      select: { id: true },
    });
    return { claimed: true, id: created.id, token };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  const existing = await db.webhookEvent.findUnique({
    where: { provider_eventId: { provider, eventId } },
    select: { id: true, processed: true, processingAt: true },
  });
  if (!existing) throw new Error('Webhook event claim conflict could not be resolved.');
  if (existing.processed) return { claimed: false, reason: 'already_processed' };

  const staleBefore = new Date(now.getTime() - CLAIM_LEASE_MS);
  const leaseAvailable = !existing.processingAt || existing.processingAt <= staleBefore;
  if (!leaseAvailable) return { claimed: false, reason: 'in_progress' };

  const updated = await db.webhookEvent.updateMany({
    where: {
      id: existing.id,
      processed: false,
      ...(existing.processingAt
        ? { processingAt: { lte: staleBefore } }
        : { processingAt: null }),
    },
    data: { processingAt: now, processingToken: token, errorMessage: null },
  });
  return updated.count === 1
    ? { claimed: true, id: existing.id, token }
    : { claimed: false, reason: 'in_progress' };
}

export async function completeWebhookEvent(claim: Extract<WebhookEventClaim, { claimed: true }>): Promise<void> {
  const completed = await db.webhookEvent.updateMany({
    where: { id: claim.id, processingToken: claim.token, processed: false },
    data: {
      processed: true,
      processedAt: new Date(),
      processingAt: null,
      processingToken: null,
      errorMessage: null,
    },
  });
  if (completed.count !== 1) {
    throw new Error('Webhook event processing lease was lost before completion.');
  }
}

export async function releaseWebhookEventClaim(
  claim: Extract<WebhookEventClaim, { claimed: true }>,
  safeErrorCode: string,
): Promise<void> {
  await db.webhookEvent.updateMany({
    where: { id: claim.id, processingToken: claim.token, processed: false },
    data: {
      processingAt: null,
      processingToken: null,
      errorMessage: safeErrorCode.slice(0, 191),
    },
  });
}
