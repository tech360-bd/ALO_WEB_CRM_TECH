# VERIFICATION REPORT — corrective development, 2026-11-02

Status legend: **VERIFIED / FIXED / PASSED / FAILED / BLOCKED / NOT TESTED / PENDING APPROVAL**

Read this with `docs/audit-2026-11-02/proposals/README.md` (the Section A package) and
`proposals/08-SECTIONA-SECURITY-REVIEW.md` (the security review that blocks it).

---

## 1. Repository identity, branch, HEAD

| Item | Value | Status |
|---|---|---|
| Repository | `tech360-bd/ALO_WEB_CRM_TECH` (`origin` = https://github.com/tech360-bd/ALO_WEB_CRM_TECH.git) | **VERIFIED** |
| Working branch | `arena/ececf40c-alo-web-crm-tech` | **VERIFIED** |
| HEAD at start of this turn | `1e30e812` (= `main`, 0 ahead / 0 behind) | **VERIFIED** |
| Remote branch head at start | `7e4c3922` (`fix(catalogue): approved records now pass the public gate`) | **VERIFIED** |
| HEAD now | `ab162322` (report commit); code+test head `c9edee3f` | **VERIFIED** |
| PR | **#49** — https://github.com/tech360-bd/ALO_WEB_CRM_TECH/pull/49 (OPEN, `MERGEABLE`, not merged) | **VERIFIED** |
| Node / npm | v22.22.3 / 10.9.8; `npm ci --no-audit` → 1,282 packages | **PASSED** |

### 1a. State reconciliation (finding, resolved)

The earlier session summary claimed HEAD `7e4c3922` with a clean tree. Reality was
different, and this is recorded rather than smoothed over:

* local HEAD was `1e30e812`, **zero commits ahead** of main;
* the remote branch already had `7e4c3922`, which local git had never fetched;
* the working tree carried **uncommitted copies** of that remote commit's changes
  (`package.json`, `src/lib/verified-catalogue/publish.ts`, plus untracked
  `scripts/diagnose-public-catalogue.ts`, `tests/unit/public-catalogue-publish.test.ts`,
  `docs/PUBLIC-CATALOGUE-VISIBILITY.md`).

**Action taken:** the five files were copied aside, removed so the fast-forward could not
overwrite them, `git merge --ff-only 7e4c3922` was run, and every file was then compared
byte-for-byte against the copies — all identical. **No work was lost, none was duplicated.**
The earlier artefacts that were reported as "generated this turn" do exist, and their
hashes were re-verified (§2).

## 2. Existing features preserved

| Preserved | How verified | Status |
|---|---|---|
| All merged PRs #36–#48 and their code | `git log`, `gh pr list --state all` | **VERIFIED** |
| `7e4c3922` catalogue publication fix + diagnostic script + 120-line test | fast-forward, byte-identical | **VERIFIED** |
| WhatsApp webhook, routing, number pool, UCC intake | not modified except the two named defects | **VERIFIED** |
| Course Finder, public catalogue gate (`public-catalog.ts`, `public-content-page-policy.ts`) | untouched; `git diff` shows no change | **VERIFIED** |
| Verified-catalogue pipeline (`src/lib/verified-catalogue/*`) | unchanged this turn | **VERIFIED** |
| University catalogue + Jan 2027–Jan 2028 monthly coverage | no schema or data change; `prisma/schema.prisma` unmodified | **VERIFIED** |
| HRMS/RBAC, partner/B2B portal, AI orchestration, marketing automation, Super Admin panels | no files touched | **VERIFIED** |
| GitHub Actions workflows, Hostinger deploy config | `git diff` empty for `.github/`, `Dockerfile`, deploy scripts | **VERIFIED** |
| Audit package from the previous turn | 30 files, all sha256 hashes match `proposals/MANIFEST.md` | **VERIFIED** |

No duplicate route, table, component, permission or business logic was created. The only
new files are three test files and two documentation trees.

## 3. Every patch reviewed and its disposition

All 15 were re-validated against the real tree at `7e4c3922`: `git apply --check` **15/15
OK**. Each `src/` patch touches exactly one file.

| Patch | File | Disposition | Evidence |
|---|---|---|---|
| `2001-offline-copy` | `src/app/offline/page.tsx` | **APPLIED** | one string; `offline-page-copy.test.ts` 2/2 |
| `3001-whatsapp-authz-before-validation` | `src/app/api/whatsapp/numbers/route.ts` | **APPLIED** | 6/6 new authz tests |
| `3002-whatsapp-display-phone-slice` | `src/lib/whatsapp-number-pool.ts` | **APPLIED** | 8/8 new normalisation tests; 3 of them fail on the old code |
| `4101` brand-chrome footer owners | `tests/unit/brand-chrome-partner-footer.test.ts` | **APPLIED** | 17/17 |
| `4102` identity owner | `tests/unit/employee-access-acceptance.test.ts` | **APPLIED** | 21/21 |
| `4103` UCC token drift | `tests/unit/ucc-acceptance-steps.test.ts` | **APPLIED** | 27/27 |
| `4104` study-step title + config | `tests/unit/alo-study-steps.test.ts` | **APPLIED** | 3/3 |
| `4105` brand config fixture | `tests/unit/public-brand-guideline.test.ts` | **APPLIED** | 6/6 |
| `4106` sender-pool fixture | `tests/unit/whatsapp-employee-communication.test.ts` | **APPLIED** | 19/19 |
| `4107` numbers route fixture | `tests/unit/whatsapp-numbers-route.test.ts` | **APPLIED** | 5/5 |
| `4108` routing mock surface | `tests/unit/whatsapp-routing-route.test.ts` | **APPLIED** | 5/5 |
| `4109` webhook handler fixture | `tests/unit/whatsapp-webhook-handler.test.ts` | **APPLIED** | 8/8 |
| `4110` language-prep service double | `tests/unit/language-prep-requirements.test.ts` | **APPLIED** | 4/4 |
| `9002` schema (Section A) | `prisma/schema.prisma` | **NOT APPLIED — PENDING APPROVAL** | apply-check OK; not generated |
| `9003` / `9003b` page (Section A) | `src/app/course/[slug]/page.tsx` | **NOT APPLIED — PENDING APPROVAL** | apply-check OK |

Verified after committing: `grep -c limitedPublication prisma/schema.prisma` → **0**;
`grep -c LimitedCourseDetail 'src/app/course/[slug]/page.tsx'` → **0**.

## 4. Files modified, added, removed

**Modified (13)** — all in the `5ce71440` commit:
`src/app/api/whatsapp/numbers/route.ts`, `src/app/offline/page.tsx`,
`src/lib/whatsapp-number-pool.ts`, and ten test files under `tests/unit/`
(`alo-study-steps`, `brand-chrome-partner-footer`, `employee-access-acceptance`,
`language-prep-requirements`, `public-brand-guideline`, `ucc-acceptance-steps`,
`whatsapp-employee-communication`, `whatsapp-numbers-route`, `whatsapp-routing-route`,
`whatsapp-webhook-handler`).

**Added:** `tests/unit/whatsapp-numbers-authorization-order.test.ts` (144 lines),
`tests/unit/whatsapp-phone-normalization.test.ts` (77), `tests/unit/offline-page-copy.test.ts`
(23), `docs/audit-2026-11-02/**` (97 files), `docs/baseline/PHASE-0-BASELINE-2026-11-02.md`.
Regenerated: `docs/environment-classification.json` (CI requirement, §8).

**Removed:** none.

**Total source diff:** `16 files changed, 402 insertions(+), 23 deletions(-)`.

## 5. Phone-number defect verification

**FIXED.** Confirmed against the real file, not the report:

```ts
// before
return normalized ? `0${normalized.slice(2)}` : '';   // 01805020100 → 001805020100
// after
return normalized ? `0${normalized.slice(3)}` : '';   // 01805020100 → 01805020100
```

`normalizeBdPhone` returns E.164 **without** `+` (`880` + 10 digits), so `slice(3)` is the
correct offset.

| Requirement | Result | Status |
|---|---|---|
| E.164 + display formatting | 11 cases pass | **PASSED** |
| Idempotency both directions | `toBdDisplayPhone(toBdDisplayPhone(x)) === x` | **PASSED** |
| Operator range 013–019 round trip | 7 prefixes pass | **PASSED** |
| Invalid rejection | short, long, `012…`, non-numeric, `+44…`, over-long | **PASSED** |
| Never a doubled prefix | `startsWith('00') === false` | **PASSED** |
| No hardcoded numbers in `src/lib` | `grep` → only env reads; fixtures live in `tests/` | **VERIFIED** |
| Regression test proves the defect | stash the fix → **3 of 8 tests fail** | **VERIFIED** |
| SMS/WhatsApp routing, official-sender validation, seeding | exercised by `whatsapp-employee-communication` 19/19 and `whatsapp-webhook-handler` 8/8 | **PASSED** |

Test fixture numbers (`01805020100`–`01805020119`) are synthetic, declared per-file in
`vi.hoisted`, and are not customer numbers.

## 6. Prisma generation result

| Environment | `prisma validate` | `prisma generate` | Status |
|---|---|---|---|
| This sandbox | BLOCKED — `binaries.prisma.sh` TLS failure | BLOCKED — same | **BLOCKED** |
| GitHub Actions (CI) | **PASSED** | **PASSED** | **VERIFIED** |

Local: `npm ci` installs `@prisma/client` but `node_modules/.prisma/client` contains only the
placeholder stub; no engine binary can be downloaded because the only reachable hosts are
`github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`,
`files.pythonhosted.org`. `npm run build`, `npm run typecheck` and `npx prisma validate` all
stop there. No credential or migration was used to work around it — that would have been the
wrong fix, and CI proves the artifact is not the code.

## 7. Test counts

Local sandbox, identical command (`npx vitest run --reporter=json`), same tree otherwise:

| | Before patches | After 13 patches + 3 new tests |
|---|---|---|
| Test files | 340 | **343** |
| Tests | 3,605 | **3,621** |
| Passed | 3,522 | **3,559** |
| Failed | 45 | **24** |
| Skipped | 38 | 38 |
| Files that fail to load | 13 | 13 |
| Newly failing | — | **0** |

All 24 remaining failures and all 13 unloadable files are Prisma-runtime absence
(`@prisma/client did not initialize yet`, `Prisma.sql is not a function`,
`Cannot read properties of undefined (reading 'datamodel')`, etc.) — 10 + 6 + 4 + 2 + 1 + 1
failures across accounting-ledger, journal-integrity, cms-revisions, business-hours,
critical-safety-remediation and ai-security-remediation.

**In CI, `npm test` passed with the full suite** (§8), which is the strongest available
statement that the 24 are environmental.

## 8. Passed / failed / skipped / blocked checks

| Check | Command | Result | Status |
|---|---|---|---|
| Install | `npm ci --no-audit` | 1,282 packages, exit 0 | **PASSED** |
| Lint (local) | `npm run lint` | 0 errors, 1 pre-existing warning (`student-help.tsx:25`) | **PASSED** |
| Lint (CI) | job step "Lint" | pass | **PASSED** |
| Secret scan / dependency audit / deployment-ownership tests (CI) | job steps | pass | **PASSED** |
| Env classification (CI) | `npm run audit:env -- --check` | initially **FAILED**, fixed, now pass | **FIXED** |
| `prisma validate` (CI) | job step | pass | **PASSED** |
| `prisma generate` + client verify (CI) | job steps | pass | **PASSED** |
| Typecheck (CI) | `tsc --noEmit` | pass | **PASSED** |
| Typecheck (local) | `npx tsc --noEmit` | **FAILED — OOM**, 3 GB sandbox, ~1.9 GB heap ceiling | **BLOCKED** |
| Tests (CI) | `npm test` | pass | **PASSED** |
| Production build (CI) | `next build --webpack` | pass | **PASSED** |
| Production build (local) | `npm run build` | stops at `prisma generate` | **BLOCKED** |
| Drift gate (CI) | migrations vs `schema.prisma` | **FAILED** — and it fails identically on `main` | **FAILED (pre-existing)** |
| Integration tests (CI) | `npm run test:integration` | skipped — no `TEST_DATABASE_URL`; the step after drift never runs | **NOT TESTED** |
| CodeQL (3 languages) | CodeQL workflow | pass | **PASSED** |
| "Code scanning AI findings on PR #49" | GHAS dynamic workflow | pass on first run, then failed at "Processing Request (Linux)" with no code change | **BLOCKED (platform)** |

**CI is therefore not fully green**, and I am not claiming it is:
`CI — Pull Request Validation` fails **only** at the migration-drift step, which fails on
`main` too (run `41185748051`, same step). That single step also prevents the MySQL job from
reaching its integration and boot steps.

### The env-classification regression I introduced and fixed

The first CI run on this PR failed *before* any test at "Environment variable classification
is current". Cause: `scripts/diagnose-public-catalogue.ts` (from `7e4c3922`, fetched into the
branch this turn) reads `process.env.DATABASE_URL`, so `docs/environment-classification.json`
was stale (2,861 → 2,862 files; `DATABASE_URL` referenceCount 9 → 10). Fixed by regenerating
with `npm run audit:env` and committing (`c142c95d`). No variable was added, removed or
reclassified. This is the correct fix per the step's own comment; the alternative — editing
the checker — would have hidden real drift.

