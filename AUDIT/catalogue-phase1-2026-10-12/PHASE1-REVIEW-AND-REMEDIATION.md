# Catalogue Phase 1: Security Review, Remediation and Commit Readiness

- **Date:** 2026-10-12
- **Branch:** `arena/8b727e17-alo-education-z-ai` (local only). HEAD is `c5bfcbba`, the same commit as `origin/main`. This is a shallow clone.
- **What this is:** a review of the Phase 1 diff, plus narrow fixes for P0-A, P0-B, P0-C, P1-D and the in-scope authorization issues.
- **Nothing was committed, pushed, merged, pulled, rebased, reset, stashed or deployed.**
- **Not done:** no migration, schema change, seed, data import, production access or pilot start.
- **Installs:** the only install was the one-time `npm ci --ignore-scripts --no-audit --no-fund` you approved, run from the committed lockfile. Exit code 0; the lockfile is byte-identical afterwards.
- **No existing audit artifact was overwritten.** Every new file in this folder starts with `review-` or `PHASE1-REVIEW-`.

**Evidence labels used below:**
- **TESTED-MOCKED:** a vitest test with an in-memory or recording DB fake. This is not MySQL proof.
- **STATIC:** a source read or grep.
- **BLOCKED:** could not run, with the reason given.

---

## 1. Initial git state

| Item | Value |
|---|---|
| Branch / HEAD | `arena/8b727e17-alo-education-z-ai` / `c5bfcbbaef4e612eddb55f5f8516e5b1526e68cc` |
| `git status --short` at review start | 396 entries. These are pre-existing user work plus the Phase 1 changes. |
| `git status --short` now | 423 entries. That is 396 + 21 files newly modified by this review (they were clean at HEAD) + 6 new untracked files. The new AUDIT files sit inside the folder that was already untracked. |
| `src/proxy.ts` | Already modified before Phase 1. Your pre-existing changes are recorded in `proxy-preexisting-uncommitted-baseline.diff`, and they are still present: the Phase 1 and review edits only touch `isStaticAssetBypass`. |
| `phase1-changes.diff` | Re-checked: it reproduces the pre-review tree. It was not modified. |
| Phase 1 logs listed in `PHASE1-RESULTS.md` (e.g. `test-new-phase1.log`) | **Not present.** `*.log` is git-ignored, so the logs were never persisted. Every claim in `PHASE1-RESULTS.md` was therefore re-run here, not trusted. |
| `package.json`, `package-lock.json`, `prisma/schema.prisma`, prisma seeds and one untracked migration | Already modified or untracked **before** this review; these are pre-existing user changes. Not touched. The SHA-256 of `package.json` (`41e12e97…`) and `package-lock.json` (`3300bccd…`) match the hashes recorded before `npm ci`. |
| Baseline before any review edit | `review-unit-baseline-pre-edit.txt`: 6 failed / 1781 passed (1787 tests, 172 files). |

## 2. Changed-file inventory

**Phase 1 files** (already uncommitted when the review started):
- `src/app/api/import-center/route.ts`
- `src/app/api/course-finder/admin/route.ts`
- `src/app/api/university-monitoring/changes/[id]/route.ts`
- `src/app/api/source-logs/route.ts`
- `src/app/api/data-quality/route.ts`
- `src/app/api/crm/course-import/download-errors/route.ts`
- `src/proxy.ts` (on top of the pre-existing user changes)
- `src/lib/course-finder/content-page-guards.ts`
- the three `tests/unit/catalogue-phase1-*.test.ts` files

**Review changes** (33 files; the exact diff is in `review-remediation-changes.diff`):

