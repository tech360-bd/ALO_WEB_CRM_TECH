# Intake uniqueness: proposal only, not applied

Date: 2026-10-12. Status: **PROPOSAL**. No migration was created, `prisma/schema.prisma` was not changed, and no database was read or modified. Every SQL statement below is for an operator to run later, and only after approval.

## 1. What the code and schema say today

### Schema (`prisma/schema.prisma`, `model CrmCourseIntakeFee`, MySQL)

- Identity columns:
  - `courseId`: FK to `CrmCourse.courseId`, which is `@unique`.
  - `universityId`: FK to `CrmUniversity.universityId`. This repeats the course's university.
  - `intakeYear`: `Int`.
  - `intakeMonth`: **free-text** `String` (VARCHAR(191)).
- Not identity:
  - `intakeName`, a display label such as "September 2027";
  - `status`, which is `active` / archived;
  - fee, deadline, provenance and `verificationStatus` columns.
- Indexes: `@@index([courseId])`, `@@index([universityId])`, `@@index([intakeYear, intakeMonth])`, `@@index([status])`.
- **There is no unique constraint.** The database will accept two rows for the same course and month.
- The model has no campus, study-mode or fee-category column. Campus belongs to the course (`CrmCourse.campusId` / `campus`). One course record therefore has at most one intake per year and month.
- No table has a foreign key to `CrmCourseIntakeFee.id`. `Application.intakeId` is a nullable free-text column with no relation; it must be checked before any row is removed (see step C3).

### Identity rules already in the code

All three treat **course + year + month** as the intake identity:

| Code | Rule |
| --- | --- |
| `src/app/api/crm/course-import/confirm/route.ts` | `buildDuplicateKey(universityId, courseId, intakeYear, intakeMonth)` |
| `src/lib/course-finder/catalogue-import-service.ts` | `intake:<YYYY-MM>:<field>` / `intake_new:<YYYY-MM>:<field>`. The month is normalised to `01`–`12` with `canonicalValue(_, 'month')`. |
| `src/lib/course-finder/apply-approved-changes.ts` | Matches on `courseId` + `intakeYear` + normalised month. Refuses `DUPLICATE_TARGET` when more than one row matches, and writes the full English month name when it creates a row. |

### Write paths that create or alter intakes

Found by searching for `crmCourseIntakeFee.(create|createMany|upsert|update|updateMany|delete|deleteMany)`.

| Path | How `intakeMonth` is written | Duplicate check today |
| --- | --- | --- |
| `src/lib/course-finder/apply-approved-changes.ts` | Full English name (`MONTH_NAMES`) | Yes: before the transaction and again inside it. A race between two concurrent transactions is still possible. |
| `src/app/api/admin/courses/create/route.ts`, `src/app/api/admin/courses/route.ts` (POST) | Client value, default `'September'` | No |
| `src/app/api/admin/courses/[id]/route.ts` | `updateMany` (no identity change) | n/a |
| `src/app/api/admin/import/courses/route.ts` | Raw CSV `intake_month`, trimmed but **not normalised** | No |
| `src/app/api/crm/course-import/confirm/route.ts` | CSV value | Yes, in application code, on the raw month text |
| `src/app/api/crm/course-import/rollback/route.ts` | `deleteMany` by batch | n/a |
| `src/app/api/crm/seed-universities/route.ts` | Generated | **Now disabled** unless a developer opts in outside production (this review) |
| `prisma/seed-complete.ts` (catalogue part), `prisma/seed-universities.ts`, `scripts/seed-*.ts` | Generated or CSV | Development or opt-in only |

Because the month is free text, `Sep`, `09`, `September` and `september` can all describe the same intake. MySQL's default case-insensitive collation would treat `september` and `September` as equal in a unique index, but not `Sep` and `September`.

## 2. Proposed business key

**One intake per (course, intake year, intake month), with the month stored as the canonical full English name (`January` … `December`).**

```prisma
// Proposed. Do not apply until the cleanup in section 4 is complete and approved.
model CrmCourseIntakeFee {
  // ...existing fields unchanged...
  @@unique([courseId, intakeYear, intakeMonth], map: "CrmCourseIntakeFee_course_year_month_key")
}
```

Why this key:

