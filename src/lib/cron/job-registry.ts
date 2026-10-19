/**
 * Scheduled job registry — ALO Education
 *
 * One table that answers "what happens when /api/cron/<x> is called, and why?".
 *
 * Before this existed, 15 jobs were declared in `vercel.json` and
 * `src/cron/cron-definitions.ts` while only one of those paths had a route
 * file: every other declaration 404'd in production, and the worker's handlers
 * were quarantined because the lock could not exclude a second runner. Now
 * every declared path resolves to exactly one of three honest outcomes:
 *
 *   job                 → real work, run under a lease with a durable log entry
 *   external-dependency → refuses to run, naming the missing outside resource
 *   superseded          → refuses to run, naming the live implementation instead
 *
 * No entry is a placeholder: a job that cannot do its job says so and never
 * reports success.
 */

import type { CronJobContext, CronJobRuntime } from './job-runner';

/**
 * Handler names, resolved lazily.
 *
 * The registry is metadata: it must be importable by verification scripts, docs
 * tooling and the 404 path without loading Prisma. `type JobHandlerName` is a
 * type-only import of the handlers module, so it is erased at build time and
 * removed from the runtime module graph; the actual module is imported on the
 * first execution of a job.
 */
type JobHandlersModule = typeof import('./job-handlers');
type JobHandlerName = keyof JobHandlersModule & `run${string}`;

export function createLazyHandler(name: JobHandlerName): (ctx: CronJobContext) => Promise<unknown> {
  return async (ctx: CronJobContext): Promise<unknown> => {
    const mod = (await import('./job-handlers')) as unknown as Record<
      string,
      ((c: CronJobContext) => Promise<unknown>) | undefined
    >;
    const fn = mod[name];
    if (typeof fn !== 'function') {
      throw new Error(`cron handler ${name} is not exported by src/lib/cron/job-handlers.ts`);
    }
    return fn(ctx);
  };
}

export type JobDisposition = 'job' | 'external-dependency' | 'superseded';

export interface RegisteredCronJob {
  key: string;
  name: string;
  description: string;
  /** Cron expression evaluated in `timezone`. */
  schedule: string;
  timezone: 'Asia/Dhaka';
  lockTtlSeconds: number;
  timeoutMs: number;
  /** Additional path segments (beyond the key) that resolve to this job. */
  aliases: string[];
  disposition: JobDisposition;
  /** Required when disposition is not `job`. */
  reason?: string;
  /** Required when disposition is `job`. */
  handler?: (ctx: CronJobContext) => Promise<unknown> | unknown;
  /** Name of the exported handler in job-handlers.ts (documentation + tooling). */
  handlerName?: JobHandlerName;
}

const MINUTE = '* * * * *';
const FIVE_MINUTES = '*/5 * * * *';
const TEN_MINUTES = '*/10 * * * *';

/**
 * The nine jobs the platform requires of its scheduler, plus the additional
 * real jobs that replace the previously phantom declarations.
 */
