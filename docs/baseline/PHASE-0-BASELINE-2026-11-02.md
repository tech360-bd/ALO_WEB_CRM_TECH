# ALO Education — International University & Course Catalogue
## Phase 0 baseline report (read-only)

**Report date:** 2026-11-02
**Author role:** read-only inspection (Phase 0, specification §18)
**Scope executed:** repository, branch, schema, public + admin surfaces, existing catalogue files, source reachability
**Changes made in this phase:** none to application code, schema, database or configuration.
**Status:** awaiting owner approval before Phase 1.

> Evidence labels used throughout: **VERIFIED**, **PARTIALLY VERIFIED**, **UNVERIFIED**, **NOT PUBLISHED**, **CONFLICTING SOURCES**, **STALE**, **BLOCKED**.
> Nothing in this report was inferred from a similar-sounding project name.

---

## 1. Repository and branch identity

| Item | Value | Evidence |
| --- | --- | --- |
| Repository URL | `https://github.com/tech360-bd/ALO_WEB_CRM_TECH.git` | VERIFIED (`git remote -v`) |
| Repository name | `tech360-bd/ALO_WEB_CRM_TECH` | VERIFIED |
| Inspection branch | `arena/ececf40c-alo-web-crm-tech` (created from `main`) | VERIFIED (`git rev-parse --abbrev-ref HEAD`) |
| Base commit (`main`) | `1e30e812e95a3dd87770a3ad9a3b63779cd15a87` | VERIFIED |
| Current HEAD | `7e4c392244d06aae3f6e8bf3429ca049eea957c1` | VERIFIED |
| Working tree | clean (no uncommitted changes) | VERIFIED (`git status --porcelain` empty) |
| Stack | Next.js App Router + Prisma 6 + MySQL, Node 22.x, npm 10.9.2 | VERIFIED (`package.json`, `.nvmrc`, `prisma/schema.prisma`) |
| Schema size | 618 models in one `prisma/schema.prisma` | VERIFIED |
| Deployment artefacts | `docker-compose.yml` (app + db + nginx), `vercel.json` crons, `.github/workflows/deploy-production.yml`, `deploy-recovery.yml` | VERIFIED (files exist) |

### Disclosure: commit made before this specification arrived

The HEAD commit `7e4c3922` is mine, produced in the previous turn (before this specification was supplied). It changes only:

- `src/lib/verified-catalogue/publish.ts` — approval now writes `status: 'active'` and publishes the parent university (two real bugs where approved records stayed invisible);
- `scripts/diagnose-public-catalogue.ts` + `npm run catalogue:diagnose` — read-only visibility funnel / optional repair;
- `tests/unit/public-catalogue-publish.test.ts` — 5 passing tests locking writer to reader;
- `docs/PUBLIC-CATALOGUE-VISIBILITY.md`.

It is already pushed to the session branch; it is **not** merged to `main` and **not** deployed. It touched no database and ran no import. If you would rather review it separately, it can be reverted from this branch without affecting `main`. From this point on, **no commit, push, migration, import or deployment will happen without your explicit approval.**

---

## 2. Environment, database and integration access

| Probe | Result | Evidence |
| --- | --- | --- |
| `.env` present | **No** (only `.env.example`, `.env.production.example`, `.env.ai-gateway.example`) | VERIFIED |
| Database reachable | **No** — no `DATABASE_URL`, no MySQL client, no running `mysqld`; `npx prisma generate` fails (Prisma engine download blocked) | VERIFIED |
| Live row counts | **Not measurable** — therefore **no live coverage figure is claimed anywhere in this report** | BLOCKED |
| Production / staging linkage | **Unknown.** Deployment config exists, but which environment this checkout maps to cannot be determined from the repository | BLOCKED — owner confirmation required |
| Shell egress (curl) | Blocked for external hosts (`ox.ac.uk`, `universitiesnz.ac.nz`, `cricos.education.gov.au`, `ucas.com` all return `000`) | VERIFIED |
| Research fetch tooling | **Works**: official pages can be read and cited via the agent's page-fetch/search tools | VERIFIED |

Consequences for the plan:

- Automated crawlers already in the repo (`scripts/run-official-university-crawler.mjs`, `scripts/collect-official-source-evidence.py`, `scripts/run-2027-intake-discovery.ts`) **cannot run in this workspace**. Collection must run either (a) through the agent's fetch tooling with citations, or (b) on a host with egress + DB access.
- Any live-database verification (import preview, dedupe against real rows, coverage counts) is **BLOCKED** until a `DATABASE_URL` for a non-production database is supplied.

---

## 3. What the website and CRM actually read today

### 3.1 Public catalogue read path (VERIFIED by source inspection)

| Surface | Route | Data model | Public gate |
| --- | --- | --- | --- |
| Course Finder | `/course-finder` → `/api/course-finder` | `CrmCourse` + `CrmUniversity` | `publicCourseWhere()` |
| All courses | `/courses` → `/api/course-finder` (paged) | `CrmCourse` | `publicCourseWhere()` |
| University directory | `/universities` → `/api/course-finder/universities` | `CrmUniversity` | `publicUniversityWhere()` |
| University detail | `/universities/[slug]` | `CrmUniversity` first, else `UniversityPage` + `passesPublicPagePolicy` | two gates |
| Course detail | `/course/[slug]`, `/courses/[slug]` | `CrmCourse` first, else `CoursePage` + `publicCoursePageWhere` | two gates |
| Destinations | `/destinations`, `/api/destinations/[slug]` | `CrmCourse`, `CrmUniversity`, `CrmScholarship`, `Country` | same helpers |
| Student portal | `/api/student-portal/course-finder` | `CrmCourse` | same helpers |

The gate (`src/lib/public-catalog.ts`): `status = 'active'` **AND** `verificationStatus = 'VERIFIED'` (literal string) **AND** `publicationStatus = 'published'` **AND** (`sourceUrl` or `officialUrl` starts with `https://`), plus for courses a public parent university and an internationally eligible flag. Fees/intakes/requirements have their **own** gates (`publicIntakeWhere`, `publicRequirementWhere`).

### 3.2 There are two catalogue models in one schema (VERIFIED)

- **Canonical CRM model (what the Finder reads):** `CrmUniversity`, `CrmCourse`, `CrmCourseIntakeFee`, `CrmCourseRequirement`, `CrmScholarship`, `CrmRanking`, `CrmCourseMonthlyCoverage`, `CrmCoverageRevision`, `CrmOfficialEvidence`, `CrmDiscoverySource`, `CrmDiscoveryRecord`, `CrmSourceVerificationEvent`, `CrmOfficialSourceCheck`, `CrmImportBatch`, `CrmImportError`, `CrmSourceLog`, `CrmAuditLog`, `Campus` (FK → `CrmUniversity.universityId`), `UniversityFaculty` (FK by **string `universitySlug`**), `Department` (**no university relation at all**).
- **Legacy website model (page content + fallback):** `UniversityPage`, `CoursePage`, `CourseIntake`, `CourseMonthCoverage`, `Scholarship`, `OfficialSource`, `DataConflict`, `ImportBatch`, `ImportError`, `UniversityHistory`, `CourseHistory`, `SourceSnapshot`, `VerificationRun`.

Neither is wrong, but the catalogue work must **not** create a third one. This is a P2 data-model risk, detailed in §8.

### 3.3 Admin / CRM surfaces that already exist (VERIFIED)

`/api/admin/import/universities`, `/api/admin/import/courses` (CSV, `dryRun` supported, writes `NEEDS_REVIEW` + `draft`),
`/api/admin/catalog-review` (summary/records/duplicates + public-visibility counts), `/api/admin/catalog-changes/apply`,
`/api/university-catalogue/coverage/decide` (Super-Admin approval), `/api/admin/course-month-coverage`,
`/api/crm/course-import/{validate,confirm}`, `/api/data-quality`, `/api/import-center`, `/api/csv-import`, plus pages `/admin/university-data`, `/admin/catalog*`.

---

## 4. Current catalogue content — measured, not claimed

### 4.1 Files at repository root

**111 CSV files, ~214 MB.** They are **parallel, overlapping "masters"**, not a single source of truth:

