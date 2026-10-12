# Course Finder remediation: results

Date: 2026-10-12 · Branch `arena/8b727e17-alo-education-z-ai` · HEAD `c5bfcbb`. All changes are local and uncommitted; nothing was pushed or deployed.

**Status: NOT COMPLETE.** The repository-side changes are done and tested at unit level with a mocked database. Database, staging and launch evidence is still BLOCKED, and there is still no verified catalogue data.

The plan is in `REMEDIATION-PLAN.md`, written before any edits.

## Files changed in this phase

The working tree went from 282 to 316 porcelain entries. No files were deleted, and no dependency, schema, migration or seed changes were made.

### C. Containment

| File | Change | Why |
| --- | --- | --- |
| `src/app/api/agent/course-advisor/route.ts` | rewritten | Every method returns `503 COURSE_ADVISOR_DISABLED_UNVERIFIED_DATA`. It imports no ai-agents or CSV module. |
| `src/lib/ai-agents/synthetic-data-guard.ts` | new | `syntheticAgentDataAllowed()` returns true only when `ALO_ALLOW_SYNTHETIC_AGENT_DATA=1` and `NODE_ENV !== 'production'`. |
| `src/lib/ai-agents/{supervisor-matcher,international-course-agent,campus-course-mapper}.ts` | guard added to each CSV loader | Defence in depth: the loaders return empty data by default. Exports are unchanged. |
| `prisma/seed-university-data.ts` | guard at the start of `main()` | The script wipes `CoursePage`/`UniversityPage`. It now refuses to run unless `ALO_ALLOW_DESTRUCTIVE_TEMPLATE_SEED=1` is set on a non-production database. |

### D. Approval to apply

| File | Change | Why |
| --- | --- | --- |
| `src/lib/course-finder/catalog-change-status.ts` | new | Status vocabulary and labels, safe to use in the browser. |
| `src/lib/course-finder/catalog-change-payload.ts` | new | `proposalPayloadHash()`: SHA-256 over id, ids, entityType, fieldName, oldValue, newValue and evidenceUrl. |
| `src/lib/crm/catalog-update-review.ts` (pre-existing untracked file) | small edits | Approve stores `approvedPayloadHash` in its audit record. The list accepts `applied` and `apply_failed`. `apply_failed` can be reviewed again. The approve message now states that approving changes nothing live. |
| `src/lib/course-finder/apply-approved-changes.ts` | new | The apply engine. It enforces: allowlist (rankings excluded, verification and publication fields forbidden); type and range coercion; HTTPS evidence on a real domain; identity checks; duplicate-target and duplicate-in-batch checks; a stale check before **and inside** the transaction; one transaction per batch; conditional claims; idempotent retries; failure recording; and an audit record for every item. New intakes are created as `NEEDS_REVIEW`. |
| `src/lib/course-finder/catalog-admin-auth.ts` | new | Server-side checks. Admin level allows ADMIN or SUPER_ADMIN. Super Admin level allows SUPER_ADMIN only, and refuses impersonation. All mutations need same origin. |
| `src/app/api/admin/catalog-changes/apply/route.ts` | new | `POST`, Super Admin only, 1–50 IDs, strict body. |
| `src/app/api/admin/catalog-changes/history/route.ts` | new | `GET`, admin only. Returns the audit trail. |
| `src/lib/course-finder/catalogue-import-service.ts` (prior phase, untracked) | edits | Adds new-intake proposals (`intake_new:YYYY-MM:<field>`) and `rowsForDraftStaging()`. Rejects `SAMPLE-` IDs and reserved example domains via `isSyntheticHost`. |
| `src/app/api/admin/data-import/route.ts` | one line plus import | `newRows` now come from `rowsForDraftStaging()`, so a new intake under an existing course is not staged twice. |

### E. Admin screens