| File | +/- | Purpose |
|---|---|---|
| `src/proxy.ts` | +14 −16 | K4: replace the dotted-path bypass with an allow-list. |
| `src/lib/course-finder/content-page-guards.ts` | +26 −0 | Add `auditActor` and `withoutUnchanged`. Additions only; byte-compared. |
| `src/app/api/course-finder/admin/route.ts` | +21 −4 | K2: re-sending a normalised value is no longer counted as an edit. Audit records the session actor. Delete returns 404 for a missing record and audits the before value. |
| `src/app/api/import-center/route.ts` | +4 −3 | K1: audit actor. Removes the fallback to an email or "system" as the User foreign key. |
| `src/app/api/university-monitoring/changes/[id]/route.ts` | +8 −6 | K1 / P1-D: field approval no longer refreshes `lastVerifiedAt`. |
| `src/lib/course-finder/manual-course-create.ts` (new) | +158 | P0-A: shared, non-inventing CrmCourse builder. |
| `src/app/api/admin/courses/create/route.ts` | +14 −73 | P0-A |
| `src/app/api/admin/courses/route.ts` (POST) | +15 −95 | P0-A |
| `src/lib/course-finder/ai-content-fallback.ts` (new) | +84 | P0-B |
| `src/app/api/ai-command/execute/route.ts` | +14 −29 | P0-B. GET now requires an admin session. |
| `src/lib/course-finder/public-content-page-policy.ts` (new) | +100 | P0-C: shared `*Page` public policy. |
| `src/app/api/homepage/route.ts` | +20 −6 | P0-C |
| `src/app/api/search/route.ts` | +19 −8 | P0-C |
| `src/app/api/course-finder/eligible/route.ts` | +13 −3 | P0-C |
| `src/app/courses/[slug]/page.tsx` | +11 −3 | P0-C |
| `src/app/course/[slug]/page.tsx` | +6 −3 | P0-C |
| `src/app/universities/[slug]/page.tsx` | +13 −5 | P0-C |
| `src/lib/study-guide.ts` | +8 −2 | P0-C |
| `src/app/sitemap.ts` | +8 −3 | P0-C |
| `src/app/api/student-portal/course-finder/route.ts` | +5 −1 | P0-C (Crm) |
| `src/app/api/student-portal/scholarships/route.ts` | +5 −2 | P0-C (Crm) |
| `src/app/api/course-finder/saved/route.ts` | +3 −1 | P0-C (Crm) |
| `src/lib/course-finder/crm-edit-verification.ts` (new) | +41 | P1-D helpers |
| `src/app/api/admin/courses/[id]/route.ts` | +42 −20 | P1-D |
| `src/app/api/admin/universities/[id]/route.ts` | +22 −9 | P1-D |
| `src/app/api/admin/import/scholarships/route.ts` | +7 −4 | P0-A / P1-D |
| `src/app/api/crm/scholarships/route.ts` | +51 −5 | P0-A / P1-D |
| `src/app/api/admin/countries/route.ts` | +4 −2 | P1-D |
| `src/app/api/admin/website/cms/route.ts` | +11 −3 | P1-D |
| `tests/unit/catalogue-phase1-review-publication.test.ts` (new) | +248 | 17 tests |
| `tests/unit/catalogue-phase1-review-writes.test.ts` (new) | +348 | 28 tests |
| `tests/unit/catalogue-phase1-security.test.ts` | +3 | **Strengthened** one existing assertion: monitoring approval must not write `lastVerifiedAt`. Disclosed here. |
| `tests/unit/sitemap-db-runtime.test.ts` | +8 −2 | **Existing test updated** after a deliberate behaviour change. Its mock now provides `dataConflict.findMany`, and its fixture rows carry an https `sourceUrl`, because the sitemap now applies the shared policy. Each change is marked with a "Phase 1 review" comment. The original is preserved inside `review-remediation-changes.diff`. |

## 3. File-by-file review of the Phase 1 diff

For each file: previous behaviour, then what Phase 1 delivered, then what the review found and changed.

- **`import-center` (K1)**
  - *Previous:* approve set VERIFIED and reject set REJECTED on `verificationStatus`; anyone in the admin list could publish unverified records.
  - *Phase 1:* approve sets PENDING_REVIEW and reject sets DRAFT, both on `approvalStatus` only. Publish requires VERIFIED plus an https source. Verify is SUPER_ADMIN only and does not publish.
  - *Review finding:* the audit `userId` fell back to an email or `"system"` when `userId` was missing. `AuditLog.userId` is a User foreign key, so that either fails the insert or misattributes the action. **Fixed** with `auditActor`: portal identities are written to `details`, never to the foreign key.
  - *Remaining:* no per-field evidence model. That needs a schema change.
