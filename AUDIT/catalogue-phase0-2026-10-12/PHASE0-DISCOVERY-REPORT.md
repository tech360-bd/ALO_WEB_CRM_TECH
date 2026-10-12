# ALO Catalogue Master Specification — Phase 0 Discovery Report

- **Date:** 2026-10-12 (Asia/Dhaka)
- **Branch:** `arena/8b727e17-alo-education-z-ai` (local only, never pushed)
- **HEAD:** `c5bfcbba` (same as `origin/main`; shallow clone)
- **Mode:** read-only. No edits, installs, migrations, seeds, imports or commits were made during Phase 0.
- **Evidence labels:** VERIFIED (read directly in the repo or on an official page on 2026-10-12), PARTIALLY VERIFIED (part checked, or secondary source), UNVERIFIED (inferred), BLOCKED (prerequisite missing).
- This file is a saved copy of the Phase 0 report delivered in chat, written after the user's approval on 2026-10-12. It was written without overwriting any existing file. Decisions taken after Phase 0 are recorded at the end.

---

## 1. Repo and branch — VERIFIED

| Item | Value |
|---|---|
| Repo | `engralaminn-collab/alo_education_z....ai` (private, not a fork) |
| Branch | `arena/8b727e17-alo-education-z-ai` |
| HEAD | `c5bfcbba` = `origin/main` |
| Working tree at Phase 0 | 384 uncommitted entries (482 with every untracked file listed), preserved |
| Nested copies | `alo-education-web-crm-final/` (1,521 tracked files), `deploy-build/` (110). Not touched; deletion needs a reviewed plan. |
| Related branch | `codex/aloeducation-access-content-repair` @ `7d30e83`: catalogue import safety changes; overlaps 12 working-tree files |

## 2. Baseline (read-only)

- **Stack — VERIFIED:** Next.js 16, Prisma, MySQL. Schema: 532 models, no enums.
- **Tests:** not re-run in Phase 0. Last recorded: 133/133 unit (mocked); Course Finder 109/109 and 182/182; scoped type-check 0 errors.
- **BLOCKED:** Prisma client generation (sandbox egress), full type-check, build, MySQL tests. No disposable MySQL test database URL.
- **Collected data — VERIFIED** (`data/official-source-audit/`): an Aston University smoke run found 471 A–Z catalogue entries, parsed 3 courses and 2 intakes; **0 verified**. Every `*_verified.csv` there is empty.
- **Fabricated data — VERIFIED** (earlier audit): root CSVs are template-generated (560 universities × exactly 20 courses, identical verification dates). `data/01_ALO_UNIVERSITY_MASTER.csv`: 399 of 400 rows `NEEDS_REVIEW`. Production database contents: unknown.

## 3. Catalogue and database architecture — VERIFIED (schema and code reads)

**Structured catalogue (proposed canonical):** `CrmUniversity` (unique `universityId`, indexed `slug`), `CrmCourse` (unique `courseId`), linked `Campus`, `CourseIntake`, `CrmCourseIntakeFee`, `CrmCourseRequirement`, `EntryRequirement`, `EnglishRequirement`, `CrmScholarship`, `CrmRanking`. Each university/course carries `verificationStatus`, `publicationStatus`, `visibility`.

**Overlaps found:**

| Area | Duplicates |
|---|---|
| Content pages | `UniversityPage`, `CoursePage`, `CountryPage`; public detail pages read both these and the Crm tables |
| Requirements | `CrmCourseRequirement` vs `EntryRequirement` + `EnglishRequirement` |
| Intakes | `CourseIntake` vs `CrmCourseIntakeFee` |
| Scholarships | `Scholarship` (content, free-text university) vs `CrmScholarship` (linked) |
| Import tracking | `ImportBatch`/`ImportError` (student imports) vs `CrmImportBatch`/`CrmImportError` |
| Sources / history | `OfficialSource`, `SourceSnapshot`, `UniversityResearchEvidence`, `DataConflict`, `*History` — linked by slug text, not FK |
| Departments | `Department` is global (no university link); `UniversityFaculty` uses a slug string |

**Import paths (7):** `/api/admin/import/*` (preview/approve/execute/rollback), `/api/admin/data-import`, `/api/admin/import-center`, `/api/import-center`, `/api/csv-import`, `/api/crm/course-import/*`, `/api/course-finder/admin`.

**Public side:** `publicCourseWhere` / `publicUniversityWhere` publish only exact `VERIFIED` + published + active + source link. Course Finder filters: country, city, campus, university, level, subject, intake, year, deadline, tuition range, IELTS/English test, application fee, deposit, scholarship, duration. Course-page Apply buttons go to `/book-consultation` with no course context (PARTIALLY VERIFIED: 3 components checked).

## 4. Institution selection methodology (proposed)

Rankings never decide alone (≤20% weight). Every included/excluded institution keeps a scorecard, evidence URL and exclusion reason.

