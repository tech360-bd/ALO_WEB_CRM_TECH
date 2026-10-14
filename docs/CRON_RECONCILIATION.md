> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

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

## Full-functionality continuation — superseding weekly-ai-agent status

`POST /api/cron/weekly-ai-agent` is now **DISABLED in the local working tree**. Inspection and regression reproduction confirmed it wrote fixed tuition-price changes without fetching evidence, then claimed an official scan. It now preserves requireCron and returns 503 DISABLED without reading/writing course/update records. No historical data removed. The prior table's BROKEN assessment remains historical; quarantine is not completed functionality and the unidentified live ZIP may still have the old handler.

All 15 worker declarations remain disabled. Other HTTP cron routes and external hPanel schedules are independent and have not been invoked. Expanded implementation classification and required activation tests: [SCHEDULER_RECONCILIATION.md](SCHEDULER_RECONCILIATION.md).

---

## 2026-10-13 — scheduler certified; quarantine lifted for jobs that now exist

The table above is the historical record of the quarantine. It is superseded by
the certification pass below; the previous state was correct at the time and is
not deleted.

**What was fixed**

1. **Missing routes.** 14 of the 15 declared paths had no route file. A dynamic
   dispatcher (`src/app/api/cron/[job]/route.ts`) plus a job registry
   (`src/lib/cron/job-registry.ts`) now serve every declared path, so
   `vercel.json` no longer schedules 404s.
2. **Invalid lock.** `DeploymentSequence` has no `ownerId` and no `expiresAt`, so
   the worker's `withCronLock` could never exclude a second runner and never
   recovered a crashed one. Replaced by a real lease table, `CronLock`
   (migration `20261013000000_cron_lock` — additive: one new table, nothing
   else touched). The claim is a single conditional `UPDATE … WHERE expiresAt <= now`.
3. **Swallowed failures.** The worker's `catch {}` around lock acquisition is
   gone; lock, log and handler failures are all recorded, and the run status is
   part of the response body.
4. **Placeholder handlers.** The twelve logging-only bodies were deleted. Job
   bodies now live in `src/lib/cron/job-handlers.ts` and perform real work.
   Declarations that genuinely cannot run here (`database-backup`,
   `ranking-update`, `sitemap-regeneration`, `scheduled-reports`,
   `university-verification`, `email-queue`) return `blocked` with the exact
   reason instead of pretending to run.
5. **Unlocked route handlers.** `sla-monitor`, `followup`, `retry` and
   `analytics` now delegate to the certified runner, so a scheduler trigger and
   the worker can no longer process the same queue concurrently.
6. **Stale declarations.** The platform required seven jobs that had no
   declaration at all (retry, health check, analytics summary, AI document
   queue, notification retention, invitation cleanup, audit maintenance).
   Declarations grew from 15 to 21: 15 enabled, 6 blocked with reasons.
   `analytics-aggregation` is now `daily-analytics-summary`; the old path still
   resolves through a registry alias.

**What is still not done — and is not claimed**

* No schedule has been installed in cPanel/hPanel or anywhere else; this
  repository cannot inspect the operator's crontab. The routes and the worker are
  ready, and the deployment steps are in `CRON_JOBS.md`.
* The migration has **not been applied** to any database: there is no MySQL
  server reachable from the build environment. `prisma validate` passes and the
  SQL is additive and re-runnable, but `CronLock` must exist before a scheduler
  is switched on, otherwise every job correctly answers `blocked` with
  "cron lock store is unavailable".
* `cron/CPANEL_CRON_COMMANDS.txt` still references `cron/*.php` wrappers that do
  not exist in this repository. That file must be corrected by the operator
  before those lines are pasted into a crontab (`CRON_JOBS.md` gives the curl
  form).
* Cross-process behaviour is proven at the *statement* level and with a
  deterministic store double. Two real processes against real MySQL are not
  exercised here.

**Evidence**

```bash
npx tsx scripts/cron-scheduler-policy-check.ts    # 221 assertions, 221 passed
npx vitest run tests/unit/cron-quarantine.test.ts  # 6 passed
npx tsx scripts/verify-15-cron.ts                  # 21 declarations, 15 enabled
```
