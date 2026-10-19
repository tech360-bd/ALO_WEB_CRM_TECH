/**
 * ALO Education — scheduled job declarations (Asia/Dhaka)
 *
 * This file answers "when does something run". `src/lib/cron/job-registry.ts`
 * answers "what runs", and `src/lib/cron/job-runner.ts` guarantees that it runs
 * at most once at a time, with a start/finish record in `CronJobLog`.
 *
 * Certified 2026-10-13. Before this pass:
 *   • 14 of the 15 declared `route` values had no route file, so the deployment
 *     was scheduling 404s;
 *   • every job was `enabled: false` because the worker's lock was invalid
 *     (it used `DeploymentSequence`, which has neither an owner nor an expiry);
 *   • twelve of the fifteen handlers only printed a log line.
 *
 * Now every declaration is one of:
 *   enabled: true                      → real handler, run under a lease
 *   enabled: false + blockedReason     → refuses to run, reason recorded
 *
 * Verification: `npx tsx scripts/verify-15-cron.ts`
 *              `npx tsx scripts/cron-scheduler-policy-check.ts`
 */

import * as cronParser from 'cron-parser';
import { getRegisteredJob } from '../lib/cron/job-registry';

export interface CronJobDefinition {
  id: string; // unique; also the /api/cron/<id> path segment
  name: string;
  description: string;
  cronExpression: string; // standard 5-field
  timezone: string; // must be Asia/Dhaka for ALO Education
  handler: string; // handler function name in src/lib/cron/job-handlers.ts
  route: string; // API route for the external scheduler (Vercel / cPanel)
  locking: boolean; // distributed locking enabled
  lockTtlMinutes: number;
  enabled: boolean;
  /** Present when `enabled` is false: exactly why this job cannot run here. */
  blockedReason?: string;
}

type DefinitionInput = Omit<CronJobDefinition, 'timezone' | 'locking' | 'enabled' | 'route' | 'blockedReason'> &
  Partial<Pick<CronJobDefinition, 'route' | 'enabled'>>;

/** Build an enabled definition whose route resolves in the job registry. */
function enabledJob(input: DefinitionInput): CronJobDefinition {
  return {
    ...input,
    route: input.route ?? `/api/cron/${input.id}`,
    timezone: 'Asia/Dhaka',
    locking: true,
    enabled: true,
  };
}

/** Build a declaration that deliberately does not run, with its reason. */
function blockedJob(input: DefinitionInput, blockedReason: string): CronJobDefinition {
  return {
    ...input,
    route: input.route ?? `/api/cron/${input.id}`,
    timezone: 'Asia/Dhaka',
    locking: true,
    enabled: false,
    blockedReason,
  };
}

/**
 * Number of declarations below. This grew from 15 to 21 in the 2026-10-13
 * certification pass: seven jobs the platform requires (retry, health check,
 * analytics summary, document extraction queue, notification retention,
 * invitation cleanup, audit maintenance) had no declaration at all, and
 * `analytics-aggregation` was renamed to `daily-analytics-summary` to match the
 * work it actually performs. `analytics-aggregation` remains a valid path
 * through the registry alias, so existing schedulers keep working.
 */
// 22 as of 2026-10-18: `webhook-dispatch` was added to drain the outbound
// webhook queue (spec s77). It is a real, lease-protected handler that reports
// NOT_CONFIGURED rather than success when no subscription exists.
export const CRON_JOB_COUNT = 22;

/** Jobs the platform must expose and keep enabled. */
export const REQUIRED_ENABLED_JOB_IDS = [
  'sla-monitoring',
  'whatsapp-followups',
  'failed-message-retry',
  'operational-health-check',
  'daily-analytics-summary',
  'ai-document-processing',
  'notification-cleanup',
  'expired-portal-invitation-cleanup',
  'audit-maintenance',
] as const;