| File | Rows | Unique rows | Redundant rows | Assessment |
| --- | --- | --- | --- | --- |
| `04_ALO_UNIVERSITY_COURSE_MASTER.csv` | 32,033 | 9,928 (uni+course+level+month+year) | **22,105** | CONFLICTING / duplicate-heavy |
| `02_ALO_COURSE_MASTER.csv` | 17,653 | 5,565 (uni+course+level) | **12,088** | CONFLICTING / duplicate-heavy |
| `ALO_MASTER_COURSE_DATABASE.csv` | 14,600 | — | — | parallel master |
| `courses.csv` | 11,200 | 9,858 | 1,342 | same generator as `courses.csv` seeds |
| `universities.csv` | 560 | 559 | 1 | parallel master |
| `01_ALO_UNIVERSITY_MASTER.csv` | 400 | 399 | 1 | parallel master |
| `05_ALO_TUITION_FEES.csv` | 145,600 | — | — | unpriced/unverifiable rows |

### 4.2 The bulk of this data is generated, not researched — VERIFIED examples

| Finding | Evidence |
| --- | --- |
| Oxford "Foundation Certificate in Medicine" | Oxford publishes no such award; row generated by `scripts/seed-400-universities.ts` (template titles × subjects) |
| `https://www.ox.ac.uk/courses/foundation-certificate-in-medicine` | **Returns HTTP 404 “Page not found”** (fetched 2026-11-02) — the URL is fabricated |
| All Oxford rows carry `official_source_url = https://www.ox.ac.uk/admissions` | A generic admissions page, not the course page — violates §4.2 and §7.1 |
| Tuition flat values (£28,000 / £49,000 for every Oxford course) | Generated from a range, not a fee schedule — violates §7.6 |
| Every course in `courses.csv` labelled `VERIFIED_OFFICIAL` | A generated label, not a verification act — must not be treated as verified |
| `seed-400-universities.ts` writes `publicationStatus: 'published'`, `status: 'active'` | Generated records were published to the public site |

**Verdict:** the large row counts in this repository are **NOT VERIFIED catalogue data**. They are synthetic seed output. They must not be counted toward coverage, must not be described as a catalogue, and should be quarantined (they already fail the public gate, which is why the website shows almost nothing).

### 4.3 The only researched dataset in the repo

`data/verified-2027/dataset.json` — `datasetAlo-verified-2027-2028-cycle-2026-10-29`:

| Item | Count |
| --- | --- |
| Universities | 10 (Manchester, Ulster, Monash, Centennial, Auckland, Dublin Business School, TUM, Copenhagen, Kyoto, Yonsei) |
| Courses | 8 |
| Course-months (Jan 2027 – Jan 2028) | 104 (15 `VERIFIED_AVAILABLE`, 52 `VERIFIED_NOT_OFFERED`, 37 `NOT_PUBLISHED`) |
| Evidence records | 30 |
| Catalogue traversals | 10 |

Assessment: a genuine, source-traced **pilot** — but it is 10 institutions and 8 courses, includes countries outside your six destinations (Japan, Germany, Denmark, South Korea), and covers 0 institutions in the United States, Canada (1), and only 1 each in Australia, Ireland, New Zealand. **This is a pilot, not a catalogue.**

### 4.4 Verified counts against authoritative registers

| Destination | Verified institution universe today | Status |
| --- | --- | --- |
| New Zealand | **8 universities** — confirmed live at `universitiesnz.ac.nz/universities` (Auckland, AUT, Waikato, Massey, Victoria Wellington, Canterbury, Lincoln, Otago) | VERIFIED |
| Australia | Register reachable (`cricos.education.gov.au` — Institution + Course search) but **not yet enumerated** | UNVERIFIED |
| United Kingdom | UCAS / Discover Uni reachable in principle; universe **not yet enumerated** | UNVERIFIED |
| Ireland | `educationinireland.com/en/universities/` returned **404** — correct URL must be located before use | BLOCKED (source URL) |
| Canada | DLI list **not yet fetched** | UNVERIFIED |
| United States | College Navigator **not yet fetched** | UNVERIFIED |

**Coverage claim: 0 of 6 destinations have a completed institution inventory. Course coverage against official catalogues: 0 measured.** No "all courses collected" claim is made or implied.

---

## 5. Capability map — existing vs required

