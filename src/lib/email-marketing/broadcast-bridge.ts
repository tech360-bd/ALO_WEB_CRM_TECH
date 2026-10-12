import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { normalizeEmail } from './addresses';
import { readEmailMarketingConfig } from './config';
import { MAX_CAMPAIGN_RECIPIENTS } from './campaigns';
import { escapeHtml, validateTemplate } from './templating';

/**
 * Turns an approved CRM broadcast with channel "email" into a queued email campaign.
 *
 * Consent is default-deny. A recipient is eligible only with a positive
 * CommunicationConsent row for channel "email" (consentGiven = true, optedOutAt null).
 * A missing row means no consent, and a default-valued CommunicationPreference row is
 * not treated as consent. Opt-out preferences and the suppression list also block.
 *
 * Nothing is sent here. The outbox worker sends the rows later, under caps and test mode.
 * The unique broadcastId makes repeated sends of the same broadcast return the existing campaign.
 */

export const EMAIL_AUDIENCE_TYPES = ['all_leads', 'hot_leads', 'students', 'partner_students'] as const;

const PAGE_SIZE = 500;
const IN_CHUNK = 500;
const MAX_AUDIENCE_SCAN = 50000;

export interface EmailBroadcastQueueResult {
  status: 'queued' | 'already_queued';
  campaignId: string;
  queued: number;
  audienceScanned: number;
  skipped: {
    invalidEmail: number;
    duplicate: number;
    optedOut: number;
    noRecordedConsent: number;
    suppressed: number;
    outsideTestList: number;
  };
  testModeRestricted: boolean;
  sendingEnabled: boolean;
}

interface AudienceRow {
  id: string;
  name: string;
  email: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let offset = 0; offset < items.length; offset += size) out.push(items.slice(offset, offset + size));
  return out;
}

async function scanAudience(audienceType: string, filter: Record<string, unknown>): Promise<AudienceRow[]> {
  const rows: AudienceRow[] = [];
  let cursor: string | null = null;
  const isLeadAudience = audienceType === 'all_leads' || audienceType === 'hot_leads';
  const leadWhere = (audienceType === 'hot_leads' ? { ...filter, hotLead: true } : filter) as Prisma.MarketingLeadWhereInput;
  const studentWhere = filter as Prisma.StudentWhereInput;

  for (;;) {
    const pageArgs = {
      orderBy: { id: 'asc' as const },
      take: PAGE_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: { id: true, name: true, email: true },
    };
    const page: AudienceRow[] = isLeadAudience
      ? await db.marketingLead.findMany({ where: leadWhere, ...pageArgs })
      : await db.student.findMany({ where: studentWhere, ...pageArgs });
    rows.push(...page);
    if (rows.length > MAX_AUDIENCE_SCAN) throw new Error('AUDIENCE_TOO_LARGE');
    if (page.length < PAGE_SIZE) break;
    cursor = page[page.length - 1].id;
  }
  return rows;
}

function splitName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  return { first_name: parts[0].slice(0, 100), last_name: parts.slice(1).join(' ').slice(0, 100) };
}