export const CRON_JOBS: CronJobDefinition[] = [
  enabledJob({
    id: 'sla-monitoring',
    name: 'SLA Monitoring & Escalation',
    description:
      'Escalates communication threads past their office-hours-aware SLA (counselor → branch manager → CEO/Super Admin) and raises dashboard alarms.',
    cronExpression: '* * * * *',
    handler: 'runSlaMonitor',
    lockTtlMinutes: 4,
  }),
  enabledJob({
    id: 'whatsapp-followups',
    name: 'WhatsApp Follow-up Sequence',
    description:
      'Sends due Day 3/7/14/21/25/30 follow-ups from the official ALO number, honouring STOP/opt-out and pausing while an application is active.',
    cronExpression: '*/5 * * * *',
    handler: 'runWhatsAppFollowUps',
    lockTtlMinutes: 5,
  }),
  enabledJob({
    id: 'failed-message-retry',
    name: 'Failed WhatsApp Message Retry',
    description: 'Retries undelivered outbound messages; a row is marked failed after at most three attempts.',
    cronExpression: '*/5 * * * *',
    handler: 'runFailedMessageRetry',
    lockTtlMinutes: 5,
  }),
  enabledJob({
    id: 'agent-schedules',
    name: 'Agent Schedule Trigger',
    description: 'Creates pending AgentTask rows for due AgentSchedule definitions and advances nextRunAt.',
    cronExpression: '* * * * *',
    handler: 'runAgentSchedules',
    lockTtlMinutes: 4,
  }),
  enabledJob({
    id: 'operational-health-check',
    name: 'Operational Health Check',
    description: 'Read-only readiness snapshot: database probe, SLA backlog, follow-up backlog, retry queue, recent runs.',
    cronExpression: '*/5 * * * *',
    handler: 'runOperationalHealthCheck',
    lockTtlMinutes: 4,
  }),
  enabledJob({
    id: 'daily-analytics-summary',
    name: 'Daily Analytics Summary',
    description: 'Writes the WhatsAppAnalyticsDaily aggregate for the day (conversations, leads, SLA, follow-ups, documents).',
    cronExpression: '0 * * * *',
    handler: 'runDailyAnalyticsSummary',
    lockTtlMinutes: 15,
  }),
  enabledJob({
    id: 'ai-document-processing',
    name: 'AI Document Extraction Queue',
    description: 'Queues unclassified student documents as AiTask rows for extraction; critical fields still require human verification.',
    cronExpression: '*/10 * * * *',
    handler: 'runAiDocumentProcessing',
    lockTtlMinutes: 9,
  }),
  enabledJob({
    id: 'notification-cleanup',
    name: 'Notification Retention',
    description: 'Reports read notifications past retention; deletes only when ALO_NOTIFICATION_RETENTION_DAYS is configured.',
    cronExpression: '0 3 * * *',
    handler: 'runNotificationCleanup',
    lockTtlMinutes: 15,
  }),
  enabledJob({
    id: 'expired-portal-invitation-cleanup',
    name: 'Expired Portal Invitation Cleanup',
    description: 'Audits unused, expired portal invitations once each. Never deletes an invitation.',
    cronExpression: '0 4 * * *',
    handler: 'runExpiredPortalInvitationCleanup',
    lockTtlMinutes: 15,
  }),
  enabledJob({
    id: 'audit-maintenance',
    name: 'Audit & Run Log Maintenance',
    description: 'Reconciles cron runs abandoned in `running` state and reports audit-log volume.',
    cronExpression: '0 2 * * *',
    handler: 'runAuditMaintenance',
    lockTtlMinutes: 15,
  }),
  enabledJob({
    id: 'expired-session-cleanup',
    name: 'Expired Session Cleanup',
    description: 'Removes portal and student sessions that expired more than 24 hours ago.',
    cronExpression: '0 * * * *',
    handler: 'runExpiredSessionCleanup',
    lockTtlMinutes: 9,
  }),
  enabledJob({
    id: 'temp-file-cleanup',
    name: 'Stale Upload Report',
    description: 'Reports uploads that never reached review. Report-only; private files are removed solely via documents/manage.',
    cronExpression: '0 4 * * *',
    handler: 'runTempFileCleanup',
    lockTtlMinutes: 15,
  }),
  enabledJob({
    id: 'document-expiry-alerts',
    name: 'Document Expiry Alerts',
    description: 'Notifies students whose passport on file expires within 60 days. Unreadable dates are reported, never guessed.',
    cronExpression: '0 8 * * *',
    handler: 'runDocumentExpiryAlerts',
    lockTtlMinutes: 15,
  }),
  enabledJob({
    id: 'scholarship-expiry',
    name: 'Scholarship Expiry Check',
    description: 'Flags scholarships whose published deadline has passed or falls within 30 days.',
    cronExpression: '0 1 * * *',
    handler: 'runScholarshipExpiryCheck',
    lockTtlMinutes: 15,
  }),
  enabledJob({
    id: 'intake-deadline-alerts',
    name: 'Course Intake Deadline Alerts',
    description: 'Notifies students whose preferred intake closes within 30 days, using the structured deadlineDate column only.',
    cronExpression: '0 * * * *',
    handler: 'runIntakeDeadlineAlerts',
    lockTtlMinutes: 9,
  }),

  // ── Declared but deliberately not run from the application ──
  blockedJob(
    {
      id: 'database-backup',
      name: 'Database Backup',
      description: 'Declared daily mysqldump backup.',
      cronExpression: '0 2 * * *',
      handler: 'none',
      lockTtlMinutes: 60,
    },
    'requires the mysqldump binary, database credentials and a backup destination with retention outside the Next.js runtime — see BACKUP_RESTORE_GUIDE.md; run from the server crontab',
  ),
  blockedJob(
    {
      id: 'ranking-update',
      name: 'Ranking Update Check',
      description: 'Declared weekly ranking provider poll.',
      cronExpression: '0 7 * * 1',
      handler: 'none',
      lockTtlMinutes: 30,
    },
    'requires ranking provider credentials that are not configured; rankings are entered through the official-source review workflow',
  ),
  blockedJob(
    {
      id: 'sitemap-regeneration',
      name: 'Sitemap Regeneration',
      description: 'Declared nightly sitemap rebuild.',
      cronExpression: '0 3 * * *',
      handler: 'none',
      lockTtlMinutes: 15,
    },
    'superseded: the sitemap is generated dynamically by src/app/sitemap.ts on request',
  ),
  blockedJob(
    {
      id: 'scheduled-reports',
      name: 'Scheduled Reports',
      description: 'Declared daily funnel/commission report job.',
      cronExpression: '0 6 * * *',
      handler: 'none',
      lockTtlMinutes: 30,
    },
    'superseded: report generation is implemented at /api/cron/weekly-reports and /api/cron/analytics',
  ),
  blockedJob(
    {
      id: 'university-verification',
      name: 'University Data Verification',
      description: 'Declared daily re-validation of official university URLs.',
      cronExpression: '0 5 * * *',
      handler: 'none',
      lockTtlMinutes: 45,
    },
    'superseded: implemented at /api/cron/university-monitoring (7-day cadence enforced in MonitoringJob.nextRunAt)',
  ),
  blockedJob(
    {
      id: 'email-queue',
      name: 'Email Queue Processor',
      description: 'Declared email queue drain.',
      cronExpression: '*/5 * * * *',
      handler: 'none',
      lockTtlMinutes: 10,
    },
    'superseded: implemented at /api/cron/email-outbox',
  ),
  enabledJob({
    id: 'webhook-dispatch',
    name: 'Outbound Webhook Dispatch',
    description:
      'Delivers queued canonical ALO events (lead.created, application.status_changed, commission.paid, …) to active webhook subscriptions with HMAC signing, exponential retry and dead-lettering. Reports NOT_CONFIGURED when no subscription exists.',
    cronExpression: '*/5 * * * *',
    handler: 'runWebhookDispatch',
    lockTtlMinutes: 5,
  }),
];

