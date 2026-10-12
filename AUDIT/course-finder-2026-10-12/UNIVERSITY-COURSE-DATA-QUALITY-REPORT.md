# University & Course Data Quality Report

**Date:** 2026-10-12
**Branch:** `arena/8b727e17-alo-education-z-ai`. Nothing is committed and nothing is deployed.
**Evidence level:** E1, static analysis of CSV files committed in the repository.
- No live database was read.
- No external URL was fetched.
- Machine-readable output: `catalogue-csv-quality.json`, produced by `node scripts/audit-catalogue-csv-quality.mjs`. The script is read-only.

## Verdict

**DATA: NOT COMPLETE.**

The repository contains **no university or course data that can be shown to be verified**. The CSV sets labelled "VERIFIED" or "VERIFIED_OFFICIAL" show strong signs of being template-generated. They must not be published as verified.

## Findings

| # | Dataset | Observation (from `catalogue-csv-quality.json`) | Consequence |
|---|---|---|---|
| 1 | `universities.csv` (read by `prisma/seed-complete.ts` and `src/lib/ai-agents/international-course-agent.ts`) | 560 rows: exactly 140 UK and exactly 20 per other country (Australia has 40). Status values: VERIFIED_OFFICIAL 234, CROSS_SOURCE_VERIFIED 79, NEEDS_REVIEW 247. | The country counts match the requested count floors exactly. That is a sign of generation, not collection. |
| 2 | `courses.csv` | 11,200 rows, **exactly 20 per university for all 560**. All 11,200 are labelled VERIFIED_OFFICIAL. There is no course URL column. The most common titles each repeat 228–251 times (e.g. "BSc (Hons) Computer Science" 251). The first university's list includes "Foundation Certificate in Medicine" and "Foundation Certificate in Pharmacy". | Generated catalogue. It has no per-course source, so verification is impossible. |
| 3 | `course_intakes.csv` | 145,600 rows, exactly 13 per course. **Every row** has `last_verified_at = 2026-09-15` and the status VERIFIED_OFFICIAL. | The verification date is fabricated. |
| 4 | `course_requirements.csv` / `english_requirements.csv` | 11,200 requirement rows contain only **6 distinct academic-requirement texts** and 5 distinct minimum scores. The English rows split evenly between IELTS 6.5 and PTE 58 (5,600 each). | Templated requirements. Eligibility results based on them would be wrong. |
| 5 | `01_universities.csv` / `02_courses.csv` | 362 universities, **all** labelled VERIFIED, and every `source_url` equals the homepage. 1,790 courses are all VERIFIED. **1,368 course URLs follow the generated pattern `/courses/<title-slug>`**, e.g. `https://www.ox.ac.uk/courses/bsc-medicine` and `…/bsc-law`. These are not degree titles Oxford awards. | Course URLs and titles were invented. |
| 6 | `data/01_ALO_UNIVERSITY_MASTER.csv` | 400 rows (140 UK, 20 each for 13 other countries). 399 are NEEDS_REVIEW. Every row has `last_verified_at = 2026-08-13`. | Honest status labels, but still unverified. |
| 7 | `supervisors.csv` (read by `src/lib/ai-agents/supervisor-matcher.ts`) | 2,821 rows such as "Dr. Supervisor 0001", `supervisor0001@www.ox.ac.uk`, `https://www.ox.ac.uk/staff/dr-supervisor-0001`. | **Fabricated people and email addresses.** They are served by `/api/agent/course-advisor`, which has no handler-level auth; the proxy only requires a logged-in user. **Not changed in this batch (owner decision needed).** It breaks the "never invent supervisors" rule. |

## What was changed in response

- **`prisma/seed-complete.ts`:** catalogue seeding is now **off by default**.
  - The Super Admin, roles and permissions seed still runs.
  - The 560/11,200/145,600 template data loads only when `ALO_SEED_UNIVERSITY_CATALOGUE=1`, which is meant for disposable development databases.
  - Even then it keeps its original fabricated statuses. Do not use it on a real database.
- **Public visibility:** `src/lib/public-catalog.ts` (`publicCourseWhere`) publishes only records that are `verificationStatus = 'VERIFIED'` (the exact value), `publicationStatus = 'published'`, `visibility = 'public'` and `status = 'active'`, and that are not marked domestic-only or closed to international students.
  - `VERIFIED_OFFICIAL` and `CROSS_SOURCE_VERIFIED` do **not** pass.
  - Rows already loaded into a live database by an earlier seed therefore stay hidden from public pages, unless an admin has changed them to `VERIFIED`.
  - The real data state of the live database is **unknown**: no database access was available.
- **Destination pages and the API** now use the same public filters. Before this change they leaked unpublished and unverified courses, and gave UK data for unknown slugs.

## Not done (BLOCKED or PENDING)

- **No official-source collection was performed.** No outbound access to university websites was available in this sandbox. Collection must not be faked.
- **Live database audit** (counts by status, duplicates, demo records): BLOCKED, because no DB credentials or access were available and none should be pasted into chat.
- **Duplicate and demo detection on the live database:** the logic exists (`findProbableDuplicate`) but has not been run against real rows.

## Recommended owner actions

1. Decide what to do with the root template CSVs. The options are to archive them outside the deploy artefact, or to keep them clearly labelled as `TEMPLATE_NOT_DATA`. They are read at runtime by `international-course-agent.ts`.
2. Restrict or retire `/api/agent/course-advisor` (fabricated supervisors and catalogue).
3. Run a read-only status count on the live database, executed by the operator, before launch.
4. Start real collection from official sources through `/admin/data-import`. Every row arrives as unverified or pending review.

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