| Requirement (§) | Existing | Gap |
| --- | --- | --- |
| University master + aliases (§5) | `CrmUniversity` has `aliases`, `slug`, `universityId`, URLs, ranking fields, `sourceUrls` | No alias **table** with merge history; no canonical-name normalisation service |
| Campuses (§5) | `Campus` (FK → `CrmUniversity`), `CrmCourse.campusId`, `CrmUniversity.campusName` | Course↔campus many-to-many not modelled (`CrmCourse.campusId` is single) |
| Faculties / schools / departments (§6) | `UniversityFaculty` (keyed by **string** `universitySlug`), `Department` (**no university link**) | Not reliable; hierarchy + department coverage reporting not supported |
| Course identity (§7.1) | `CrmCourse.courseId`, `courseCode`, `officialUrl`, `slug` | No uniqueness rule on (university, official code); duplicates unchecked |
| Study level (§7.2) | `studyLevel`, `programLevel`, `qualification`, `degreeType` free strings + lookup IDs | No controlled vocabulary enforced |
| Delivery/structure (§7.3) | `deliveryMode`, `attendanceMode`, `durationMonths`, `placementOption`, module/credits absent | No credits/modules, no handbook URL |
| Entry requirements (§7.4) | `CrmCourseRequirement`: academic, min score, prerequisites, `countrySpecificRequirement`, portfolio/interview flags | Not field-separated (academic vs English vs documents); no BD-specific split field |
| English requirements (§7.5) | IELTS/PTE/TOEFL/DET/Cambridge numeric fields inside `CrmCourseRequirement` | No separate entity, no accepted-test list, no validity period, no exemption flags, no UKVI field |
| Tuition fees (§7.6) | `CrmCourseIntakeFee` (`yearlyTuition`, `totalTuition`, `tuitionPeriod`, currencies, `feeSourceUrl`) | No academic-year field, no fee-basis enum, no `indicative/confirmed`, no deposit conditions, no refund-policy URL, no FX record |
| Intakes/deadlines (§7.7) | `intakeYear`, `intakeMonth`, `intakeName`, `applicationDeadline`, `startDate`, source URLs | No opening date, no rolling flag, no timezone, no confirmed-for-international flag |
| Scholarships (§7.8) | `CrmScholarship` (name, provider, amount, %, eligibleCountries/Levels, deadline, URL, `expiryStatus`) | No renewal, documents, separate-application flag, BD-eligibility field |
| Application documents (§7.9) | Application module has document types | Not linked to catalogue courses |
| Outcomes/services (§7.10) | `CrmUniversity.internationalStudentSupportSummary`, `CrmCourse.careerOutcomes` (free text) | No source/date, no structured outcome data |
| Source register (§4.2) | `CrmSourceLog`, `CrmOfficialSourceCheck`, `CrmSourceVerificationEvent`, `CrmOfficialEvidence` (SHA-256, excerpt, field scope) | Solid — **reuse this**, do not build another |
| Verification workflow (§12) | `CrmAuditLog`, `CrmCoverageRevision`, `UniversityUpdateRequest`, `ApprovalQueueItem`, `DataConflict` | Field-level verification authoring UI only partial |
| Import safety (§13) | `CrmImportBatch`, `CrmImportError`, dry-run, quarantine, synthetic-host rejection (`isSyntheticHost`) | No automatic rollback; no per-row undo |
| Coverage reporting (§9) | `CrmCourseMonthlyCoverage` + `scripts/verified-catalogue/report-coverage.ts` | Course-month level only; no institution/department coverage report |
| Public visibility diagnostic | `npm run catalogue:diagnose` (added 2026-11-02) | Endpoint/UI not exposed; CLI only |

---

## 6. Proposed data dictionary and schema mapping

**Principle: extend the `Crm*` model additively. Do not build a third catalogue.**

