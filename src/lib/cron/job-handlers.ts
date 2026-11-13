/**
 * Cron job bodies — ALO Education
 *
 * Each handler is the single implementation for its job. Nothing here is a
 * placeholder: every handler performs real work against existing models and
 * reports what it did, and every handler is safe to run twice (idempotent) and
 * safe to run concurrently (the runner holds a lease).
 *
 * Destructive work is opt-in. `runNotificationCleanup` only deletes once
 * `ALO_NOTIFICATION_RETENTION_DAYS` is explicitly configured, and
 * `runTempFileCleanup` reports without deleting — the platform never removes
 * student evidence as a side effect of a scheduled job.
 */

import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/phone-normalization';

export interface JobHandlerContext {
  now: Date;
  limit: number;
}

const MAX_STRING = 180;

function clampLimit(value: unknown, fallback = 100, max = 500): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.floor(n));
}

function short(value: unknown): string {
  const text = typeof value === 'string' ? value : String(value ?? '');
  return text.length <= MAX_STRING ? text : `${text.slice(0, MAX_STRING - 1)}…`;
}

/**
 * Parse the loose date strings stored on student profiles (ISO, D/M/Y, D-M-Y).
 * Returns null for anything unrecognised — an unparseable date must never be
 * treated as "expiring soon".
 */