- **`university-monitoring/changes/[id]` (K1)**
  - *Phase 1:* approval no longer set VERIFIED, but it **still refreshed `lastVerifiedAt`**, which is a record-level claim.
  - *Review:* **fixed** (P1-D). If no field is mapped, nothing is written.
  - *Remaining:* fields the monitoring sync does not map are not applied at all; the history row still records the change.
- **`course-finder/admin` (K2)**
  - *Phase 1:* create sets UNVERIFIED with a null date; updates use an allow-list; a fact edit downgrades verification; publish requires ADMIN plus VERIFIED plus a source.
  - *Review finding:* normalisation (`""` becomes null, JSON re-serialisation) made an unchanged resend count as a fact change, which unpublished legacy pages. **Fixed** with `withoutUnchanged`.
  - *Review finding:* the audit had no actor, and DELETE had no existence check or before value. **Fixed.**
  - *Remaining:* no same-origin check on this route (Phase 1 limitation; the cookie SameSite setting is not verified here).
- **`source-logs`, `data-quality` (K3):** re-read and the tests re-run. No change needed.
- **`crm/course-import/download-errors`:** re-read. Handler-level ADMIN/SUPER_ADMIN check. No change needed.
- **`src/proxy.ts` (K4)**
  - *Phase 1:* the dotted bypass was removed for `/api/**` and the role-gated prefixes, **but any other gated page outside the `ROLE_ROUTES` prefixes still bypassed** when a dot was added (e.g. `/guides/x.pdf`).
  - *Review:* **fixed** by replacing the check with an allow-list of real static roots (`_next`, `static`, `public`, `docs`, `icons`, `images`) and single root-level files.
  - *Compatibility:* your pre-existing proxy changes are preserved. Only `isStaticAssetBypass` changed.

## 4. K1–K4 verdicts

These verdicts cover only the scope that was tested, using a mocked DB.

| Item | Verdict | Evidence | Remaining risk |
|---|---|---|---|
| **K1:** import-centre approve/reject/publish; monitoring field approvals | **PASS** (mocked) | `catalogue-phase1-security` (23) and `catalogue-phase1-real-auth` (9) pass. The new monitoring assertion fails against the pre-review code. | Existing records that the old code marked VERIFIED stay VERIFIED. A read-only DB audit is **BLOCKED**. |
| **K2:** create / allow-list / verification reset / publish / unpublish / delete | **PASS** (mocked) | Security tests plus the review test "re-sending normalised values is not a change". | No same-origin check. No UI button for verify (API only). |
| **K3:** source-logs ownership; data-quality read/write split | **PASS** (mocked) | Security tests. | None found within scope. |
| **K4:** proxy bypass via dotted, encoded and case variants | **PASS** (unit, proxy function only) | `catalogue-phase1-proxy` (4) plus 3 review proxy cases. The dotted gated-page case fails on the pre-review code. | Blocking at the proxy does not secure a route: 84 routes rely on proxy role checks alone and 6 on proxy authentication alone (§6). |
| **download-errors** authorization | **PASS** (mocked) | Real-auth tests. | |
| Compatibility with auth, RBAC and impersonation | **PARTIAL** | Admin checks now use `auth.userType`, which comes from the session, not lowercase role claims. Impersonation: `auditActor` keeps `actorUserId`. No impersonation-specific test exists. | Untested impersonation flows. |

## 5. P0-A, P0-B, P0-C and P1-D

### P0-A: unsafe DB defaults

**Previous behaviour, confirmed by STATIC review of the schema:**
- `CoursePage`, `UniversityPage`, `CountryPage` and `ExamPage` default to `verificationStatus = "VERIFIED"` and `approvalStatus = "PUBLISHED"`.
- `CrmCourse` and `CrmUniversity` default to NEEDS_REVIEW, `"draft"` and `lastVerifiedAt = ""`.

**Creation paths traced:**