| Route | Backing API | Notes |
| --- | --- | --- |
| `/admin/change-approval` | `/api/admin/university-updates` (GET/PATCH), `/api/weekly-updates` (GET), `/api/admin/catalog-changes/apply` | **Replaced a local-state demo** that showed a hard-coded sample change and an "Approve & Publish" button with no server call. Both queues are shown. The weekly queue is read-only and the screen explains why. Apply results are shown exactly as the server returns them. |
| `/admin/change-approval/history` | `/api/admin/catalog-changes/history` | Shows actor, time, target, previous and approved values, result and evidence. |
| `/admin/data-review` | `/api/admin/catalog-review?view=summary\|records` | **Replaced a static card.** Shows real status counts and the number of records visible under the actual public filter, plus provenance fields. |
| `/admin/data-review/duplicates`, `/admin/data-conflicts` | `/api/admin/catalog-review?view=duplicates` | Groups probable duplicate universities, courses and intakes, and lists open `DataConflict` rows. Says plainly that merge is unavailable. `/admin/data-conflicts` used to be a static card. |
| `/admin/eligibility-rules` | none (pure engine in the browser) | Shows the 7 categories, the 3 disclaimers and the rule behaviour. Includes a synthetic validation harness, clearly labelled. |
| `/admin/university-data/duplicates` | — | Now redirects to `/admin/data-review/duplicates`. |
| `GET /api/admin/university-data/duplicates` | — | Now **410**. It used to always return `[]`, which read as "no duplicates". |
| `POST /api/admin/university-data/duplicates/merge` | — | Now **409 `MERGE_WORKFLOW_REQUIRED`**, Super Admin and same origin. It used to accept any authenticated session in the handler, wrote non-transactionally, left dependent records pointing at the archived university, and wrote no audit record. |
| `src/components/admin/catalog-review/CatalogReviewViews.tsx` | — | Shared views for the screens above. |
| `src/components/admin/data-import/CatalogueImportViews.tsx` | link and wording | After queueing, links to `/admin/change-approval`. |

### F. Templates and Compare

| File | Change |
| --- | --- |
| `docs/catalogue-import/README.md`, `catalogue-import-TEMPLATE.csv`, `catalogue-import-EXAMPLE-SYNTHETIC.csv` | New. The template has a header row only. The example is clearly synthetic and is rejected by the importer, which a test checks. |
| `src/app/api/course-finder/public-compare/route.ts` | New public GET for up to 4 courses. Uses only the canonical public filters. Non-public IDs are listed as `unavailable`. Rankings and internal fields are left out. |
| `src/components/course-finder/CourseComparePage.tsx`, `src/app/compare/page.tsx` | A real Compare page replaces the placeholder. It has an optional eligibility check through the same engine (7 categories, disclaimers, engine-checked alternatives). |
| `src/lib/course-finder/compare-list.ts`, `src/components/course-finder/EnhancedCourseFinder.tsx` | Course Finder cards get an "Add to compare" toggle (max 4, stored in the browser as IDs only) and a "Compare (n)" link. |
| `src/app/api/course-finder/eligibility-engine/route.ts` | Optional `courseIds` (1–4) restricts evaluation to those courses. They still pass `publicCourseWhere()`. |
| `src/app/api/course-finder/compare/route.ts` (student saved comparison) | Now filtered through `publicCourseWhere` / `publicIntakeWhere` / `publicRequirementWhere`. It used to return unverified courses. |

### Tests (new)

- `tests/helpers/fake-catalog-db.ts`: an in-memory stand-in for the database with all-or-nothing transactions. It is **not MySQL**.
- `tests/unit/course-finder-apply-approved-changes.test.ts` (20 tests)
- `tests/unit/course-finder-remediation.test.ts` (11 tests)
- `tests/unit/course-finder-review-compare.test.ts` (12 tests)

## Test evidence

Levels: E3 = unit/integration with mocked Prisma; E1 = static.