| Country | Candidate universe | Rule | Checked 2026-10-12 |
|---|---|---|---|
| UK (140) | OfS Register (England) + SFC / Medr / NI funded providers, cross-checked with the Home Office register of licensed student sponsors | Student-sponsor licence and degree-awarding powers required; then scored on international PG offer, Bangladesh relevance, subject breadth, region/fee spread, data availability, ranking (≤20%) | OfS Register is the official English provider list (https://www.gov.uk/government/publications/student-sponsor-guidance/higher-education-regulatory-reform-accessible). PARTIALLY VERIFIED: register and sponsor list not downloaded |
| Australia (all) | HESA Tables A/B/C + TEQSA National Register | Universities first; private, other HE and pathway providers separate; CRICOS per course | Current Table A text lists "Adelaide University" (http://www.austlii.edu.au/au/legis/cth/consol_act/hesa2003271/s16.15.html); older lists show both predecessors (https://thepienews.com/which-are-table-a-and-b-institutions-in-australia/). Needs alias/merger record. PARTIALLY VERIFIED. education.gov.au list page returned 404. CRICOS reachable (VERIFIED) |
| New Zealand (8) | Universities New Zealand | All 8 members | VERIFIED from https://www.universitiesnz.ac.nz/universities: Auckland, AUT, Waikato, Massey, Victoria University of Wellington, Canterbury, Lincoln, Otago |
| Ireland (all) | HEA institution list | Universities and Technological Universities separate; others separate | Five TUs on the HEA site (https://hea.ie/policy/he-reform/technological-universities/). HEA institution list (https://hea.ie/higher-education-institutions/) PARTIALLY VERIFIED. RCSI categorisation needs a decision |
| Canada (provisional 40) | IRCC DLI list, public institutions | DLI status recorded separately from PGWP eligibility (the DLI page states not every programme is PGWP-eligible) | DLI page reachable, VERIFIED |
| USA (provisional 60) | College Navigator + recognised accreditor | Institutional accreditation separate from programme accreditation | College Navigator reachable, VERIFIED |

**Bangladesh relevance score:** each signal stores its own evidence (Bangladeshi qualifications on institution country pages; Bangladesh office/events; official enrolment-by-nationality data where published; intake fit; fee band). Unevidenced signals are NOT PUBLISHED, never guessed.

## 5. Source access and usage constraints

| Source | Access | Constraints |
|---|---|---|
| University official pages | Reachable via the page-fetch tool | Facts only, original summaries, URL + access date |
| Discover Uni / HESA dataset | Reachable | CC BY 4.0 with attribution (https://www.hesa.ac.uk/support/tools-and-downloads/unistats); 2026 dataset covers 2027–28 courses (https://discoveruni.gov.uk/information-providers/) |
| UCAS course search | Reachable (50,912 courses shown) | Bulk data sold under a paid Courses Data Service licence (https://www.ucas.com/terms-and-conditions/sale-of-products-services/sale-of-products-services-courses-data-service). Older terms banned systematic downloading (secondary, old: https://blog.ouseful.info/tag/ucasdata/). Current terms page 404. Spot-checks only |
| CRICOS, DLI, College Navigator, Universities NZ, HEA | Reachable | Status lookups only |
| ApplyBoard | Homepage only; terms page not found | Not used for data; its marketing figures are not reusable facts |
| Ranking publishers | Not checked | Licence needed before display |

**BLOCKED:** the sandbox shell reaches only GitHub/npm/PyPI; collection must be page-by-page through the fetch tool or run by an operator from an approved environment.

## 6. Data dictionary and schema mapping (25 logical entities, as read from section 8)

| Entity | Existing model | Gap |
|---|---|---|
| Country | `Country` | Stored counts should be computed |
| Institution | `CrmUniversity` | Summary fields (`ranking`, `ieltsMin`, `tuitionRange`) not traceable |
| Alias / merger | `CrmUniversity.aliases` (string) | Structured alias table missing |
| Register status (CRICOS, DLI, OfS, accreditor) | `type` (string) | Missing |
| Campus | `Campus` | OK |
| Faculty / department | `UniversityFaculty` (slug) | Needs real FK; `Department` unrelated |
| Course | `CrmCourse` | Marketing flags (`highAcceptance`, `fastOffer`, `noInterview`) unsourceable; keep hidden |
| Course ↔ campus / delivery | `CrmCourse.campusId` (single) | Many-to-many missing |
| Intake | `CourseIntake` + `CrmCourseIntakeFee` | Merge to one canonical record |
| Fee | `CrmCourseIntakeFee` | Fee basis must be required; no silent conversion |
| Entry requirement | `CrmCourseRequirement` / `EntryRequirement` | Choose one; Bangladeshi qualification rows needed |
| English requirement | `EnglishRequirement` | OK |
| Scholarship | `CrmScholarship` (+ `Scholarship` content) | Canonical decided: `CrmScholarship` |
| Scholarship eligibility | `CrmScholarship.eligibleCountries` (string) | Partial |
| Required documents | `CoursePage.documents` (JSON) | Missing on Crm models |
| Accreditation | none | Missing |
| Ranking | `CrmRanking` | OK |
| Outcomes | none | Missing |
| Source | `OfficialSource` | OK |
| Snapshot | `SourceSnapshot` | `aiSummary` must never count as verification |
| Field evidence | `UniversityResearchEvidence` | Slug-linked; extend to course/fee |
| Verification event | `CrmSourceVerificationEvent` | OK |
| History / version | `*History` | Slug-linked |
| Import batch / error | `CrmImportBatch` / `CrmImportError` | OK |
| Conflict / duplicate | `DataConflict`, `findProbableDuplicate` | Not run on real data |
| Bangladesh relevance | none | Missing |

No unique constraints before a duplicate audit. Missing fields need a separately approved migration.

## 7. Existing vs missing

**Exists (code VERIFIED; behaviour shown only by mocked tests):** VERIFIED-only public filters; batch import with preview/approve/execute/rollback; diff, duplicate finder and verified-record protection; approved-change applier with stale-value checks; synthetic-host detection; admin screens (data-import, data-review/duplicates, data-conflicts, source-verification, data-freshness, data-coverage); ~20 catalogue unit test files.

**Missing:** aliases, register status, accreditation, course↔campus, documents, outcomes, Bangladesh relevance; separate editor/approver roles (only ADMIN/SUPER_ADMIN; maker-checker unverified); Apply passing course context; delivery/CRICOS/DLI/PGWP filters; per-institution progress; any verified data.

## 8. Risk register

| # | Risk | Label | Severity |
|---|---|---|---|
| K1 | `/api/import-center` PATCH set `verificationStatus:"VERIFIED"` on every action, including reject | VERIFIED | High |
| K2 | `/api/course-finder/admin` auto-VERIFIED creates, admitted MARKETING_MANAGER, spread the request body into updates and reset `lastVerifiedAt` | VERIFIED | High |
| K3 | `/api/source-logs` (any authenticated, POST) and `/api/data-quality` (any authenticated; GET suspected of writing) | VERIFIED (access) / UNVERIFIED (write on GET) at Phase 0 | Medium |
| K4 | Proxy skipped checks for any path containing a dot; 85 routes rely on the proxy alone | VERIFIED | Medium |
| K5 | Fabricated root CSVs (611 MB) remain; loaders disabled | VERIFIED | Medium |
| K6 | No backups or cron runner | VERIFIED | High |
| K7 | Public pages read two systems (Crm + `*Page`) | VERIFIED | Medium |
| K8 | Course scale makes manual full verification unrealistic in one pass | UNVERIFIED (estimate) | Planning |
| K9 | Licensing (UCAS, rankings, aggregators) | PARTIALLY VERIFIED | Legal |
| K10 | Real-world change (Adelaide merger, Canada PAL/PGWP rules) | VERIFIED | Data |
| K11 | AI summaries stored beside evidence | VERIFIED | Data |

## 9. Phased plan

| Phase | Work | Gate |
|---|---|---|
| 1 | Fix K1–K4 with tests; diff held for review | Approval to edit |
| 2 | Canonical models; migration plan for missing fields | Migration approval + disposable MySQL |
| 3 | Candidate lists per country with scorecards | Approve lists |
| 4 | Pilot: NZ 8 + 2 UK, per-field evidence, per-institution progress | Pilot review |
| 5 | Discover Uni CC BY dataset for UK course identity, drafts only | Approval + approved egress environment |
| 6 | Scale country by country | Per-tranche review |
| 7 | Integration (Apply context, filters, review queue) | Approval |
| 8 | Security review, full tests, deliverables A–T | Before any merge/deploy |

## 10. Blockers and approval gates

Blockers: shell egress; no disposable MySQL; Prisma generate blocked; no production access; UCAS/ranking licence status unknown.

---

## Decisions recorded after Phase 0 (user, 2026-10-12)

- **Phase 1 approved only** (K1–K4 with tests; no commit/push/merge/deploy/migrate/seed/import/install).
- **Canonical structured models (proposed):** `CrmUniversity`, `CrmCourse`, `CrmScholarship`. `*Page` models retained for content presentation unless a reviewed migration plan proves otherwise. **No schema changes under this approval.**
- **Selection targets:** UK 140; all verified Australian universities; all 8 NZ universities; all qualifying Irish universities with TUs categorised separately; Canada 40 and USA 60 as **provisional targets**, not verified lists or claims of national coverage.
- **Pilot:** 8 NZ universities + 2 UK universities. No scaling until source traceability, department coverage, course-extraction quality and verification process are reviewed.
- **No data collection or database import** until the Phase 1 review is complete and pilot quality is accepted.