## 9. Section A security review findings

Full detail in `proposals/08-SECTIONA-SECURITY-REVIEW.md`. **Verdict: NOT READY — do not
apply `9002`/`9003`.**

| # | Finding | Severity | Status |
|---|---|---|---|
| SA-1 | `CrmCourse` has **no `studyMode`** column (it is `deliveryMode` / `attendanceMode`) | **blocking** | **FIXED in rev 2** |
| SA-2 | `CrmCourse` has **no `academicYear`** column (year lives on `CourseIntake` / coverage) | **blocking** | **FIXED in rev 2** (claim removed) |
| SA-3 | Approval snapshot binds evidence keys but **not course field values** — an edit after approval publishes unsupported text | high | **OPEN** |
| SA-4 | Approval history is one mutable row; `CrmAuditLog` carries the trail but has no tamper evidence | medium | **OPEN** |
| SA-5 | Concurrent approve/revoke is last-write-wins; no conditional write, no `409` | medium | **OPEN** |
| SA-6 | `isSameOrigin` allows absent `Origin` (server-to-server) | low | recorded, no change |

Controls that **PASS**: Super-Admin-only approval with Acting-As rejected; backend
authorization on `POST` and `GET`; course-specific hashed evidence (course **and**
university slug, `VERIFIED`, https, 64-hex hash); automatic invalidation on evidence change;
deny-by-default; hard deny-list for Monash (HOLD) + 3 Aston records; sensitive fields
suppressed behind an off flag; `robots: noindex, follow`; sitemap exclusion verified at
`src/app/sitemap.ts:35` (queries `publicCourseWhere()` only); no JSON-LD beyond breadcrumbs.

