# ALO Education — Audit, Repair & Quality Report

**Date:** 2026-09-16
**Repo:** `engralaminn-collab/alo_education_z....ai` (Next.js App Router `alo-education-erp`, Prisma 6.19.3, MySQL)
**Branch:** `arena/01a0aa5e-alo-education-z-ai` (from `main` @ `f97a5ec`)
**Scope note:** the path `/root/alo-github-main` given in the task does not exist in this
environment; all work was done in the checked-out repository. Production target mapping
(`aloeducation.com` → PM2 `alo-education` port **3044**; `learn.aloeducation.com` port **3017**
stays isolated) was verified in the restored deploy workflow.

---

## 1. Executive summary

| Item | Status | Evidence |
|---|---|---|
| Prisma P1012 (`EmployeeDocument.versions`) | **FIXED** | WASM `validate`: "schema ... is valid" |
| Schema/DB drift identified & documented | **DONE** | `docs/db/2026-09-16-employee-document-version/` (precheck + idempotent migration + rollback, PROPOSED-only) |
| TypeScript errors | **79 → 0** | `npx tsc --noEmit` → `TSC_EXIT=0` (log `/tmp/tsc-round3.log`) |
| Runtime-silent failures repaired | **~40 sites** | Audit-log/TimelineEvent/FileEvent writes that Prisma rejected at runtime (masked by `.catch`) |
| University/course APIs | **REPAIRED** | Honest errors, `status` publish filter, finder params wired |
| Floating widget duplication + fake AI chat | **REPAIRED** | Single global widget; fabricated OTP/profile flow removed |
| Dead "Chat with AI Agent" header button | **FIXED** | `alo:open-ai-chat` listener + `#alo-ai-chat-trigger` now exist |
| Tests | **178 passed, 7 skipped, 1 file blocked (environmental, pre-existing)** | `npx vitest run` (log `/tmp/vitest-round2.log`) |
| Production build | **PASS (exit 0)** | 973/973 static pages, standalone `server.js` verified (log `/tmp/build-round2.log`) |
| Deploy workflow | **RESTORED + valid** | `.github/workflows/deploy-production.yml` (618 lines, js-yaml parse OK) |
| Production deploy & live verification | **BLOCKED** | No DB URL, SSH keys, or GitHub secrets available in this environment — see §8 |

No secrets were committed. No DB migration was executed anywhere. No data was invented.

---

## 2. Root causes found

1. **P1012 validation failure** — `EmployeeDocument.versions EmployeeDocumentVersion[]` existed
   with **no opposite relation field** on `EmployeeDocumentVersion`. Root cause: the table was
   implemented twice with incompatible shapes (see §6) and a merge left the relation one-sided.
2. **Massive Prisma-drift type errors (79)** — code written against model shapes that don't
   exist in `prisma/schema.prisma`: `CrmAuditLog.entityType/entityId/actorId/details`,
   `AloAuditLog.actorId/targetId`, `TimelineEvent` missing required `stage`, `db.socialMessageLog`,
   `db.university`, `OtpCode.identifier`, `CoursePage.status`, `mode:'insensitive'` on MySQL, etc.
   **Critically, ~40 of these were also runtime failures** hidden by `as any` + `.catch(()=>{})`:
   vault secret storage, signals/GTM pipeline, double-entry ledger, Twenty CRM sync, Ghost
   publishing, broadcast approvals, dashboard alarms, timeline events — all silently dead.
3. **Empty universities/courses on the public site** — (a) seeders write `status:'active'` but
   `/api/universities` and `/api/courses` did **no** status filtering while claiming "returns only
   ACTIVE/APPROVED/VERIFIED"; (b) both swallowed DB failures into `[]` (indistinguishable from
   "no data"); (c) the Course Finder page sent `level`/`subject` while `/api/course-finder` reads
   `studyLevel`/`subjectArea` — those filters were dead controls; (d) `/api/courses` never
   included the `university` relation so `universityName` was always `''`; (e) production seeds
   were apparently never run (deployment was broken — workflow file was missing).