| Check | Result | Scope |
| --- | --- | --- |
| New tests | **43 / 43 pass** | E3 |
| Course Finder and review set: 9 files (`course-finder-*`, `destination-public-catalogue`, `catalog-update-review-security`) | **103 / 103 pass** | E3 |
| Full unit suite (`vitest run tests/unit`) | **1682 pass / 6 fail** (167 files, 6 failing files) | Baseline was 1639 / 6. The 43 extra passes are the new tests. |
| The same 6 failures as baseline | 5 files cannot load `.prisma/client/default` because there is no generated Prisma client: accounting-ledger, cms-revisions, broadcast-send, erp-routes-authz-regression, journal-integrity. `standalone-verification` fails 6 tests on the pre-existing missing `scripts/lib/public-upload-guard.mjs`. | environment / baseline |
| Whole repo (`vitest run`, unit and integration) | 1704 pass / 6 fail / 28 skipped. 9 files fail: the 6 above, plus 3 integration files (consultation-workflow, content-publication-security, partner-b2b-security) that fail at import for the same missing Prisma client. | environment |
| Type check | Scoped `tsc` over every touched or new file and test: **0 errors in those files**. The only errors are the 3 pre-existing "`@prisma/client` has no exported member" errors (`db.ts`, `registration-lead.ts`, `canonical-student.ts`). Because the Prisma client is not generated, `db` calls are **not** type-checked against the schema. The temporary tsconfig was deleted. | partial |
| `next build` | **NOT RUN.** It needs a generated Prisma client, and whole-app `tsc` runs out of memory in this sandbox. | BLOCKED |
| MySQL integration (transactions, isolation, real Prisma queries) | **NOT RUN.** There is no disposable MySQL database, and `prisma generate` fails because outbound TLS is blocked. | BLOCKED |
| Mutation check | Making the stale comparison always pass made 3 tests fail (stale requeue, concurrent change, new-intake overwrite). The comparison was then restored. | E3 |

## Migration

**None needed.** `applied` and `apply_failed` are values in the existing string `status` column. The hash lives in `PortalAuditLog.metadata`.

Optional (owner approval needed): add `@@unique([courseId, intakeYear, intakeMonth])` on `CrmCourseIntakeFee` to close a concurrent new-intake race. Any existing duplicate rows (listed on `/admin/data-review/duplicates`) must be resolved first.

## Risks and rollback

- **Concurrent inserts.** Without that unique index, two simultaneous transactions creating the same new intake could both succeed under MySQL REPEATABLE READ. The in-transaction re-check narrows this window but does not close it.
- **Applying to a VERIFIED record keeps it VERIFIED.** The change is Super-Admin-applied with evidence and fully audited. If you want such changes to downgrade the record to `NEEDS_REVIEW` (hiding it until re-verified), that is a one-line policy change. Owner decision.
- **Re-approval required.** Approvals made before this change have no hash and must be approved again. After any `apply_failed`, a fresh approval is required before retrying, including after a transient database error.
- **Truncated values are refused.** Values of 191 or more characters (the queue column limit) are refused as possibly truncated.
- **Behaviour changes users will notice:**
  - The course advisor API is now 503.
  - Duplicate merge is now 409.
  - The legacy duplicate list is now 410.
  - `/admin/university-data/duplicates` redirects.
  - The student saved comparison hides non-public courses.
- **Rollback:** revert the files listed above. No data shape changes. Live values changed by a future authorised apply can be restored from `CATALOG_CHANGE_APPLIED.previousValue`. There is no automated rollback.
- **Production:** do not run apply against production without an authorised backup, migration review and release approval.

## Still BLOCKED or pending

- There is **no verified catalogue data**. All repository CSV sets are templated or fabricated (see `UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md`).
- MySQL and DB tests, `prisma generate`, `next build`, staging and live launch.
- Owner decisions:
  - delete or move the git-tracked fabricated CSVs (they are now unreachable at runtime by default);
  - the VERIFIED-downgrade policy;
  - the unique-index migration;
  - building an audited merge workflow;
  - B2B Batch 1 and D1–D6.