/**
 * Structural verification of the declarations.
 *
 * Beyond timezone/locking/cron-syntax this now checks that every declaration is
 * resolvable in the job registry and that a disabled declaration states why —
 * the two defects that made the previous scheduler a list of 404s.
 */
export function verifyCronDefinitions(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (CRON_JOBS.length !== CRON_JOB_COUNT) {
    errors.push(`Expected ${CRON_JOB_COUNT} job declarations, found ${CRON_JOBS.length}`);
  }

  // The platform requires these jobs to exist and be enabled (§48).
  for (const key of REQUIRED_ENABLED_JOB_IDS) {
    const declaration = CRON_JOBS.find((job) => job.id === key);
    if (!declaration) errors.push(`required job ${key} is not declared`);
    else if (!declaration.enabled) errors.push(`required job ${key} is disabled`);
  }

  const seen = new Set<string>();
  for (const job of CRON_JOBS) {
    if (seen.has(job.id)) errors.push(`${job.id} declared more than once`);
    seen.add(job.id);

    if (job.timezone !== 'Asia/Dhaka') errors.push(`${job.id} timezone != Asia/Dhaka (${job.timezone})`);
    if (!job.locking) errors.push(`${job.id} locking disabled`);
    if (!job.route.startsWith('/api/cron/')) errors.push(`${job.id} route must start with /api/cron/`);
    if (!job.enabled && !job.blockedReason) errors.push(`${job.id} is disabled without a blockedReason`);

    const entry = getRegisteredJob(job.route.replace('/api/cron/', '')) ?? getRegisteredJob(job.id);
    if (!entry) {
      errors.push(`${job.id} route ${job.route} has no implementation in the job registry`);
    } else if (job.enabled && entry.disposition !== 'job') {
      errors.push(`${job.id} is enabled but its registry entry is ${entry.disposition}`);
    } else if (!job.enabled && entry.disposition === 'job') {
      errors.push(`${job.id} is disabled but a real handler exists — enable it or remove the declaration`);
    }

    try {
      const parserAny = cronParser as any;
      const parser =
        parserAny.parse ||
        parserAny.parseExpression ||
        parserAny.CronExpressionParser?.parse ||
        parserAny.default?.parse ||
        parserAny.default?.CronExpressionParser?.parse;
      if (typeof parser !== 'function') throw new Error('cron-parser parse not found');
      parser.call(parserAny, job.cronExpression, { tz: job.timezone });
    } catch (e: any) {
      errors.push(`${job.id} invalid cron: ${job.cronExpression} - ${e.message}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