| Logical entity (§8) | Maps to | Action |
| --- | --- | --- |
| 1 Institution | `CrmUniversity` | reuse |
| 2 InstitutionAlias | `CrmUniversity.aliases` (JSON) | **propose** `CrmUniversityAlias` table (alias, type, source, mergedInto) |
| 3 Campus | `Campus` (FK `universityId`) | reuse; add campus-type/city normalisation |
| 4 FacultyOrSchool | `UniversityFaculty` | **propose** replace `universitySlug` string key with `universityId` FK |
| 5 Department | `Department` | **propose** add `universityId`, `facultyId`, `officialUrl`, `lastVerifiedAt` |
| 6 Course | `CrmCourse` | reuse; **propose** unique `(universityId, courseCode)` where `courseCode <> ''` |
| 7 CourseCampus | — | **propose** `CrmCourseCampus` join (or array field) |
| 8 CourseIntake | `CrmCourseIntakeFee` | reuse; **propose** `academicYear`, `feeBasis`, `feeConfidence`, `openingDate`, `isRolling`, `confirmedForInternational`, `deadlineTimeZone` |
| 9 EntryRequirement | `CrmCourseRequirement` | split fields; **propose** `CrmCourseAdmissionRequirement` if separation is required |
| 10 EnglishRequirement | fields inside `CrmCourseRequirement` | **propose** `CrmCourseEnglishRequirement` (accepted tests, validity, exemptions, UKVI) |
| 11 TuitionFee | `CrmCourseIntakeFee` (+ `CrmCourse.tuitionFee`) | reuse; add fee metadata above; **propose** `CrmCurrencyConversion` for any FX |
| 12 Scholarship | `CrmScholarship` | reuse; add renewal/documents/separate-application/BD-eligibility fields |
| 13 ScholarshipEligibility | `eligibleCountries`, `eligibleLevels` strings | **propose** normalise to rows, or document JSON contract |
| 14 CourseScholarship | `CrmScholarship.courseId` (single) | reuse (course-specific) |
| 15 CourseDocumentRequirement | — | **propose** `CrmCourseDocumentRequirement` |
| 16 Accreditation | partial (`CrmUniversity` free text) | **propose** `CrmAccreditation` (body, scope, source, checked) |
| 17 RankingSnapshot | `CrmRanking` + `CrmUniversity.ranking*` | reuse |
| 18 SourceRecord | `CrmSourceLog` / `CrmOfficialEvidence` | reuse |
| 19/20 Course/InstitutionSource | `sourceUrl`, `sourceUrls`, `CrmOfficialEvidence.fieldScope` | reuse |
| 21 VerificationRecord | `CrmSourceVerificationEvent`, `UniversityUpdateRequest` | reuse |
| 22 ChangeHistory | `CrmAuditLog`, `CrmCoverageRevision`, legacy `*History` | reuse; **do not** create a third history |
| 23 ImportBatch | `CrmImportBatch` | reuse |
| 24 ImportError | `CrmImportError` | reuse |
| 25 DataQualityIssue | `DataConflict`, `catalogue-review` analysis | **propose** persisted issue table if durable tracking is needed |

No migration will be written or executed until §2 above is approved and a non-production database is provided.

---

## 7. Risk register

| # | Risk | Severity | Evidence / note | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Synthetic seed data (400 unis / ~11k courses) mistaken for a catalogue and "topped up" | **Critical** | §4.2 — generated titles, 404 URLs, flat fees | Quarantine + label; delete or keep permanently unpublished; never count |
| R2 | Parallel masters (111 CSVs, 5 "course masters") create irreconcilable duplicates | **High** | §4.1 — up to 69% redundant rows | One canonical dataset file; others archived read-only with a signed-off mapping |
| R3 | No database access → imports, dedupe and coverage cannot be validated | **High** | §2 | Owner supplies a non-production `DATABASE_URL` |
| R4 | No shell egress → repo crawlers cannot run here | **High** | §2 (`curl` → 000) | Agent-tool collection, or run crawlers on an egress-enabled host |
| R5 | Two catalogue models (Crm* vs legacy pages) diverge | **High** | §3.2 | Written rule: `Crm*` is canonical; legacy pages are display enrichment only |
| R6 | Public gate requires literal `VERIFIED` while legacy labels are `VERIFIED_OFFICIAL` / `CROSS_SOURCE_VERIFIED` | **Medium** | §4.2, `public-catalog.ts` | Decide vocabulary once (owner decision) — not silently |
| R7 | Faculty/department coverage is not representable today | **Medium** | §5 | Additive schema change in Phase 2 (approved) |
| R8 | Fee/intake gates hide fees even when the course is visible | **Medium** | `publicIntakeWhere` | Count fee coverage separately in every report |
| R9 | Third-party aggregators (ApplyBoard etc.) terms prohibit extraction | **High (legal)** | §4.1 of spec; no licence on file | Official university pages only; obtain written licence before any aggregator use |
| R10 | Fabrication risk under "coverage" pressure (AI-generated plausible values) | **Critical** | Spec §2.3 | Every value needs a URL + check date; `NOT PUBLISHED` is an acceptable outcome |
| R11 | Bulk import into production without rollback | **High** | §13 of spec | Dry-run + batch + backup + approval gate |
| R12 | Existing uncommitted/parallel work overwritten by a refactor | **Medium** | Clean tree today | Branch-per-phase, no history rewrites |