function bodyToHtml(body: string): string {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br/>')}</p>`);
  const footer =
    '<p style="font-size:12px;color:#64748b">To stop receiving marketing emails, <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>';
  return `${paragraphs.join('\n')}\n${footer}`;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function queueEmailBroadcast(
  broadcast: { id: string; title: string; messageBody: string; audienceType: string; audienceFilter: unknown; createdBy: string },
  now: Date = new Date()
): Promise<EmailBroadcastQueueResult> {
  if (!EMAIL_AUDIENCE_TYPES.includes(broadcast.audienceType as (typeof EMAIL_AUDIENCE_TYPES)[number])) {
    throw new Error(`AUDIENCE_NOT_SUPPORTED_FOR_EMAIL:${broadcast.audienceType}`);
  }
  const config = readEmailMarketingConfig();

  const existing = await db.emailCampaign.findUnique({
    where: { broadcastId: broadcast.id },
    select: { id: true, recipientCount: true },
  });
  if (existing) {
    return {
      status: 'already_queued',
      campaignId: existing.id,
      queued: existing.recipientCount,
      audienceScanned: 0,
      skipped: { invalidEmail: 0, duplicate: 0, optedOut: 0, noRecordedConsent: 0, suppressed: 0, outsideTestList: 0 },
      testModeRestricted: config.testMode,
      sendingEnabled: config.sendingEnabled,
    };
  }

  const title = broadcast.title.trim();
  const body = broadcast.messageBody.trim();
  if (title.length === 0) throw new Error('BROADCAST_TITLE_REQUIRED');
  if (body.length === 0) throw new Error('BROADCAST_BODY_REQUIRED');

  const subject = title.slice(0, 255);
  const html = bodyToHtml(body);
  const text = `${body}\n\nUnsubscribe: {{unsubscribe_url}}`;
  const problem = validateTemplate({ subject, html, text });
  if (problem) throw new Error(`TEMPLATE_INVALID:${problem.code}`);

  const filter = isPlainObject(broadcast.audienceFilter) ? broadcast.audienceFilter : {};
  const rows = await scanAudience(broadcast.audienceType, filter);

  const skipped = { invalidEmail: 0, duplicate: 0, optedOut: 0, noRecordedConsent: 0, suppressed: 0, outsideTestList: 0 };
  const candidates = new Map<string, { email: string; first_name: string; last_name: string; id: string }>();
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email) {
      skipped.invalidEmail += 1;
      continue;
    }
    if (candidates.has(email)) {
      skipped.duplicate += 1;
      continue;
    }
    candidates.set(email, { email, id: row.id, ...splitName(row.name) });
  }

  const ownerIds = Array.from(candidates.values()).map((row) => row.id);
  const consented = new Set<string>();
  const optedOut = new Set<string>();
  for (const group of chunks(ownerIds, IN_CHUNK)) {
    const consentRows = await db.communicationConsent.findMany({
      where: { channel: 'email', consentGiven: true, optedOutAt: null, contactId: { in: group } },
      select: { contactId: true },
    });
    for (const row of consentRows) consented.add(row.contactId);

    const preferenceRows = await db.communicationPreference.findMany({
      where: { ownerId: { in: group } },
      select: { ownerId: true, optOutAt: true, marketingAllowed: true, emailAllowed: true },
    });
    for (const row of preferenceRows) {
      if (row.optOutAt !== null || row.marketingAllowed === false || row.emailAllowed === false) optedOut.add(row.ownerId);
    }
  }

  const suppressed = new Set<string>();
  const emails = Array.from(candidates.keys());
  for (const group of chunks(emails, IN_CHUNK)) {
    const hits = await db.emailSuppression.findMany({ where: { email: { in: group } }, select: { email: true } });
    for (const hit of hits) suppressed.add(hit.email);
  }

  const testModeRestricted = config.testMode;
  const allowlist = new Set(config.testRecipients);
  if (testModeRestricted && allowlist.size === 0) throw new Error('TEST_RECIPIENTS_REQUIRED');

  const eligible: Array<{ email: string; first_name: string; last_name: string }> = [];
  for (const row of candidates.values()) {
    if (optedOut.has(row.id)) {
      skipped.optedOut += 1;
      continue;
    }
    if (!consented.has(row.id)) {
      skipped.noRecordedConsent += 1;
      continue;
    }
    if (suppressed.has(row.email)) {
      skipped.suppressed += 1;
      continue;
    }
    if (testModeRestricted && !allowlist.has(row.email)) {
      skipped.outsideTestList += 1;
      continue;
    }
    eligible.push({ email: row.email, first_name: row.first_name, last_name: row.last_name });
  }

  if (eligible.length > MAX_CAMPAIGN_RECIPIENTS) throw new Error('AUDIENCE_TOO_LARGE');

  try {
    const campaign = await db.$transaction(
      async (tx) => {
        const created = await tx.emailCampaign.create({
          data: {
            name: `Broadcast: ${title}`.slice(0, 160),
            subject,
            html,
            text,
            status: 'queued',
            testMode: testModeRestricted,
            broadcastId: broadcast.id,
            consentAttestedBy: 'system:communication-consent',
            consentAttestedAt: now,
            consentBasis:
              'CommunicationConsent email records (consentGiven=true, not opted out); opt-out preferences and suppression list checked',
            recipientCount: eligible.length,
            queuedAt: now,
            createdById: broadcast.createdBy || null,
          },
          select: { id: true },
        });
        for (const group of chunks(eligible, IN_CHUNK)) {
          await tx.emailOutboxItem.createMany({
            data: group.map((row) => ({
              campaignId: created.id,
              email: row.email,
              recipientVars: JSON.stringify({ first_name: row.first_name, last_name: row.last_name, company: '' }),
              status: 'queued',
              nextAttemptAt: now,
            })),
          });
        }
        return created;
      },
      { timeout: 60000 }
    );

    return {
      status: 'queued',
      campaignId: campaign.id,
      queued: eligible.length,
      audienceScanned: rows.length,
      skipped,
      testModeRestricted,
      sendingEnabled: config.sendingEnabled,
    };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const raced = await db.emailCampaign.findUnique({ where: { broadcastId: broadcast.id }, select: { id: true, recipientCount: true } });
    if (!raced) throw error;
    return {
      status: 'already_queued',
      campaignId: raced.id,
      queued: raced.recipientCount,
      audienceScanned: rows.length,
      skipped,
      testModeRestricted,
      sendingEnabled: config.sendingEnabled,
    };
  }
}
