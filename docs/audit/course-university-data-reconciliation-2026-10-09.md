# University and course data reconciliation — 2026-10-09

## Mandatory page acceptance criterion

Each university information page must ultimately include **every course offered to international students, from Foundation through PhD, with an intake from January 2027 through January 2028 inclusive; no course may be omitted**. The list may be paginated, but every matching course must be reachable. A page can only be certified complete after its official course catalogue has been exhaustively reconciled, course-level international eligibility is source-verified, and each displayed in-window intake has its own authoritative source evidence. Unknown or unresolved records must remain visible as coverage gaps and must block a completeness claim.

The current public listing is intentionally narrower: it returns only source-linked, verified, published CRM courses with an explicit positive international-eligibility status and a source-verified intake in the requested window. The API labels catalogue coverage `RESEARCH_REQUIRED` and reports CRM candidate/verification counts; those counts do **not** prove that no course is missing from the official catalogue. This is a safe interim guard, not satisfaction of the no-omissions criterion.

## Release decision

**University/course completeness is not established. Keep the data-completeness release gate closed.** This is a repository-file audit, not a query of the production CRM database and not a live verification of university websites. `DATABASE_URL` and `TEST_DATABASE_URL` were not configured for this run, and official university sites were not available to the audit process.

Do not describe the current catalogue as complete, and do not publish records marked `NEEDS_REVIEW`, `RESEARCH_REQUIRED`, or `REQUIRES_REVIEW`. An imported row or a populated source URL is not proof that its facts are correct or that a catalogue is exhaustive.

## Reproducible evidence observed

| Evidence file | Observed records | What the records establish |
|---|---:|---|
| `01_ALO_UNIVERSITY_MASTER.csv` | 400 universities | 1 is `VERIFIED_OFFICIAL`; 399 are `NEEDS_REVIEW`. |
| `02_ALO_COURSE_MASTER.csv` | 17,653 candidate courses across 400 university IDs | This is a candidate/import dataset, not 17,653 verified offerings. Every row's `official_course_id` equals its local `course_id`; do not represent those generated identifiers as university-assigned IDs. |
| `ALO_COURSE_MASTER.csv` | 471 courses | All 471 belong to Aston University; they are the course rows in the verified-only course master. |
| `08_ALO_COURSE_SOURCES.csv` | 471 course-source rows | The 471 records are marked official and `VERIFIED_OFFICIAL`, dated 2026-08-13. This is the only verified course-source set found in the compact master. |
| `11_ALO_SOURCE_PROVENANCE.csv` | 18,053 provenance rows | 472 rows are `VERIFIED_OFFICIAL`; 17,581 are `NEEDS_REVIEW` (399 university records and 17,182 course records). |
| `ALO_COURSE_COMPLETENESS_AUDIT.csv` | 400 universities | 399 are `REQUIRES_REVIEW` with catalogue access marked `CATALOGUE_NOT_ACCESSIBLE`; one is `EXHAUSTIVELY_VERIFIED`. Its 17,653 discovered/imported rows split into 471 verified and 17,182 unverified. |
| `03_ALO_COURSE_INTAKES_2027.csv` | 32,033 intake rows | All are `REQUIRES_REVIEW`; 31,210 rows explicitly cite `Template pattern fallback` as evidence. They must not be presented as confirmed start dates or deadlines. |
| `18_ALO_IMPORT_MANIFEST.csv` | 2 manifest entries | It records a historical successful import of 400 universities and 17,653 courses on 2026-08-13. A manifest is not live database verification. |

The 17,653 candidate course rows are labeled in the JSON master as 471 `VERIFIED_OFFICIAL` and 17,182 `NEEDS_REVIEW`. The 471 verified records are the Aston University course set. The remaining course and university facts are research candidates, not public facts.

## Conflicting or unsafe coverage claims

- `ALO_COURSE_COVERAGE_REPORT.csv` claims 153 universities are `COMPLETE` and totals 17,231 imported/verified programmes. That conflicts with the source-provenance and completeness audits above: only 471 course rows are marked verified, and only one university record is marked verified. **Do not use that report's COMPLETE labels or 100% figures as evidence.**
- The older `10_ALO_COURSE_COVERAGE.csv` and `05_ALO_UNIVERSITY_COVERAGE.csv` classify 399 catalogues as inaccessible, but some numeric columns contradict each other (for example, zero discovered/imported beside a nonzero missing count). Treat those counts as unresolved, not as measured catalogue totals.
- `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` is a filename, not an approval state. Its course-level statuses still mark 17,182 records `NEEDS_REVIEW`; it includes generated intake values with template-fallback evidence. The filename must not be taken as permission to publish.
- The candidate CSV has values in many fields and official-looking URLs, but those fields are not independently verified by this audit. Do not promote them to `VERIFIED` based only on being populated or on the historical import manifest.

## Public-route guard observed in source

The database-backed university and CRM-course detail queries require a published record, `verificationStatus: VERIFIED`, and a non-empty official/source URL. University-linked course cards also require `PUBLISHED`, `VERIFIED`, and a source URL. Keep those guards in place; they do not prove completeness and still need verification against the live database and end-to-end crawl.

## Required before a completeness/release claim

1. Reconcile the live CRM database to source evidence; compare every imported record to its own authoritative course/university page.
2. Keep the 17,182 candidate course records and 399 university records in review until evidence supports a status change. Do not infer that a catalogue is complete from the record count.
3. Replace or quarantine template-derived intake, fee, scholarship, requirement, and deadline values; validate dates against current official pages and retain per-field provenance.
4. Resolve the coverage-report conflicts and separate `candidate/imported`, `source-verified`, and `catalogue-exhaustive` counts in both imports and dashboards.
5. Recheck freshness: the evidence files are dated 2026-08-13. Intake and deadline facts require a 7–30 day review cadence under `DATA-FRESHNESS-POLICY.md`.
6. Run the live public-route crawl, database checks, and approval-gate tests in an environment with a generated Prisma client and a test database before release.