| Path | Before | Now | Evidence |
|---|---|---|---|
| `POST /api/admin/courses/create` and `POST /api/admin/courses` (CrmCourse) | Set VERIFIED whenever a source was given, and accepted `status` from the body. Invented IELTS 6.5, PTE 58, TOEFL 80, DET 115, "September 2026", "Rolling", GBP, MSc and 12 months. Any `withAuth` user could call it. | Shared `buildManualCourseRecords`: NEEDS_REVIEW, draft, `lastVerifiedAt ""`. Control fields → 400. Nothing is invented. A fee needs both a currency and an intake. Requires ADMIN/SUPER_ADMIN `userType`. | TESTED-MOCKED, 8 cases |
| `ai-command/execute` fallback (CoursePage) | See P0-B. | Explicit UNVERIFIED and DRAFT. | TESTED-MOCKED |
| `course-finder/admin` POST (CoursePage) | Phase 1 | UNVERIFIED with explicit DRAFT or PENDING_REVIEW. | TESTED-MOCKED |
| Static inventory of every `*Page.create` in `src/` | — | Exactly 2 creation paths exist, both reviewed, and both set both status fields. The test fails if a new path appears. | TESTED (static scan) |
| `crm/scholarships` POST / PUT | Currency defaulted to `GBP`. PUT kept VERIFIED after a fact edit. | Currency required with any amount (ISO code). Control fields → 400. A fact edit of a VERIFIED row → NEEDS_REVIEW. A missing row → 404. Creates still inherit NEEDS_REVIEW, which is not public. | TESTED-MOCKED |
| `admin/import/scholarships` | Rows were imported as verified, dated, GBP, with invented amount text. | Imported as pending, `lastVerifiedAt` null, no invented values. | TESTED-MOCKED |
| `crm/course-import/map-university:92` | — | Creates `status: needs_official_source` with the default NEEDS_REVIEW, so it is not public. No change needed. | STATIC |
| `crm/import/*`, `universities/create`, `course-import/confirm` | — | Safe (not VERIFIED, not published). | STATIC (earlier pass) |
| `admin/builder` | — | Writes `ContentAsset` guides, not catalogue records. Publishing needs a second-person approval plus validation. Its generation context reads non-public Crm rows (`status in active/verified/published`); this is documented, not changed. | STATIC |

**Schema proposal (NOT applied; needs a migration and your approval):**
- Change the `*Page` defaults to `verificationStatus "UNVERIFIED"` and `approvalStatus "DRAFT"`.
- Make `Scholarship.verificationStatus` default to `pending`.
- Run a read-only data audit first (**BLOCKED**: no DB).

Seeds that create VERIFIED or PUBLISHED records were not touched; none were run.

**Verdict:** **PASS** (mocked) for the application paths. **BLOCKED** for the schema defaults (decision needed).

### P0-B: AI executor fallback

**Before:**
- When the primary executor failed, the inline `DEPLOY_CONTENT` fallback created CoursePages with invented facts that inherited VERIFIED and PUBLISHED.
- Updates mass-assigned the AI payload.
- Unsupported targets reported a fake success.
- GET (listing payloads) was unauthenticated.

**Now (`ai-content-fallback.ts`):**
- Creates an UNVERIFIED DRAFT with supplied values only.
- Refuses to create without the identifying fields.
- Payloads that try to set verification or publication → rejected.
- An update to a VERIFIED, published page → NEEDS_REVIEW plus PENDING_REVIEW, so the page goes offline.
- An unsupported target → failure, not success.
- GET requires an ADMIN/SUPER_ADMIN session.

**Evidence:** TESTED-MOCKED. The executor is forced to throw; 6 cases; the created record fails `passesPublicCoursePagePolicy`.

**Verdict:** **PASS** (mocked).

**Not fixed (documented):**
- The primary executor's signature mismatch (string id; PATCH claims success).
- The `UPDATE_STUDENT` and `MODIFY_APPLICATION` fallbacks still mass-assign. They are outside the catalogue scope.

### P0-C: public homepage, search and catalogue

