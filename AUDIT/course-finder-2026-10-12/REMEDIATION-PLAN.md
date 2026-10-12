# Course Finder: remediation report (pre-implementation)

Date: 2026-10-12 · Branch `arena/8b727e17-alo-education-z-ai` · HEAD `c5bfcbb` (equal to `main`) · Status: **NOT COMPLETE**

This report was written **before** any remediation edits, as approved-plan step H requires.
Results recorded after implementation are in `REMEDIATION-RESULTS.md`.

## 0. Preserved state (step A)

- The working tree already had 282 porcelain entries before this phase: 159 tracked and 98 untracked from the earlier baseline, plus the Course Finder work from the previous phase.
- None of these entries has been reset, stashed, cleaned or overwritten.
- `src/app/api/admin/university-data-updates/route.ts` and `src/app/api/course-finder/universities/route.ts` show diffs, but they are **pre-existing baseline changes**. Their mtime is the snapshot-restore time. They were not authored in the Course Finder phase.
- Earlier in this session I ran `npm ci --ignore-scripts` (exit 0) to get `vitest` into `node_modules`.
  - This is a disclosure: `package.json` and `package-lock.json` were not changed by it.
  - `node_modules` is not persisted between sandbox snapshots.
  - I will not run it again without authorisation.
- `prisma generate` fails in this sandbox because outbound TLS to the Prisma engine CDN is blocked. As a result:
  - there is no generated Prisma client;
  - tests that import the real `@prisma/client` cannot run;
  - no MySQL-compatibility claim is made.
- Nothing was committed, pushed, merged or deployed, and no production system was touched.

## 1. Fabricated data containment (step C)

### Where the fabricated data is read

| Reader | Runtime? | Files read | Exposure |
| --- | --- | --- | --- |
| `src/app/api/agent/course-advisor/route.ts` → `src/lib/ai-agents/international-course-agent.ts` | yes (Next.js route) | `universities.csv`, `course_intakes.csv`, `tuition_fees.csv` | Any authenticated session. There is no in-handler role check and the route is not in the proxy public lists. GET claims "560 universities, 11200 courses … no course omitted". |
| same route → `src/lib/ai-agents/supervisor-matcher.ts` | yes | `supervisors.csv` (2,821 invented people with invented e-mails at real university domains), `courses.csv` | **P0:** invented names and e-mail addresses are served to any logged-in user. |
| `src/lib/ai-agents/campus-course-mapper.ts` | No callers anywhere in `src/` | `campuses.csv`, `courses.csv` | Dormant |
| `src/components/course-finder/import-history.tsx` | UI | none (mock file names only) | None |
| `prisma/seed-complete.ts` | manual seed | `courses.csv` and others | Already gated behind `ALO_SEED_UNIVERSITY_CATALOGUE=1` (previous phase). Seeded statuses are not `VERIFIED`, so seeded rows stay hidden from the public catalogue. |
| `prisma/seed-university-data.ts` | Manual only; not wired to `npm run db:seed` | `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` or the CSVs | **Runs `coursePage.deleteMany({})` and `universityPage.deleteMany({})` with no guard.** |
| `scripts/build-delivery-packages-portable.sh`, `scripts/{generate_full_dataset,regenerate_csvs_every_month,generate_missing_universities_and_intakes,enhance_gcu_london}.py`, `scripts/verify-15-cron.ts` | offline tooling | generate or copy the fabricated sets | Not part of the build or start scripts. The packaging script repeats the false "560 verified" claim. |

`next.config.ts` has no `outputFileTracingIncludes`, and no CSV lives in `public/`.
The root CSVs are therefore only reachable at runtime through `process.cwd()` reads in the three `ai-agents` modules.
On Hostinger the standalone app runs from the repository checkout, so those reads would find the files.

### Planned changes (smallest safe set; no file deletions)

1. **`src/app/api/agent/course-advisor/route.ts`** will fail closed:
   - every method returns `503 {disabled: true, code: 'COURSE_ADVISOR_DISABLED_UNVERIFIED_DATA'}`;
   - it will import no CSV-reading module;
   - this happens before any data access, for every role, authenticated or not.
2. **`supervisor-matcher.ts`, `international-course-agent.ts` and `campus-course-mapper.ts`** will get an in-module guard: the CSV loaders return `[]` unless `ALO_ALLOW_SYNTHETIC_AGENT_DATA=1` **and** `NODE_ENV !== 'production'`. This is defence in depth if someone re-imports the modules later. The modules stay in place and their exports do not change.
3. **`prisma/seed-university-data.ts`** will refuse to run unless both of these are true:
   - `ALO_ALLOW_DESTRUCTIVE_TEMPLATE_SEED=1`;
   - `NODE_ENV !== 'production'`.
