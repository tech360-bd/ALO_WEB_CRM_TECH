# Initial Launch: Course Finder, Data & Import Report

**Date:** 2026-10-12
**Scope:** local working tree on `arena/8b727e17-alo-education-z-ai`. Nothing is committed, pushed or deployed.

## Status

| Area | Status |
|---|---|
| Course Finder implementation (this batch) | **IMPLEMENTATION PARTIAL.** Core pieces are built and unit-tested (E3, mocked DB). Many requested pages and models are not built (see below). |
| University and course data | **NOT COMPLETE.** No verified data exists in the repository (see `UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md`). |
| Live DB repair, backup, 212 tables, deploy | **BLOCKED.** No cPanel, SSH or MySQL access from this sandbox. Prisma engines cannot be downloaded (TLS/egress). |
| Live route, auth and RBAC tests | **BLOCKED** for the same reason. |
| Overall | **NOT COMPLETE.** Not "READY FOR INITIAL PRODUCTION LAUNCH". |
| Archives (5 zips) | **NOT CREATED.** Packaging an incomplete and unverified build would misrepresent it. |

## Built in this batch (local, uncommitted)

### 1. Rule-based eligibility engine
`src/lib/course-finder/eligibility-rules.ts`
- Seven categories.
- The academic level ladder is compared on the same basis only.
- English tests are checked for validity (24 months) and for component scores. MOI gives a condition.
- Budget is compared in the same currency only and is never decisive.
- Research levels go to counsellor review.
- Closed or domestic-only courses are reported as not currently eligible, with a reason and a next step.
- Includes the 3 disclaimers.

### 2. Eligibility API
`/api/course-finder/eligibility-engine` was rewritten.
- It queries only the public catalogue.
- Every result gets a reason, a requirement table, next steps and a source.
- Alternatives must also pass the engine.
- Results are saved only for authenticated STUDENT sessions. Anonymous checks are not stored.

### 3. Public visibility fix
- `publicCourseWhere` now excludes records that are not open to international students.
- The destination pages and `/api/destinations/[slug]` now use the canonical public filters.
- An unknown slug returns 404 instead of UK data.
- Internal fields are stripped.

### 4. Same-data import rule
`src/lib/course-finder/import-diff.ts` and `catalogue-import-service.ts`.

| Row type | Action |
|---|---|
| Identical row | SKIP |
| Formatting-only change (case, whitespace, URL `www`/trailing slash, `20,000` vs `20000`, `Sep` vs `September`) | NORMALIZE, with no write |
| Material change to a verified or published record | PENDING_CHANGE: a field-level `UniversityUpdateRequest` with status `pending_approval`; the live value is unchanged |
| New record | NEW_PENDING_REVIEW |
| Probable duplicate (website host, or normalised name + country) | BLOCK_DUPLICATE |
| Invalid row | INVALID, reported per column |

Blank cells never clear existing values. Formula injection is neutralised.

### 5. `/api/admin/data-import`
Rewritten. Previously it parsed the file, discarded the rows and over-reported `rowsImported`.
- **Authorisation:** an ADMIN or SUPER_ADMIN identity is required (role claims alone do not count), plus a same-origin check.
- **Limits:** CSV only, maximum 5 MB and 500 rows.
- **`preview`:** writes nothing.
- **`queue_changes`:** runs in one transaction. It creates the batch record, queues de-duplicated pending changes, records blocked and invalid rows (values cut to 191 characters), and writes an audit-log entry. It never publishes or verifies anything.

### 6. Admin pages
`/admin/data-import`, `/new`, `/history` and `/[batchId]` replaced hard-coded fake numbers with real API data (`CatalogueImportViews.tsx`).
- New rows are staged through the existing `/api/crm/course-import/confirm`, which creates draft and NEEDS_REVIEW records.
- `/admin/university-data-updates` was fixed:
  - The status filter values were invalid, so the API returned 400.
  - Only one of the two queues was displayed.
  - A missing confidence was shown as a fake "0.9".

### 7. Seed safety
`prisma/seed-complete.ts` no longer loads the template catalogue unless `ALO_SEED_UNIVERSITY_CATALOGUE=1` is set.

> **Conflict to note:** the requirement "seed-complete.ts exit 0" can still be met, because the admin and roles seed runs as before. But it no longer seeds 560 universities, by design. That count would be fabricated data.

## Test evidence (E3 = unit tests with a mocked DB; not database proof)

| Run | Result |
|---|---|
| `npx vitest run tests/unit/course-finder-*.test.ts tests/unit/destination-public-catalogue.test.ts tests/unit/prisma-config-compatibility.test.ts` | **58/58 passed** |
| Related baseline plus new (11 files: public-catalog, public-course-routes, related-catalog-publication, eligibility-engine (old), catalog-import-quarantine, country-destination-resolver, catalog-update-review-security, course-finder ×4) | **136/136 passed** |
| Full `tests/unit` | **1639 passed, 6 failed (164 files)** |