Rev 2 artefacts: `proposals/files/limited-publication-policy.rev2.ts`,
`proposals/patches/9003b-course-page-limited-branch.rev2.patch`,
`proposals/tests/limited-publication-policy.rev2.test.ts` — **20/20 pass**. Rev 1 is retained
unmodified as the record of what was reviewed and rejected.

Eight recovered courses: **unpublished** — nothing in this package publishes anything.

## 10. Database migration readiness

| Step required by §5 | Result | Status |
|---|---|---|
| Inspect exact SQL and Prisma schema | done; additive `CREATE TABLE` + FK + 3 indexes, plus one nullable relation field | **VERIFIED** |
| No destructive changes | no `ALTER`, no `DROP` in `.up.sql` | **VERIFIED** |
| Table/index name collisions | `CrmCourseLimitedPublication*` — no existing match in `schema.prisma` | **VERIFIED** |
| MySQL-version compatibility | `utf8mb4_unicode_ci`, `DATETIME(3)`, `VARCHAR(191)` — standard for 8.x; **not executed** | **NOT TESTED** |
| FK / unique / transaction behaviour | FK→`CrmCourse(id)` `ON DELETE CASCADE`; unique `courseId`; writes are single `$transaction` | **VERIFIED (by reading)** |
| Backup + restore proof | none — no database has been contacted | **PENDING APPROVAL** |
| Rollback tested on an isolated DB | **impossible here** — no `mysql`/`mariadb` client, no Docker in this sandbox | **BLOCKED** |
| Impact + expected downtime | `CREATE TABLE` on an empty table: sub-second DDL; 0 rows written to existing tables | **VERIFIED (estimated)** |
| Formal approval record | template produced (`proposals/06`); **unsigned** | **PENDING APPROVAL** |
| Written authorization | none | **PENDING APPROVAL** |