export const JOB_REGISTRY: RegisteredCronJob[] = [
  {
    key: 'sla-monitoring',
    name: 'SLA Monitoring & Escalation',
    description: 'Escalates communication threads past their office-hours-aware SLA to the next level of responsibility.',
    schedule: MINUTE,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 240,
    timeoutMs: 60_000,
    aliases: ['sla-monitor'],
    disposition: 'job',
    handler: createLazyHandler('runSlaMonitor'),
    handlerName: 'runSlaMonitor',
  },
  {
    key: 'whatsapp-followups',
    name: 'WhatsApp Follow-up Sequence',
    description: 'Sends due Day 3/7/14/21/25/30 follow-ups, honouring STOP/opt-out, template approval and active applications.',
    schedule: FIVE_MINUTES,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 280,
    timeoutMs: 120_000,
    aliases: ['followup'],
    disposition: 'job',
    handler: createLazyHandler('runWhatsAppFollowUps'),
    handlerName: 'runWhatsAppFollowUps',
  },
  {
    key: 'failed-message-retry',
    name: 'Failed WhatsApp Message Retry',
    description: 'Retries undelivered outbound WhatsApp messages with a maximum of three attempts, then marks them failed.',
    schedule: FIVE_MINUTES,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 280,
    timeoutMs: 120_000,
    aliases: ['retry'],
    disposition: 'job',
    handler: createLazyHandler('runFailedMessageRetry'),
    handlerName: 'runFailedMessageRetry',
  },
  {
    key: 'operational-health-check',
    name: 'Operational Health Check',
    description: 'Read-only readiness snapshot: database probe, SLA backlog, follow-up backlog, retry queue and recent cron runs.',
    schedule: FIVE_MINUTES,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 240,
    timeoutMs: 45_000,
    aliases: ['health'],
    disposition: 'job',
    handler: createLazyHandler('runOperationalHealthCheck'),
    handlerName: 'runOperationalHealthCheck',
  },
  {
    key: 'daily-analytics-summary',
    name: 'Daily Analytics Summary',
    description: 'Aggregates conversation, lead, SLA, follow-up and document volume into the WhatsAppAnalyticsDaily row for the day.',
    schedule: '0 * * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 120_000,
    aliases: ['analytics-aggregation', 'analytics'],
    disposition: 'job',
    handler: createLazyHandler('runDailyAnalyticsSummary'),
    handlerName: 'runDailyAnalyticsSummary',
  },
  {
    key: 'ai-document-processing',
    name: 'AI Document Extraction Queue',
    description: 'Queues every unclassified student document for AI extraction as an AiTask; extracted fields still require human verification.',
    schedule: TEN_MINUTES,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 540,
    timeoutMs: 120_000,
    aliases: ['document-processing'],
    disposition: 'job',
    handler: createLazyHandler('runAiDocumentProcessing'),
    handlerName: 'runAiDocumentProcessing',
  },
  {
    key: 'notification-cleanup',
    name: 'Notification Retention',
    description: 'Reports read notifications past the retention window; deletes only when ALO_NOTIFICATION_RETENTION_DAYS is explicitly configured.',
    schedule: '0 3 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 120_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runNotificationCleanup'),
    handlerName: 'runNotificationCleanup',
  },
  {
    key: 'expired-portal-invitation-cleanup',
    name: 'Expired Portal Invitation Cleanup',
    description: 'Audits unused, expired student portal invitations. Never deletes: an invitation is evidence of a send.',
    schedule: '0 4 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 90_000,
    aliases: ['portal-invitation-cleanup'],
    disposition: 'job',
    handler: createLazyHandler('runExpiredPortalInvitationCleanup'),
    handlerName: 'runExpiredPortalInvitationCleanup',
  },
  {
    key: 'audit-maintenance',
    name: 'Audit & Run Log Maintenance',
    description: 'Reconciles cron runs abandoned in `running` state and reports audit-log volume.',
    schedule: '0 2 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 90_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runAuditMaintenance'),
    handlerName: 'runAuditMaintenance',
  },

  // ── Additional real jobs that replace previously phantom declarations ──
  {
    key: 'agent-schedules',
    name: 'Agent Schedule Trigger',
    description: 'Creates pending AgentTask rows for due AgentSchedule definitions and advances nextRunAt.',
    schedule: MINUTE,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 240,
    timeoutMs: 60_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runAgentSchedules'),
    handlerName: 'runAgentSchedules',
  },
  {
    key: 'expired-session-cleanup',
    name: 'Expired Session Cleanup',
    description: 'Removes portal and student sessions that expired more than 24 hours ago.',
    schedule: '0 * * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 540,
    timeoutMs: 90_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runExpiredSessionCleanup'),
    handlerName: 'runExpiredSessionCleanup',
  },
  {
    key: 'temp-file-cleanup',
    name: 'Stale Upload Report',
    description: 'Reports uploads that never reached review. Report-only: private files are removed solely via the audited documents/manage endpoint.',
    schedule: '0 4 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 90_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runTempFileCleanup'),
    handlerName: 'runTempFileCleanup',
  },
  {
    key: 'document-expiry-alerts',
    name: 'Document Expiry Alerts',
    description: 'Notifies students whose passport on file expires inside the next 60 days; unreadable dates are reported, never guessed.',
    schedule: '0 8 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 120_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runDocumentExpiryAlerts'),
    handlerName: 'runDocumentExpiryAlerts',
  },
  {
    key: 'scholarship-expiry',
    name: 'Scholarship Expiry Check',
    description: 'Flags CrmScholarship rows whose published deadline has passed or falls within 30 days.',
    schedule: '0 1 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 120_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runScholarshipExpiryCheck'),
    handlerName: 'runScholarshipExpiryCheck',
  },
  {
    key: 'intake-deadline-alerts',
    name: 'Course Intake Deadline Alerts',
    description: 'Notifies students whose preferred intake closes within 30 days, using the structured deadlineDate column only.',
    schedule: '0 * * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 540,
    timeoutMs: 120_000,
    aliases: [],
    disposition: 'job',
    handler: createLazyHandler('runIntakeDeadlineAlerts'),
    handlerName: 'runIntakeDeadlineAlerts',
  },

  // ── Declared paths that cannot run here — with the exact reason ──
  {
    key: 'database-backup',
    name: 'Database Backup',
    description: 'Declared daily mysqldump backup.',
    schedule: '0 2 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 3600,
    timeoutMs: 60_000,
    aliases: [],
    disposition: 'external-dependency',
    reason:
      'requires the mysqldump binary, database credentials and a backup destination with retention policy outside the Next.js runtime — see BACKUP_RESTORE_GUIDE.md and run it from the server crontab, not the application',
  },
  {
    key: 'ranking-update',
    name: 'Ranking Update Check',
    description: 'Declared weekly ranking provider poll.',
    schedule: '0 7 * * 1',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 1800,
    timeoutMs: 60_000,
    aliases: [],
    disposition: 'external-dependency',
    reason:
      'requires ranking provider credentials, which are not configured (RANKING_API_KEY/QS credentials absent); university rankings are entered and verified through the official-source review workflow',
  },
  {
    key: 'sitemap-regeneration',
    name: 'Sitemap Regeneration',
    description: 'Declared nightly sitemap rebuild.',
    schedule: '0 3 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 900,
    timeoutMs: 60_000,
    aliases: [],
    disposition: 'superseded',
    reason: 'the sitemap is generated dynamically by src/app/sitemap.ts on request — there is no static file to regenerate',
  },
  {
    key: 'scheduled-reports',
    name: 'Scheduled Reports',
    description: 'Declared daily funnel/commission report job.',
    schedule: '0 6 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 1800,
    timeoutMs: 60_000,
    aliases: [],
    disposition: 'superseded',
    reason: 'report generation is implemented at /api/cron/weekly-reports and /api/cron/analytics',
  },
  {
    key: 'university-verification',
    name: 'University Data Verification',
    description: 'Declared daily re-validation of official university URLs.',
    schedule: '0 5 * * *',
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 2700,
    timeoutMs: 60_000,
    aliases: [],
    disposition: 'superseded',
    reason: 'implemented at /api/cron/university-monitoring (ALO monitoring agent; the 7-day cadence is enforced in MonitoringJob.nextRunAt)',
  },
  {
    key: 'email-queue',
    name: 'Email Queue Processor',
    description: 'Declared email queue drain.',
    schedule: FIVE_MINUTES,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 540,
    timeoutMs: 60_000,
    aliases: [],
    disposition: 'superseded',
    reason: 'implemented at /api/cron/email-outbox',
  },
  {
    // Outbound webhook fan-out (spec s77). Reports NOT_CONFIGURED rather than
    // success when no active subscription exists, so a silent no-op can never
    // be mistaken for working integration.
    key: 'webhook-dispatch',
    name: 'Outbound Webhook Dispatch',
    description:
      'Delivers queued canonical ALO events to active webhook subscriptions with HMAC signing, exponential retry and dead-lettering.',
    schedule: FIVE_MINUTES,
    timezone: 'Asia/Dhaka',
    lockTtlSeconds: 280,
    timeoutMs: 120_000,
    aliases: ['webhooks', 'webhook-queue'],
    disposition: 'job',
    handler: createLazyHandler('runWebhookDispatch'),
    handlerName: 'runWebhookDispatch',
  },
];