The 6 failures in the full run are not caused by this batch:
- 5 files cannot load `.prisma/client/default`, because `prisma generate` is blocked by TLS/egress. These are accounting-ledger, cms-revisions, broadcast-send, erp-routes-authz-regression and journal-integrity.
- `standalone-verification` fails with a missing `scripts/lib/public-upload-guard.mjs` in its fixture. This comes from the earlier, already-modified `scripts/verify-standalone.mjs`, which this batch did not touch.

**Type check:** standalone `tsc` on all changed files reports only `src/lib/db.ts: no exported member PrismaClient`. Because the Prisma client is not generated, **Prisma query shapes are not type-verified**. Field names were cross-checked against `prisma/schema.prisma` by grep: all fields exist (E1).

## Known limitations (must be read before launch)

- **Identical re-imports:** the old confirm endpoint returns "Duplicate" errors. The new same-data path returns SKIP.
- **Staging limits:** new intakes or requirements under an already VERIFIED or published course cannot be staged, because confirm refuses them. They also cannot be queued as field changes, because there is no existing row to change.
- **Approval does not update the live record:** approving a pending change (`PATCH /api/admin/university-updates`) sets `reviewed_unverified`. **No code applies an approved change to the live record**, and that step remains unimplemented. The "Approved" filter on `/admin/university-data-updates` maps to `approved`, so reviewed items do not appear there.
- **Possible overflow in confirm:** `confirm` writes `JSON.stringify(row)` into `CrmImportError.rowData`, which is VARCHAR(191). Long rows can overflow. This file was not changed in this batch.
- **XLSX:** returns 415. No XLSX parser is installed, and adding a dependency was not approved.
- **Admin page guard:** there is no `src/app/admin/layout.tsx` server guard. The admin pages rely on the proxy and on the API authorisation, and the APIs are the real enforcement.
- **Course URL redirect:** `/courses/[slug]` redirects to `/course/[slug]`.
- **Unused mock component:** `src/components/course-finder/import-history.tsx` is unused mock UI and was left untouched.
- **npm ci:** `npm ci --ignore-scripts` was run in the sandbox to get vitest, without an explicit answer to the earlier question. `node_modules` is not persisted.

## Requested items not built in this batch

- **Not built at all:**
  - CSV templates 00–07 and the XLSX workbook.
  - Pages: `/admin/data-review`, `/data-conflicts`, `/change-approval`, `/data-sources`, `/data-freshness`, `/verification-agents`, `/eligibility-rules`, `/student-matches` and `/counsellor-reviews`.
  - The apply-flow (lead, assessment, checklist and task creation).
  - Assessment versioning.
  - The Compare page.
  - The ranking provider/edition model.
  - The provenance fields not already present in the schema.
  - The international-status enum migration.
  - SEO schema markup.
  - The WCAG audit.
- **Report files not written:** reference-function audit, content-originality report and coverage report (the coverage numbers above are the honest state).
- **Not run:** the guarded deploy script with rollback, and the live 212-table verification. Both are BLOCKED on access.

## Exact operator steps (for later; do not run without approval)

1. **Back up first:** take a cPanel full backup and a `mysqldump --single-transaction` of the live database.
2. **On the server:**
   - Use Node 22.
   - `npm ci`
   - `npx prisma generate` (the official engine download works there).
   - `npx prisma db push`, **without** `--accept-data-loss`. If it asks for data loss, stop and send the output for review.
3. **Seed:** `npx prisma db seed` runs `seed-complete.ts`. It needs `SEED_SUPER_ADMIN_PASSWORD` set in the panel environment, never in chat. The template catalogue is skipped by default.
4. **Check the catalogue state, read-only:** `SELECT verificationStatus, publicationStatus, COUNT(*) FROM CrmCourse GROUP BY 1,2;` Then send the counts only.

## Remediation update (2026-10-12, later the same day)

See `REMEDIATION-PLAN.md` (written before the edits) and `REMEDIATION-RESULTS.md`. Summary:

- **Course advisor:** `/api/agent/course-advisor` is disabled for every method (503) and imports no CSV module.
- **Fabricated CSVs:** the legacy loaders for the CSV sets (including `supervisors.csv`) return no data unless a developer opts in on a non-production environment.
- **Destructive seed:** `prisma/seed-university-data.ts` refuses to run without an explicit non-production opt-in.
- **Approval to apply:**
  - Approval now records a payload hash.
  - A Super-Admin-only apply endpoint revalidates every proposal and applies a batch in one transaction, or applies nothing.
  - Stale proposals are re-queued.
  - Retries are idempotent.
  - Every item is audited.
  - Approval and apply never set a verified status. New intakes are created as `NEEDS_REVIEW`.
- **Admin screens:** the approval queue, history, data review, duplicates and eligibility-rules screens now use real data. The previous demo and placeholder pages were replaced.
- **Compare:** the Compare page uses verified, published records only.

The data status is unchanged: **NOT COMPLETE**. There are zero verifiable catalogue records, and DB, build and launch evidence is still BLOCKED.