The migration stays unapplied on staging and production.

## 11. WhatsAppContact.countryCode investigation

Separate workstream, **proposed only** — no write path was changed.

| Fact | Evidence |
|---|---|
| Column exists: `countryCode String @default("")`, indexed `@@index([countryCode])` | `prisma/schema.prisma` (`model WhatsAppContact`) |
| **Nothing ever writes it.** Not the inbound webhook, not the contacts route, not the UCC intake, not the public-lead route | `grep -rn countryCode src/app/api/whatsapp src/lib/whatsapp*` → no matches |
| Inbound upsert writes `phone`, `normalizedPhone`, `externalContactId`, `displayName`, `profileName`, timestamps — no `countryCode` | `src/app/api/whatsapp/webhook/route.ts:364` |
| Other writers (`contacts/match/[id]/resolve`, `crm/leads/public`) also never set it | grep of all `whatsAppContact.*` writes |
| A correct helper already exists: `deriveCountryCode()` maps 880/91/92/977/94/971/966/44/1 and returns `''` for anything else — it does **not** guess | `src/lib/access-control/object-scope.ts:76` |
| Consumer risk of a naive backfill | `deriveCountryCode` would return `''` for unknown prefixes (safe) but `1` for +1 numbers (US/Canada ambiguity) and cannot distinguish e.g. +1242 Bahamas from +1 US |
| Query surface | only `@@index([countryCode])`; the admin CMS search hit is a different model's column, so nothing reads `WhatsAppContact.countryCode` today |

