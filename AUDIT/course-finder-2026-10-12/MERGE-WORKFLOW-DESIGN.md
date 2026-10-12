# Audited duplicate-merge workflow: design for review, not implemented

Date: 2026-10-12. Status: **DESIGN ONLY**.

- Nothing in this design has been implemented.
- The legacy merge endpoint still returns `409 MERGE_WORKFLOW_REQUIRED`.
- The legacy duplicate list still returns `410`.
- No schema change or migration has been created.

## 1. Scope and what a merge means

A merge combines two catalogue records that describe the same real entity into one surviving record:

- two `CrmUniversity` rows for one university; or
- two `CrmCourse` rows for one course.

Intake duplicates are covered by `INTAKE-UNIQUENESS-PROPOSAL.md`. They are resolved row by row, not with this workflow.

The design rests on these principles:

- **No data is destroyed.** The losing record is never hard-deleted. It is retired: it is marked merged into the survivor, hidden from the public catalogue, and kept for history.
  - Hard deletion is unsafe. Courses have `onDelete: Cascade` children (`CourseTag`, `CourseIntake`, `EntryRequirement`, `EnglishRequirement`), so deleting a course would silently delete them.
  - Universities have required foreign keys from courses, intakes, requirements, scholarships, rankings, commissions and campuses.
- **Facts are never picked by the machine.**
  - When two records disagree on a fact (fees, deadlines, requirements, URLs, names), a human picks the value, with an evidence URL.
  - When they agree, the value is kept as it is.
- **No record becomes verified through a merge.** A survivor whose values changed moves to `NEEDS_REVIEW`, as with owner decision 2.
- **Commissions are finance data.** Re-pointing `CrmCommission` rows needs a separate finance approval flag.

## 2. What references the records (from `prisma/schema.prisma`)

| Target | Foreign keys (enforced) | Soft references (no FK; text columns) |
| --- | --- | --- |
| `CrmUniversity.universityId` (`@unique`) | `CrmCourse`, `CrmCourseIntakeFee`, `CrmCourseRequirement`, `CrmScholarship`, `CrmRanking`, `CrmCommission`, `Campus` | `Application`, `UniversityUpdateRequest`, `CrmOfficialSourceCheck`, `CrmImportError`, `CrmSourceLog`, `PartnerMarketingRequest`, `EnglishPrep*`, `LanguagePrepLead`, `Scholarship`. Also `universitySlug` in 23 models, e.g. `DataChange`, `DataConflict`, `UniversityHistory`, `CoursePage`, `OfficialSource`, `UniversityAgreement`. |
| `CrmCourse.courseId` (`@unique`) | `CrmCourseIntakeFee`, `CrmCourseRequirement`, `CrmScholarship` (optional), `CrmCommission`, and with cascade `CourseTag`, `CourseIntake`, `EntryRequirement`, `EnglishRequirement` | `Application`, `UniversityUpdateRequest`, `CourseShortlist`, `FinderEligibilityResult` (JSON), `CrmOfficialSourceCheck`, `CrmSourceLog`, `CrmImportError`, `PartnerMarketingRequest`. Also `courseSlug` in 13 models, e.g. `CourseView`, `CourseHistory`, `DataChange`, `DataConflict`. |

The implementation must create this inventory by **reading the schema at test time**, the same way the apply allowlist test does. Any new model that references these keys then fails the test until it is classified. The list above is a snapshot and will go stale.

## 3. Workflow

### 3.1 Preview (read-only)

`POST /api/admin/catalog-merge/preview` with `{ entity: 'university' | 'course', survivorId, retiredId }`.

1. **Authorisation:** Admin or Super Admin, using `requireCatalogAdmin({ level: 'admin' })`. Preview writes nothing.
2. **Refusal codes:**
   - `SAME_RECORD`: both IDs are the same.
   - `NOT_FOUND`: either record is missing.
   - `ALREADY_MERGED`: either record has already been merged.
   - `CROSS_ENTITY`: a course from a different university, unless the universities are being merged in the same plan.
