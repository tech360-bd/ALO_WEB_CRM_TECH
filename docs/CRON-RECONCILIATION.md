# Cron declaration reconciliation — 2026-10-01

Not an installation manifest. Every declared worker job remains BLOCKED: distributed locking is not valid and several handlers are logging-only. No daemon or cPanel command has been installed. All require DATABASE_URL; HTTP jobs additionally require ALO_CRON_SECRET / CRON_SECRET. Provider-dependent jobs need their separately verified credentials.

| Job | Declared schedule (Asia/Dhaka) | Handler in src/cron/worker.ts | Declared route exists? |
|---|---|---|---|
| sla-monitoring | `* * * * *` | `processSLAEvents` | NO: `/api/cron/sla-monitoring` |
| agent-schedules | `* * * * *` | `processAgentSchedules` | NO: `/api/cron/agent-schedules` |
| whatsapp-followups | `*/5 * * * *` | `processWhatsAppFollowUps` | NO: `/api/cron/whatsapp-followups` |
| sitemap-regeneration | `0 3 * * *` | `regenerateSitemap` | NO: `/api/cron/sitemap-regeneration` |
| database-backup | `0 2 * * *` | `backupDatabase` | NO: `/api/cron/database-backup` |
| expired-session-cleanup | `0 * * * *` | `cleanupExpiredSessions` | NO: `/api/cron/expired-session-cleanup` |
| temp-file-cleanup | `0 4 * * *` | `cleanupTempFiles` | NO: `/api/cron/temp-file-cleanup` |
| scheduled-reports | `0 6 * * *` | `generateScheduledReports` | NO: `/api/cron/scheduled-reports` |
| university-verification | `0 5 * * *` | `verifyUniversityData` | NO: `/api/cron/university-verification` |
| intake-deadline-alerts | `0 * * * *` | `alertIntakeDeadlines` | NO: `/api/cron/intake-deadline-alerts` |
| email-queue | `*/5 * * * *` | `processEmailQueue` | NO: `/api/cron/email-queue` |
| scholarship-expiry | `0 1 * * *` | `checkScholarshipExpiry` | NO: `/api/cron/scholarship-expiry` |
| ranking-update | `0 7 * * 1` | `checkRankingUpdates` | NO: `/api/cron/ranking-update` |
| document-expiry-alerts | `0 8 * * *` | `alertDocumentExpiry` | NO: `/api/cron/document-expiry-alerts` |
| analytics-aggregation | `0 * * * *` | `aggregateAnalytics` | NO: `/api/cron/analytics-aggregation` |

Do not substitute declared URLs for implemented routes. See CRON-JOBS.md for actual HTTP endpoints and private curl-config mechanism. Exact executable/path/frequency must be approved after hosting paths, timezone and execution limits are known.

Verified defects: lock acquisition is read-then-upsert, optional nonexistent cronLock model fallback, DeploymentSequence has no expiry/updatedAt, exceptions swallowed; hourly and five-minute jobs are treated as every-minute jobs; handler outcomes may report successful runs after swallowed failures. Backup, email queue, reports, temp cleanup and other handlers are stubs. weekly-university-scan HTTP endpoint creates simulated change evidence rather than fetched evidence. These are repository defects, not missing cPanel credentials.
