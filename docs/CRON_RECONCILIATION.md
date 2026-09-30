# Cron reconciliation — 2026-10-01 continuation

All 15 worker jobs are now explicitly disabled and the worker honors the flag. This is quarantine, not completion. Worker lock fallback is still invalid; no cron installed.

| Job | Declared schedule | Declared route | Actual route | Implementation | Locking | Cadence | Status |
|---|---|---|---|---|---|---|---|
| sla-monitoring | `* * * * *` Asia/Dhaka | `/api/cron/sla-monitoring` (missing) | /api/cron/sla-monitor (related only, not an equivalent handler) | worker.ts `processSLAEvents`: DB operations; failure swallowing/identity issues | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| agent-schedules | `* * * * *` Asia/Dhaka | `/api/cron/agent-schedules` (missing) | None | worker.ts `processAgentSchedules`: DB operations; failure swallowing/identity issues | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| whatsapp-followups | `*/5 * * * *` Asia/Dhaka | `/api/cron/whatsapp-followups` (missing) | /api/cron/followup (related only, not an equivalent handler) | worker.ts `processWhatsAppFollowUps`: DB operations; failure swallowing/identity issues | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| sitemap-regeneration | `0 3 * * *` Asia/Dhaka | `/api/cron/sitemap-regeneration` (missing) | None | worker.ts `regenerateSitemap`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| database-backup | `0 2 * * *` Asia/Dhaka | `/api/cron/database-backup` (missing) | None | worker.ts `backupDatabase`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| expired-session-cleanup | `0 * * * *` Asia/Dhaka | `/api/cron/expired-session-cleanup` (missing) | None | worker.ts `cleanupExpiredSessions`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| temp-file-cleanup | `0 4 * * *` Asia/Dhaka | `/api/cron/temp-file-cleanup` (missing) | None | worker.ts `cleanupTempFiles`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| scheduled-reports | `0 6 * * *` Asia/Dhaka | `/api/cron/scheduled-reports` (missing) | /api/cron/weekly-reports (related only, not an equivalent handler) | worker.ts `generateScheduledReports`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| university-verification | `0 5 * * *` Asia/Dhaka | `/api/cron/university-verification` (missing) | /api/cron/weekly-university-scan (related only, not an equivalent handler) | worker.ts `verifyUniversityData`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| intake-deadline-alerts | `0 * * * *` Asia/Dhaka | `/api/cron/intake-deadline-alerts` (missing) | None | worker.ts `alertIntakeDeadlines`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| email-queue | `*/5 * * * *` Asia/Dhaka | `/api/cron/email-queue` (missing) | None | worker.ts `processEmailQueue`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| scholarship-expiry | `0 1 * * *` Asia/Dhaka | `/api/cron/scholarship-expiry` (missing) | None | worker.ts `checkScholarshipExpiry`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| ranking-update | `0 7 * * 1` Asia/Dhaka | `/api/cron/ranking-update` (missing) | None | worker.ts `checkRankingUpdates`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| document-expiry-alerts | `0 8 * * *` Asia/Dhaka | `/api/cron/document-expiry-alerts` (missing) | None | worker.ts `alertDocumentExpiry`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |
| analytics-aggregation | `0 * * * *` Asia/Dhaka | `/api/cron/analytics-aggregation` (missing) | /api/cron/analytics (related only, not an equivalent handler) | worker.ts `aggregateAnalytics`: Incomplete/logging-only or optional no-op | Broken read/upsert fallback | Expression exists; no scheduling approved | DISABLED |

## Existing HTTP endpoints (separate implementations)

| Endpoint | Authentication | Idempotency/locking/retry/outcome | Status |
|---|---|---|---|
| /api/cron/analytics | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |
| /api/cron/followup | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |
| /api/cron/health | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |
| /api/cron/retry | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |
| /api/cron/sla-monitor | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |
| /api/cron/weekly-ai-agent | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |
| /api/cron/weekly-reports | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |
| /api/cron/weekly-university-scan | requireCron guard present | Authenticated 503; no fabricated evidence/data write | DISABLED |
| /api/cron/weekly-university-update | requireCron guard present | Not certified: no proven cross-process lock + durable idempotent outcome; no production schedule approved | BROKEN |

Correction to prior report: worker already checks modulo five/hour for those cadences; the earlier claim that both always ran every minute was incorrect. Its remaining lock ownership/expiry and swallowed outcomes are verified defects.

Other scheduling surfaces: `/api/automation/schedule` calls runAllSchedulers in automation-engine; agent schedules exist in DB; health-monitor.yml is GitHub operational monitoring, not cPanel application cron. No assumption of a daemon, Redis, VPS or fixed port. Broken HTTP jobs must not be installed in cPanel; existing unknown external cron configuration cannot be inspected from this repository.

Re-enable only after authentication, real implementation, durable claiming/idempotency, concurrency tests, persisted failure/success logs, bounded timeout, ambiguous-delivery retry policy and correct cadence are proven. cPanel command requires actual private curl-config path and executable; no invented paths. See CRON-JOBS.md for mechanism, not an approved schedule.
