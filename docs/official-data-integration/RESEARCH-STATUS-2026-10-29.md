# ALO official university/course data integration — research status

**As of:** 2026-10-29 UTC
**Status:** researched subset staged as a local evidence package; no production data published.
**Scope statement:** this is not a complete destination catalogue and is not a production integration claim.

## Work performed

Opened Aston University's official course A–Z catalogue (`https://www.aston.ac.uk/courses-atoz`), which reported 374 courses, then opened the official individual Artificial Intelligence MSc page and the official English requirements, Bangladesh, and international scholarship pages. The source record and field-level notes are in `data/official-source-audit/aston-ai-msc-2027-monthly-staging.json`.

The AI MSc page publishes January, April, and September 2027 starts. It does not establish exact start days, application open dates, course/international deadlines, 2027/28 fees, an application fee, a course deposit amount, or a course-specific Bangladesh postgraduate academic equivalency. Those remain null/NOT_PUBLISHED. The page's £24,800 international annual tuition amount is explicitly labelled 2026/27 and is preserved only as historical source evidence; it is not copied into a 2027 or 2028 monthly fee field.

Official course URL: `https://www.aston.ac.uk/study/courses/artificial-intelligence-msc/january-2027`
Other opened official pages:

- `https://www.aston.ac.uk/international/english-language-requirements`
- `https://www.aston.ac.uk/international/aston-in-your-country/south-asia/bangladesh`
- `https://www.aston.ac.uk/international/scholarships`

The official scholarship page lists the postgraduate International Community Scholarship (£4,000 for January 2027 and April 2027; £5,500 for September 2027) and Sir Adrian Cadbury postgraduate award (£10,000, with application dates varying/TBC). These are staged as published scheme evidence and are not a guarantee of an individual applicant's award. Individual terms PDFs have not yet been downloaded/reviewed, so record-level Super Admin approval remains mandatory.

## Auditable counts from this research session

| Measure | Observed result |
|---|---:|
| Destination countries requested | 12 |
| Destination countries with course-page research performed | 1 (United Kingdom) |
| Institution catalogues opened | 1 (Aston University) |
| Catalogue-reported entries (not individually inspected) | 374 |
| Institutions with complete catalogue traversal | 0 |
| Faculties/schools traversed | 0 |
| Departments traversed | 0 |
| Individual course pages opened and assessed | 1 |
| Course pages verified in this subset | 1 (course page identity and selected published fields; still pending CRM review) |
| Distinct official URLs opened | 5 |
| Month assessments staged for that course | 13 |
| Confirmed 2027 intake months | 3 (January, April, September) |
| Other months assessed as NOT_PUBLISHED (not “not offered”) | 10 (including January 2028) |
| Verified 2027/28 tuition amounts | 0 |
| Exact course application/international deadlines verified | 0 |
| Scholarship schemes found on official scholarship page | 2; 6 course-month scheme associations across the three confirmed starts |
| CRM course-month records staged in live DB | 0 (no DB staging was executed) |
| Records approved/published in live DB | 0 |
| Pending/rejected live approval records created | 0 / 0 |
| Live database counts | Unknown; production/test credentials were not available in the shell environment |

## January 2027–January 2028 coverage matrix — the researched MSc only

`VERIFIED_AVAILABLE` is supported by the official course page's published start-date list. For all remaining months, the absence of a start-date listing is recorded as `NOT_PUBLISHED`; it is not interpreted as `VERIFIED_NOT_OFFERED`.

| Month | Intake availability | Exact start date | Course deadline | 2027/28 fee | Scholarship information |
|---|---|---|---|---|---|
| Jan 2027 | VERIFIED_AVAILABLE | Not published | NOT_PUBLISHED | NOT_PUBLISHED | Two official postgraduate schemes listed; eligibility/terms review pending |
| Feb 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Mar 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Apr 2027 | VERIFIED_AVAILABLE | Not published | NOT_PUBLISHED | NOT_PUBLISHED | Two official postgraduate schemes listed; one award's application deadline TBC |
| May 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Jun 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Jul 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Aug 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Sep 2027 | VERIFIED_AVAILABLE | Not published | NOT_PUBLISHED | NOT_PUBLISHED | Two official postgraduate schemes listed; eligibility/terms review pending |
| Oct 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Nov 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Dec 2027 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |
| Jan 2028 | NOT_PUBLISHED | — | NOT_PUBLISHED | NOT_PUBLISHED | NOT_PUBLISHED |

## CRM/database and production blockers

- No `DATABASE_URL` was configured in the current shell session. No production credential was inspected or requested. The new import command was not run with `--stage`; therefore it made **zero** database writes.
- `prisma validate` could not complete: the cloned imported Prisma CLI was incomplete (`prisma_schema_build_bg.wasm` missing); a registry-installed CLI then attempted to fetch the Prisma schema engine from `binaries.prisma.sh`, which is outside the available network allowlist and failed. No migration or destructive database operation was run.
- The prior reference commit `71e5f381` is not present in the shallow local Git object database; a GitHub commit lookup also returned “No commit found” for that short SHA. Current branch HEAD is `3563421e`. No branch switch, reset, rebase, or history rewrite was performed.
- Full faculty/department/programme traversal, detailed verification of all 374 catalogue links, international eligibility confirmation, source PDF/T&C review, distinct course-month records for all CRM courses, Super Admin decisions, public/CRM portal synchronization, deployed scheduler execution, and production persistence remain outstanding.

## Safe next steps

1. Configure a protected backup and production/test database access outside chat; inspect the actual migration state and take a verified backup with rollback before deployment.
2. Run `npm run db:validate`, generate the Prisma client, review the additive migration against the actual database, then deploy it only after backup approval.
3. Run `npx tsx scripts/stage-course-month-coverage.ts --stage` (or the equivalent deployed script) after confirming the CRM has exactly one matching university and course. The importer refuses ambiguous or absent matches, preserves approved records and stages rows as `PENDING`.
4. Review the records in the Super Admin coverage queue. Only approved `VERIFIED_AVAILABLE`, `VERIFIED_NOT_OFFERED`, or `NOT_PUBLISHED` records are exposed by the new public read endpoint. Pending, unavailable and conflict states remain unpublished.
5. Continue the university-by-university catalogue queue in `data/official-source-audit/destination-research-queue.json`; never count candidate URLs or A–Z link counts as verified courses.