**Policy scope:**
- **Crm models:** `src/lib/public-catalog.ts` (unchanged) requires active + VERIFIED + published + a source link. Courses also need a public university.
- **`*Page` models:** the new shared `public-content-page-policy.ts` requires all of:
  - `approvalStatus` PUBLISHED and `verificationStatus` VERIFIED;
  - an https, non-synthetic `sourceUrl`, enforced in SQL and re-checked in JS;
  - no open `DataConflict` (PENDING or ESCALATED) on the slug;
  - for courses, a public university.
- If the conflict lookup errors, the policy **fails closed**.

**Surfaces now enforcing the policy:**
- `/api/homepage`
- `/api/search`
- `/api/course-finder/eligible`
- `study-guide` (used by the public `/api/course-finder/guide`)
- `/courses/[slug]`
- the legacy `/course/[slug]` redirect
- `/universities/[slug]`, including its embedded course list
- `sitemap.ts`
- `student-portal/course-finder`, `student-portal/scholarships` and `course-finder/saved` (all Crm)

**Evidence:** TESTED-MOCKED with an in-memory Prisma `where` evaluator; 17 tests. Every surface excludes each of these cases:
- unverified, NEEDS_REVIEW, CONFLICTING_SOURCES
- draft, pending
- no source, empty source, http source, synthetic source
- open conflict
- hidden university

The only cache found (`website/cms-content`) does not serve catalogue rows.

**Verdict:** **PASS** (mocked) for the listed surfaces.

**Out of policy scope, documented and not changed:**
- `CountryPage` and `ExamPage`. The homepage still lists countries with `approvalStatus = PUBLISHED`.
- `website/stats` counts unverified records.
- Homepage counts skip the JS synthetic-host re-check (a test shows `totalCourses` 2 against 1 listed).
- `course-finder/eligibility` and `course-finder/universities/[slug]` query nonexistent fields and fail closed.
- `api/universities/[slug]` has no source requirement and uses mixed-case role checks.
- `admin/courses/[id]/create-draft` accepts unpublished courses.
- Crm queries ignore `DataConflict`.
- If the sitemap's conflict lookup errors, the whole sitemap falls back to its static version and blogs are dropped. This fails closed.

### P1-D: verification timestamps

| Route | Before | Now | Evidence |
|---|---|---|---|
| Monitoring field approval | Refreshed record-level `lastVerifiedAt`. | No date and no status written. | TESTED-MOCKED |
| `PUT /api/admin/courses/[id]` and `PUT /api/admin/universities/[id]` | A `sourceUrl` in the body set VERIFIED. Every edit stamped `lastVerifiedAt = now`. Fees defaulted to GBP. | Control fields → 400. Never upgrades verification. A fact, fee or requirement change on a VERIFIED record → NEEDS_REVIEW. Never writes `lastVerifiedAt`. A changed URL must be https; unchanged legacy values are accepted. A fee needs a currency. Requires ADMIN/SUPER_ADMIN. | TESTED-MOCKED, 5 cases |
| Scholarship import | Verified and dated. | Pending, null. | TESTED-MOCKED |
| `crm/scholarships` PUT | Kept VERIFIED after a fact edit. | NEEDS_REVIEW. | TESTED-MOCKED |
| `POST /api/admin/countries` | Every save stamped `Country.lastVerifiedAt`, which the public country page shows as "Last verified". | No stamp. | TESTED-MOCKED |
| `admin/website/cms` country POST and PUT | Same stamp. PUT also let the client set the date via `...body`. | No stamp; `lastVerifiedAt` is stripped from the body. | STATIC (regex test) |
| `import-center` verify | — | An explicit SUPER_ADMIN verification. Acceptable. | TESTED-MOCKED |