/** Job keys the platform must always expose. Asserted by the policy check. */
export const REQUIRED_JOB_KEYS = [
  'whatsapp-followups',
  'failed-message-retry',
  'sla-monitoring',
  'notification-cleanup',
  'daily-analytics-summary',
  'ai-document-processing',
  'expired-portal-invitation-cleanup',
  'audit-maintenance',
  'operational-health-check',
] as const;

const PATH_SEGMENT = /^[a-z0-9][a-z0-9-]*$/;

export function normaliseJobSegment(segment: string): string {
  return (segment || '').trim().toLowerCase();
}

export function getRegisteredJob(key: string): RegisteredCronJob | null {
  const wanted = normaliseJobSegment(key);
  if (!wanted || !PATH_SEGMENT.test(wanted)) return null;
  return (
    JOB_REGISTRY.find((job) => job.key === wanted) ??
    JOB_REGISTRY.find((job) => job.aliases.includes(wanted)) ??
    null
  );
}

/** Every URL path the registry serves, including aliases. */
export function registeredJobPaths(): string[] {
  const paths: string[] = [];
  for (const job of JOB_REGISTRY) {
    paths.push(`/api/cron/${job.key}`);
    for (const alias of job.aliases) paths.push(`/api/cron/${alias}`);
  }
  return paths;
}