3. **Field comparison.** Returns a field-by-field table for the two records:
   - fields that are equal after normalisation (the import diff's `canonicalValue`);
   - fields that **conflict**, with both values and both evidence URLs;
   - fields filled in only one record.
4. **Child-collision report:**
   - **Intakes:** for each pair with the same course and normalised year and month, are they identical or conflicting?
   - **Requirements:** one row per course, so two rows means a conflict.
   - **Scholarships:** same name.
   - **Rankings:** same provider and edition.
   - **Campuses:** same name.
   - **Commissions:** any overlap.
5. **Reference counts** for every FK and soft reference in section 2, so the reviewer can see the blast radius.
6. **Plan hash.** SHA-256 over:
   - both records' `updatedAt` and their field values;
   - the child IDs and their `updatedAt`;
   - the reference counts.

   This works like the approval fingerprint in `catalog-change-payload.ts`.

### 3.2 Decision (stored; nothing live changes)

`POST /api/admin/catalog-merge/plans`. The body contains:

- `planHash`;
- per conflicting field: `{ field, chosen: 'survivor' | 'retired', evidenceUrl }`;
- per child collision: `{ childId, action: 'move' | 'retire' }`;
- an optional `includeCommissions: true`.

Rules:

1. **Authorisation:** Admin or Super Admin, same origin.
2. **Validation:**
   - Every conflict must have a decision.
   - Every decision must carry an HTTPS evidence URL on a real domain, using the existing `urlProblem` rule.
   - Any `includeCommissions` plan stays blocked until a finance approver signs it off.
3. **Storage:**
   - The plan is stored with status `approved_for_merge` (a reviewer other than the author is recommended).
   - A `CATALOG_MERGE_PLAN_APPROVED` audit entry records the full plan and its hash.
4. **Effect:** nothing live changes.

### 3.3 Execute (Super Admin, one transaction)

`POST /api/admin/catalog-merge/execute` with `{ planId }`.

1. **Authorisation:**
   - Super Admin only, same origin, and not while impersonating (`requireCatalogAdmin({ level: 'superAdmin', mutation: true })`).
   - Refused in production until the release gate in section 6 is met.
2. **Re-check before the transaction.** Recompute the plan hash from live data.
   - Any difference returns `PLAN_STALE`. The plan goes back to review, the same as stale catalogue proposals.
3. **Single `$transaction`.** If any step fails, everything rolls back. Steps in order:
   1. **Claim the plan:** `updateMany({ id, status: 'approved_for_merge' }) → 'merging'`. The count must be 1, which gives idempotency and blocks a concurrent execute.
   2. **Re-read both records and their children inside the transaction.** Recompute the hash. A mismatch throws, and the whole transaction rolls back.
   3. **Apply the chosen field values to the survivor:**
      - conditional on the survivor's `updatedAt`;
      - set `lastApprovedUpdateAt` and `updatedBy`;
      - if any value changed, set `verificationStatus = 'NEEDS_REVIEW'` and write a `CATALOG_RECORD_VERIFICATION_DOWNGRADED` audit entry.
   4. **Re-point FK children from the retired record to the survivor:** `updateMany({ where: { universityId: retired } })`, and the same for `courseId`. Count each and compare with the preview count. A different count throws.
      - Colliding children marked `retire` move the same way, but are archived: `status = 'archived'` and `verificationStatus = 'NEEDS_REVIEW'`.
      - Colliding intakes are **never** kept as two active rows. This keeps the intake unique key intact.
   5. **Re-point soft references on an explicit allowlist:** `Application`, `CourseShortlist`, `UniversityUpdateRequest`, and so on. Same per-table count check.
      - Slug-based history tables (`UniversityHistory`, `CourseHistory`, `DataChange`) are **not rewritten**. History stays attached to the original slug, and the redirect in step 6 links them.
   6. **Retire the losing record:**
      - Set `status = 'merged'`, `publicationStatus = 'draft'` and `verificationStatus = 'NEEDS_REVIEW'`.
      - Record `mergedIntoId = survivorId`. This needs a new nullable column; until that is reviewed, the value is kept in the audit entry and in a `Redirect`-style table if one exists.
      - The public filters already exclude it, because it is no longer `VERIFIED` or `published`.
   7. **Write the audit entry:** one `CATALOG_MERGE_EXECUTED` entry. It records:
      - the actor;
      - the plan ID and hash;
      - before and after values for every survivor field;
      - the moved child IDs per table, with counts;
      - the soft-reference counts per table;
      - the retired record's full row JSON.
   8. **Mark the plan done:** set its status to `merged`.
4. **After commit:** revalidate the affected public pages, and return a per-table summary.

### 3.4 Conflict detection summary

Execution is refused, and nothing is written, in each of these cases:

| Condition | Code |
| --- | --- |
| Stale plan hash, either before or inside the transaction | `PLAN_STALE` |
| Moved-row counts differ from the preview | `REFERENCE_COUNT_CHANGED` |
| A colliding child has no decision | `UNRESOLVED_COLLISION` |
| Commissions included without finance approval | `FINANCE_APPROVAL_REQUIRED` |
| Either record already merged | `ALREADY_MERGED` |
| Circular plan (A into B while B into A) | `CIRCULAR_MERGE` |
| A pending catalogue proposal (`UniversityUpdateRequest`) targets the retired record | `PENDING_PROPOSALS` (re-point or reject them first) |

## 4. Rollback and recovery

- **During execution:** any error rolls back the whole transaction. The plan stays `approved_for_merge`, or becomes `merge_failed` with a failure audit entry. The live catalogue is unchanged.
- **After a successful merge:** `POST /api/admin/catalog-merge/unmerge` (Super Admin) builds the reverse plan from the `CATALOG_MERGE_EXECUTED` audit JSON:
  1. Restore the retired row's fields.
  2. Move back exactly the child IDs that were moved, conditional on their current parent being the survivor.
  3. Restore the survivor's previous field values, conditional on its `updatedAt` being unchanged since the merge. If either record changed after the merge, the unmerge becomes a reviewed plan instead of an automatic one.
  4. Write a `CATALOG_MERGE_REVERSED` audit entry.
- **Disaster recovery:** an authorised database backup taken before the first production merge batch, recorded with its checksum.

## 5. Tests required before enabling

Write these against the fake DB first. MySQL integration tests on a disposable database are required before production.

1. Preview writes nothing, and reports conflicts, collisions and reference counts.
2. A plan without decisions for every conflict, or without evidence URLs, is refused.
3. Admin can preview and plan. Only Super Admin can execute. Impersonation, cross-origin and non-admin requests are refused before any database access.
4. Execute is all-or-nothing: an injected failure at every step leaves the database byte-identical.
5. Stale-plan checks before and inside the transaction. Concurrent double execute: one wins, the other gets `ALREADY_MERGED` or `PLAN_STALE`.
6. Every FK child moves. Cascade children are never deleted. Child counts per table are preserved.
7. Colliding intakes never end up as two active rows for one course and month.
8. The survivor moves to `NEEDS_REVIEW` when its values change. Nothing becomes verified. The retired record disappears from the public catalogue, Compare and destination pages.
9. Commissions are untouched unless finance approval is present.
10. Unmerge restores the exact pre-merge state when nothing changed afterwards, and refuses (sending the plan to review) when something did.
11. The schema-driven reference inventory test fails when a new model references `universityId` or `courseId` and has not been classified.
12. The audit entries contain the before and after values, the moved IDs and the retired row JSON, and no secrets.

## 6. Migration and data implications (to review before implementing)

- **Proposed nullable columns:** `mergedIntoId String @default("")` on `CrmUniversity` and on `CrmCourse`, plus an index. This is additive and needs no data rewrite.
- **Proposed new table** `CatalogMergePlan`: id, entity, survivorId, retiredId, planHash, decisions (LongText JSON), status, createdBy, approvedBy, executedBy, timestamps. The alternative, with no new table, is to keep plans in `PortalAuditLog` only, which makes them harder to query and claim atomically. The new table is recommended.
- **Status value `merged`** in the existing string `status` column. There is no enum change. Readers that list "all universities" should exclude `merged`; the public filters already do, through verification and publication.
- Re-pointing touches **`Application`** (student records) and **`CrmCommission`** (finance). Both need owner sign-off and a backup before the first production run.
- **Release gate:** migration review, a disposable-MySQL test run, a backup, and explicit release approval.