- **`courseId`, not `universityId`.** `courseId` is globally unique and already decides the university. Adding `universityId` would only allow inconsistent pairs.
- **The month must be canonical before the index means anything.** So the rollout below normalises every write path first, then backfills existing rows, and only then adds the index.
- **`status` is left out.** Archived duplicates would otherwise hide real duplicates and keep two "truths" for one intake. Archived duplicates must be resolved during cleanup.
- **`intakeName` is left out.** It is a label, not identity.
- **Index size is safe for MySQL/InnoDB:**
  - `courseId` VARCHAR(191) × 4 bytes = 764
  - `intakeYear` = 4
  - `intakeMonth` VARCHAR(191) × 4 bytes = 764
  - Total ≈ 1.5 KB, under the 3,072-byte limit.

**Alternative.** Add an `intakeMonthNumber Int` column and put the unique index on `(courseId, intakeYear, intakeMonthNumber)`. This is more robust against free text, but it needs a backfill and every reader must be changed. It is not recommended now.

## 3. Duplicate-detection queries (read-only)

The table name is `CrmCourseIntakeFee` (the model has no `@@map`). These are `SELECT` statements only. Run them against an authorised copy first.

### Q1: exact-key duplicates (rows the proposed index would reject as stored today)

```sql
SELECT courseId, intakeYear, intakeMonth, COUNT(*) AS rows_in_group,
       GROUP_CONCAT(id ORDER BY updatedAt DESC) AS ids_newest_first,
       GROUP_CONCAT(DISTINCT verificationStatus) AS verification_labels,
       GROUP_CONCAT(DISTINCT status) AS statuses
FROM CrmCourseIntakeFee
GROUP BY courseId, intakeYear, intakeMonth
HAVING COUNT(*) > 1
ORDER BY rows_in_group DESC, courseId;
```

### Q2: duplicates after month normalisation (the real business-key collisions)

```sql
SELECT courseId, intakeYear, month_no, COUNT(*) AS rows_in_group,
       GROUP_CONCAT(CONCAT(id, ':', intakeMonth) ORDER BY updatedAt DESC) AS ids_and_raw_months,
       GROUP_CONCAT(DISTINCT verificationStatus) AS verification_labels
FROM (
  SELECT id, courseId, intakeYear, intakeMonth, updatedAt, verificationStatus,
    CASE LOWER(TRIM(intakeMonth))
      WHEN 'january' THEN 1 WHEN 'jan' THEN 1 WHEN '1' THEN 1 WHEN '01' THEN 1
      WHEN 'february' THEN 2 WHEN 'feb' THEN 2 WHEN '2' THEN 2 WHEN '02' THEN 2
      WHEN 'march' THEN 3 WHEN 'mar' THEN 3 WHEN '3' THEN 3 WHEN '03' THEN 3
      WHEN 'april' THEN 4 WHEN 'apr' THEN 4 WHEN '4' THEN 4 WHEN '04' THEN 4
      WHEN 'may' THEN 5 WHEN '5' THEN 5 WHEN '05' THEN 5
      WHEN 'june' THEN 6 WHEN 'jun' THEN 6 WHEN '6' THEN 6 WHEN '06' THEN 6
      WHEN 'july' THEN 7 WHEN 'jul' THEN 7 WHEN '7' THEN 7 WHEN '07' THEN 7
      WHEN 'august' THEN 8 WHEN 'aug' THEN 8 WHEN '8' THEN 8 WHEN '08' THEN 8
      WHEN 'september' THEN 9 WHEN 'sept' THEN 9 WHEN 'sep' THEN 9 WHEN '9' THEN 9 WHEN '09' THEN 9
      WHEN 'october' THEN 10 WHEN 'oct' THEN 10 WHEN '10' THEN 10
      WHEN 'november' THEN 11 WHEN 'nov' THEN 11 WHEN '11' THEN 11
      WHEN 'december' THEN 12 WHEN 'dec' THEN 12 WHEN '12' THEN 12
      ELSE NULL END AS month_no
  FROM CrmCourseIntakeFee
) t
GROUP BY courseId, intakeYear, month_no
HAVING COUNT(*) > 1
ORDER BY rows_in_group DESC, courseId;
```

The `CASE` mapping matches `canonicalValue(_, 'month')` in `src/lib/course-finder/import-diff.ts`.

### Q3: months that cannot be normalised (must be fixed by hand before the backfill)