/** All path segments the registry answers to (keys + aliases). */
export function registeredJobSegments(): string[] {
  return registeredJobPaths().map((path) => path.replace('/api/cron/', ''));
}

/**
 * Convert a registry entry into a runtime job. A non-`job` disposition becomes
 * a runtime refusal, so the runner never executes a handler that does not exist.
 */
export function toRuntimeJob(entry: RegisteredCronJob): CronJobRuntime {
  if (entry.disposition === 'job') {
    if (typeof entry.handler !== 'function') {
      throw new Error(`cron job ${entry.key} is declared as a job but has no handler`);
    }
    return {
      key: entry.key,
      description: entry.handlerName ? `${entry.description} [${entry.handlerName}]` : entry.description,
      lockTtlSeconds: entry.lockTtlSeconds,
      timeoutMs: entry.timeoutMs,
      handler: entry.handler,
    };
  }
  return {
    key: entry.key,
    description: entry.description,
    lockTtlSeconds: entry.lockTtlSeconds,
    timeoutMs: entry.timeoutMs,
    ...(entry.disposition === 'external-dependency'
      ? { externalDependency: entry.reason ?? 'external dependency not configured' }
      : { supersededBy: entry.reason ?? 'superseded by another implementation' }),
    handler: () => {
      throw new Error(`cron job ${entry.key} must never execute its handler`);
    },
  };
}

/** Public, secret-free description of one job. */
export function describeRegisteredJob(entry: RegisteredCronJob): Record<string, unknown> {
  return {
    key: entry.key,
    name: entry.name,
    schedule: entry.schedule,
    timezone: entry.timezone,
    disposition: entry.disposition,
    handlerName: entry.handlerName ?? null,
    path: `/api/cron/${entry.key}`,
    aliases: entry.aliases.map((alias) => `/api/cron/${alias}`),
    lockTtlSeconds: entry.lockTtlSeconds,
    timeoutMs: entry.timeoutMs,
    ...(entry.reason ? { reason: entry.reason } : {}),
  };
}

/** The scheduler catalogue, safe for an admin UI. */
export function listRegisteredJobs(): Record<string, unknown>[] {
  return JOB_REGISTRY.map(describeRegisteredJob);
}