**Proposal (not applied):** set `countryCode: deriveCountryCode(normalizedFrom)` in the
inbound upsert's `create` and `update`; add a per-row `countryCodeSource`
(`DERIVED` / `MANUAL` / `UNKNOWN`) if manual override is wanted; backfill only
`countryCode = ''` rows, in batches, idempotently, **skipping** any number whose prefix maps
to `''` and leaving ambiguous +1 rows `UNKNOWN` rather than guessing. That is a write to
production messaging data and needs its own §6 approval record plus a measured batch plan.
The corrected `employee-access-acceptance` test asserts the real current contract and does
not pretend the field is populated.

## 12. University data publication safeguards

**VERIFIED, unchanged.** No catalogue data, schema or gate was modified this turn:

* `publicCourseWhere` / `publicUniversityWhere` / `publicCoursePageWhere` unchanged: a record
  is public only with `PUBLISHED` **and** `VERIFIED` **and** an acceptable https source, and
  the university must itself be public.
* Jan 2027 – Jan 2028 monthly intake requirements: untouched (no schema change; the four
  overlapping coverage models remain as-is, and which is authoritative is still an open
  question).
* The eight recovered courses: still unpublished. `9002`/`9003` unapplied, no approval rows
  exist, no seed run.
* A URL or a unique key still proves nothing: the Section A policy requires
  course-specific, hashed, VERIFIED evidence per field, and labels everything else
  "Not confirmed".
* No verified record was overwritten by an import: no import was run.

## 13. Pull request

