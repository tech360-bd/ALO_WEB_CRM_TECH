# ALO Education — Scheduled Jobs

> Certified 2026-10-13. Certification command:
> `npx tsx scripts/cron-scheduler-policy-check.ts` → **221 assertions, 0 failed**.
> Unit regression: `npx vitest run tests/unit/cron-quarantine.test.ts` → 6/6.
>
> This document supersedes the 2026-09-15 "15 jobs" description. Read
> [docs/CRON_RECONCILIATION.md](docs/CRON_RECONCILIATION.md) for the historical
> quarantine record; its superseded note at the end states what changed.

## What was wrong (root causes, all confirmed in source)

| # | Defect | Evidence | Consequence |
|---|---|---|---|
| 1 | 14 of 15 declared route paths had **no route file** | only `src/app/api/cron/university-monitoring/route.ts` existed for the declared set | the deployment scheduled 404s; no job ran |
| 2 | the worker's lock could not exclude anyone | it read `DeploymentSequence`, which has no owner and no `expiresAt`/`updatedAt` column, so `expiresAt > now` was always `false` and the "lock" was an unowned permanent row | two processes could run the same job concurrently |
| 3 | lock errors were swallowed | `catch {}` around acquire, then the job ran anyway | a failed lock looked like a successful lock |
| 4 | 12 of 15 handlers only printed a line | `src/cron/worker.ts` (`[Sitemap]`, `[Backup]`, `[Reports]`, …) | a "run" recorded no business result |
| 5 | every declaration was `enabled: false` | quarantine while the above held | nothing ran, by design, and the quarantine was invisible in `vercel.json` |
| 6 | route handlers ran unlocked | `/api/cron/{sla-monitor,followup,retry,analytics}` held no lease | a scheduler trigger and the worker could drain the same queue |

## The model now

* **When** — `src/cron/cron-definitions.ts` (21 declarations, Asia/Dhaka).
* **What**  — `src/lib/cron/job-registry.ts` (21 entries, one per path segment plus aliases).
* **How**   — `src/lib/cron/job-runner.ts` + `src/lib/cron/cron-lock.ts`.
* **Who**   — `src/cron/worker.ts` (loop) and `src/app/api/cron/[job]/route.ts` (HTTP).

Every run is one of four outcomes, and the HTTP status matches:

| status | HTTP | meaning |
|---|---|---|
| `ran` | 200 | the handler executed and its summary is in the response and in `CronJobLog.metadata` |
| `skipped_locked` | 423 | another runner holds a live lease; nothing was executed |
| `blocked` | 501 | the job cannot run here — the response names the missing resource or the superseding implementation |
| `failed` | 500 | the handler threw or exceeded its timeout; the reason is in the response and in `CronJobLog.errorMessage` |

`success` is `true` only for `ran`. A skipped, blocked or failed run can never be
mistaken for a completed one.

## Concurrency

`CronLock` (added by migration `20261013000000_cron_lock`, additive: one new
table, no existing table/column/row touched).

1. `INSERT` the job key. A unique-constraint violation means somebody holds it.
2. `UPDATE … WHERE jobKey = ? AND expiresAt <= now`. Only one concurrent claimant
   can win, because the winner's new `expiresAt` is in the future and the loser
   re-evaluates the predicate against the committed row.

A crashed holder is replaced once its lease expires, and every run releases its
lease in a `finally`, so a retry never waits for the TTL. Without a usable lease
store the runner **refuses to run** (`blocked`) instead of degrading to an
in-process lock — a silent downgrade is how duplicate WhatsApp sends happen.

## Job catalogue

Enabled (all Asia/Dhaka, lease + timeout + `CronJobLog`):