---

## 8. Phased execution plan and approval gates

| Phase | Work | Output | Gate |
| --- | --- | --- | --- |
| **0 — done** | This report | baseline | **You approve scope below** |
| 1 | Enumerate the institution universe per destination from official registers (NZ 8 already confirmed; AU via CRICOS; UK via official provider registers/UCAS; IE correct official URL first; CA DLI; US College Navigator/IPEDS); selection score + inclusion/exclusion register for US/CA | `institution-universe.csv`, `selection-register.csv`, `source-map.csv` | Approve institution universe (esp. US/CA targets) |
| 2 | Data-model mapping + gap list; duplicate audit of existing rows (needs DB) | mapping doc, migration **proposal only** | Approve any schema change |
| 3 | Pilot: 2 institutions per destination, full field set, every value sourced | pilot dataset + coverage + gap report | Approve field definitions |
| 4 | Full collection to approved scope, per country | datasets + coverage per institution/department | Approve per country before moving on |
| 5 | QA: duplicates, source revalidation, completeness, field consistency | QA report | — |
| 6 | Import preview + rollback plan (non-production) | preview + errors + backup plan | **Explicit approval before any write** |
| 7 | Course Finder / detail-page integration for approved changes | code + tests | Approve integration |
| 8 | Handover: source register, coverage report, refresh schedule | handover pack | — |

**Recommended first increment (cheapest path to real value):** complete New Zealand (8 universities, universe already verified) end-to-end through Phase 1–4. It is small, bounded and proves the whole pipeline before scaling to ~140 UK institutions.

---

## 9. Blockers and required permissions

| # | Blocker | Needed from owner |
| --- | --- | --- |
| B1 | **No database access** (no `DATABASE_URL`, no MySQL) → no dedupe, no counts, no import validation | A **non-production** MySQL URL (and confirmation of which environment this branch maps to) |
| B2 | **Production/staging identity unconfirmed** | Written confirmation; nothing will be run against production |
| B3 | **No shell egress** in this workspace | Confirm agent-tool research is acceptable as the collection channel, or provide an egress-enabled host |
| B4 | **Verification vocabulary decision** (`VERIFIED` vs `VERIFIED_OFFICIAL`/`CROSS_SOURCE_VERIFIED`) | Owner decision; affects what becomes public |
| B5 | **Fate of synthetic data** (400 unis / ~11k courses) | Delete, or keep permanently unpublished and labelled |
| B6 | **US/Canada initial target size** (spec §3.5 asks me to propose) | Approval of a number + rationale (proposal below) |
| B7 | **Legacy page model** (`UniversityPage`/`CoursePage`) | Confirm "Crm* is canonical, legacy = display enrichment" |
| B8 | **Aggregator licensing** | No licence on file — confirm official-pages-only |
| B9 | **Approval to commit** | §2.2: nothing will be committed/pushed/merged without your word |

### Proposal for B6 (needs your approval)

US: **40 institutions** (25 nationally recognised research universities with documented international recruitment + 15 credible regional/public institutions with strong international admission pages). Canada: **25 institutions** spanning all 10 provinces, weighted to DLIs with documented PGWP-eligible programmes. Rationale: enough breadth for Bangladesh demand without attempting a 4,000-institution US inventory in the first release.

---

## 10. What this report does **not** claim

- Not claimed: complete coverage, verified fees, verified deadlines, scholarship values, or "all courses collected".
- Not claimed: that the 400 seeded universities or ~11,000 seeded courses are real catalogue data.
- Not claimed: that any mocked unit test proves production readiness.
- Measured, honest position: **1 destination's institution universe verified (NZ, 8), 5 destinations unenumerated, 10 institutions and 8 courses genuinely researched, 0 imports executed, 0 database writes.**

---

*Awaiting approval to start Phase 1. No file in the application, schema, database or deployment config was modified to produce this report.*