4. **Static containment test:** no runtime file under `src/` may reference the fabricated CSV names, except the three guarded modules. It also checks that the course-advisor route imports none of them.
5. The CSV files themselves **are not deleted.** They are git-tracked and are referenced by offline scripts, so deleting them is an owner decision. See section 7.
6. The existing public filter (`publicCourseWhere` and related filters require exact `VERIFIED` + `published` + `public`) and the destination-slug 404 stay as they are and keep their tests.

## 2. Approval-to-apply workflow (step D)

### Schema findings (inspected, not guessed)

- **`UniversityUpdateRequest`** (the legacy proposal queue used by the CSV import and the CRM University Data Update Center) has these fields: `id`, `universityId`, `courseId`, `entityType`, `entityName`, `country`, `fieldName`, `oldValue`, `newValue`, `evidenceUrl`, `aiConfidence`, `status`, `reviewedBy`, `createdAt`, `updatedAt`.
  - All string fields are `VARCHAR(191)`.
  - There is no version or hash column.
- **`WeeklyUpdateRequest`** (the second queue) has `targetType` and `targetId` but no typed mapping to `Crm*` fields. Its approve, edit and publish paths are already disabled (409) in this codebase.
- **`CrmCourseIntakeFee`** has **no `@@unique`** on (courseId, intakeYear, intakeMonth). Duplicates therefore have to be checked inside the transaction.
- **`DataChange` and `DataConflict`** belong to a separate official-source verification pipeline with slug-based targets. They are not wired into this flow and I will not reuse them.
- `PortalAuditLog` (`actorUserId`, `action`, `entityType`, `entityId`, `metadata`) is the existing audit table.

**Decision: no Prisma migration.** The workflow can be built on the existing columns:

| Requirement | Implementation without schema change |
| --- | --- |
| Statuses pending / approved / rejected / applied / failed | `pending_approval` (also legacy `pending`) / `reviewed_unverified` (the existing "approved, not verified" state, shown as "Approved – not applied") / `rejected` / new `applied` / new `apply_failed`. Both new values fit the existing free-text `status` column. |
| Approval separate from apply | Approve (existing endpoint, ADMIN or SUPER_ADMIN) never touches catalogue tables. Apply is a new endpoint, **SUPER_ADMIN only**, same-origin. |
| Payload hash | At approve time, SHA-256 is taken over (id, universityId, courseId, entityType, fieldName, oldValue, newValue, evidenceUrl) and stored in the approve audit record's `metadata.approvedPayloadHash`. Apply recomputes it and requires an exact match with the **latest** approve audit. Approvals made before this change have no hash, so they must be re-approved. |
| Revalidation at apply | Each proposal is checked for: field on an allowlist (taken from the import-diff specs, with the Prisma type of every field verified against `schema.prisma` by a test); value type and coercion (Int, Float, Boolean, String; non-finite numbers rejected); HTTPS evidence URL with no credentials; target identity (university exists; course belongs to the university; exactly one matching intake or requirement row); and no two proposals touching the same target field in one batch. |
| Stale check | The live value (canonicalised) must equal `oldValue`. If it does not, the proposal goes back to `pending_approval` with `oldValue` refreshed to the live value, and a `CATALOG_CHANGE_STALE_REQUEUED` audit is written. Because the payload changed, the old approval hash no longer matches, so a fresh review is required. The value is re-checked **inside** the transaction before each write. |
| Atomic batch | One `$transaction` per batch (max 50). If any item fails validation, nothing in the catalogue is written. Each proposal is claimed with a conditional `updateMany` (status `reviewed_unverified` + the exact payload). A claim count other than 1 rolls back the whole batch. |
| Idempotent retries | Proposals that are already `applied` are reported as `already_applied` and nothing is written. A re-sent request after success is therefore a no-op. |
| Failure recording | Validation failures set `apply_failed` (or requeue when stale), with an audit record. On an unexpected transaction error the transaction rolls back, and a separate best-effort write then marks the still-approved items `apply_failed` and audits `TRANSACTION_FAILED`. If that write also fails, the API returns 503 and claims nothing. |
| Audit | Every applied item gets `CATALOG_CHANGE_APPLIED`, recording the actor, timestamp (`createdAt`), target model and key, previous live value, approved value, evidence URL, approval hash, approval audit id and result. |
| Approval ≠ verified | Apply never writes `verificationStatus`, `publicationStatus`, `visibility` or `lastVerifiedAt`. Those fields are not on the allowlist. An unverified record stays unverified and hidden. |
| New intake on an existing verified course | The import now emits `intake_new:YYYY-MM:<field>` proposals when the course exists but the intake does not. Previously such rows went to the draft-staging path, which refuses courses that are already verified. All proposals for that course and intake must be approved and applied together. The new `CrmCourseIntakeFee` row is created with `verificationStatus: 'NEEDS_REVIEW'`, so it is **not public** until it is separately verified. |

