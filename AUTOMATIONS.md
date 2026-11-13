# ALO EDUCATION — AUTOMATIONS

Spec s7, s41, s51, s60, s64, s89, s90.

**Scheduler:** 22 declared jobs, **16 enabled**, 6 deliberately disabled with a recorded reason.
Definitions: `src/cron/cron-definitions.ts` · Handlers: `src/lib/cron/job-handlers.ts` ·
Registry: `src/lib/cron/job-registry.ts` · Worker: `src/cron/worker.ts` ·
External schedule: `vercel.json`.

---

## 1. Architecture

A job is only *enabled* when the registry resolves it to real work. The invariant enforced by
`tests/unit/cron-quarantine.test.ts` is:

> a declaration may be enabled only when the job registry resolves it to a real handler, and a
> declaration that is not enabled must state why (more than 20 characters).

Every job runs through the same path:

```
external scheduler (Vercel / cPanel)
  → POST /api/cron/<id>
  → requireCron(req)                        # src/lib/cron-auth.ts
  → handleAuthorizedCronRequest(req, key)   # src/lib/cron/route-handler.ts
  → JOB_REGISTRY[key].handler(ctx)          # ctx: { now, jobKey, ownerId, runId, limit }
  → CronJobLog row                          # durable run record
```

`CronJobContext` carries `now`, `jobKey`, `ownerId`, `runId` and `limit`. Handlers use `clampLimit`,
`short`, `parseLooseDate` and `daysUntil` from `job-handlers.ts` so bounds and date parsing are
consistent rather than re-implemented per job.

**Locking.** Every enabled definition has `locking: true` and a `lockTtlMinutes`. The worker skips a
job whose lease is held (`if (!definition.enabled) continue;` gates disabled ones). Run statuses are
`ran`, `skipped_locked`, `failed`, `blocked`.

**Timezone.** All jobs run in `Asia/Dhaka`. A test asserts this for new jobs.

**Idempotency (s89, s90).** Jobs must be safe to re-run. Where an external side effect is involved the
deduplication is structural, not a flag: webhook delivery is unique per `(subscriptionId, eventId)`, so
a repeated dispatch cannot double-send.

---

## 2. Enabled jobs (16)

| Job | Schedule | Purpose |
|---|---|---|
| `sla-monitoring` | — | SLA breach detection and escalation (s51) |
| `whatsapp-followups` | — | WhatsApp follow-up sequences with stop-on-reply (s10, s41) |
| `failed-message-retry` | — | Retries failed outbound messages (s91) |
| `agent-schedules` | — | Agent/B2B scheduled work |
| `operational-health-check` | — | Platform health, feeds the admin health dashboard (s88) |
| `daily-analytics-summary` | — | Aggregates analytics (s71) |
| `ai-document-processing` | — | AI document pre-checks; final approval stays human (s23) |
| `notification-cleanup` | — | Prunes old notifications |
| `expired-portal-invitation-cleanup` | — | Expires stale portal invitations |
| `audit-maintenance` | — | Audit table maintenance (never deletes audit history) |
| `expired-session-cleanup` | — | Revokes expired sessions (s66) |
| `temp-file-cleanup` | — | Removes temporary files |
| `document-expiry-alerts` | — | Document expiry monitoring (s30) |
| `scholarship-expiry` | — | Scholarship deadline monitoring (s47) |
| `intake-deadline-alerts` | — | Intake deadline monitoring, generates tasks and warnings (s19, s30) |
| **`webhook-dispatch`** | `*/5 * * * *` | **Added by this work.** Drains the outbound webhook queue (s77) |

Schedule density across the chain: five jobs at `*/5 * * * *`, three hourly, two each at 02:00/03:00/04:00,
two every minute, and one each at `*/10 * * * *`, 01:00, 05:00, 06:00, 07:00 Monday and 08:00.

### `webhook-dispatch` in detail

Runs every 5 minutes with a 5-minute lock TTL. It calls `processDueDeliveries(limit, { fetchImpl, now })`,
which:

1. Selects deliveries whose `nextAttemptAt` has passed.
2. Signs the payload with HMAC-SHA256 over `<timestamp>.<raw body>`.
3. POSTs with a bounded timeout.
4. Records the **true** outcome — `DELIVERED`, `FAILED` (retryable) or `DEAD` (exhausted).
5. Schedules the next attempt with exponential backoff: 30s, 2m, 8m, 32m, 2h, capped at 6h.