**PR #49** — https://github.com/tech360-bd/ALO_WEB_CRM_TECH/pull/49
Title: *fix(whatsapp): BD phone normalisation, authz order, offline copy + Section A review
(9002/9003 unapplied)*. State: **OPEN**, `MERGEABLE`, **not merged** (approval required).

Commits: `7e4c3922` (fetched), `5ce71440` (fixes + tests), `6d11814e` (audit docs),
`c142c95d` (env classification), `c9edee3f` (CI re-trigger, empty), `ab162322` (this report).

## 14. CI results and evidence links

| Check | Result | Link |
|---|---|---|
| Lint · Typecheck · Tests · Prisma · Build (final SHA `ab162322`) | **PASSED** (15m04s) | https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/41442086742/job/125266176868 |
| Same job, previous SHA `c9edee3f` | **PASSED** (17m14s) | https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/41439607157/job/125257865796 |
| MySQL 8 · Migrate · Integrate · Boot | **FAILED** (pre-existing, drift step) | https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/41442086742/job/125266176518 |
| CodeQL (actions, python, javascript-typescript) | **PASSED** | https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/41442086716 |
| Code scanning AI findings | **BLOCKED (platform)** | https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/41437514001 |
| Same drift step on `main` (proof of pre-existence) | **FAILED** | https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/41185748051 |

Note: on `main`, the *tests* step also fails. On this branch it passes — i.e. this PR does not
just avoid regressing CI, it un-breaks the tests gate that `main` is currently failing.

## 15. Production deployment status

**NOT DEPLOYED — PENDING APPROVAL.** No deploy workflow was triggered, no environment was
touched, no Hostinger artefact was produced. A passing build is not proof of a live deploy,
and none is claimed.

## 16. Outstanding approvals and blockers

| # | Item | Owner action | Status |
|---|---|---|---|
| 1 | Eight Phase 0E attestations (A1–A8) | written answers from the DB owner | **PENDING** |
| 2 | Migration `9002` approval record + backup + tested rollback | sign `proposals/06` | **PENDING** |
| 3 | Section A apply (`9002` + `9003b` rev 2) | approve after SA-3/4/5 are closed | **PENDING** |
| 4 | SA-3 content digest (new column ⇒ new migration) | design decision | **OPEN** |
| 5 | SA-4 audit-of-record decision | choose statement vs new table | **OPEN** |
| 6 | SA-5 conditional write + `409` | implementation | **OPEN** |
| 7 | `countryCode` write path + backfill | separate approval record | **PENDING** |
| 8 | Migration-drift CI gate failing on `main` | pre-existing; needs its own investigation | **OPEN** |
| 9 | "Code scanning AI findings" runner failure | retry / platform | **BLOCKED** |
| 10 | Fixture phone numbers inside `tests/` | policy question for the owner | **OPEN** |
| 11 | Indexing of limited pages (`noindex` → index) | separate decision | **PENDING** |

## 17. Exact rollback procedure

Nothing here touches a database, so rollback is source-only.

```bash
# 1. Revert this PR's substantive work (keeps the audit docs)
cd /home/user/ALO_WEB_CRM_TECH
git revert --no-edit 5ce71440          # the three fixes + test repairs + new tests
git revert --no-edit c142c95d          # env classification regeneration (or leave: harmless)

# 2. If the audit/docs commits must also go
git revert --no-edit 6d11814e c9edee3f

# 3. Full reset to the reviewed baseline (destroys the branch's commits locally only)
git reset --hard 7e4c3922 && git push --force-with-lease origin arena/ececf40c-alo-web-crm-tech
```

Post-rollback verification: `npx vitest run` should return to **45 failed / 3,522 passed**;
`grep -n "slice(3)" src/lib/whatsapp-number-pool.ts` should return nothing;
`grep -n "Please reconnect to continue" src/app/offline/page.tsx` should return nothing.

Section A needs no rollback because it was never applied. If `9002` is ever applied and must
be undone: `proposals/sql/9002-limited-publication.down.sql` (`DROP TABLE`), then revert the
schema patch and re-run `prisma generate`. No `CrmCourse` row is touched either way.
