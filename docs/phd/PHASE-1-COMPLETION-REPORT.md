# Phase 1 completion report — PhD API, workspace UI and public research pages

_Date: 2026-10-26 · Branch: `arena/fd119d66-alo-web-crm-tech`_

## 1. Commits in this phase

| Commit | Summary |
|---|---|
| `0d327bb7` | Statement-of-purpose builder: four additive tables + migration, deterministic generator, content checks, review trail, DOCX/PDF/report exports, panel and page, 23 unit + 11 integration tests, `docs/phd/SOP-BUILDER.md` |
| `ae9cbff8` | Research workspace UI (10 panels), `/student/phd/**` pages, public `/research-opportunities` directory and detail pages, `/api/phd/jobs` + `/api/phd/jobs/run`, saved supervisor-match reader, `phd-maintenance` cron job registered in scheduler, definitions, route and `vercel.json` |

A third commit contains the second audit, the source-verification record, the
route-authorization test and the small dead-code removals described below.

Prior work in this branch (before `ae9cbff8`) delivered the PhD service layer,
33 original API routes, the 47-table migration, AI gateway integration, export
writers and the audit/documentation set.

## 2. Delivered surface

| Area | Count | Where |
|---|---|---|
| PhD API routes | 51 | `src/app/api/phd/**` |
| Public research API routes | 2 | `src/app/api/research/programmes/**` |
| PhD cron route | 1 | `src/app/api/cron/phd-maintenance/route.ts` |
| Student workspace pages | 11 | `src/app/student/phd/**` (all `noindex`) |
| Public research pages | 2 | `src/app/research-opportunities/**` |
| Workspace panels | 10 + SOP | `src/components/phd/panels/**` |
| Prisma models | 51 PhD (603 total) | `prisma/schema.prisma` |
| Additive migrations | 2 | `20261025120000_phd_proposal_builder`, `20261026120000_phd_sop_builder` |
| Unit test files | 15 | `tests/unit/phd/**` |
| Integration tests | 49 | `tests/integration/phd/services.test.ts` |

The API covers: dashboard, profile, projects, topic generation/selection/evaluation,
literature and evidence claims, supervisors (directory, matching, outreach),
proposals (sections, quality, citations, versions, DOCX/PDF export), funding, fees,
deadlines, timeline, documents (upload/download/soft delete), applications and
tasks, commission (records, calculation, agreements, PDF documents), notifications,
research jobs, statement of purpose and the verification queue.

## 3. Verified evidence

| Gate | Command | Result |
|---|---|---|
| Lint (whole source tree) | `npx eslint src` | **0 errors, 0 warnings** |
| Unit + integration suite | `npx vitest run` | **303 files passed, 3 420 tests, 0 failed, 143 skipped** |
| PhD service contracts on a real database | `ALO_DB_DRIVER=sqlite DATABASE_URL=file:$PWD/.phd-tmp/phd-test.db npx vitest run tests/integration/phd` | **49/49 passed** |
| Type check — routes shard | `tsc -p .audit-phd-routes.json` | **exit 0** |
| Type check — UI shard | `tsc -p .audit-phd-ui.json` | **exit 0** |
| Type check — SOP shard | `tsc -p .audit-phd-sop.json` | **exit 0** |
| Prisma schema | `npx prisma validate` | **valid** |
| Verification mirror | `npm run awf:mirror` + `prisma generate` | **603 models (51 PhD)** |
| Scheduler certification | `npx tsx scripts/cron-scheduler-policy-check.ts` | **225/225 assertions** |
| Design-token guardrail | part of the suite | **17/17** |

The integration suite proves, against real rows: statement privacy across
students, duplicate refusal, adviser-only approval, edit-invalidates-approval,
DOCX/PDF/report signatures, review-trail integrity, commission exclusions and the
absence of private content in audit details.

## 4. Blocked gates (not passed, not claimed)

| Gate | Status | Reason |
|---|---|---|
| Whole-repo `tsc` | **BLOCKED** | V8 heap OOM at 3.2 GB (container 3.9 GB). Coverage obtained through three overlapping shards that include every changed file |
| `next build` | **BLOCKED** | Same memory ceiling; production bundle unverified here |
| `prisma migrate deploy` on MySQL | **BLOCKED** | No MySQL server, client or `mysqldump` in this environment |
| Backup/restore drill | **BLOCKED** | `mysqldump` absent; no disposable MySQL instance |
| StarRocks restore test | **BLOCKED** | Requires a disposable StarRocks 3.5+ cluster; the tool is reviewed, not adopted |
| Live source verification of the 27 institutions | **BLOCKED** | Outbound network limited to GitHub and package registries; see `docs/phd/SOURCE_VERIFICATION.md` |

## 5. Data-honesty notes carried into the product

- Public programme visibility requires `VERIFIED_OFFICIAL` on the programme **and**
  the university's research-degrees page, plus an `officialUrl`.
- Fees, deadlines, requirements and funding each gate themselves; home and
  international fees are separate rows and are never merged.
- A 503 from the public API means "catalogue unavailable"; an empty result means
  "no verified match". Neither is rendered as "not offered".
- Unknown values stay `null`; no requirement, fee, deadline or commission rate is
  guessed.
- The SOP builder emits no invented achievements, no shared template text and no
  detector score; blocking checks stop approval and final export.

## 6. Catalogue figures (measured earlier in this branch, unchanged)

- Seeded course rows: **17 581 / 17 653 (97.4 %)**.
- Verified rows: **472**.
- `CATALOGUE_NOT_ACCESSIBLE` results: **399 / 400** sampled universities.
- Constructed `<root>/courses/<slug>` URLs found in the legacy CSV:
  **2 464 / 4 000 sampled** — the reason those rows stay quarantined.

These figures come from the import/validation runs recorded in
`docs/course-catalogue/import-validation-results.md`; they were **not** re-measured
in this phase.

## 7. Rollback instructions

1. `git revert 0d327bb7 ae9cbff8` (and the audit commit) restores the previous code
   state. Nothing in this phase rewrote history.
2. The two migrations are **additive**: they create new tables and indexes only.
   Reverting the application code leaves them dormant and harmless. Dropping them
   is a separate, approval-gated operation:
   `DROP TABLE PhdSopReview, PhdSopVersion, PhdSopSection, PhdStatementOfPurpose;`
   after exporting any statement a student still needs. Do **not** run it without
   explicit approval and a verified backup.
3. The `phd-maintenance` cron entry can be paused by removing its declaration from
   `src/cron/cron-definitions.ts` and `vercel.json`; the route then returns 501
   ("unknown scheduled job") rather than doing partial work.
4. No production database was written during this phase. All database verification
   used the throwaway SQLite mirror at `.phd-tmp/phd-test.db`.

## 8. Remaining work after this phase

- Run `next build` and the full `tsc` on a machine with ≥ 8 GB free, then record
  both exit codes.
- Apply and verify the two migrations on a disposable MySQL 8 instance, then run the
  backup/restore drill with row counts and RPO/RTO evidence.
- Complete the two-reviewer source verification for the 27 institutions and import
  the first verified programmes, fees and deadlines.
- Continue the broader repository audit items unrelated to the PhD module
  (marketing/CRM surfaces) recorded in `docs/audit/COMPLETE-REPOSITORY-AUDIT-2026-10-25.md`.
