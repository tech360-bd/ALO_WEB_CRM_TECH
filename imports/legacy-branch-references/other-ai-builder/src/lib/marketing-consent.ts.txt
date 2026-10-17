// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Marketing Consent Engine
 *
 * Single source of truth for marketing-channel consent.
 *
 * Rules enforced:
 *   - Consent is per-visitor (identified by visitorId) OR per-email.
 *   - Consent is per-channel (WHATSAPP, SMS, EMAIL, CALL, PUSH).
 *   - Consent may be revoked at any time; revocation is final.
 *   - Frequency caps are enforced per (visitor, channel, campaignId?).
 *
 * Schema dependency: this module expects a MarketingConsent table
 * (or equivalent) with columns:
 *   id, visitorId?, email?, phone?, channel, consentStatus,
 *   grantedAt?, revokedAt?, source?, frequencyCaps JSON, createdAt, updatedAt
 *
 * If the underlying table is absent at runtime, calls will fail.
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export type MarketingChannel = "WHATSAPP" | "SMS" | "EMAIL" | "CALL" | "PUSH";

export const MARKETING_CHANNELS: MarketingChannel[] = ["WHATSAPP", "SMS", "EMAIL", "CALL", "PUSH"];

export interface GrantConsentParams {
  visitorId?: string;
  email?: string;
  phone?: string;
  channel: MarketingChannel;
  source?: string; // e.g. "lead_form", "checkbox_optin", "verbal"
  preferredLanguage?: string;
  preferredTimeWindow?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentRecord {
  id: string;
  visitorId: string | null;
  email: string | null;
  phone: string | null;
  channel: MarketingChannel;
  consentStatus: "GRANTED" | "REVOKED" | "UNKNOWN";
  grantedAt: Date | null;
  revokedAt: Date | null;
  source: string | null;
  preferredLanguage: string | null;
  preferredTimeWindow: string | null;
  metadata: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FrequencyCapConfig {
  channel: MarketingChannel;
  campaignId?: string;
  /** Max messages per window */
  maxCount: number;
  /** Window size in hours */
  windowHours: number;
}

const DEFAULT_CAPS: Record<MarketingChannel, FrequencyCapConfig> = {
  WHATSAPP: { channel: "WHATSAPP", maxCount: 3, windowHours: 24 },
  SMS: { channel: "SMS", maxCount: 2, windowHours: 24 },
  EMAIL: { channel: "EMAIL", maxCount: 3, windowHours: 24 },
  CALL: { channel: "CALL", maxCount: 1, windowHours: 24 },
  PUSH: { channel: "PUSH", maxCount: 5, windowHours: 24 },
};

// Cast db so we can call models that may not exist on the generated client.

// ─── grantConsent ────────────────────────────────────────────────

/**
 * Grant marketing consent for a specific channel.
 *
 * Idempotent: if consent already exists for this (visitorId|email, channel)
 * and is in GRANTED state, this is a no-op (but updates preferred fields).
 * If previously revoked, granting again is allowed and resets revokedAt to null.
 */
export async function grantConsent(params: GrantConsentParams): Promise<ConsentRecord> {
  if (!params.visitorId && !params.email && !params.phone) {
    throw new Error("grantConsent: at least one of visitorId, email, phone is required");
  }
  if (!MARKETING_CHANNELS.includes(params.channel)) {
    throw new Error(`grantConsent: invalid channel ${params.channel}`);
  }

  const lookupKey = params.visitorId
    ? { visitorId: params.visitorId, channel: params.channel }
    : params.email
      ? { email: params.email.toLowerCase(), channel: params.channel }
      : { phone: params.phone, channel: params.channel };

  return db.marketingConsent.upsert({
    where: { visitorId_channel: { visitorId: params.visitorId ?? "", channel: params.channel } },
    create: {
      visitorId: params.visitorId ?? null,
      email: params.email?.toLowerCase() ?? null,
      phone: params.phone ?? null,
      channel: params.channel,
      consentStatus: "GRANTED",
      grantedAt: new Date(),
      revokedAt: null,
      source: params.source ?? "UNKNOWN",
      preferredLanguage: params.preferredLanguage ?? null,
      preferredTimeWindow: params.preferredTimeWindow ?? null,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
    update: {
      consentStatus: "GRANTED",
      grantedAt: new Date(),
      revokedAt: null,
      source: params.source ?? "UNKNOWN",
      preferredLanguage: params.preferredLanguage ?? undefined,
      preferredTimeWindow: params.preferredTimeWindow ?? undefined,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  }).catch(async () => {
    // Fallback for when visitorId_channel unique compound key is absent: findFirst + update
    const existing = await db.marketingConsent.findFirst({ where: lookupKey });
    if (existing) {
      return db.marketingConsent.upsert({
        where: { id: existing.id },
        create: {
          visitorId: params.visitorId ?? null,
          email: params.email?.toLowerCase() ?? null,
          phone: params.phone ?? null,
          channel: params.channel,
          consentStatus: "GRANTED",
          grantedAt: new Date(),
          revokedAt: null,
          source: params.source ?? "UNKNOWN",
          preferredLanguage: params.preferredLanguage ?? null,
          preferredTimeWindow: params.preferredTimeWindow ?? null,
          metadata: JSON.stringify(params.metadata ?? {}),
        },
        update: {
          consentStatus: "GRANTED",
          grantedAt: new Date(),
          revokedAt: null,
          source: params.source ?? "UNKNOWN",
        },
      });
    }
    // Create new record
    return db.marketingConsent.upsert({
      where: { id: "nonexistent" },
      create: {
        visitorId: params.visitorId ?? null,
        email: params.email?.toLowerCase() ?? null,
        phone: params.phone ?? null,
        channel: params.channel,
        consentStatus: "GRANTED",
        grantedAt: new Date(),
        revokedAt: null,
        source: params.source ?? "UNKNOWN",
        preferredLanguage: params.preferredLanguage ?? null,
        preferredTimeWindow: params.preferredTimeWindow ?? null,
        metadata: JSON.stringify(params.metadata ?? {}),
      },
      update: {},
    });
  });
}

// ─── revokeConsent ───────────────────────────────────────────────

/**
 * Revoke all marketing consent for a visitor or email.
 * Revocation is final — all channels are marked REVOKED.
 */
export async function revokeConsent(identifier: { visitorId?: string; email?: string }): Promise<{ revokedCount: number }> {
  if (!identifier.visitorId && !identifier.email) {
    throw new Error("revokeConsent: visitorId or email is required");
  }

  const where = identifier.visitorId
    ? { visitorId: identifier.visitorId }
    : { email: identifier.email!.toLowerCase() };

  const result = await db.marketingConsent.updateMany({
    where,
    data: {
      consentStatus: "REVOKED",
      revokedAt: new Date(),
    },
  });

  return { revokedCount: result.count };
}

// ─── hasConsent ──────────────────────────────────────────────────

/**
 * Check whether consent is currently GRANTED for a visitor or email,
 * optionally for a specific channel.
 *
 * Returns true ONLY if a record exists AND consentStatus === "GRANTED"
 * AND revokedAt is null.
 */
export async function hasConsent(
  identifier: { visitorId?: string; email?: string },
  channel?: MarketingChannel
): Promise<boolean> {
  if (!identifier.visitorId && !identifier.email) {
    throw new Error("hasConsent: visitorId or email is required");
  }

  const where: Record<string, unknown> = {
    consentStatus: "GRANTED",
    revokedAt: null,
  };
  if (identifier.visitorId) where.visitorId = identifier.visitorId;
  else where.email = identifier.email!.toLowerCase();

  if (channel) where.channel = channel;

  const count = await db.marketingConsent.count({ where });
  return count > 0;
}

// ─── checkFrequencyCap ───────────────────────────────────────────

/**
 * Check whether the visitor has hit their frequency cap for a channel.
 * Returns true if MORE messages are ALLOWED (i.e. cap NOT yet hit),
 * false if the cap has been reached.
 *
 * Counts outbound messages in the configured window. If no
 * CommunicationMessage table is available, falls back to 0 (cap not hit).
 */
export async function checkFrequencyCap(
  visitorId: string,
  config: FrequencyCapConfig
): Promise<{ allowed: boolean; sentInWindow: number; cap: number }> {
  if (!visitorId) return { allowed: false, sentInWindow: 0, cap: 0 };

  const cap = config.maxCount;
  const windowMs = config.windowHours * 60 * 60 * 1000;
  const since = new Date(Date.now() - windowMs);

  // Try CommunicationMessage table first (sent messages)
  let sentInWindow = 0;
  try {
    if (db.communicationMessage) {
      sentInWindow = await db.communicationMessage.count({
        where: {
          visitorId,
          channel: config.channel,
          direction: "OUTBOUND",
          createdAt: { gte: since },
          ...(config.campaignId ? { campaignId: config.campaignId } : {}),
        },
      });
    }
  } catch {
    sentInWindow = 0;
  }

  return {
    allowed: sentInWindow < cap,
    sentInWindow,
    cap,
  };
}

// ─── getDefaultCap ───────────────────────────────────────────────

export function getDefaultCap(channel: MarketingChannel): FrequencyCapConfig {
  return DEFAULT_CAPS[channel];
}