```sql
SELECT id, courseId, intakeYear, intakeMonth
FROM CrmCourseIntakeFee
WHERE LOWER(TRIM(intakeMonth)) NOT IN (
  'january','jan','1','01','february','feb','2','02','march','mar','3','03','april','apr','4','04',
  'may','5','05','june','jun','6','06','july','jul','7','07','august','aug','8','08',
  'september','sept','sep','9','09','october','oct','10','november','nov','11','december','dec','12');
```

### Q4: university mismatch (the intake's `universityId` differs from its course's)

```sql
SELECT i.id, i.courseId, i.universityId AS intake_university, c.universityId AS course_university
FROM CrmCourseIntakeFee i JOIN CrmCourse c ON c.courseId = i.courseId
WHERE i.universityId <> c.universityId;
```

### Q5: soft references that would break if a duplicate row were removed

```sql
SELECT a.id AS application_id, a.intakeId
FROM Application a JOIN CrmCourseIntakeFee i ON i.id = a.intakeId
WHERE a.intakeId IS NOT NULL AND a.intakeId <> '';
```

The admin duplicates screen (`/admin/data-review/duplicates`) already lists probable intake duplicates read-only. It uses the same normalised key, capped at 5,000 rows, and says when the list is truncated.

## 4. Safe cleanup and rollout plan (every step needs separate approval)

**A. Stop new duplicates at the source.** A code change, with no database change.

1. Add a shared `canonicalIntakeMonth()` helper. It reuses `canonicalValue(_, 'month')` and maps to `MONTH_NAMES`. Refuse unrecognised months with a 400 on every write path in the table above.
2. Add an application-level "already exists" check, returning 409, to the admin create routes and `admin/import/courses`, matching what `course-import/confirm` and apply already do.
3. Add unit tests for each path.

**B. Back up.** Make an operator-run, authorised backup of `CrmCourseIntakeFee` and `Application` (for example `mysqldump --single-transaction` of those tables). Record the checksum. No credentials go in chat or in the repository.

**C. Detect and classify.** Run on a copy first, then on production with approval.

1. Run Q1–Q5 and save the outputs as evidence. Store counts and IDs only, never fee values in chat.
2. Classify every Q2 group:
   - **Identical:** all fee, deadline and provenance columns are equal after normalisation. The survivor is the row with a verified label first, then the newest `lastCheckedAt`, then the newest `updatedAt`.
   - **Conflicting:** any value differs. Send it for **human review**. Open a `DataConflict` row per field, or export a reviewer CSV. Never auto-pick a fee or deadline.
3. Any group with a Q5 reference keeps the referenced row as the survivor. If more than one row is referenced, escalate.

**D. Resolve.** One transaction per group, all audited.

1. Copy each losing row's full JSON into a `PortalAuditLog` entry (`CATALOG_INTAKE_DUPLICATE_REMOVED`, `entityType = CrmCourseIntakeFee`, `metadata` = row JSON plus survivor ID plus reviewer). The metadata column is LongText.
2. Delete the losing row using its exact ID and `updatedAt` (a conditional delete), and check that exactly one row was affected.
3. Never run an unscoped `DELETE`, `TRUNCATE` or `--accept-data-loss`.
4. Survivors keep their verification label only if the group was identical. If a reviewer merged values, the survivor becomes `NEEDS_REVIEW`, matching owner decision 2.

**E. Backfill canonical months.**

```sql
UPDATE CrmCourseIntakeFee
SET intakeMonth = 'September'
WHERE LOWER(TRIM(intakeMonth)) IN ('sep','sept','09','9','september');
```

Write one such statement per month, in a transaction, and log the affected row counts. Re-run Q1 and Q2; both must return no rows.

**F. Add the index.** Create a reviewed migration containing the `@@unique` above. Apply it with `prisma migrate deploy` after migration review and release approval. If the index fails, the migration aborts without changing data. Fix the remaining duplicates and retry.

**G. Recovery.**

- A removed row can be restored from its `CATALOG_INTAKE_DUPLICATE_REMOVED` audit JSON or from the step-B backup.
- The index can be dropped with a down-migration:

```sql
ALTER TABLE CrmCourseIntakeFee DROP INDEX CrmCourseIntakeFee_course_year_month_key;
```

## 5. What this does not prove

None of this has been run against MySQL. The queries were written against `prisma/schema.prisma` and checked against the code paths listed above. They were not executed. Row counts, the number of duplicate groups and the MySQL version are unknown until an operator runs Q1–Q5 on an authorised copy.