- Commit, push, merge and deploy are waiting for your explicit authorisation.

## Final safety and pre-commit review (2026-10-12)

**Owner decisions 1, 2 and 4 are implemented in code. Decisions 3 and 5 are proposals only.** Nothing has been committed, pushed, merged, deployed, migrated or seeded.

### Decision 1: re-approval when the approval fingerprint is missing

`apply-approved-changes.ts` refuses to apply with `APPROVAL_HASH_MISSING` when the latest approval audit entry has no valid SHA-256 fingerprint. This covers legacy `approved` rows and malformed audit data. The review screen shows "Re-approval required", and `approved` rows can be reviewed again. There is no silent upgrade.

### Decision 2: verified records are downgraded when a material change is applied

When a change is applied to a record whose verification status is `VERIFIED`, the same transaction runs a conditional `updateMany` that sets the record to `NEEDS_REVIEW`. It writes a `CATALOG_RECORD_VERIFICATION_DOWNGRADED` audit entry with the previous and new status, and returns `verificationTransition`. Only the record that was directly changed is downgraded. Nothing is ever auto-verified.

### Decision 4: synthetic datasets

- Every runtime reader, seed, the delivery script and the seed API now reads only `fixtures/synthetic-catalogue/`, and only behind a non-production opt-in.
- The 421-file physical move is prepared (`scripts/archive-synthetic-catalogue.mjs --apply`) but **not run**. It belongs to the commit step.
- Details: `SYNTHETIC-CATALOGUE-ARCHIVE.md`.

### Decision 3: intake unique key

`INTAKE-UNIQUENESS-PROPOSAL.md`.

### Decision 5: merge workflow

`MERGE-WORKFLOW-DESIGN.md`.

### Newly found and contained

`POST /api/crm/seed-universities` previously let any ADMIN wipe the university, course, intake, requirement, scholarship and commission tables, and regenerate template data. It now returns `503 CATALOGUE_SEEDER_DISABLED` before authentication or any database access, except under a non-production opt-in, and even then only for Super Admin.

### Test evidence

| Run | Result |
| --- | --- |
| Course Finder set (16 files) | 193 / 193 passed |
| Unit suite | 1699 passed, 6 failed, 5 files did not load |
| Whole repository | 1721 passed, 6 failed, 28 skipped; 9 files failed |
| Scoped tsc (63 changed Course Finder files) | 1 error: `src/lib/db.ts`, `PrismaClient` missing, because `prisma generate` cannot run here |

- The **6 failures** are all in `standalone-verification` (`ERR_MODULE_NOT_FOUND scripts/lib/public-upload-guard.mjs`). They were already failing before this work.
- The **5 unit files that did not load** need a generated `@prisma/client`. In the whole-repository run, 3 integration files also did not load for the same reason.
- Mutation checks confirmed that the decision 1 and decision 2 tests fail when those guards are removed.

**Not run:** build, MySQL, `prisma generate`, and the 63 database tests. These are blocked here and need an operator.

### Pre-existing auto-verify paths (reported only, not changed)

| Path | Behaviour |
| --- | --- |
| `api/admin/courses` POST, `api/admin/courses/create`, `api/admin/courses/[id]` PATCH, `api/admin/universities/[id]` PATCH | Set `verificationStatus` to `VERIFIED` whenever `sourceUrl` is present (Super Admin) |
| `api/course-finder/admin` | Creates `CoursePage` rows as `VERIFIED` |
| `api/import-center` | Approval sets `VERIFIED` on the page models |
| `api/university-monitoring/changes/[id]` | Applying a change sets `VERIFIED` on the page models |
| `lib/official-crawlers/aston-adapter.ts` | Sets `VERIFIED` when the source fetch checks pass |
| `lib/source-intelligence.ts`, `lib/knowledge-base-engine.ts` | Explicit "verify" actions |

These need an owner decision before launch.