4. **Navigation/floating-bubble bug** — TWO independent floating stacks rendered simultaneously
   at bottom-right z-50 (`PublicCommunicationBar` globally from `layout.tsx` +
   `FloatingActionWidget` from `PublicPages`' footer), overlapping each other on every public page.
5. **Dead AI-chat button** — header dispatched `alo:open-ai-chat` and fell back to
   `#alo-ai-chat-trigger`; **neither a listener nor that element existed anywhere**.
6. **Fabricated data in the widget chat** — fake OTP "verification", a hardcoded fake student
   profile ("AE-2026000412, Manchester MSc Data Science, CAS Issued, VFS 12 Aug"), auto-"created"
   lead IDs, and canned visa steps with bank figures. Violates the no-invented-data rule and is a
   trust/compliance risk.
7. **Fabricated university fallback (dead code)** — `PublicUniversityDetail` fell back to
   `allStatic[0]` (an arbitrary unrelated university) when a slug didn't match, and on API error.
   It had **zero importers** (the real page is `universities/[slug]` → `UniversityHub`, which has
   honest states) — removed.
8. **Build-blocking bug** — `src/app/offline/page.tsx` was a Server Component passing `onClick`
   (prerender error: "Event handlers cannot be passed to Client Component props"), failing
   `next build` at export.
9. **Missing deploy workflow** — `.github/workflows/deploy-production.yml` had been reduced to a
   stub; the complete version survived in `docs/DEPLOY_PRODUCTION_WORKFLOW_READY.yml` and was
   restored (secrets-presence checks, validate-and-build gate, SSH deploy protecting 3017/learn,
   backups, no `git clean -fdx`, `skip_migrations` default true, PM2 `alo-education` on 3044).

---

## 3. Changes by category

### 3.1 Prisma schema (smallest correct fix; nothing removed)
`prisma/schema.prisma` — `EmployeeDocumentVersion`:
- `documentId String` → `documentId String @default("")` (legacy alias; documented),
- added `employeeDocumentId String?` + `document EmployeeDocument? @relation(fields:[employeeDocumentId], references:[id])` (canonical FK; nullable for agreement-only rows),
- kept `agreementId` relation (agreement history), kept all indexes.
Validated offline with the Prisma WASM validator (authoritative in this sandbox).

### 3.2 API/runtime repairs (type + runtime correctness)
- **Batch A** — null-inference: explicit `: any` annotations (unified-communication,
  marketing/lead-pipeline `Record<string, any[]>`, admin/import/duplicates, marketing/auto-pipeline).
- **Batch B** — 9 `TimelineEvent.create` sites missing required `stage` (+`studentId:""` where
  only lead context): counselor/students/[id], interview, leads, student/cv, student/referrals,
  student/sop, whatsapp/document-upload, crm-automation, referral-engine, plus lead-enrichment
  and twenty-custom-objects found during Batch D. **These were silently failing at runtime.**
- **Batch C** — `string|null` into non-nullable defaulted fields (10 files): AuditLog
  `userId/ipAddress || ""`, Service/Scholarship payloads `|| undefined`, `system`→`""`.
- **Batch D** — audit-log field drift (12 files): uniform mapping `entityType→targetCollection`,
  `entityId→targetId`, `actorId→actorUserId`, `details→afterData` on **both write and read paths**
  (cap-recording, chatwoot-inbox, doodle-note-engine, double-entry-ledger, ghost-publishing,
  lead-enrichment-pipeline, market-intel-radar, structured-extractor, twenty-custom-objects,
  vaultwarden-client); `AloAuditLog` fixed in broadcast-engine (`actorName/resource/resourceId/details`)
  and dashboard-alarm-service (`targetId→resourceId` + `resource:'DashboardAlarm'`);
  `db.university`→`db.crmUniversity` (market-intel-radar). Also removed an impossible
  `fileEvent.create` in double-entry-ledger (its `fileId` FK targets `FileMetadata.id`, a journal
  id can never satisfy it — the CrmAuditLog row is the real trail).
- **Batch E** — 23 one-off sites: Lead `name→fullName` (+response alias kept), Lead
  `assignedCounselorId→counselorId`, ApplicationStatusLog real fields, EmployeePayroll/Item and
  EmployeeReassignment required fields, CounselorTask `employeeId`, CourseShortlist
  `courseId`+`courseSlug` both uniques, VisaCase `destinationCountry/nextAction`, FAQ accumulator
  typing, UccConversation `assignedToUserId`, CommunicationMessage `fileUrl`, UccMessage
  `senderName/senderRole`, PortalTimelineEvent `studentProfileId`, OfficialSource required
  `entityType/sourceName`, `db.socialMessageLog`→`db.socialInboxMessage`, FileMetadata
  `storedName/checksumSha256/storagePath`, CrmSourceVerificationEvent `verificationStatus`,
  CrmSourceLog real fields, `findUnique→findFirst` (non-unique `sourceUrl`), CoursePage
  `approvalStatus`, DeploymentSequence lock no-op, OtpCode `phone/email`,
  removed `mode:'insensitive'` (MySQL — **this was a live runtime bug**).
- **Honest-error sweep on touched routes** — removed `.catch(()=>[])`/`success:true`-on-failure
  from source-intelligence, university-monitoring, note-versions (now real 500s with logged cause).

### 3.3 University/course data layer (public site)
- `src/app/api/universities/route.ts` — added `status` param (**default `active`**, `?status=all`
  for internal), removed `.catch(()=>[])` (500s surface), whitelist mapping kept (never exposes
  internal notes/source artifacts).
- `src/app/api/courses/route.ts` — same publish filter + honest errors; added
  `include: { university: select {name, slug} }` so `universityName`/`universitySlug` are real;
  removed the "broaden for demo" comment/behavior.
- `PublicCourseFinderPage` — sends `studyLevel`/`subjectArea` (filters now work), abortable
  fetch, distinct **error state with retry** vs empty state, tuition rendered with the row's real
  currency (`tuitionCurrency`, GBP default) and `durationMonths`.
- `PublicUniversitiesPage` — error state with retry, honest empty states ("no universities
  published yet" vs "no match for search"), badge changed from unverifiable "150+ PARTNER
  UNIVERSITIES" to "UNIVERSITY DIRECTORY".
- **Removed** dead `PublicUniversityDetail` (562 lines, zero importers, fabricated fallback).
- Data stance: no universities/courses/fees were invented. Seeders (`scripts/seed-*.ts`,
  `prisma/seed-universities.ts`) already write `status:'active'`, so seeded rows publish; rows
  left at `needs_official_source` correctly stay hidden until verified. **Production emptiness =
  seeds never run + broken deploy + error masking — all three addressed.**

### 3.4 Navigation / floating widget / chat
- `FloatingActionWidget.tsx` rewritten: collapsed by default; listens for `alo:open-ai-chat`;
  AI button carries `id="alo-ai-chat-trigger"` (header button now works via both paths);
  hidden when `usePortalStore(s=>s.isAuthenticated)` (portal shells keep their own nav);
  full a11y (`aria-expanded`, `aria-label`s, `role="dialog"`, `aria-modal`, Escape, backdrop
  click, focus-on-open, `aria-live` message feed); links consistent with
  `WebsiteActionButtons` (wa.me/8801805020100, m.me/aloeducation, real office address/map).
- **Honest assistant flow**: no fake OTP, no fabricated profiles/IDs, no invented visa steps.
  Keyword-routed to: Course Finder (`/course-finder`), Student Portal sign-in (`/portal/login`)
  for real status, WhatsApp counselor for everything else; explicit "I will not guess" fallback.
- `src/app/layout.tsx` — mounts the widget **once** globally (replaces `PublicCommunicationBar`
  mount; that file is kept, now unmounted, with its fake chat out of the render tree).
- `PublicPages.tsx` — removed the duplicate footer mount + import.

### 3.5 Build fix
- `src/app/offline/page.tsx` — extracted `RetryConnectionButton.tsx` ('use client') so the page
  keeps `metadata` export and prerenders cleanly. Scanned all app-router pages/layouts for the
  same pattern — none found.

### 3.6 CI/CD
- `.github/workflows/deploy-production.yml` restored from the vetted docs copy and YAML-validated.
  It will not trigger from this arena branch; it runs on the real repo's pushes to `main`
  (validate-and-build: secrets check → npm ci → prisma validate/generate → lint/typecheck/tests →
  build; deploy: SSH via `DEPLOY_HOST/USER/SSH_KEY/PORT` secrets, protects 3017 + learn subdomain,
  backs up before release, `skip_migrations: true` by default, PM2 `alo-education` on 3044).

### 3.7 Database migration safety kit (PROPOSED-only, nothing executed)
`docs/db/2026-09-16-employee-document-version/`:
- `00-precheck.sql` — read-only shape detection (A vs B vs union), row counts, dangling-reference
  report.
- `01-migration.sql` — idempotent guarded reconciliation (adds missing columns/indexes, only ever
  RELAXES NOT NULL, backfills `employeeDocumentId` only where `documentId` truly matches an
  `EmployeeDocument`, copies `versionNumber→version` if present; deletes nothing; optional FK
  block gated on zero dangling rows; built-in post-run verification).
- `02-rollback.sql` — shape-specific best-effort reverse; primary rollback = restore verified backup.
- `README.md` — 8-step mandatory gate (identify prod DB → verified restorable backup → precheck →
  review/approve → maintenance window → execute+verify → app smoke → retain backup ≥14 days).

---

## 4. Exact verification results (this environment)

| Check | Command | Result |
|---|---|---|
| Schema validity | WASM validator (`/tmp/wasm-validate.cjs`) | `VALIDATE OK: ... schema is valid` |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit` | **0 errors, exit 0** (`/tmp/tsc-round3.log`; baseline was 79 errors, `/tmp/typecheck-final.log`) |
| Tests | `npx vitest run` | **178 passed, 7 skipped** in 17 files; **1 file failed: `tests/integration/consultation-workflow.test.ts`** — pre-existing environmental block: it calls the real DB in `beforeAll` and this sandbox has no `DATABASE_URL` and only stub Prisma engines ("invalid ELF header"). Matches the repo's documented baseline (178 pass / 1 blocked). Not weakened, not skipped-by-edit. (`/tmp/vitest-round2.log`) |
| Lint (touched areas) | `npx eslint <changed dirs/files>` | exit 0 (`/tmp/eslint-touched.log`) |
| Build | `npm run build` (fake-engine env for offline `prisma generate`) | **exit 0**; "Compiled successfully in 95s"; **973/973 static pages**; `prepare-standalone` verified `.next/standalone/server.js` (`/tmp/build-round2.log`) |
| Build warnings | same log | 1 pre-existing warning: `@/lib/rag/rag-engine` unresolved — imported dynamically with `.catch(()=>null)` in `agent-orchestrator.ts` (untouched file); RAG feature degrades gracefully; `src/lib/rag/` does not exist in the repo. 42 `prisma:error` lines are sandbox-only (stub engine, no DB) during sitemap prerender; sitemap catches by design — in CI these run with real engines. |
| Workflow YAML | js-yaml parse | OK (618 lines, restored) |
| Secrets scan | `git diff` grep for credentials/keys/URLs | Clean — only the workflow's documented dummy build-check URL (`mysql://user:pass@localhost/dummy_build_check`) and `${{ secrets.* }}` references |

## 5. Commit / push / deploy evidence

- **Commit:** `55a3f6858bf58e9f8b8869d8c5c4b345ac34fc67` on branch
  `arena/01a0aa5e-alo-education-z-ai` — 75 files changed, +2079 / −922.
- **Push: BLOCKED (environment)** — `git push origin arena/01a0aa5e-alo-education-z-ai` fails
  with `could not read Username for 'https://github.com'`, and `gh auth status` reports
  "The github.com token in GH_TOKEN is no longer valid." The GitHub connection for this session
  needs to be reconnected in Arena; the commit is safely stored locally and in the workspace
  snapshots. No credentials were requested or stored in chat, per policy.
- **Production deployment was NOT performed and could not be verified from this environment**
  (no DB URL, SSH keys, or Actions secrets — see §8).

## 6. Schema question — answered

> Which scalar field is intended to reference `EmployeeDocument.id`, and which is used for agreement history?

- **`employeeDocumentId`** is the canonical scalar referencing **`EmployeeDocument.id`**
  (Prisma relation `document EmployeeDocument? @relation(fields: [employeeDocumentId], references: [id])`).
  It is nullable because agreement-only version rows legitimately have no employee document.
  Migration `20260913050000_benchmark_capabilities` created this column (as NOT NULL — the
  reconciliation kit relaxes it).
- **`agreementId`** (relation to `EmployeeAgreement`) is the field used for **agreement history**.
- **`documentId`** is a **legacy alias**, NOT a reliable FK: HRM/employee-access routes store
  `EmployeeDocument.id` there, while `api/hrm/agreements` stores `EmployeeAgreement.id` there.
  It is kept (`@default("")`) because both writers exist in production code; new code should
  write `employeeDocumentId` / `agreementId`.

The two known DB shapes (precheck distinguishes them):
**A** `.repair-backup-20260819`/deploy-build: `documentId NOT NULL`, `versionNumber`, no
`employeeDocumentId`. **B** migration 20260913050000: `employeeDocumentId NOT NULL`, `version`,
no `documentId`. The Prisma schema now targets the union; `01-migration.sql` converges either
shape to it without deleting data.

## 7. Backup / rollback status

- **No database was touched anywhere** — there is no DATABASE_URL in this environment. Therefore
  no backup was needed for this session's changes; the schema fix is code-only until someone runs
  the reconciliation kit.
- The kit in `docs/db/2026-09-16-employee-document-version/` hard-gates any future execution on:
  verified restorable backup (test-restored, row counts recorded), precheck output review, owner
  approval, maintenance window, post-run verification, app smoke test, 14-day backup retention.
- **Standing risk flagged:** `deploy/ubuntu/deploy.sh` uses `prisma db push --accept-data-loss`.
  Until it is switched to `prisma migrate deploy`, any schema edit deployed through it is a
  potential silent data-loss event. The restored GitHub workflow defaults `skip_migrations: true`
  and does not run `db push`, which is the safer path.

## 8. Remaining blockers (production path)

1. **No production access from this environment** — no `DATABASE_URL`, no SSH keys, no GitHub
   Actions secrets (`DEPLOY_HOST/USER/SSH_KEY/PORT`). Deployment must be done by the owner:
   merge to the real repo's `main` → the restored workflow validates, builds, and deploys to
   `alo-education` PM2 on **3044** (learn/3017 untouched), or run `deploy/ubuntu` toolkit manually.
2. **Seeds must be run on production** (after backup) or university/course pages will legitimately
   show "no data published yet" states — that is now honest, not broken. Needed data inputs:
   official university/course/fee records with source URLs (models default to
   `needs_official_source` until verified).
3. **EmployeeDocumentVersion reconciliation** — run the docs/db kit after precheck reveals the
   live shape (see §7 gate).
4. **Pre-existing tech debt** (not introduced here, not fixed silently): missing `src/lib/rag/rag-engine`
   module (RAG feature disabled at runtime by design-guard); `tests/integration/consultation-workflow.test.ts`
   requires a live DB; `PublicCommunicationBar.tsx` kept but unmounted (fake chat preserved in
   file history only) — delete after owner confirms; `.repair-backup-20260819/` and `deploy-build/`
   directories should eventually move out of the repo root.
5. **HTTP 200 / PM2 online is not proof** — post-deploy verification checklist: prisma validate in
   CI green; `/api/universities?status=active` returns rows with real fields; `/course-finder`
   filters respond to Study Level; header "Chat with AI Agent" opens the assistant; exactly ONE
   floating stack bottom-right; `/api/employee/documents` POST writes a version row without P20xx
   in PM2 logs; learn.aloeducation.com:3017 still serving the isolated app.

## 9. Change inventory

Commit `55a3f68`: **75 files changed, +2087 / −922** — 68 modified source/config files plus new:
`src/app/offline/RetryConnectionButton.tsx`, `docs/db/2026-09-16-employee-document-version/`
(00-precheck.sql, 01-migration.sql, 02-rollback.sql, README.md), and this report.
