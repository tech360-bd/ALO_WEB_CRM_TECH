# ALO University & Official Data Monitoring Agent

Operational reference for the 7-day monitoring agent, its approval workflow and
its scheduler.

This document covers what is **implemented in code**. It deliberately does not
claim any university/course catalogue has been verified — see
[Data state](#data-state).

---

## 1. What already existed

The monitoring system was largely built before this change. Present and working:

| Area | Status |
| --- | --- |
| `OfficialSource`, `SourceSnapshot`, `DataChange`, `DataChangeValue`, `DataConflict`, `VerificationRun`, `MonitoringJob`, `MonitoringLog`, `ApprovalQueueItem`, `ApprovalAction`, `OfficialDocument` models | existed |
| Monitoring engine (fetch → normalise → hash → diff → AI explain → `DataChange`) | existed (`src/lib/university-monitoring-engine.ts`) |
| 27 change types + impact mapping (fee/deadline HIGH, closure/gov-policy CRITICAL) | existed |
| Recheck logic (`recheckSource`) | existed |
| Super Admin UI (queue, compare, approve/reject/recheck, sources, runs, logs) | existed (`src/components/alo/views/university-monitoring.tsx`) |
| Dashboard aggregation endpoint | existed |
| Knowledge Center search restricted to `VERIFIED` + `PUBLISHED` | existed |
| Government/authority sources per country (UKVI, IRCC, Home Affairs/CRICOS, INZ/NZQA, SEVP/State, Irish Immigration/QQI, DAAD, KHDA, MQA, …) | existed in `prisma/seed-university-monitoring.ts` |

## 2. What was missing and has now been added

### 2.1 Authentication and RBAC (critical)

Ten of the eleven `/api/university-monitoring/*` handlers had **no
authentication at all**, and the Super Admin UI hard-coded
`performedBy: "superadmin@aloedu.com"` into every request body. Combined, any
anonymous caller on the internet could:

- `PATCH /changes/[id] {"action":"APPROVE"}` — write an arbitrary value into
  `UniversityPage` / `CoursePage`, i.e. into the public website and CRM;
- `POST /trigger` — start outbound scraping runs;
- `POST /recheck` — force outbound fetches;
- `PATCH /sources` — silently disable monitoring of any official source;
- `PATCH /conflicts` — resolve a data conflict;

…and every action was audit-logged **as the Super Admin**, because the actor
came from the request body rather than the session.

Added `src/lib/university-monitoring-auth.ts`:

- `requireMonitoringAdmin` — `SUPER_ADMIN` only. Guards approve, reject, mark
  verified, recheck, trigger, source create/update, conflict resolution.
- `requireMonitoringViewer` — staff only (`SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`,
  `COUNSELOR`, `MANAGER`, `STAFF`). Students and partners are rejected because
  the queue exposes *unapproved* detected values.
- Both **fail closed**: if session resolution throws, the result is an explicit
  401, never a pass-through.
- The actor is always derived from the session (`actorUserId`, so impersonation
  records who actually clicked). `performedBy` is no longer read from any body.

### 2.2 The 7-day scheduler

There was no scheduled entry point. `/api/cron/weekly-university-scan` returned
`503 DISABLED`, so the agent only ran when a human clicked a button.

Added:

- `src/lib/university-monitoring-runner.ts` — single owner of the run
  lifecycle, shared by the manual trigger and the cron route.
- `src/app/api/cron/university-monitoring/route.ts` — the scheduled entry point.

Reliability properties:

| Requirement | Implementation |
| --- | --- |
| Survives server/app/process restart and deployment | Cadence lives in the database (`MonitoringJob.nextRunAt`), not in the crontab line. `ensureMonitoringJob()` is idempotent and recreates the row on a fresh deploy. |
| Prevents duplicate execution | Lock acquired with a conditional `updateMany` (compare-and-set) — only one concurrent caller can match `lockedBy IS NULL OR lockExpiresAt < now`. |
| Crash recovery | `lockExpiresAt` (30 min TTL). `reclaimExpiredLock()` releases an orphaned lock and marks the abandoned `VerificationRun` as `FAILED`. |
| Never steals a live lock | Release is also conditional on `lockedBy = <our instance id>`. |
| Retry safety | `VerificationRun.retryCount` incremented on failure; `nextRunAt` still advances so a failure cannot wedge the schedule. |
| Run bookkeeping | `runId`, `startedAt`, `completedAt`, `status`, `errorMessage`, `retryCount`. |

The cron endpoint is **idempotent**: call it as often as you like, it returns
`{"status":"NOT_DUE"}` until 7 days have elapsed.

### 2.3 Historical versioning

Added `UniversityHistory`, `CourseHistory` and `ScholarshipHistory` (models +
migration `20261007010000_university_monitoring_history`).

`DataChange` records every *detected* change. These tables record the subset
that was *approved* and therefore actually mutated production, each row
carrying `oldValue`, `newValue`, `sourceUrl`, `detectedAt`, `approvedBy`,
`approvedAt` and `approvalId`. History is written **before** the overwrite, in
the same transaction, so the old value can never be lost.

### 2.4 CRM / public website / Knowledge Center synchronisation

The only cache helper in the repo (`invalidateCaches` in `publish-engine.ts`)
is an explicit no-op, and nothing called it from the monitoring flow — so an
approved fee change could keep serving the superseded value from cache.

Added `src/lib/university-monitoring-sync.ts`, invoked after the approval
transaction commits. It revalidates the affected university/course/country
paths, the listing and Course Finder surfaces, the CRM views, and the shared
cache tags (`revalidateTag(tag, { expire: 0 })` for immediate purge), then
records the fan-out in `MonitoringLog`.

### 2.5 7-day report delivery

`deliverRunReport()` writes the report to `AuditLog`
(`UNIVERSITY_MONITORING_REPORT_GENERATED`) and `MonitoringLog` with the full
counter set required by the spec.

### 2.6 Approval hardening

- Terminal states (`APPROVED` / `REJECTED`) can no longer be silently
  re-approved — returns `409` (recheck is still allowed).

---

## 3. Scheduler configuration

The 7-day cadence is enforced in the database. The platform scheduler only
needs to *poll* the endpoint; polling **daily** is recommended so a window
missed during a deployment or outage is picked up the next day rather than
slipping a full week.

### Vercel

Already registered in `vercel.json`:

```json
{ "path": "/api/cron/university-monitoring", "schedule": "0 21 * * *" }
```

### cPanel / VPS / systemd

```bash
0 3 * * * /usr/bin/curl -fsS -m 290 \
  -H "Authorization: Bearer $ALO_CRON_SECRET" \
  https://YOUR-DOMAIN/api/cron/university-monitoring \
  >> /path/to/logs/cron.log 2>&1
```

### Required environment

| Variable | Notes |
| --- | --- |
| `ALO_CRON_SECRET` (or `CRON_SECRET`) | **Minimum 16 characters.** Compared in constant time. Without it the endpoint accepts only an authenticated Super Admin session, and in production rejects everything else. |

### Manual operation

```bash
# Super Admin session, respects the 7-day gate
curl -X GET  https://DOMAIN/api/cron/university-monitoring --cookie "alo_portal_session=..."

# Super Admin session, bypass the gate (lock still applies)
curl -X GET  "https://DOMAIN/api/cron/university-monitoring?force=1" --cookie "..."

# Status probe
curl -I https://DOMAIN/api/cron/university-monitoring -H "Authorization: Bearer $ALO_CRON_SECRET"
#   x-monitoring-due / x-monitoring-enabled / x-monitoring-next-run
```

Responses: `COMPLETED` / `PARTIAL` (200), `NOT_DUE` (200), `LOCKED` (409),
`FAILED` (500), `DISABLED` (200).

---

## 4. API surface and required role

| Endpoint | Method | Role |
| --- | --- | --- |
| `/api/cron/university-monitoring` | GET/POST/HEAD | cron secret **or** `SUPER_ADMIN` |
| `/api/university-monitoring/trigger` | POST | `SUPER_ADMIN` |
| `/api/university-monitoring/recheck` | POST | `SUPER_ADMIN` |
| `/api/university-monitoring/changes/[id]` | PATCH | `SUPER_ADMIN` |
| `/api/university-monitoring/changes/[id]` | GET | staff |
| `/api/university-monitoring/changes` | GET | staff |
| `/api/university-monitoring/conflicts` | GET / PATCH | staff / `SUPER_ADMIN` |
| `/api/university-monitoring/sources` | GET / POST / PATCH | staff / `SUPER_ADMIN` / `SUPER_ADMIN` |
| `/api/university-monitoring/dashboard` | GET | staff |
| `/api/university-monitoring/runs` | GET | staff |
| `/api/university-monitoring/logs` | GET | staff |
| `/api/university-monitoring/search` | GET | staff (returns `VERIFIED` + `PUBLISHED` only) |

No endpoint in this namespace is anonymous.

---

## 5. Approval rule

AI detects → researches → compares → explains → prepares the update.
**Super Admin approves.** Only then does production data change.

`DataChange.status` defaults to `PENDING`; nothing in the monitoring engine
writes to `UniversityPage` / `CoursePage`. The single code path that mutates
production is `applyChangeToProduction()` in
`src/app/api/university-monitoring/changes/[id]/route.ts`, reachable only
through an `APPROVE` / `MARK_VERIFIED` action from an authenticated
`SUPER_ADMIN`, and it runs inside a transaction that also writes history and
the audit event.

---

## 6. Tests

`tests/integration/university-monitoring.test.ts` (15) and
`tests/integration/university-monitoring-rbac.test.ts` (13) run against a real
relational database — the SQLite mirror of the production MySQL schema (same
models, fields and constraints), not mocks.

```bash
npm run awf:mirror
npm run awf:ddl
node -e "const{DatabaseSync}=require('node:sqlite');\
new DatabaseSync('.awf-tmp/verify.db').exec(require('fs').readFileSync('.awf-tmp/verify-schema.sql','utf8'))"

ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.awf-tmp/verify.db" \
  npx vitest run tests/integration/university-monitoring.test.ts \
                 tests/integration/university-monitoring-rbac.test.ts
```

Coverage: scheduler config/persistence, 7-day interval, due calculation,
concurrent-lock duplicate prevention, stale-lock reclaim, live-lock protection,
change-evidence shape, no-auto-apply-before-approval, approve→apply+history+
audit, reject→no mutation, history timeline, source-failure isolation, conflict
lifecycle, approved+verified-only visibility, anonymous denial, per-role
allow/deny, revoked session, forged token, and body-supplied `performedBy`
privilege escalation.

---

## 7. Data state

**No university or course data was created, verified or imported by this
change.** The work here is the monitoring, approval, history, synchronisation
and security machinery.

Real catalogue verification requires outbound access to the official
university and government websites. The sandbox this was developed in can only
reach `github.com`, `registry.npmjs.org` and `pypi.org`, so no official source
was fetched and no `UNIVERSITY_CATALOGUE_VERIFIED` flag was set. Counts of
universities/faculties/courses/scholarships must come from an actual
monitoring run against live sources in an environment with internet access —
they are deliberately not asserted here.

To begin real verification on a deployed environment:

```bash
# 1. Register official sources (idempotent upsert)
npx tsx prisma/seed-university-monitoring.ts

# 2. Run the first cycle
curl -X GET "https://DOMAIN/api/cron/university-monitoring?force=1" \
  -H "Authorization: Bearer $ALO_CRON_SECRET"

# 3. Review the queue
#    Super Admin → AI Command Center → University Data Monitor → Verification Queue
```

---

## 8. Development note: scoped typecheck

`tsconfig.monitoring-scope.json` typechecks only the monitoring files. The
full-repo `tsc --noEmit` needs more than 4 GB of heap on this codebase
(~2,000 source files, 527 Prisma models); the scoped config lets you verify a
monitoring change on a smaller machine.

```bash
npx tsc -p tsconfig.monitoring-scope.json --noEmit
```

It is a development aid only — CI should continue to run the full
`npm run typecheck` and `npm run build`.