**Writers that remain (explicit verify actions or outside scope; listed, not changed):**
- `university-monitoring-engine.ts:205` (OfficialSource, source-level)
- `official-crawlers/aston-adapter.ts:235` (automatic VERIFIED: **risk**)
- `source-intelligence.ts:358` (evidence-level)
- the manual Verify buttons in admin `scholarships` and `services` (`AdminContentManager.tsx:372`)
- `knowledge-base-engine.ts:97` (explicit verify)
- the new-test form default in `AdminLanguageTestsView.tsx:111` (today's date plus `isPublished: true`)
- `crm/seed-universities` (returns 503)

**Verdict:** **PASS** (mocked) for the routes listed in the table. The remaining writers are **NOT REVIEWED** for a fix.

## 6. Authorization progress

**Inventory:** `review-authorization-inventory.csv.txt` covers all 903 `route.ts` files. It is saved as `.csv.txt` because `*.csv` is git-ignored outside top-level `AUDIT/`. Columns: methods, proxy result per method, proxy role list, handler auth helper, role, ownership and write heuristics, and priority flags.

**Classification (heuristic):**

| Class | Routes |
|---|---|
| Auth helper found in the handler | 738 |
| Proxy role list only, no handler auth | 84 (44 with writes; 18 admit PARTNER or STUDENT) |
| Proxy authentication only (any signed-in user) | 6 |
| Public by proxy, no handler auth | 72 (mostly intended: auth flows, webhooks, public reads) |
| 410/501 stubs | 3 |

**Review status:**
- 19 routes reviewed and tested (mocked).
- 23 read only.
- **861 not reviewed** (heuristic classification only). Of those, 692 carry priority flags.

**Confirmed by reading (not tested), outside this scope, NOT fixed:**
1. **HIGH.** The 14 `/api/communications/*` routes have no handler auth, and the proxy admits PARTNER. For example, `communications/tasks` GET returns every task with any filter, which allows cross-tenant reads. Errors leak `error.message`.
2. **HIGH (defence in depth).** `university-agreements`, `official-emails`, `b2b-contacts`, `interview-questions` and the `hr/*` routes rely only on the proxy role. `university-agreements` PATCH also mass-assigns `approvedById` from the body.
3. **MEDIUM.** `POST /api/events` is public with no rate limit. Anyone can increment `registeredCount` until the event shows as full.
4. **C1 (from the earlier audit).** `partner-packages` has no handler auth.
5. **MEDIUM.** The admin CMS and country routes treat a lowercase `admin` role claim as admin. This is the same pattern that was fixed for catalogue routes.

**Remediation plan for the rest:** add handler-level `withAuth({ requireUserTypes })` or the module's own guard to every proxy-only route, communications first. Then add ownership scoping for PARTNER, allow-list request bodies, and add per-route negative tests (unauthenticated, wrong role, cross-user, impersonated).

**This review does not claim the application is secure.**

## 7. Commands and results

All runs used Node v22.22.3 in the sandbox. "Reproducible" means the same command gives the same result in this environment.

| # | Command | Exit | Result | DB | Log |
|---|---|---|---|---|---|
| 1 | `npx --no-install vitest run <6 Phase 1 and review files>` | 0 | **84 passed** / 0 failed / 0 skipped | mocked | `review-targeted-tests.txt` |
| 2 | Related suites: 27 files whose tests reference the edited routes or modules | 0 | **394 passed** / 0 failed | mocked | `review-related-tests.txt` |
| 3 | Mutation check: the review tests plus `catalogue-phase1-security` run against the reconstructed pre-review code (24 source files swapped, then restored and byte-compared: OK) | 1 (expected) | **40 failed** / 28 passed. The 6 review tests that pass on old code check pure helpers or behaviour that was already correct. The 22 Phase 1 security tests pass because Phase 1 code is part of the pre-review tree. | mocked | `review-mutation-pre-review.txt` |
| 4 | `npx --no-install vitest run tests/unit` | 1 | **1826 passed / 6 failed** (1832 tests); 168 files passed, 6 failed. **The failure set is identical to the baseline.** | mocked | `review-unit-final.txt` (baseline `review-unit-baseline-pre-edit.txt`, mid-review `review-unit-mid.txt`) |
| 5 | `npx --no-install vitest run` (unit + integration, as configured) | 1 | 1848 passed / 6 failed / 28 skipped; 9 files failed at import | — | `review-vitest-all-final.txt` |
| 6 | `npx --no-install vitest run tests/integration` | 1 | 22 passed / 28 skipped. 3 files fail at import (`.prisma/client/default` missing). 2 MySQL files are skipped because `TEST_DATABASE_URL` is not set. | **MySQL unavailable: BLOCKED** | `review-integration-final.txt` |
| 7 | Full tsc (temporary tsconfig, `incremental:false`, `--noEmit`) | 2 | **43 errors, 0 in the 36 changed files.** All are in unchanged files, mostly missing generated Prisma types (TS2305 ×20). The Phase 1 report's 48 came from a different environment (a stub client was present then). | — | `review-tsc-full.txt` |
| 8 | ESLint on the 36 changed files | 0 | **0 errors, 0 warnings** (36 files linted) | — | `review-eslint-changed.txt` |
| 9 | `npm run build` | not run | **BLOCKED.** Its first step is `prisma generate`, which needs engine downloads outside the egress allow-list; forcing generation is not permitted. | — | `review-build-blocked.txt` |
| 10 | E2E / browser | not run | **BLOCKED:** no running app and no DB. | — | — |

**Details for row 4:**
- The 6 failing tests are all in `standalone-verification` (pre-existing).
- Another 5 files fail at import because the Prisma client is not generated: `accounting-ledger`, `cms-revisions`, `broadcast-send`, `erp-routes-authz-regression`, `journal-integrity`. They run 0 tests.
- Versus the baseline: +45 new tests, all passing. The 2 mid-review `sitemap-db-runtime` regressions were caused by the deliberate policy change and are now resolved by the disclosed test update.

**Limitations:**
- The Prisma client is not generated, so tsc cannot check Prisma field names or call shapes.
- Every DB result here is a mock, not MySQL.

## 8. Blockers and risks

**Blocked:**
- **MySQL:** BLOCKED. No disposable `TEST_DATABASE_URL` is available. Operator: you or CI with a disposable MySQL instance.
- **Build and generated-client tsc:** BLOCKED. `prisma generate` cannot run here. Operator: CI.
- **E2E:** BLOCKED.

**Decisions needed:**
1. Change the schema defaults (§5 P0-A).
2. Run a read-only data audit to find records the old code marked VERIFIED.

**Risks:**
- The 861 unreviewed routes, including the HIGH communications finding (§6).
- Out-of-scope surfaces: `CountryPage` and `ExamPage`, `website/stats`, the homepage counts.
- The automatic VERIFIED written by `aston-adapter`.
- The executor signature mismatch.
- If the sitemap's conflict lookup errors, the whole sitemap falls back.

**User-visible changes:**
- Admin course create, course PUT and university PUT now require an ADMIN or SUPER_ADMIN `userType`. Callers that relied on lowercase role claims lose access.
- These PUTs reject `verificationStatus`, `lastVerifiedAt` and `publicationStatus`.
- A fact edit on a VERIFIED Crm course, university or scholarship takes the record out of public view until it is re-verified.
- `ai-command` GET requires an admin session. AI updates to live pages take them offline.
- `*Page` records that do not meet the policy disappear from the homepage, search, sitemap and detail URLs (404).
- Students see only public Crm data.
- Imported scholarships always arrive as pending.
- Country saves no longer refresh the "Last verified" date.

## 9. Rollback (preserves pre-existing changes)

**To undo only this review's changes:**
1. Dry run first: `git apply -R --check AUDIT/catalogue-phase1-2026-10-12/review-remediation-changes.diff` (verified clean today).
2. Then run `git apply -R AUDIT/catalogue-phase1-2026-10-12/review-remediation-changes.diff`.

This restores the exact pre-review tree, including the Phase 1 code and your pre-existing `src/proxy.ts` changes. It deletes the 4 new libraries and the 2 new test files.

**To also undo Phase 1:** follow the rollback steps in `PHASE1-RESULTS.md`.

**Never** run `git checkout src/proxy.ts`, `git reset --hard`, `git stash` or `git clean`. They would destroy your uncommitted work.

## 10. Decision

**READY FOR REVIEW.** This means human code review of the diff only.

It is **not** commit, merge or deploy readiness. Before any commit:
- the build, generated-client tsc, MySQL integration and E2E checks must run in an environment that can generate the Prisma client;
- the schema-default and data-audit decisions must be made.

Nothing was committed. Waiting for your decision.
