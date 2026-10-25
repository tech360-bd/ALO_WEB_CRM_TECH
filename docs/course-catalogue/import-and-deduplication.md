# Course catalogue — import and deduplication

**Status:** the pipeline described here exists and was exercised; the large bulk
files are **not** cleared for publication (see `import-validation-results.md`).

## 1. Components that exist

| Stage | Implementation |
|---|---|
| Candidate generation | `scripts/compile-full-canonical-dataset.mjs`, `scripts/build-complete-canonical-csvs.ts`, `scripts/add_universities.py`, `scripts/add_courses.py` (produce CSV, never write to the DB directly) |
| Canonical CSV set | `01_universities.csv` (362), `02_courses.csv` (1 790), `03_course_intakes_fees.csv` (3 580), `04_course_requirements.csv` (1 790), `05_country_specific_requirements.csv` (362), `06_scholarships.csv` (3 411), `07_rankings.csv` (362), `08_source_evidence.csv` (1 790) |
| Validation | `scripts/test-canonical-import-validation.mjs` — parses all eight files, requires headers and non-empty required fields |
| Security tests | `scripts/test-import-pipeline.mjs` — formula-injection sanitisation, header-alias mapping, duplicate engine |
| Quality audit | `scripts/audit-catalogue-csv-quality.mjs`, `scripts/audit-local-catalog.py`, `scripts/build-catalogue-review-queues.py` |
| Official-source checking | `scripts/run-official-university-crawler.mjs` + `src/lib/official-crawlers/{base,aston}-adapter.ts`, `catalogue-traversal.ts`, `catalogue-monitoring.ts` |
| Batch API | `src/app/api/admin/import/batches/*` — list, create, `[id]`, `preview`, `approve`, `execute`, `rollback` |
| CRM import API | `src/app/api/crm/course-import/*` — confirm, errors, history, map-university, download-errors |
| Duplicate review | `src/app/api/admin/import/duplicates/route.ts`, `merge/route.ts` |
| Admin UI | `/admin/import-center/*`, `/admin/data-import/*`, `/admin/data-review`, `/admin/data-conflicts` |

## 2. Batch lifecycle (state machine)

```
draft → previewed → approved → executing → completed | completed_with_errors
                                              └→ rollback_review_requested
```

Each transition is restricted to staff with the import permission; `rollback` is
Super Admin only (`src/app/api/admin/import/batches/[id]/rollback/route.ts`).

**Rollback is deliberately not a data delete.** The endpoint sets
`rollback_review_requested` and writes an audit row with
`recordsDeleted: false`. Reversal of already-published rows is a manual, reviewed
step. This is a real limitation: there is **no automated undo** of an executed
batch, because deleting published catalogue rows could orphan student applications.

## 3. Dry run

`POST …/preview` produces the diff (create / update / unchanged / conflict) without
writing. The acceptance rule is that the rows previewed must equal the rows changed
on execute; this was **not** re-verified in this environment because no MySQL server
is reachable (BLOCKED).

## 4. Identity resolution and deduplication

### Institution identity

1. Match on `CrmUniversity.universityId` when the input already carries it.
2. Otherwise match on a normalised official domain (`officialUrl` host).
3. Otherwise match on normalised official name + country.
4. Anything left over → duplicate queue, never an automatic create.

`scripts/test-import-pipeline.mjs` exercises "near-duplicate titles matched, distinct
campuses preserved" — a course with the same title at two campuses stays two records.

### Course identity

1. `courseId` (stable ALO identifier) when present.
2. Otherwise `(universityId, normalised title, study level, intake year)`.
3. Variants (with placement, part-time, different campus) are separate rows, never
   merged by title alone.
4. A changed official title creates a **proposed update** with the old title retained
   in `CourseHistory`, not a second course.

## 5. Idempotency

Every importer is keyed on a stable identifier and is safe to re-run:

* inserts use `upsert` on the natural key;
* unchanged rows are counted as `unchanged`, not rewritten (so `updatedAt` does not
  churn and the audit log stays readable);
* a batch records `sourceFile`, row count, checksum and operator;
* re-importing the same file twice must produce zero creates on the second run.
  This is asserted for the canonical CSVs by the validation script; the database
  half is BLOCKED here.

## 6. Refusals (by design)

| Input | Behaviour |
|---|---|
| Row with a URL that was not captured from a page | rejected (`failureReason = 'constructed_url'`) |
| Course with no official source | stored as `NEEDS_REVIEW`, never public |
| Fee with no academic year | stored with `academicYear = null`, displayed as "not published" |
| Deadline in the past | `expired`, never shown as open |
| Provider that is not registered (UK) | flagged `provider_status_unverified` |
| Row that would overwrite a VERIFIED value with a lower-tier source | staged to the conflict queue |

## 7. Operating commands

```bash
# validate the canonical CSV set (no database needed)
node scripts/test-canonical-import-validation.mjs

# import security + dedupe tests (no database needed)
node scripts/test-import-pipeline.mjs

# off-line catalogue quality audit
node scripts/audit-catalogue-csv-quality.mjs

# official-source smoke crawl for one institution (writes to data/official-source-audit)
node scripts/run-official-university-crawler.mjs --limit=10
```

Database-backed steps (`preview`/`execute`/`rollback`) require the production or a
staging MySQL instance and were **not** run here.

## 8. Known gaps

1. **No robots.txt enforcement or request throttling** in the crawler adapters.
   Until added, crawling is manual-supervised only.
2. **No automated rollback** of an executed batch (review-request only).
3. **No field-level provenance table** (see `schema-and-provenance.md` §5).
4. **No scheduled link-check job** wired to the review queue (the monitoring libs
   exist; the schedule does not).
5. **One official adapter** (`aston-adapter.ts`) — 399 of 400 institutions have no
   adapter, which is why the coverage file reports `CATALOGUE_NOT_ACCESSIBLE`.
