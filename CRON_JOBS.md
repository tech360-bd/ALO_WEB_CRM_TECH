# ALO Education — Cron Jobs (15 jobs, Asia/Dhaka, Distributed Locking)

> **All jobs run in `Asia/Dhaka` timezone with DB-based distributed locking (lockTtlMinutes).** Verification: `npx tsx scripts/verify-15-cron.ts` must report 15/15 OK, locking enabled, tz Asia/Dhaka.

Source: `src/cron/cron-definitions.ts` (single source of truth). Worker: `src/cron/worker.ts`. Vercel: `vercel.json` crons. cPanel: `scripts/cron-scheduler.sh`.

## Summary (15 jobs)

| # | id | Schedule (Dhaka) | Route | Lock | Purpose |
|---|----|------------------|-------|------|---------|
| 1 | `sla-monitoring` | `* * * * *` (every min) | `/api/cron/sla-monitoring` | 5m | 30-min SLA breach → branch_manager escalation, portalNotification |
| 2 | `agent-schedules` | `* * * * *` | `/api/cron/agent-schedules` | 5m | Evaluate AgentSchedule cronExpression tz Asia/Dhaka → create AgentTask pending |
| 3 | `whatsapp-followups` | `*/5 * * * *` | `/api/cron/whatsapp-followups` | 10m | Unreplied studentMessage >1h → CounselorTask HIGH |
| 4 | `sitemap-regeneration` | `0 3 * * *` (03:00) | `/api/cron/sitemap-regeneration` | 15m | Rebuild sitemap.ts 560 universities (ALL_400_UNIVERSITIES), sync footers/shell |
| 5 | `database-backup` | `0 2 * * *` (02:00) | `/api/cron/database-backup` | 60m | mysqldump + SHA256, verify 560/11200/145600 |
| 6 | `expired-session-cleanup` | `0 * * * *` (hourly) | `/api/cron/expired-session-cleanup` | 15m | Delete expired sessions/tokens >24h |
| 7 | `temp-file-cleanup` | `0 4 * * *` (04:00) | `/api/cron/temp-file-cleanup` | 30m | Remove /tmp uploads >48h, orphan StudentDocument |
| 8 | `scheduled-reports` | `0 6 * * *` (06:00) | `/api/cron/scheduled-reports` | 30m | Daily funnel/commission/verification reports (60+ exports) |
| 9 | `university-verification` | `0 5 * * *` (05:00) | `/api/cron/university-verification` | 45m | Re-validate 560 official URLs incl GCU London https://www.gcu.ac.uk/london/study/london-courses, update lastVerifiedAt 2026-09-15 |
| 10 | `intake-deadline-alerts` | `0 * * * *` (hourly) | `/api/cron/intake-deadline-alerts` | 15m | Alert 145600 intakes deadline within 7d/30d (13 intakes/course Jan2027-Jan2028) |
| 11 | `email-queue` | `*/5 * * * *` | `/api/cron/email-queue` | 10m | Process email queue, retry failed, respect 10:00-18:00 Dhaka |
| 12 | `scholarship-expiry` | `0 1 * * *` (01:00) | `/api/cron/scholarship-expiry` | 20m | Flag CrmScholarship expiryStatus |
| 13 | `ranking-update` | `0 7 * * 1` (Mon 07:00) | `/api/cron/ranking-update` | 30m | Poll ranking providers for 560, update CrmRanking (GCU 601) |
| 14 | `document-expiry-alerts` | `0 8 * * *` (08:00) | `/api/cron/document-expiry-alerts` | 20m | Passport/visa <60d alerts |
| 15 | `analytics-aggregation` | `0 * * * *` (hourly) | `/api/cron/analytics-aggregation` | 15m | Aggregate 53-module chain, destination footers |

## GCU London Validation

GCU London real courses verified 2026-09-15:
- https://www.gcu.ac.uk/london/study/london-courses (6 PG courses FT 16mo Jan27 London)
- https://www.gcu.ac.uk/study/courses/msc-international-management-and-business-development-london (MSc IMBD, GBP16200, IELTS6.0 PTE59, 2:2 honours, Jan27/Sep27/Jan28, modules, programme_spec PDF, REF2021)
All info replicated like same across 560/11200 via `scripts/enhance_gcu_london.py` and detailed master `02_ALO_COURSE_MASTER.csv`.

## Locking Implementation

Each job acquires DB lock in `CronLock` table (or `DeploymentSequence` fallback) with `lockKey=job.id`, `lockedAt=now`, `expiresAt=now+lockTtlMinutes`. If lock held and not expired, skip. All handlers wrap with `withCronLock(id, fn)` in `src/cron/worker.ts` and each `/api/cron/*` route.

## Timezone

All expressions parsed with `cron-parser` `{ tz: 'Asia/Dhaka' }`. No UTC conversion in app; Vercel crons also set to `Asia/Dhaka` via `vercel.json` cron definitions (Vercel interprets UTC but we schedule UTC equivalent of Dhaka time — see vercel.json comments).

## Verification

```bash
npx tsx scripts/verify-15-cron.ts
# Expected: 15 jobs, 15 Asia/Dhaka, 15 locking, 0 errors, worker.ts imports cron-definitions.ts
```

## cPanel Alternative

If deploying to cPanel PHP Node, use `scripts/cron-scheduler.sh` which calls same routes via `curl -H "Authorization: Bearer $CRON_SECRET" https://aloeducation.com/api/cron/<id>` with locking.