It reports `NOT_CONFIGURED` rather than success when there is nothing to deliver (s94). A transport
failure never throws out of the handler — it is persisted on the delivery row so operators can see
exactly what happened (s91).

---

## 3. Disabled jobs (6) — and why

Each carries a `blockedReason`. Four are *superseded* (the work exists elsewhere), two are
*not configured* (they need infrastructure this deployment lacks). None is silently off.

| Job | Reason |
|---|---|
| `database-backup` | Requires the `mysqldump` binary, database credentials and a backup destination with retention. **Not configured.** s87 forbids calling a backup complete unless tested — so it is declared blocked rather than pretending to run. |
| `ranking-update` | Requires ranking-provider credentials that are not configured; rankings are entered through the admin surface instead. |
| `sitemap-regeneration` | Superseded — the sitemap is generated dynamically by `src/app/sitemap.ts` on request. |
| `scheduled-reports` | Superseded — implemented at `/api/cron/weekly-reports` and `/api/cron/analytics`. |
| `university-verification` | Superseded — implemented at `/api/cron/university-monitoring` (7-day cadence enforced there). |
| `email-queue` | Superseded — implemented at `/api/cron/email-outbox`. |

---

## 4. Event-driven automation (s7, s41)

Beyond the scheduler, automation rules fire on state changes: new lead → assign counselor; no response
→ automated follow-up; high-intent lead → notify counselor; deadline approaching → notify responsible
staff; offer received → notify student and counselor; deposit pending → reminder sequence; visa
deadline → visa task created.

Campaign automation (s41) must **stop or adapt** when the student replies, converts, opts out, an
application begins, or staff pause it manually. Stop-on-reply is implemented in the WhatsApp follow-up
engine (`src/lib/whatsapp-followup-engine.ts`).

---

## 5. Policy change monitoring (s64)

A detected regulatory change raises a `PolicyChangeAlert` with an explicit blast radius — affected
workflows, students, applications and countries, plus an `impactCount`. Detection **never** applies the
change. Triage turns it into a proposed `RegulatoryRuleVersion`, which still needs a named
administrator's approval (s116). `requiresApproval` defaults to true and is forced true for high-risk
rule types even if a caller asks otherwise.

`expireOverdueRules()` is idempotent and safe to call from a job repeatedly.

---

## 6. Certification

`scripts/cron-scheduler-policy-check.ts` certifies the whole scheduler — **223 assertions, 0 failures**.
It covers lease exclusivity and recovery, run statuses (`ran` / `skipped_locked` / `failed` / `blocked`),
durable run logging, bounded timeouts, path coverage for both `vercel.json` and `cron-definitions.ts`,
add-only migrations, and the absence of any scheduled deletion of private files or student data.

`verifyCronDefinitions()` returns `ok: true` for 22/22 definitions, validating each cron expression
against the declared `Asia/Dhaka` timezone.

`tests/unit/cron-quarantine.test.ts` (7 tests) additionally pins that:
- the declaration count derives from `CRON_JOB_COUNT` rather than a literal, so a legitimate new job
  does not break the suite without adding coverage;
- `webhook-dispatch` resolves in the registry to a real handler, is declared enabled at `*/5 * * * *`,
  is scheduled in `vercel.json` at the same cadence, and its route calls `handleAuthorizedCronRequest`;
- every quarantined job is blocked at runtime and has no handler;
- every path declared to the external scheduler is served.

Two hard-coded counts were fixed while doing this: `cron-quarantine.test.ts` asserted
`CRON_JOBS.length === 21` and `scripts/cron-scheduler-policy-check.ts` assertion C1 did the same. Both
now derive from `CRON_JOB_COUNT`.

`scripts/verify-15-cron.ts:84` still asserts `CRON_JOBS.length !== 15`. It is **stale and not run by
CI**, so it is not a regression, but it should be deleted or updated.

---

## 7. Verification status

| Item | Status |
|---|---|
| Declarations, registry resolution and path coverage | **PASS** — 223/223 assertions, 22/22 definitions, 7/7 tests |
| Handler logic (`processDueDeliveries`, backoff, retryability) | **PASS** — unit tested with an injected `fetchImpl` |
| A job actually executing on schedule | **NOT VERIFIED** — no scheduler and no database in this environment |
| `database-backup` | **NOT CONFIGURED** — correctly declared blocked (s87) |
| Real message/email/WhatsApp delivery | **NOT CONFIGURED** — no provider credentials |