The existing `approve` behaviour gains one thing: the hash in its audit metadata.
It also accepts `apply_failed` as a reviewable state. The existing `reviewCatalogUpdate` status values and its tests stay valid.

## 3. Admin screens (step E)

All of these are new `/admin/*` pages backed by admin-only APIs that read real tables. Unavailable or failed states are shown as such, with no sample data.

- `/admin/change-approval`
  - Shows both queues (legacy proposals, which can be applied; weekly requests, read-only with the honest reason).
  - Selection and apply are offered for Super Admins.
  - Per-item apply results are shown exactly as the server returns them.
- `/admin/change-approval/history`: `PortalAuditLog` entries for proposal review, apply, stale-requeue and failure.
- `/admin/data-review`
  - Counts by verification and publication status, plus how many records are actually public under the real public filter.
  - Records with their provenance fields (source URL, last verified, verification and publication status).
- `/admin/data-review/duplicates`
  - Probable duplicate universities (same matcher as the import) and open `DataConflict` rows.
  - Merge is **not** provided; the page says so.
- `/admin/eligibility-rules`
  - Read-only view of the 7 categories, the disclaimers and the rule behaviour taken from `eligibility-rules.ts`.
  - A validation harness runs the real engine against built-in synthetic profiles in the browser. It is labelled synthetic and stores nothing.
- Import preview and history: already built in the previous phase.

## 4. Templates and Compare (step F)

- **Templates**
  - `docs/catalogue-import/` will hold a template guide and a header-only CSV template.
  - A clearly synthetic example will use `SAMPLE-` IDs and `.invalid` domains.
  - The import validator will **reject** any row with `SAMPLE-` IDs or `example`/`.invalid`/`.test` hosts, so the example cannot enter the database.
- **Compare**
  - A new public read-only API returns up to 4 courses, using only `publicCourseIdentifierWhere` (verified + published + public) and `publicIntakeWhere` / `publicRequirementWhere`.
  - Unknown or unverified IDs are listed as `unavailable`, with nothing else disclosed.
  - The public `/compare` page will render that data.
  - The existing student compare GET will also be filtered through the public filters, because it currently returns unverified courses.
  - Eligibility in Compare reuses the existing `/api/course-finder/eligibility-engine` route, so alternatives go through the same engine and the same 7 categories.

## 5. Tests (step G)

- New unit and integration tests (mocked Prisma; DB tests are BLOCKED) will cover:
  - containment;
  - unauthorised access (non-admin, ADMIN trying to apply, cross-origin);
  - the public filter and the 404 (existing tests kept);
  - stale approval;
  - duplicate import (idempotent queueing);
  - a failed transaction (rollback, no partial updates, failure recorded);
  - idempotent retry;
  - payload-hash mismatch;
  - the audit record;
  - creating a new intake;
  - the allowlist matching the Prisma schema;
  - the template guard.
- Unit, integration, type-check and build results will be reported separately, along with the 58 / 136 / 1639+6 baselines.

## 6. Dependency impact, migration and rollback

- **Dependencies:** none added, removed or upgraded. Only `node:crypto` (built in) and existing `zod`.
- **Migration:** none. New status values are strings in existing columns.
- **Rollback:** revert the files in the diff. No data shape changes.
  - Rows already moved to `applied` or `apply_failed` by a future authorised run would remain. The existing CRM list accepts `all`, and the UI shows those values.
  - Live catalogue values changed by apply can be restored from the `CATALOG_CHANGE_APPLIED` audit (`previousValue`).
  - Automated rollback is **not** built; the legacy rollback path stays 409.
- **Production:** apply must not be run against production without an authorised backup, migration review and release approval.

## 7. Risks and blockers

- **BLOCKED: no Prisma client and no MySQL.** Transaction semantics, the `updateMany` claim and isolation behaviour are verified only against mocks.
  - MySQL REPEATABLE READ does not stop two concurrent transactions from both inserting the same new intake, because there is no unique index. The in-transaction re-check narrows that window but does not close it. Closing it needs `@@unique([courseId, intakeYear, intakeMonth])`, which is an owner-approved migration and needs existing duplicates cleaned first.
- **Whole-app `tsc` runs out of memory,** and `next build` cannot run without a Prisma client. Type checks are scoped to the touched files.
- **Owner decisions:**
  - whether to delete or move the git-tracked fabricated CSVs;
  - whether applying a change to a VERIFIED record should downgrade it to NEEDS_REVIEW (current design keeps its verification status, and the change is Super-Admin-approved with evidence);
  - the unique-index migration;
  - approval of the B2B batch (D1–D6), which is still pending.