| job | schedule | does |
|---|---|---|
| `sla-monitoring` | `* * * * *` | escalates threads past their office-hours SLA (counselor → branch manager → CEO/SA) and raises alarms |
| `whatsapp-followups` | `*/5 * * * *` | Day 3/7/14/21/25/30 sends; honours STOP/opt-out and active applications |
| `failed-message-retry` | `*/5 * * * *` | retries undelivered sends, max 3 attempts, then `failed` |
| `agent-schedules` | `* * * * *` | creates `AgentTask` rows for due `AgentSchedule`s, advances `nextRunAt` |
| `operational-health-check` | `*/5 * * * *` | read-only readiness snapshot (DB probe, SLA/follow-up/retry backlogs, recent runs) |
| `daily-analytics-summary` | `0 * * * *` | writes the `WhatsAppAnalyticsDaily` aggregate for the day |
| `ai-document-processing` | `*/10 * * * *` | queues unclassified student documents as `AiTask` rows (`ALO-DOCAI-<id>`, idempotent) |
| `notification-cleanup` | `0 3 * * *` | reports read notifications past retention; deletes only when `ALO_NOTIFICATION_RETENTION_DAYS >= 7` |
| `expired-portal-invitation-cleanup` | `0 4 * * *` | audits unused expired invitations once each; never deletes |
| `audit-maintenance` | `0 2 * * *` | re-marks abandoned `running` runs as `failed`, reports audit volume |
| `expired-session-cleanup` | `0 * * * *` | removes sessions expired more than 24 h ago |
| `temp-file-cleanup` | `0 4 * * *` | reports uploads that never reached review; report-only |
| `document-expiry-alerts` | `0 8 * * *` | notifies students whose passport expires within 60 days |
| `scholarship-expiry` | `0 1 * * *` | flags scholarship deadlines past / within 30 days |
| `intake-deadline-alerts` | `0 * * * *` | notifies students whose preferred intake closes within 30 days |

Declared but deliberately not run from the application — the endpoint returns
`blocked` with the reason, never a fake success:

| job | reason |
|---|---|
| `database-backup` | needs `mysqldump`, DB credentials and a backup destination with retention outside the Next.js runtime (see `BACKUP_RESTORE_GUIDE.md`) |
| `ranking-update` | needs ranking-provider credentials, which are not configured |
| `sitemap-regeneration` | the sitemap is generated dynamically by `src/app/sitemap.ts` |
| `scheduled-reports` | implemented at `/api/cron/weekly-reports` and `/api/cron/analytics` |
| `university-verification` | implemented at `/api/cron/university-monitoring` (7-day cadence in `MonitoringJob.nextRunAt`) |
| `email-queue` | implemented at `/api/cron/email-outbox` |

Aliases keep every previously published path working:
`analytics-aggregation` → `daily-analytics-summary`, `sla-monitor` →
`sla-monitoring`, `followup` → `whatsapp-followups`, `retry` →
`failed-message-retry`, `health` → `operational-health-check`,
`document-processing` → `ai-document-processing`,
`portal-invitation-cleanup` → `expired-portal-invitation-cleanup`.

## Authorization

All `/api/cron/*` endpoints require `requireCron`: either
`Authorization: Bearer $ALO_CRON_SECRET` (`>= 16` chars, constant-time compare)
or an authenticated SUPER_ADMIN/ADMIN session. In production a missing secret
rejects everything (fail closed). `GET` and `POST` behave identically;
`OPTIONS` returns the job catalogue for the same callers.

## Deployment

* **Hostinger (current production)** — Hostinger is the only authorized runtime
  (`HOSTINGER-RUNTIME-STANDARD.md`); Hostinger's hPanel cron is used only to call
  the job URLs. Point each schedule at `https://aloeducation.com/api/cron/<job>`
  with the bearer secret, for example:

  ```
  */5 * * * * curl -fsS -m 120 -H "Authorization: Bearer $ALO_CRON_SECRET" https://aloeducation.com/api/cron/whatsapp-followups
  ```

  hPanel documents cron times in UTC while the declarations in
  `cron-definitions.ts` are Asia/Dhaka — convert explicitly and verify the
  account's timezone before trusting a schedule.

  The interface is HTTP-only, so no repository file is deployed into the
  scheduler: any scheduler able to issue one authenticated GET can drive these
  jobs.

* **Vercel** — `vercel.json` already lists the paths; they now resolve.
* **Worker** — `npx tsx src/cron/worker.ts` runs the same registry under the same
  leases; run it *or* an external scheduler, or both (leases make it safe).

## Verification

```bash
npx tsx scripts/cron-scheduler-policy-check.ts   # 221 assertions, 0 failed
npx vitest run tests/unit/cron-quarantine.test.ts # 6/6
npx tsx scripts/verify-15-cron.ts                 # declaration table
```
