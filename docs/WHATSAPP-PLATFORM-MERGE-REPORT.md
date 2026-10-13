# ALO Education — Complete Platform merge & certification report

**Date:** 2026-10-13 · **Repo:** `tech360-bd/ALO_WEB_CRM_TECH`
**Branch:** `arena/57b0809e-alo-web-crm-tech` · **Commit at start and end:** `7c26aad4` (nothing committed, nothing pushed, nothing deployed — see §U)

This report answers the master implementation command ("merge WhatsApp AI
automation, employee RBAC, CRM communication, student automation, SLA
escalation, document security, AI assistance, audit, notification, task,
analytics and production operations into the **existing** project") and the
required A–V response format. It separates three things that are easy to
confuse:

* **discovered** — already built in the repository, untouched;
* **merged/fixed** — changed in this pass, with evidence;
* **blocked** — genuinely waiting on an external resource or environment.

---

## A. Project inspection summary

| Item | Finding |
|---|---|
| Runtime | Next.js (App Router) + Prisma + MySQL, Node 22, Hostinger production (`HOSTINGER-RUNTIME-STANDARD.md`) |
| API surface | **910** `route.ts` files under `src/app/api` |
| Schema | **533** models (`prisma/schema.prisma`, validated: "The schema … is valid 🚀") |
| WhatsApp surface | 13 routes under `/api/whatsapp/*` plus `/api/crm/whatsapp`, `/api/counselor/whatsapp`, `/api/crm/ucc/*` (14 sub-modules) |
| WhatsApp libraries | `whatsapp-cloud-api`, `whatsapp-number-pool`, `whatsapp-webhook-handler`, `whatsapp-followup-engine`, `whatsapp-inbound-media`, `whatsapp-media-ingestion`, `ai-whatsapp-engine`, `whatsapp-media` |
| Scheduler | 21 declarations (was 15), `src/cron/worker.ts`, 11 static `/api/cron/*` routes |
| Duplicate systems | **none created** in this pass; where two implementations existed they were merged (see C) |

## B. Existing features discovered (not rebuilt)

Verified present in source, with the same behaviour left intact:

* **WhatsApp Cloud API only** — official Graph API calls, HMAC signature
  verification (`X-Hub-Signature-256`), `hub.challenge` verification. No
  Baileys/QR/Puppeteer/Selenium anywhere in `src/`.
* **20-number official pool** `01805020100-01805020119` with main/COO semantics,
  a routing engine with the documented 6-level priority, and an auditable
  assignment log (`WhatsAppNumberAssignmentAudit`).
* **Webhook pipeline** — 16 ordered steps: payload/source validation, receiving
  number, sender, provider message id, duplicate detection, raw event, message
  archive, conversation link, student/lead link, routing, SLA start, AI, document
  processing, urgent escalation, audit, fast 200.
* **Webhook idempotency** — event id derivation, duplicate suppression and
  out-of-order status protection (`src/lib/communications/webhook-idempotency.ts`,
  already committed as `cecee580`).
* **AI engine** — language/intent/sentiment detection, lead scoring, reply
  generation, handover decisions, banned-claim rules (never guarantee visa or
  admission).
* **Follow-up engine** — Day 3/7/14/21/25/30 templates with `{{variables}}`,
  STOP/START opt-out, template approval state, attempt cap, audit.
* **SLA engine** — Asia/Dhaka, Sat–Thu 09:00–18:00, Friday closed,
  office-hours-aware due calculation, 3 escalation levels, holiday helper.
* **Dashboard alarms** — `DashboardAlarm` + `PortalNotification`, escalation
  levels, masked phone by role, acknowledge/resolve with audit.
* **Task engine** — `CounselorTask`, `CommunicationTask`, `AgentOSTask`,
  `VisaTask`, `AiTask` (idempotent `taskCode`).
* **Notification engine** — `Notification`, `PortalNotification`,
  `StudentNotification`, `NotificationEngine`, `HrmNotification`,
  `ApplicationNotification`.
* **Message/note immutability** — `CommunicationDeleteRequest` (request → approval),
  `CommunicationNoteVersion` (old content, new content, actor, reason).
* **Document security** — private file store with SHA-256 re-verification on read,
  `DocumentSecurityIncident`, `DocumentAudit`, `AiDocumentClassification`.
* **Audit** — `AuditLog`, `AloAuditLog`, `CrmAuditLog`, `PortalAuditLog`,
  `EmployeeAuditLog`, `DocumentAudit`, `AgentAuditLog`.
* **Retry** — `WhatsAppRetryQueue` with `attemptCount`/`maxAttempts`/`nextRetryAt`.
* **RBAC** — `withAuth`/`withStudentAuth`, `src/proxy.ts` route allow-lists,
  `access-check-engine`, `partner-tenant-guard`, partner entitlement policy.
* **Portal invitation** — `StudentPortalInvitation` with token hash, expiry,
  single use, and opened/activated timestamps.

## C. Features merged / fixed in this pass

### C1. Scheduler was scheduling 404s (six confirmed defects)

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | 14 of 15 declared cron paths had **no route file** | only `university-monitoring/route.ts` existed | dynamic dispatcher + registry; `vercel.json` unchanged and now resolves |
| 2 | the worker's lock could not exclude anyone | `DeploymentSequence` has no owner and no expiry column, so `expiresAt > now` was always false and the "lock" was an unowned permanent row | real lease table `CronLock`; single conditional claim |
| 3 | lock acquisition errors swallowed | `catch {}` then the job ran | failures are recorded and surfaced |
| 4 | 12 of 15 handlers only printed a line | `[Sitemap]`, `[Backup]`, `[Reports]`, … | deleted; real bodies in `job-handlers.ts` |
| 5 | all 15 declarations `enabled: false` | quarantine while the above held | 15 enabled (real work), 6 blocked with reasons |
| 6 | route handlers ran unlocked | `sla-monitor`, `followup`, `retry`, `analytics` | now delegate to the certified runner |

### C2. Document send path had no recipient authorization (§34)

`checkDocumentSharingAllowed` existed but was called from exactly one place: the
manual `POST /api/documents/security` with `action: 'check_share'`. The real
document-send path — `POST /api/crm/ucc/conversations/[id]/reply` with
`sendWhatsAppPrivateMedia` — performed conversation, B2B-confidentiality and file
integrity checks but **never checked the destination number**. A student document
could be sent to any number.

Fixed with `resolveAuthorizedDocumentRecipient` (deny by default) enforced
**before** the message row is written: an official ALO number, a WhatsApp contact
already linked to that student, a contact of the student's own partner, or a
phone on the student's record. Anything else → 403
`DOCUMENT_RECIPIENT_NOT_AUTHORIZED`, security incident, audit entry, no provider
call.

### C3. WhatsApp send endpoint hardening (§44/§46/§49)

`POST /api/whatsapp/send`: the only prior check was `role !== "STUDENT"`.

* role is now an allow-list (deny by default) — partners, students and
  unrecognised roles are refused;
* per-user rate limit (`whatsapp_send`, 30/min) with `Retry-After`;
* delegated to the canonical `sendWhatsAppMessage` (length validation, phone
  normalization, provider status persistence) instead of a hand-rolled Graph call;
* a failed text send is **enqueued in `WhatsAppRetryQueue`** — nothing enqueued
  rows before, so the retry job had no real work to drain;
* audit records `WHATSAPP_SEND` and `WHATSAPP_SEND_FAILED`.

### C4. Follow-up pause rule was an exclusion list (§19)

`status notIn ['cancelled','closed','rejected']` treated any future status
(`withdrawn`, `on_hold`, `draft`) as an active application and silently stopped
follow-up. Replaced with the reviewed allow-list
`hasActiveAloApplication` (deny by default) from the partner entitlement policy.

### C5. New scheduled jobs the platform required (§48)

Seven required jobs had no declaration at all: `failed-message-retry`,
`operational-health-check`, `daily-analytics-summary`, `ai-document-processing`,
`notification-cleanup`, `expired-portal-invitation-cleanup`,
`audit-maintenance`.

## D. Files patched

| File | Change |
|---|---|
| `src/cron/worker.ts` | rewritten: real lock, registry dispatch, structured logs, SIGTERM |
| `src/cron/cron-definitions.ts` | rewritten: 21 declarations, real routes, `enabled`/`blockedReason`, stronger `verifyCronDefinitions` |
| `src/app/api/cron/{sla-monitor,followup,retry,analytics}/route.ts` | bespoke unlocked bodies replaced by delegation to the runner |
| `src/app/api/whatsapp/send/route.ts` | role allow-list, rate limit, canonical sender, retry queue, audit |
| `src/lib/whatsapp-cloud-api.ts` | optional `templateLanguage` (no capability lost) |
| `src/lib/whatsapp-followup-engine.ts` | allow-list application check |
| `src/lib/document-security.ts` | +`resolveAuthorizedDocumentRecipient`, `RecipientDecision` |
| `src/app/api/crm/ucc/conversations/[id]/reply/route.ts` | recipient authorization + incident + audits |
| `prisma/schema.prisma` | +`CronLock` model (additive) |
| `prisma/verification-mirror/schema.sqlite.prisma` | regenerated by the existing mirror workflow (533 models) |
| `tests/unit/cron-quarantine.test.ts` | quarantine assertions replaced by the stronger certification invariant |
| `scripts/verify-15-cron.ts` | stops asserting the stale count; defers to the certified check |
| `CRON_JOBS.md` | rewritten for the current model |
| `docs/CRON_RECONCILIATION.md` | dated superseding section (historical record kept) |

*(Carried over, still uncommitted from the previous pass: the document/profile
authorization work — `src/lib/documents/*`, `src/app/api/documents/manage`,
`src/app/api/student-portal/profile/sections`, the four `visa/documents/[id]/*`
and `counselor/documents` / `crm/documents` routes, `docs/DOCUMENT-MANAGEMENT-IMPLEMENTATION-REPORT.md`.)*

## E. Files created

| File | Purpose |
|---|---|
| `src/lib/cron/cron-lock.ts` | lease primitive, pure + Prisma store + in-memory double |
| `src/lib/cron/job-runner.ts` | run/status/log/timeout/blocked, dependency-injected |
| `src/lib/cron/job-handlers.ts` | 16 real job bodies |
| `src/lib/cron/job-registry.ts` | 21 entries, aliases, dispositions, lazy handlers |
| `src/lib/cron/route-handler.ts` | shared HTTP contract for every `/api/cron/*` |
| `src/lib/cron/parse-cron.ts` | one cron-parser wrapper (v4/v5 compatible) |
| `src/lib/cron/health-snapshot.ts` | single health implementation |
| `src/app/api/cron/[job]/route.ts` | dispatcher serving every declared path |
| `prisma/migrations/20261013000000_cron_lock/migration.sql` | additive migration |
| `scripts/cron-scheduler-policy-check.ts` | 221-assertion certification |

## F. Database changes

One new table, additive only: `CronLock` (`jobKey` unique, `ownerId`,
`lockedAt`, `expiresAt`, `runCount`, `lastRunAt`, `lastStatus`, `lastError`).
The migration contains no `DROP`, `TRUNCATE`, `DELETE` or `ALTER TABLE`; the
policy check asserts this (E1–E8). **Not applied** — no MySQL in this
environment. `prisma validate` passes and the mirror regenerated 533 models.

## G. RBAC changes

* WhatsApp send: allow-list of staff roles (was "anyone but students").
* Document send: destination-number authorization, deny by default.
* Cron endpoints: `requireCron` everywhere the declared paths resolve.

## H. WhatsApp changes

Send-path hardening and the retry-queue feeder (C3); everything else was already
present and untouched.

## I. AI changes

No new AI claims and no fabricated output. `ai-document-processing` queues
extraction work as idempotent `AiTask` rows (`ALO-DOCAI-<documentId>`) and marks
`requiresHumanVerification: true`; extracted values are never written by the job.
AI credentials (OpenRouter/Gemini) remain unconfigured — see T.

## J. Student automation

Student creation, `AE-YYYYNNNN` allocation, portal invitation and progressive
profile collection already existed (webhook + `identity/student-id.ts` +
`StudentPortalInvitation`). The only change is the follow-up pause rule (C4).

## K. SLA + alarm system

Existing SLA engine, escalation levels, alarms and acknowledge/resolve were
correct but **could not run**, because the job that drives them had no route and
no working lock. `sla-monitoring` now runs every minute under a lease with a
durable run log; `daily-analytics-summary` records the escalation and SLA counts.

## L. Document security

New recipient authorization on the real send path (C2), enforced before any write
or provider call, with a security incident (which itself notifies managers and
raises a dashboard alarm) and a `DOCUMENT_SEND_BLOCKED` audit entry.

## M. Follow-up automation

Day 3/7/14/21/25/30, STOP/START, opt-out, template approval and retry logic were
already implemented; the job that sends them now actually runs (`whatsapp-followups`,
every 5 minutes, leased) and the pause rule is deny-by-default (C4).

## N. Cron jobs

21 declarations / 29 resolvable paths; see `CRON_JOBS.md` for the catalogue,
concurrency model and deployment steps. Declared jobs that cannot run here return
`blocked` with the exact reason — never a fake success.

## O. API endpoints

New: `GET|POST|OPTIONS /api/cron/<job>` (29 path segments). Unchanged but now
functional: every path declared in `vercel.json`. Hardened:
`POST /api/whatsapp/send`, `POST /api/crm/ucc/conversations/[id]/reply`.

## P. Dashboard changes

None in this pass. The scheduler now feeds the dashboards that already exist
(alarms, notifications, analytics). No dashboard was rebuilt or duplicated.

## Q. Security hardening

Cron authorization fail-closed; lease-protected jobs; rate limit on WhatsApp send;
document-recipient enforcement; structured logs that never include bodies, tokens,
storage paths or PII; `sandbox`-safe error messages on the send path (no stack traces).

## R. Verification commands

```bash
npx tsx scripts/cron-scheduler-policy-check.ts        # 221 assertions
npx tsx scripts/document-access-policy-check.ts       # 86 assertions
npx tsx scripts/b2b-access-policy-check.ts            # 94 assertions
npx tsx scripts/communications-policy-check.ts        # 119 assertions
npx vitest run tests/unit/cron-quarantine.test.ts     # 6 tests
npx eslint <changed files>                            # 0 problems
npx tsc -p tsconfig.cron-*.json                       # scoped, exit 0 (temp configs removed)
DATABASE_URL=… npx prisma validate                    # "The schema … is valid 🚀"
node scripts/verify-prisma-client.mjs                 # 533 models
```

## S. Test results (executed)

| Suite | Result |
|---|---|
| `cron-scheduler-policy-check.ts` | **221 assertions, 221 passed, 0 failed**, exit 0 |
| `document-access-policy-check.ts` | **86 passed, 0 failed** (70 → 86 with the §34 group) |
| `b2b-access-policy-check.ts` | **94 passed, 0 failed** |
| `communications-policy-check.ts` | **119 passed, 0 failed** |
| `vitest tests/unit/cron-quarantine.test.ts` | **6 passed** (1 file) |
| eslint (all changed TS, `src/lib/cron`, `src/cron`, `src/app/api/cron`) | **0 errors, 0 warnings** |
| scoped `tsc` (pure core / handlers / routes / reply route) | **exit 0** each |
| `prisma validate` + mirror | valid; **533 models** |

Total DB-free assertions executed: **520 passed, 0 failed**.

Two defects were found by these checks and fixed rather than being written around:
`PortalStudentDocument.uploadedAt` is a **string**, not a datetime (the age filter
now parses it and counts unreadable values separately), and the reply route's
nullable `UccAttachment.studentId`.

## T. External credential blockers

| Blocker | Effect | Still implemented |
|---|---|---|
| No MySQL server in this environment | DB-backed paths unverified here; migration not applied | code, SQL, schema, validation, type-check |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | no live sends | sender, validation, status persistence, retry queue |
| `WHATSAPP_APP_SECRET` / `WHATSAPP_VERIFY_TOKEN` | webhook rejects unsigned events in production (correct) | verification, idempotency |
| OpenRouter / Gemini keys | no AI generation | prompt/agent pipeline, queue, safety rules |
| SMTP credentials | `SMTP_NOT_CONFIGURED` returned, never a fake success | templates, queue |
| `mysqldump` + backup target | `database-backup` returns `blocked` | declaration, reason, run instructions |
| Ranking provider credentials | `ranking-update` returns `blocked` | declaration, reason |
| Meta template approval | templates cannot be sent until approved in the WABA | template registry, approval status field |
| Operator crontab/hPanel | no schedule installed from here | routes, worker, documented curl form |

## U. Production readiness status

**Explicit:** the work is **local (uncommitted)** — not committed, not pushed, not
deployed. No production configuration, DNS, credentials, branch protection or
deployment settings were touched. No migration was applied. No schedule was
installed.

* Code-level: verified (520 assertions, lint, scoped type-check, schema validation).
* Isolated integration: not performed — no MySQL, no provider credentials, no
  authenticated session available in this environment.
* Staging/production: not exercised. Nothing here should be described as
  production-verified.

## V. Remaining risks

1. `CronLock` must exist before the scheduler is enabled, or every job correctly
   returns `blocked` ("lock store unavailable") and nothing runs.
2. Cross-process exclusion is proven at statement level and with a deterministic
   double — two real processes against real MySQL are not exercised here.
3. ~~`cron/CPANEL_CRON_COMMANDS.txt` still lists `cron/*.php` wrappers that do not
   exist~~ — **resolved 2026-10-13**: every cPanel artifact was removed at the
   owner's direction (see `HOSTINGER-DEPLOYMENT-GUIDE.md` § Filename history).
   The remaining risk is only that no schedule has been installed yet, and that
   hPanel cron is documented in UTC while the declarations are Asia/Dhaka.
4. Job bodies that mutate data (invitation audit flagging, analytics upsert,
   document expiry notifications, session cleanup) are unverified against real
   rows; the first production run of each must be observed in `CronJobLog`.
5. `notification-cleanup` deletes only when `ALO_NOTIFICATION_RETENTION_DAYS >= 7`
   is set — leaving it unset is the safe default and must be a deliberate decision.
6. The document-recipient resolver trusts `WhatsAppContact.studentId` links; a
   wrongly linked contact would authorize a wrong send. Link integrity is the
   existing contact-identity flow's responsibility.
7. `PortalStudentDocument` still has no version/archive columns and
   `StudentWorkExpRecord` has no `responsibilities` column (documented in the
   document-management report); a schema change there is a separate decision.
8. The stale verification surface near the scheduler remains: `vercel.json` (16
   entries, one of which is a real static route) and the historical reconciliation
   documents are kept as evidence.