export function parseLooseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (iso) return safeDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dmy = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(text);
  if (dmy) return safeDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function safeDate(year: number, month: number, day: number): Date | null {
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function daysUntil(target: Date, now: Date): number {
  return Math.floor((target.getTime() - now.getTime()) / 86_400_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WhatsApp follow-up sequence (§19/§20) — existing engine, unchanged
// ─────────────────────────────────────────────────────────────────────────────

export async function runWhatsAppFollowUps(): Promise<Record<string, unknown>> {
  const { processDueFollowUps } = await import('@/lib/whatsapp-followup-engine');
  const results = await processDueFollowUps();
  const sent = results.filter((r) => r?.success).length;
  return {
    processed: results.length,
    sent,
    failed: results.length - sent,
    // Provider-level failures (e.g. credentials not configured) are reported,
    // never converted into a success.
    errors: results.filter((r) => !r?.success).slice(0, 10).map((r) => short(r?.error ?? 'send failed')),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SLA monitoring & escalation (§26/§27)
// ─────────────────────────────────────────────────────────────────────────────

export async function runSlaMonitor(): Promise<Record<string, unknown>> {
  const { checkAndEscalateSla } = await import('@/lib/sla-engine');
  const results = await checkAndEscalateSla();
  return { escalated: Array.isArray(results) ? results.length : 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Failed WhatsApp message retry (§49) — bounded attempts, never endless
// ─────────────────────────────────────────────────────────────────────────────

export async function runFailedMessageRetry(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const { sendWhatsAppMessage } = await import('@/lib/whatsapp-cloud-api');
  const limit = clampLimit(ctx.limit, 20, 50);

  const due = await db.whatsAppRetryQueue.findMany({
    where: {
      status: { in: ['pending', 'retrying'] },
      attemptCount: { lt: 3 },
      nextRetryAt: { lte: ctx.now },
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of due) {
    const attemptsAfter = item.attemptCount + 1;
    // Compare-and-swap claim makes concurrent cron workers idempotent.
    const claim = await db.whatsAppRetryQueue.updateMany({
      where: {
        id: item.id,
        status: { in: ['pending', 'retrying'] },
        attemptCount: item.attemptCount,
        nextRetryAt: { lte: ctx.now },
      },
      data: {
        status: 'retrying',
        attemptCount: attemptsAfter,
        nextRetryAt: new Date(ctx.now.getTime() + 10 * 60_000),
      },
    });
    if (claim.count !== 1) { skipped++; continue; }

    const purpose = String(item.purpose || 'unknown').toUpperCase();
    if (!['SERVICE', 'TRANSACTIONAL', 'PROMOTIONAL_MARKETING'].includes(purpose)) {
      failed++;
      const error = 'REVIEW_REQUIRED_UNKNOWN_PURPOSE';
      await db.whatsAppRetryQueue.update({
        where: { id: item.id },
        data: { status: 'failed', lastError: error, nextRetryAt: null },
      });
      if (errors.length < 5) errors.push(error);
      continue;
    }

    if (purpose === 'SERVICE') {
      const cutoff = new Date(ctx.now.getTime() - 24 * 60 * 60 * 1000);
      let recentInbound = false;
      try {
        const ucc = item.conversationId
          ? await db.uccConversation.findUnique({
              where: { id: item.conversationId },
              select: { id: true, channel: true, participantPhone: true, assignedToUserId: true },
            })
          : null;
        if (ucc) {
          const contextStillOwned = ucc.channel.toLowerCase() === 'whatsapp'
            && normalizePhone(ucc.participantPhone || '') === normalizePhone(item.recipientPhone)
            && ucc.assignedToUserId === item.actorId;
          recentInbound = contextStillOwned && Boolean(await db.uccMessage.findFirst({
            where: { conversationId: ucc.id, direction: 'inbound', createdAt: { gte: cutoff } },
            select: { id: true },
          }));
        } else if (item.conversationId) {
          const legacyThread = await db.communicationThread.findUnique({ where: { id: item.conversationId }, select: { id: true, channel: true, studentId: true, leadId: true, assignedToId: true } }).catch(() => null);
          if (legacyThread) {
            const linkedStudent = legacyThread.studentId
              ? await db.student.findUnique({ where: { id: legacyThread.studentId }, select: { phone: true } }).catch(() => null)
              : null;
            const linkedLead = legacyThread.leadId
              ? await db.lead.findUnique({ where: { id: legacyThread.leadId }, select: { phone: true } }).catch(() => null)
              : null;
            const conversationPhone = linkedStudent?.phone || linkedLead?.phone || '';
            const contextStillOwned = legacyThread.channel.toLowerCase() === 'whatsapp'
              && normalizePhone(conversationPhone) === normalizePhone(item.recipientPhone)
              && legacyThread.assignedToId === item.actorId;
            recentInbound = contextStillOwned && Boolean(await db.communicationMessage.findFirst({
              where: { threadId: legacyThread.id, direction: 'inbound', createdAt: { gte: cutoff } },
              select: { id: true },
            }));
          }
        }
      } catch {
        recentInbound = false;
      }
      if (!recentInbound) {
        failed++;
        const error = 'WHATSAPP_SERVICE_WINDOW_CLOSED_OR_CONVERSATION_MISSING';
        await db.whatsAppRetryQueue.update({ where: { id: item.id }, data: { status: 'failed', lastError: error, nextRetryAt: null } });
        if (errors.length < 5) errors.push(error);
        continue;
      }
    }

    if (purpose === 'TRANSACTIONAL' && !item.conversationId) {
      failed++;
      const error = 'TRANSACTIONAL_RETRY_REQUIRES_VERIFIABLE_CONTEXT';
      await db.whatsAppRetryQueue.update({ where: { id: item.id }, data: { status: 'failed', lastError: error, nextRetryAt: null } });
      if (errors.length < 5) errors.push(error);
      continue;
    }

    try {
      const sendResult = await sendWhatsAppMessage({
        to: item.recipientPhone,
        text: item.messageBody,
        purpose: purpose as 'SERVICE' | 'TRANSACTIONAL' | 'PROMOTIONAL_MARKETING',
        conversationId: item.conversationId || undefined,
        campaignId: item.campaignId || undefined,
        approvalId: item.approvalId || undefined,
        actorId: item.actorId || 'system',
        senderNumber: item.senderNumber || undefined,
      });

      if (sendResult.success) {
        sent++;
        await db.whatsAppRetryQueue.update({
          where: { id: item.id },
          data: { status: 'sent', lastError: '', nextRetryAt: null },
        });
      } else {
        failed++;
        const errorCode = sendResult.error ?? 'provider rejected the message';
        if (errors.length < 5) errors.push(short(errorCode));
        // Retry only a definitive provider rate-limit rejection. Network/time-out
        // and other responses can be ambiguous after provider acceptance, so a
        // resend could duplicate a message and is deliberately terminal.
        const retryable = errorCode.includes('HTTP_429');
        const exhausted = !retryable || attemptsAfter >= Math.max(1, Math.min(item.maxAttempts || 3, 3));
        await db.whatsAppRetryQueue.update({
          where: { id: item.id },
          data: {
            status: exhausted ? 'failed' : 'retrying',
            lastError: short(errorCode),
            nextRetryAt: exhausted ? null : new Date(ctx.now.getTime() + attemptsAfter * 3_600_000),
          },
        });
      }
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      if (errors.length < 5) errors.push(short(message));
      await db.whatsAppRetryQueue.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          lastError: short(message),
          nextRetryAt: null,
        },
      }).catch(() => {});
    }
  }

  return { attempted: due.length - skipped, sent, failed, skipped, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Agent schedule trigger — moved out of src/cron/worker.ts
// ─────────────────────────────────────────────────────────────────────────────

export async function runAgentSchedules(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 25, 100);
  const schedules = await db.agentSchedule.findMany({ where: { isActive: true }, take: limit });

  let triggered = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      if (schedule.nextRunAt && ctx.now < schedule.nextRunAt) continue;

      const { parseCronExpression } = await import('@/lib/cron/parse-cron');
      const interval = parseCronExpression(schedule.cronExpression, schedule.timezone || 'Asia/Dhaka');
      const nextRunAt = interval.next().toDate();

      await db.agentTask.create({
        data: {
          taskCode: `TSK-CRON-${schedule.id}-${nextRunAt.getTime()}`,
          agentId: schedule.agentId,
          triggeredBy: 'system_cron',
          triggerType: 'cron',
          input: schedule.inputPayload ?? '',
          output: '',
          status: 'pending',
          errorMessage: '',
        },
      });
      await db.agentSchedule.update({ where: { id: schedule.id }, data: { nextRunAt } });
      triggered++;
    } catch (error) {
      errors.push(short(error instanceof Error ? error.message : String(error)));
    }
  }

  return { evaluated: schedules.length, triggered, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Notification retention (§48 "notification cleanup")
// ─────────────────────────────────────────────────────────────────────────────

export const MIN_NOTIFICATION_RETENTION_DAYS = 7;

/**
 * Read notifications are operational noise, not evidence, but retention is a
 * business decision: this job only deletes when ALO_NOTIFICATION_RETENTION_DAYS
 * is explicitly set (>= 7). Otherwise it reports what a cleanup would remove.
 */
export async function runNotificationCleanup(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const configured = Number(process.env.ALO_NOTIFICATION_RETENTION_DAYS ?? '');
  const retentionDays =
    Number.isFinite(configured) && configured >= MIN_NOTIFICATION_RETENTION_DAYS
      ? Math.floor(configured)
      : null;
  const cutoff = new Date(ctx.now.getTime() - (retentionDays ?? MIN_NOTIFICATION_RETENTION_DAYS) * 86_400_000);

  const targets = [
    { name: 'portalNotification', model: db.portalNotification },
    { name: 'studentNotification', model: db.studentNotification },
    { name: 'notification', model: db.notification },
  ] as const;

  const report: Record<string, unknown> = {
    retentionDays,
    mode: retentionDays ? 'delete' : 'report_only',
    cutoff: cutoff.toISOString(),
  };

  for (const target of targets) {
    const where = { isRead: true, createdAt: { lt: cutoff } };
    try {
      const candidates = await (target.model as { count: (a: unknown) => Promise<number> }).count({ where });
      if (!retentionDays || candidates === 0) {
        report[target.name] = { candidates, deleted: 0 };
        continue;
      }
      const deleted = await (target.model as {
        deleteMany: (a: unknown) => Promise<{ count: number }>;
      }).deleteMany({ where });
      report[target.name] = { candidates, deleted: deleted?.count ?? 0 };
    } catch (error) {
      report[target.name] = { error: short(error instanceof Error ? error.message : String(error)) };
    }
  }

  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Daily analytics summary (§38) — one row per day in WhatsAppAnalyticsDaily
// ─────────────────────────────────────────────────────────────────────────────

export async function runDailyAnalyticsSummary(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const since = new Date(ctx.now.getTime() - 24 * 60 * 60 * 1000);
  const dateKey = ctx.now.toISOString().slice(0, 10);

  const count = async (fn: () => Promise<number>): Promise<number> => {
    try {
      return await fn();
    } catch {
      return 0;
    }
  };

  const metrics = {
    totalConversations: await count(() => db.communicationThread.count()),
    newLeads: await count(() => db.lead.count({ where: { createdAt: { gte: since } } })),
    activeConversations: await count(() => db.communicationThread.count({ where: { status: 'open' } })),
    unreadConversations: await count(() =>
      db.communicationThread.count({ where: { status: 'open', unreadCount: { gt: 0 } } })),
    aiHandled: await count(() => db.socialInboxMessage.count({ where: { aiHandled: true, createdAt: { gte: since } } })),
    humanHandled: await count(() =>
      db.socialInboxMessage.count({ where: { aiHandled: false, direction: 'OUTBOUND', createdAt: { gte: since } } })),
    slaBreaches: await count(() =>
      db.communicationThread.count({ where: { slaDueAt: { lt: ctx.now }, status: { not: 'resolved' } } })),
    escalations: await count(() =>
      db.dashboardAlarm.count({ where: { createdAt: { gte: since }, escalationLevel: { gte: 1 } } })),
    urgentCases: await count(() => db.dashboardAlarm.count({ where: { status: 'active', priority: 'critical' } })),
    followUpSent: await count(() => db.whatsAppFollowUpSchedule.count({ where: { status: 'sent', sentAt: { gte: since } } })),
    documentVolume: await count(() => db.studentDocument.count({ where: { createdAt: { gte: since } } })),
    // Inbound messages answered by a person rather than by AI = AI handovers.
    aiHandovers: await count(() =>
      db.socialInboxMessage.count({
        where: { createdAt: { gte: since }, direction: 'INBOUND', aiHandled: false, humanApproved: true },
      })),
  };

  const row = await db.whatsAppAnalyticsDaily.upsert({
    where: { date: dateKey },
    update: metrics,
    create: { date: dateKey, ...metrics },
  });

  return { date: dateKey, summarised: true, id: row.id, ...metrics };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. AI document processing queue (§31/§33)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Student documents that have never been classified are queued for AI
 * extraction as AiTask rows. Nothing is auto-filled and no field is invented:
 * the task only records that extraction is due, and idempotency comes from the
 * task code, so a second run cannot queue the same document twice.
 */
export async function runAiDocumentProcessing(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 25, 50);

  // AiDocumentClassification has no back-relation on StudentDocument, so the
  // already-classified set is read first and excluded by id. No document is
  // modified and no extracted value is written here — extraction itself is
  // performed by the AI agent, and every critical field still needs a human.
  const classified = await db.aiDocumentClassification.findMany({
    select: { documentId: true },
    orderBy: { createdAt: 'desc' },
    take: 2000,
  }).catch(() => []);
  const classifiedIds = new Set(classified.map((row) => row.documentId));

  const candidates = await db.studentDocument.findMany({
    where: {
      isArchived: false,
      storagePath: { not: null },
      createdAt: { gte: new Date(ctx.now.getTime() - 30 * 86_400_000) },
    },
    select: { id: true, studentId: true, fileName: true, category: true, storagePath: true },
    orderBy: { createdAt: 'desc' },
    take: limit * 2,
  }).catch(() => []);

  const unclassified = candidates
    .filter((document) => (document.storagePath ?? '') !== '' && !classifiedIds.has(document.id))
    .slice(0, limit);

  let queued = 0;
  let alreadyQueued = 0;
  const errors: string[] = [];

  for (const document of unclassified) {
    const taskCode = `ALO-DOCAI-${document.id}`;
    try {
      const existing = await db.aiTask.findUnique({ where: { taskCode } });
      if (existing) {
        alreadyQueued++;
        continue;
      }
      await db.aiTask.create({
        data: {
          taskCode,
          agentName: 'Document AI Extraction',
          department: 'Document Management',
          crmId: document.studentId,
          crmType: 'STUDENT',
          priority: 'NORMAL',
          status: 'QUEUED',
          action: 'extract_document_data',
          input: JSON.stringify({
            documentId: document.id,
            fileName: short(document.fileName),
            category: document.category,
            requiresHumanVerification: true,
          }),
        },
      });
      queued++;
    } catch (error) {
      errors.push(short(error instanceof Error ? error.message : String(error)));
    }
  }

  return { scanned: candidates.length, queued, alreadyQueued, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Expired portal invitation cleanup (§13) — non-destructive
// ─────────────────────────────────────────────────────────────────────────────

export async function runExpiredPortalInvitationCleanup(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 100, 200);

  const expired = await db.studentPortalInvitation.findMany({
    where: { expiresAt: { lt: ctx.now }, isUsed: false },
    select: { id: true, studentId: true, email: true, expiresAt: true },
    orderBy: { expiresAt: 'asc' },
    take: limit,
  });

  let flagged = 0;
  for (const invitation of expired) {
    // Idempotent: one audit row per invitation, so repeated runs do nothing.
    const already = await db.aloAuditLog.findFirst({
      where: { action: 'PORTAL_INVITATION_EXPIRED', resourceId: invitation.id },
      select: { id: true },
    }).catch(() => null);
    if (already) continue;

    await db.aloAuditLog.create({
      data: {
        studentId: invitation.studentId,
        actorType: 'system',
        actorName: 'cron:expired-portal-invitation-cleanup',
        action: 'PORTAL_INVITATION_EXPIRED',
        resource: 'StudentPortalInvitation',
        resourceId: invitation.id,
        details: JSON.stringify({ expiresAt: invitation.expiresAt.toISOString() }),
      },
    }).catch(() => {});
    flagged++;
  }

  return { expiredUnused: expired.length, flagged, deleted: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Audit maintenance (§37/§70/§79)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reconciles cron runs that were recorded as `running` and never finished
 * (process crash, deploy, timeout kill). Re-marking them is the only correct
 * action: leaving them `running` makes every "is cron healthy?" query lie.
 */
export async function runAuditMaintenance(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const staleBefore = new Date(ctx.now.getTime() - 60 * 60 * 1000);

  const stale = await db.cronJobLog.findMany({
    where: { status: 'running', startedAt: { lt: staleBefore } },
    select: { id: true, jobName: true, startedAt: true },
    take: clampLimit(ctx.limit, 100, 500),
  });

  let reconciled = 0;
  for (const run of stale) {
    const updated = await db.cronJobLog.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        finishedAt: ctx.now,
        durationMs: Math.max(0, ctx.now.getTime() - run.startedAt.getTime()),
        errorMessage: 'abandoned: run never recorded an outcome (reconciled by audit-maintenance)',
      },
    }).catch(() => null);
    if (updated) reconciled++;
  }

  const auditRows = await db.aloAuditLog.count().catch(() => 0);
  const recentAuditRows = await db.aloAuditLog.count({
    where: { createdAt: { gte: new Date(ctx.now.getTime() - 86_400_000) } },
  }).catch(() => 0);

  return { staleRuns: stale.length, reconciled, auditRows, recentAuditRows };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Operational health check (§70)
// ─────────────────────────────────────────────────────────────────────────────

export async function runOperationalHealthCheck(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const { collectOperationalHealth } = await import('@/lib/cron/health-snapshot');
  const snapshot = await collectOperationalHealth(ctx.now);
  return snapshot as unknown as Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Document expiry alerts (declared job `document-expiry-alerts`)
// ─────────────────────────────────────────────────────────────────────────────

export const DOCUMENT_EXPIRY_WINDOW_DAYS = 60;

export async function runDocumentExpiryAlerts(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 100, 300);
  const windowEnd = new Date(ctx.now.getTime() + DOCUMENT_EXPIRY_WINDOW_DAYS * 86_400_000);
  const todayKey = ctx.now.toISOString().slice(0, 10);

  const profiles = await db.portalStudentProfile.findMany({
    where: { passportExpiry: { not: '' }, userId: { not: '' } },
    select: { id: true, userId: true, studentId: true, fullName: true, passportExpiry: true },
    take: limit,
  }).catch(() => []);

  let notifications = 0;
  let unparseable = 0;
  const expiring: { studentId: string; daysLeft: number }[] = [];

  for (const profile of profiles) {
    const expiry = parseLooseDate(profile.passportExpiry);
    if (!expiry) {
      unparseable++;
      continue;
    }
    if (expiry > windowEnd || expiry < ctx.now) {
      // Already expired passports are reported by the student's own document
      // review, not by a 60-day reminder window.
      if (expiry < ctx.now) expiring.push({ studentId: profile.studentId, daysLeft: daysUntil(expiry, ctx.now) });
      continue;
    }
    const daysLeft = daysUntil(expiry, ctx.now);
    expiring.push({ studentId: profile.studentId, daysLeft });

    const title = `Passport expiring in ${daysLeft} day(s)`;
    const already = await db.portalNotification.findFirst({
      where: { userId: profile.userId, title, createdAt: { gte: new Date(`${todayKey}T00:00:00.000Z`) } },
      select: { id: true },
    }).catch(() => null);
    if (already) continue;

    await db.portalNotification.create({
      data: {
        userId: profile.userId,
        studentProfileId: profile.id,
        title,
        message: `Passport on file expires on ${expiry.toISOString().slice(0, 10)}. Upload the renewed passport before the visa stage.`,
        type: 'DOCUMENT_EXPIRY',
        actionUrl: '/student-portal/documents',
        isRead: false,
      },
    }).catch(() => {});
    notifications++;
  }

  return {
    checked: profiles.length,
    withinWindow: expiring.length,
    notificationsCreated: notifications,
    unparseableDates: unparseable,
    windowDays: DOCUMENT_EXPIRY_WINDOW_DAYS,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Temp/orphan upload report (declared job `temp-file-cleanup`)
// ─────────────────────────────────────────────────────────────────────────────

export const ORPHAN_UPLOAD_AGE_HOURS = 48;

/**
 * Reports uploads that never became a reviewed document. It does not delete
 * anything: private student files are only removed through the audited
 * `POST /api/documents/manage` endpoint by an Admin/Super Admin.
 */
export async function runTempFileCleanup(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 100, 300);
  const cutoff = new Date(ctx.now.getTime() - ORPHAN_UPLOAD_AGE_HOURS * 3_600_000);

  const stalePending = await db.studentDocument.findMany({
    where: { status: 'pending', createdAt: { lt: cutoff }, isArchived: false },
    select: { id: true, studentId: true, fileName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  }).catch(() => []);

  // PortalStudentDocument.uploadedAt is a free-text column, so the age filter
  // runs in JS through the shared loose-date parser: rows whose timestamp
  // cannot be read are counted separately instead of being assumed stale.
  const portalRows = await db.portalStudentDocument.findMany({
    where: { studentProfileId: '' },
    select: { id: true, name: true, uploadedAt: true },
    orderBy: { uploadedAt: 'asc' },
    take: limit,
  }).catch(() => []);

  let unlinkedCount = 0;
  let unreadableUploadedAt = 0;
  for (const row of portalRows) {
    const uploadedAt = parseLooseDate(row.uploadedAt);
    if (!uploadedAt) {
      unreadableUploadedAt++;
      continue;
    }
    if (uploadedAt < cutoff) unlinkedCount++;
  }

  const missingStorage = await db.studentDocument.count({
    where: { isArchived: false, OR: [{ storagePath: null }, { storagePath: '' }] },
  }).catch(() => 0);

  return {
    ageHours: ORPHAN_UPLOAD_AGE_HOURS,
    stalePendingDocuments: stalePending.length,
    stalePendingSample: stalePending.slice(0, 10).map((d) => ({ id: d.id, createdAt: d.createdAt })),
    unlinkedPortalDocuments: unlinkedCount,
    unreadableUploadedAt,
    rowsWithoutPrivateStoragePath: missingStorage,
    deleted: 0,
    note: 'report only — private files are removed solely via the audited documents/manage endpoint',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Expired session cleanup (declared job `expired-session-cleanup`)
// ─────────────────────────────────────────────────────────────────────────────

export async function runExpiredSessionCleanup(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const cutoff = new Date(ctx.now.getTime() - 24 * 60 * 60 * 1000);

  const portalSessions = await db.portalSession.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  }).then((r) => r?.count ?? 0).catch(() => 0);

  const studentSessions = await db.studentSession.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  }).then((r) => r?.count ?? 0).catch(() => 0);

  return { portalSessionsDeleted: portalSessions, studentSessionsDeleted: studentSessions, cutoff: cutoff.toISOString() };
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. Scholarship expiry check (declared job `scholarship-expiry`)
// ─────────────────────────────────────────────────────────────────────────────

export const SCHOLARSHIP_EXPIRY_WINDOW_DAYS = 30;

/**
 * Flags scholarships whose published deadline has passed or falls inside the
 * alert window. `CrmScholarship.deadline` is a free-text column, so only values
 * `parseLooseDate` can read are touched — an unreadable deadline is left as
 * "unknown" rather than guessed into an expiry claim.
 */
export async function runScholarshipExpiryCheck(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 200, 300);
  const windowEnd = new Date(ctx.now.getTime() + SCHOLARSHIP_EXPIRY_WINDOW_DAYS * 86_400_000);
  const stamp = ctx.now.toISOString();

  const rows = await db.crmScholarship.findMany({
    where: { status: 'active', deadline: { not: '' } },
    select: { id: true, deadline: true, expiryStatus: true },
    take: limit,
  }).catch(() => []);

  let expired = 0;
  let expiringSoon = 0;
  let unreadable = 0;

  for (const row of rows) {
    const deadline = parseLooseDate(row.deadline);
    if (!deadline) {
      unreadable++;
      continue;
    }
    const nextStatus = deadline < ctx.now ? 'expired' : deadline <= windowEnd ? 'expiring_soon' : 'active';
    if (nextStatus === 'expired') expired++;
    else if (nextStatus === 'expiring_soon') expiringSoon++;
    if (row.expiryStatus === nextStatus) continue; // idempotent: no write when unchanged
    await db.crmScholarship.update({
      where: { id: row.id },
      data: { expiryStatus: nextStatus, lastCheckedAt: stamp },
    }).catch(() => {});
  }

  return { checked: rows.length, expired, expiringSoon, unreadableDeadlines: unreadable };
}


// ─────────────────────────────────────────────────────────────────────────────
// 16. Intake deadline alerts (declared job `intake-deadline-alerts`)
// ─────────────────────────────────────────────────────────────────────────────

export const INTAKE_DEADLINE_WINDOW_DAYS = 30;

export async function runIntakeDeadlineAlerts(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 100, 300);
  const windowEnd = new Date(ctx.now.getTime() + INTAKE_DEADLINE_WINDOW_DAYS * 86_400_000);

  // `CourseIntake.deadline` is a free-text string ("rolling", "15 Jan"); only
  // the structured `deadlineDate` column can be trusted for a dated alert.
  const intakes = await db.courseIntake.findMany({
    where: { deadlineDate: { gte: ctx.now, lte: windowEnd }, status: { not: 'closed' } },
    select: { id: true, courseId: true, intakeMonth: true, intakeYear: true, deadlineDate: true },
    orderBy: { deadlineDate: 'asc' },
    take: limit,
  }).catch(() => []);

  const students = await db.portalStudentProfile.findMany({
    where: { preferredIntake: { not: '' } },
    select: { id: true, userId: true, studentId: true, preferredIntake: true },
    take: limit,
  }).catch(() => []);

  const todayKey = ctx.now.toISOString().slice(0, 10);
  let notifications = 0;

  for (const student of students) {
    const wanted = student.preferredIntake.toLowerCase();
    const matching = intakes.filter((intake) => {
      const label = `${intake.intakeMonth} ${intake.intakeYear}`.toLowerCase();
      return wanted.includes(intake.intakeMonth.toLowerCase()) && wanted.includes(String(intake.intakeYear))
        || label.length > 0 && wanted.replace(/\s+/g, ' ').includes(label.replace(/\s+/g, ' '));
    });
    if (matching.length === 0) continue;
    const soonest = matching[0];
    if (!soonest.deadlineDate) continue;
    const daysLeft = daysUntil(soonest.deadlineDate, ctx.now);
    const title = `Intake deadline in ${daysLeft} day(s)`;
    const already = await db.portalNotification.findFirst({
      where: { userId: student.userId, title, createdAt: { gte: new Date(`${todayKey}T00:00:00.000Z`) } },
      select: { id: true },
    }).catch(() => null);
    if (already) continue;
    await db.portalNotification.create({
      data: {
        userId: student.userId,
        studentProfileId: student.id,
        title,
        message: `Your ${student.preferredIntake} intake closes on ${soonest.deadlineDate.toISOString().slice(0, 10)}. Please complete outstanding documents.`,
        type: 'INTAKE_DEADLINE',
        actionUrl: '/student-portal/applications',
        isRead: false,
      },
    }).catch(() => {});
    notifications++;
  }

  return {
    windowDays: INTAKE_DEADLINE_WINDOW_DAYS,
    intakesInWindow: intakes.length,
    studentsConsidered: students.length,
    notificationsCreated: notifications,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbound webhook dispatch (spec s77, s89, s90)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drain the outbound webhook queue.
 *
 * Idempotent by construction: `WebhookDelivery` has a UNIQUE
 * (subscriptionId, eventId) pair, rows already DELIVERED or DEAD are skipped by
 * `processDueDeliveries`, and the job runner holds a lease so a second worker
 * cannot process the same queue concurrently.
 *
 * Honest reporting: when no subscription exists the job reports
 * `configured: false` rather than claiming deliveries succeeded (spec s94).
 */
export async function runWebhookDispatch(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const { processDueDeliveries, deliveryStats } = await import('@/lib/webhooks');

  const subscriptionCount = await db.webhookSubscription
    .count({ where: { active: true } })
    .catch(() => null);

  if (subscriptionCount === null) {
    return {
      configured: false,
      status: 'NOT_CONFIGURED',
      reason: 'Webhook subscription table unreachable',
    };
  }
  if (subscriptionCount === 0) {
    return {
      configured: false,
      status: 'NOT_CONFIGURED',
      reason: 'No active webhook subscriptions — no deliveries attempted',
      processed: 0,
    };
  }

  const limit = clampLimit(ctx.limit, 25, 200);
  const result = await processDueDeliveries(limit, { now: ctx.now });
  const stats = await deliveryStats(1).catch(() => null);

  return {
    configured: true,
    status: 'OK',
    activeSubscriptions: subscriptionCount,
    batchLimit: limit,
    ...result,
    last24h: stats,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 27. PhD workspace maintenance (declared job `phd-maintenance`)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PhD workspace maintenance.
 *
 * Three duties, all of them non-destructive:
 *   1. raise in-app deadline reminders for the applicant's own project;
 *   2. report evidence that has passed its re-verification date (report only —
 *      a stale claim is never silently downgraded or re-dated);
 *   3. report documents whose retention window has elapsed (report only —
 *      removal stays an explicit, audited administrator action, because a
 *      scheduled job must never delete student evidence).
 *
 * Reminders are de-duplicated by entity + due date so running the job twice in
 * one hour cannot spam the workspace.
 */
export async function runPhdMaintenance(ctx: JobHandlerContext): Promise<Record<string, unknown>> {
  const limit = clampLimit(ctx.limit, 200, 1000);
  const horizon = new Date(ctx.now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const dueDeadlines = await db.phdDeadline.findMany({
    where: {
      dueDate: { not: null, lte: horizon },
      projectId: { not: null },
      verificationStatus: { in: ['VERIFIED_OFFICIAL', 'VERIFIED_MAY_BE_OUTDATED'] },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      kind: true,
      reminderDays: true,
      projectId: true,
      project: { select: { userId: true } },
    },
    take: limit,
  });

  let remindersCreated = 0;
  let remindersSkipped = 0;
  for (const deadline of dueDeadlines) {
    const recipientId = deadline.project?.userId;
    if (!recipientId || !deadline.dueDate) {
      remindersSkipped++;
      continue;
    }
    const reminderDays = Math.max(1, deadline.reminderDays ?? 14);
    const remindFrom = new Date(deadline.dueDate.getTime() - reminderDays * 24 * 60 * 60 * 1000);
    if (ctx.now < remindFrom) {
      remindersSkipped++;
      continue;
    }
    const existing = await db.phdNotification.findFirst({
      where: {
        userId: recipientId,
        entityType: 'PhdDeadline',
        entityId: deadline.id,
        dueAt: deadline.dueDate,
      },
      select: { id: true },
    });
    if (existing) {
      remindersSkipped++;
      continue;
    }
    await db.phdNotification.create({
      data: {
        userId: recipientId,
        projectId: deadline.projectId,
        type: 'DEADLINE',
        title: `Deadline approaching: ${deadline.title}`,
        body: `Recorded as a ${String(deadline.kind).toLowerCase()} deadline on ${deadline.dueDate.toISOString().slice(0, 10)}. Check the official page before relying on this date.`,
        dueAt: deadline.dueDate,
        entityType: 'PhdDeadline',
        entityId: deadline.id,
      },
    });
    remindersCreated++;
  }

  const staleEvidence = await db.phdSourceEvidence.findMany({
    where: { nextVerificationAt: { not: null, lt: ctx.now } },
    select: { id: true, entityType: true, entityId: true, verificationStatus: true, nextVerificationAt: true },
    take: limit,
  });

  const expiredRetention = await db.phdDocument.findMany({
    where: { deletedAt: null, retentionUntil: { not: null, lt: ctx.now } },
    select: { id: true, projectId: true, documentType: true, retentionUntil: true },
    take: limit,
  });

  return {
    status: 'OK',
    dueDeadlinesExamined: dueDeadlines.length,
    remindersCreated,
    remindersSkipped,
    staleEvidence: staleEvidence.length,
    staleEvidenceSample: staleEvidence.slice(0, 10),
    documentsPastRetention: expiredRetention.length,
    documentsPastRetentionSample: expiredRetention.slice(0, 10),
    deleted: 0,
    note: 'report only — evidence is never re-dated and documents are never removed by a scheduled job',
  };
}
