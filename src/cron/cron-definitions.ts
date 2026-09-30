/**
 * ALO Education - 15 Cron Job Definitions
 * All jobs use Asia/Dhaka timezone with distributed locking (DB-based)
 * Verification: run `npm run cron:verify` or `npx tsx scripts/verify-15-cron.ts`
 */
import * as cronParser from 'cron-parser';

export interface CronJobDefinition {
  id: string; // unique
  name: string;
  description: string;
  cronExpression: string; // standard 5-field
  timezone: string; // must be Asia/Dhaka for ALO Education
  handler: string; // handler function name in worker.ts or api route
  route: string; // API route for Vercel/cPanel cron
  locking: boolean; // distributed locking enabled
  lockTtlMinutes: number;
  enabled: boolean;
}

export const CRON_JOBS: CronJobDefinition[] = [
  {
    id: 'sla-monitoring',
    name: 'SLA Monitoring & Escalation',
    description: 'Check 30-min SLA breaches, escalate to branch manager (CrmUniversity: 560 monitored, lastVerified 2026-09-15).',
    cronExpression: '* * * * *', // every minute
    timezone: 'Asia/Dhaka',
    handler: 'processSLAEvents',
    route: '/api/cron/sla-monitoring',
    locking: true,
    lockTtlMinutes: 5,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'agent-schedules',
    name: 'Agent Schedule Trigger',
    description: 'Evaluate AgentSchedule cronExpressions in Asia/Dhaka tz, create AgentTask pending jobs.',
    cronExpression: '* * * * *',
    timezone: 'Asia/Dhaka',
    handler: 'processAgentSchedules',
    route: '/api/cron/agent-schedules',
    locking: true,
    lockTtlMinutes: 5,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'whatsapp-followups',
    name: 'WhatsApp Follow-up Task Creation',
    description: 'Unreplied studentMessage >1h creates CounselorTask HIGH priority.',
    cronExpression: '*/5 * * * *',
    timezone: 'Asia/Dhaka',
    handler: 'processWhatsAppFollowUps',
    route: '/api/cron/whatsapp-followups',
    locking: true,
    lockTtlMinutes: 10,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'sitemap-regeneration',
    name: 'Sitemap Regeneration',
    description: 'Rebuild sitemap.ts with 560 universities (ALL_400_UNIVERSITIES), foots/shell sync, verified 2026-09-15 official URLs.',
    cronExpression: '0 3 * * *', // 03:00 daily
    timezone: 'Asia/Dhaka',
    handler: 'regenerateSitemap',
    route: '/api/cron/sitemap-regeneration',
    locking: true,
    lockTtlMinutes: 15,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'database-backup',
    name: 'Database Backup',
    description: 'Mysqldump + SHA256, rotate 7 daily, verify 560/11200/145600 counts.',
    cronExpression: '0 2 * * *', // 02:00 daily
    timezone: 'Asia/Dhaka',
    handler: 'backupDatabase',
    route: '/api/cron/database-backup',
    locking: true,
    lockTtlMinutes: 60,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'expired-session-cleanup',
    name: 'Expired Session Cleanup',
    description: 'Delete expired sessions/tokens >24h, clear portalUser session store.',
    cronExpression: '0 * * * *', // hourly
    timezone: 'Asia/Dhaka',
    handler: 'cleanupExpiredSessions',
    route: '/api/cron/expired-session-cleanup',
    locking: true,
    lockTtlMinutes: 15,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'temp-file-cleanup',
    name: 'Temp File & Upload Cleanup',
    description: 'Remove /tmp/unverified uploads >48h, orphan StudentDocument temp files.',
    cronExpression: '0 4 * * *', // 04:00 daily
    timezone: 'Asia/Dhaka',
    handler: 'cleanupTempFiles',
    route: '/api/cron/temp-file-cleanup',
    locking: true,
    lockTtlMinutes: 30,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'scheduled-reports',
    name: 'Scheduled Reports Generation',
    description: 'Generate daily application funnel, commission, university verification reports (60+ exports).',
    cronExpression: '0 6 * * *', // 06:00 daily
    timezone: 'Asia/Dhaka',
    handler: 'generateScheduledReports',
    route: '/api/cron/scheduled-reports',
    locking: true,
    lockTtlMinutes: 30,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'university-verification',
    name: 'University Data Verification',
    description: 'Re-validate 560 official URLs (GCU London https://www.gcu.ac.uk/london/study/london-courses etc.), update lastVerifiedAt 2026-09-15, flag NEEDS_REVIEW.',
    cronExpression: '0 5 * * *', // 05:00 daily
    timezone: 'Asia/Dhaka',
    handler: 'verifyUniversityData',
    route: '/api/cron/university-verification',
    locking: true,
    lockTtlMinutes: 45,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'intake-deadline-alerts',
    name: 'Course Intake Deadline Alerts',
    description: 'Alert for 145600 intakes with deadlines within 7d/30d, 13 intakes/course Jan2027-Jan2028.',
    cronExpression: '0 * * * *', // hourly
    timezone: 'Asia/Dhaka',
    handler: 'alertIntakeDeadlines',
    route: '/api/cron/intake-deadline-alerts',
    locking: true,
    lockTtlMinutes: 15,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'email-queue',
    name: 'Email Queue Processor',
    description: 'Send queued emails, retry failed, respect Asia/Dhaka working hours 10:00-18:00.',
    cronExpression: '*/5 * * * *',
    timezone: 'Asia/Dhaka',
    handler: 'processEmailQueue',
    route: '/api/cron/email-queue',
    locking: true,
    lockTtlMinutes: 10,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'scholarship-expiry',
    name: 'Scholarship Expiry Check',
    description: 'Flag CrmScholarship expiryStatus, notify for 145600 intakes with expiring scholarships.',
    cronExpression: '0 1 * * *', // 01:00 daily
    timezone: 'Asia/Dhaka',
    handler: 'checkScholarshipExpiry',
    route: '/api/cron/scholarship-expiry',
    locking: true,
    lockTtlMinutes: 20,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'ranking-update',
    name: 'Ranking Update Check',
    description: 'Poll ranking providers for 560 universities, update CrmRanking, verify GCU 601 band.',
    cronExpression: '0 7 * * 1', // Monday 07:00 weekly
    timezone: 'Asia/Dhaka',
    handler: 'checkRankingUpdates',
    route: '/api/cron/ranking-update',
    locking: true,
    lockTtlMinutes: 30,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'document-expiry-alerts',
    name: 'Student Document Expiry Alerts',
    description: 'Alert passport/visa expiry <60d, StudentPassport/StudentVisaHistory.',
    cronExpression: '0 8 * * *', // 08:00 daily
    timezone: 'Asia/Dhaka',
    handler: 'alertDocumentExpiry',
    route: '/api/cron/document-expiry-alerts',
    locking: true,
    lockTtlMinutes: 20,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
  {
    id: 'analytics-aggregation',
    name: 'Analytics Aggregation',
    description: 'Aggregate daily stats for 53-module chain, destination footers, search analytics.',
    cronExpression: '0 * * * *', // hourly
    timezone: 'Asia/Dhaka',
    handler: 'aggregateAnalytics',
    route: '/api/cron/analytics-aggregation',
    locking: true,
    lockTtlMinutes: 15,
    enabled: false, // Quarantined: locking/outcome/implementation audit incomplete
  },
];

// Helper: verify all jobs are Asia/Dhaka and locking enabled
export function verifyCronDefinitions(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (CRON_JOBS.length !== 15) errors.push(`Expected 15 jobs, found ${CRON_JOBS.length}`);
  for (const job of CRON_JOBS) {
    if (job.timezone !== 'Asia/Dhaka') errors.push(`${job.id} timezone != Asia/Dhaka (${job.timezone})`);
    if (!job.locking) errors.push(`${job.id} locking disabled`);
    if (!job.route.startsWith('/api/cron/')) errors.push(`${job.id} route must start with /api/cron/`);
    try {
      const parserAny = cronParser as any;
      const parser = parserAny.parse || parserAny.parseExpression || parserAny.CronExpressionParser?.parse || parserAny.default?.parse || parserAny.default?.CronExpressionParser?.parse;
      if (typeof parser === 'function') {
        parser.call(parserAny, job.cronExpression, { tz: job.timezone });
      } else if (parserAny.CronExpressionParser && typeof parserAny.CronExpressionParser.parse === 'function') {
        parserAny.CronExpressionParser.parse(job.cronExpression, { tz: job.timezone });
      } else if (typeof parserAny.parseExpression === 'function') {
        parserAny.parseExpression(job.cronExpression, { tz: job.timezone });
      }
    } catch (e: any) {
      errors.push(`${job.id} invalid cron: ${job.cronExpression} - ${e.message}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
