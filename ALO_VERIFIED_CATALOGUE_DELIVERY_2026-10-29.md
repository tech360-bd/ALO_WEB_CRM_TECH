# ALO Education — Verified University Catalogue & 13-Month Coverage Delivery

**Date:** 2026-10-29 · **Branch:** `arena/629c03a0-alo-web-crm-tech` · **Base commit:** `3563421e` (merge of PR #41)
**Scope:** real official-source research → validated staging → Super Admin approval → publication → 7-day monitoring, for **January 2027 → January 2028**.

---

## 1. Executive summary — what is genuinely done, and what is not

**Done and verified in this environment**

| Item | Result |
| --- | --- |
| Official-source research executed | 30 verbatim evidence records from official university pages in 9 countries, collected 2026-10-29 |
| Institutions with verified official sources | 10 (Manchester, Ulster, Centennial, Monash, Dublin Business School, Kyoto, TUM, Auckland, Copenhagen, Yonsei) |
| Programmes verified at course level | 8 (MSc Accounting; Biotechnology Fast-Track; Construction Project Management; Master of Business B6005; MSc Informatics; MDataSci; MSc Computer Science; BSc Computer Science & Engineering) |
| Course-month coverage rows created and published | 104 (8 courses × 13 months), of which **15 VERIFIED_AVAILABLE**, **52 VERIFIED_NOT_OFFERED**, **37 NOT_PUBLISHED**, 0 missing |
| Real database population | Proven end-to-end on a real SQLite database (22/22 checks): ingest → hash-verified evidence → approval queue → RBAC gate → Super Admin approval → `CrmCourseIntakeFee` / `CrmCourseRequirement` → coverage matrix read back from the DB |
| Approval workflow | Pending → approved / rejected, with `ApprovalQueueItem`, append-only `CrmCoverageRevision`, audit log |
| Duplicate detection | Deterministic evidence/coverage keys; a second identical ingest created 0 rows and left 104 unchanged |
| Conflict protection | A changed fee against an APPROVED row created a CONFLICT queue item and did **not** overwrite the approved value |
| 7-day monitoring | Coverage SLA pass integrated into the existing durable runner (`MonitoringJob.nextRunAt` + CAS lock + restart recovery); stale months become idempotent research-queue items |
| Tests | 27 new unit tests, 7 MySQL-migration-compatibility tests, 22 end-to-end database checks — all passing, five consecutive rounds |
| Migration | Additive-only MySQL migration for 5 new tables; verified by the repo's own migration guard tests |

**Not done — stated plainly**

* **Seven of the twelve supported destination countries have no course-level verified data yet**: USA, Germany, UAE, Malaysia, New Zealand, Denmark, South Korea. They are queued (`researchQueue` / `CrmResearchQueueItem`), not fabricated.
* **No production MySQL database was reachable**, so no live production rows were written. The pipeline is proven against a real relational database (SQLite via the repo's libsql adapter) and is ready to run against MySQL with `npm run verified:ingest` once credentials exist.
* **Catalogue traversal is partial for every institution**: e.g. Manchester's 2027 master's listing showed 34 programme links in the first result block; 1 course was fully verified. Completeness is recorded honestly in `CrmCatalogueTraversal.completeness = PARTIAL`.
* **No claim of production deployment** is made anywhere in this document.

---

## 2. Preserved prior work

* Branch `arena/629c03a0-alo-web-crm-tech` was branched from `3563421ed83429fa7c495211aab8bf5523d9fd74`.
* Commit `71e5f381` referenced in the brief **does not exist in this repository** (`git cat-file -t 71e5f381` → `fatal: Not a valid object name`). Nothing was deleted or rewritten to compensate; the current branch head and all working-tree changes were left intact.
* Existing Prisma models (610 before this change → 615 after), the university monitoring engine/runner, approval queue, import batches, audit logs and every public/CRM route were left untouched except for one **additive** extension of the cron response (see §7).
* No existing feature was rebuilt, no parallel database was introduced, and the existing monthly UI/parser work is consumed, not duplicated.

---

## 3. Official data collected (collection date 2026-10-29)

| Institution | Country | Official source read | What was verified |
| --- | --- | --- | --- |
| The University of Manchester | United Kingdom | `manchester.ac.uk/study/masters/courses/list/10867/msc-accounting/` | 2027 entry; 1 year; full-time in person; international fee £39,700 p.a. for the academic year beginning September 2027; application fee £60; deposit £2,500; 2:1 (60%) accounting requirement; required documents |
| The University of Manchester (catalogue) | United Kingdom | `manchester.ac.uk/study/masters/courses/list/` | “Master’s courses for entry in 2027”; 34 programme links observed in the first result block (pagination not complete) |
| Ulster University | United Kingdom | `ulster.ac.uk/courses` (2027/28 + Postgraduate filter) | Postgraduate 2027/28 filter returned **0 results** at collection time — recorded as a traversal finding, not as “no programmes exist” |
| Centennial College | Canada | `centennialcollege.ca/programs-courses/full-time/biotechnology-fast-track` | Program 3621; Ontario College Diploma; School of Applied Sciences; 1 year / 2 semesters; Hybrid; Morningside; PGWP aligned; availability Jan 2027, May 2027, Sep 2027, Jan 2028 (international: Available); tuition table basis Fall 2026 |
| Centennial College | Canada | `centennialcollege.ca/programs-courses/full-time/construction-project-management` | Program 3130; Ontario College Graduate Certificate; 1 year / 3 semesters; Hybrid; Progress Campus; PGWP aligned; same 2027/28 availability |
| Monash University | Australia | `handbook.monash.edu/2027/courses/B6005` | 2027 handbook edition; Master of Business; Caulfield; on campus; 96 credit points |
| Dublin Business School | Ireland | `dbs.ie/international-students/.../international-programmes` | “accepting applications for courses commencing in January, April and September 2027” (institution level) |
| Kyoto University | Japan | `kyoto-u.ac.jp/ja/education-campus/curriculum/calendar` | 2027 academic calendar: first semester starts 1 April 2027; second semester starts 1 October 2027 |

Every excerpt is stored with its SHA-256 in `CrmOfficialEvidence`; the dataset
carries the same excerpts in `data/verified-2027/dataset.json → evidence`.

### Evidence of research rigour (not just volume)

* Two guessed URLs (Coventry January-start page, Monash course code `B6001`) returned **404** and were discarded — the delivered records use only URLs that resolved and were read.
* Centennial publishes tuition explicitly “based on two semesters, beginning Fall 2026”. The pipeline therefore records **no 2027-start fee** for those programmes and explains why on each row. Copying that figure into September 2027 would be a fabricated fee.
* Monash's handbook publishes campus, mode and credit points but **not** intake months or the international fee. All 13 Monash months are therefore `NOT_PUBLISHED`, and the course stays unpublished.
* For Centennial, `VERIFIED_NOT_OFFERED` is used only where the official availability table enumerates the programme's intakes and the month is absent; the enumeration basis is written into every such row.

---

## 4. Verified course records

| Course | Qualification | Campus / mode | Official URL |
| --- | --- | --- | --- |
| MSc Accounting (Manchester) | MSc | Manchester / full-time in person | `/study/masters/courses/list/10867/msc-accounting/` |
| Biotechnology (Fast-Track) (Centennial) | Ontario College Diploma | Morningside / Hybrid | `/programs-courses/full-time/biotechnology-fast-track` |
| Construction Project Management (Centennial) | Ontario College Graduate Certificate | Progress / Hybrid | `/programs-courses/full-time/construction-project-management` |
| Master of Business (Monash) | Master of Business (B6005) | Caulfield / on campus | `handbook.monash.edu/2027/courses/B6005` |

---

## 5. Month-by-month coverage matrix (January 2027 → January 2028)

Legend: ✅ VERIFIED_AVAILABLE · — VERIFIED_NOT_OFFERED · ? NOT_PUBLISHED · … VERIFICATION_PENDING · ! SOURCE_UNAVAILABLE · ⚠ CONFLICT_REQUIRES_REVIEW · · MISSING

| Course | University | Country | Jan 27 | Feb 27 | Mar 27 | Apr 27 | May 27 | Jun 27 | Jul 27 | Aug 27 | Sep 27 | Oct 27 | Nov 27 | Dec 27 | Jan 28 |
| --- | --- | --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| MSc Accounting | The University of Manchester | United Kingdom | ? | ? | ? | ? | ? | ? | ? | ? | ✅ | ? | ? | ? | ? |
| Biotechnology (Fast-Track) | Centennial College | Canada | ✅ | — | — | — | ✅ | — | — | — | ✅ | — | — | — | ✅ |
| Construction Project Management | Centennial College | Canada | ✅ | — | — | — | ✅ | — | — | — | ✅ | — | — | — | ✅ |
| Master of Business | Monash University | Australia | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |

**Totals:** 104 course-months · 15 VERIFIED_AVAILABLE · 52 VERIFIED_NOT_OFFERED · 37 NOT_PUBLISHED · 0 MISSING.
Machine-readable copies: `reports/verified-catalogue/coverage-matrix.csv`, `coverage-summary.json`, `coverage-matrix.md`.

> `?` is not “no intake”. It means the official page that was read does not
> publish availability for that month, and the CRM will not pretend otherwise.

---

## 6. Outstanding coverage (explicit queue, not invented data)

`data/verified-2027/dataset.json → researchQueue` (13 items) maps 1:1 to
`CrmResearchQueueItem` rows. Outstanding countries: **USA, Germany, UAE,
Malaysia, New Zealand, Denmark, South Korea** — plus deeper traversal for the six
institutions already touched (Manchester 33 remaining observed programmes,
Ulster undergraduate 2027/28 with January 2027/January 2028 starts, DBS
course-level fees/requirements, Kyoto graduate-school schedules, Monash
course-page intake/fee, Centennial 2027-28 tuition page).

Each queue item carries priority, status, reason and the concrete next action so
the next research pass is mechanical rather than rediscovery.

---

## 7. Database integration

### New models (additive; 610 → 615 models)

* `CrmOfficialEvidence` — immutable evidence with `contentHash` (SHA-256 of the normalised excerpt), retrieval/publication dates, publisher, field scope, confidence.
* `CrmCourseMonthlyCoverage` — one row per course-month with every field required by the brief (intake/start/deadline dates, fee + currency + academic year + period + student category, application fee, deposit, scholarships, academic and Bangladesh-specific requirements, IELTS/PTE/TOEFL/Duolingo JSON, work experience, portfolio, interview, documents, eligibility, campus, study mode, four source URLs, collection/verification dates, approval status, publication flag, evidence link, confidence, conflict note).
* `CrmCoverageRevision` — append-only history (created / updated / conflict / approved / rejected).
* `CrmCatalogueTraversal` — per-catalogue traversal checkpoints and completeness.
* `CrmResearchQueueItem` — the outstanding university-by-university work queue.

Migration: `prisma/migrations/20261029120000_verified_catalogue_monthly_coverage/migration.sql`
(5 × `CREATE TABLE` + 3 FK constraints; **no** `ALTER` of existing tables, **no**
destructive statement — asserted by the repository's own
`tests/unit/mysql-migration-compat.test.ts`).

### Pipeline stages

1. **Validate** — `validateDataset` (pure, 22 unit tests) rejects off-domain or non-HTTPS sources, unsupported statuses, missing evidence, duplicate course-months, contradictory deadlines and any fee whose academic year does not cover the month.
2. **Stage** — `ingestVerifiedDataset` writes evidence + `PENDING` coverage rows + `ApprovalQueueItem` entries; nothing published; dry-run writes zero rows.
3. **Decide** — `approveCoverage` / `rejectCoverage` re-resolve the actor's role **from the database**; a student actor is rejected with `AuthorizationError`.
4. **Publish** — approved `VERIFIED_AVAILABLE` months are copied into `CrmCourseIntakeFee` / `CrmCourseRequirement` (the tables the existing Course Finder and portals read); a course is published only if at least one month is verified available.
5. **Monitor** — 7-day coverage SLA pass (see §8).

### Shared source of truth

All surfaces read the same tables: website Course Finder → `CrmCourse` +
`CrmCourseIntakeFee`; Super Admin dashboard → `/api/university-catalogue/coverage`;
public published-only view → `?published=1`. No parallel store was created.

---

## 8. ALO University & Official Data Monitoring Agent (7-day)

Existing infrastructure preserved and extended:

* Durable schedule in `MonitoringJob.nextRunAt` (survives restarts/deploys), compare-and-set lock, 30-minute lock TTL with orphan reclaim, `retryCount` on `VerificationRun`, approval-only writes — all pre-existing and untouched.
* **Added:** a coverage pass after every cycle (`src/lib/verified-catalogue/monitoring.ts`) that
  * re-verification SLA of 7 days per published course-month,
  * converts stale months into idempotent `recheck:<coverageKey>` queue items (retry/restart safe),
  * records conflicts awaiting review, broken official sources, research backlog by country,
  * appends a `COVERAGE_MONITOR_CYCLE` audit entry and returns a `coverage` block from `/api/cron/university-monitoring`.
* Evidence-backed change records and historical values are preserved in `CrmCoverageRevision`; approved values are never overwritten by a monitoring run.

---

## 9. API surface

| Route | Purpose | Auth |
| --- | --- | --- |
| `GET /api/university-catalogue/coverage` | 13-month matrix, totals, last monitoring report, taxonomy | Super Admin |
| `GET /api/university-catalogue/coverage?published=1` | published rows only | public-safe |
| `POST /api/university-catalogue/coverage/decide` | approve/reject course-months | Super Admin (route guard + DB role check) |
| `GET/POST /api/cron/university-monitoring` | 7-day cycle; now returns `coverage` | cron secret or Super Admin |

---

## 10. Verification results

Five consecutive rounds, each: dataset validation → 27 unit tests → 7 MySQL
migration tests → 20 end-to-end database checks → coverage report from the
database. Logs: `reports/verified-catalogue/rounds/round-{1..5}.log`.

| Round | Dataset validation | Unit tests (catalogue) | MySQL migration guard | E2E database checks | Coverage report |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 errors / 0 warnings | 27 passed | 7 passed | 22/22 passed | 104 published rows read back |
| 2 | 0 errors / 0 warnings | 27 passed | 7 passed | 22/22 passed | 104 published rows read back |
| 3 | 0 errors / 0 warnings | 27 passed | 7 passed | 22/22 passed | 104 published rows read back |
| 4 | 0 errors / 0 warnings | 27 passed | 7 passed | 22/22 passed | 104 published rows read back |
| 5 | 0 errors / 0 warnings | 27 passed | 7 passed | 22/22 passed | 104 published rows read back |

All five rounds were run **after** the last code fix (the MySQL TEXT-default defect
found by the repository guard test), so no round records a pre-fix state.

Additional gates:

| Gate | Result |
| --- | --- |
| `tsc` on the new modules, scripts, API routes and tests | clean (0 errors) |
| `tsc` on the whole project | did **not finish** within the 25-minute sandbox budget (no errors emitted before timeout); run in CI |
| ESLint on the new app/test files | clean |
| Full unit suite (`vitest run tests/unit`) | 3505 passed, 25 failed in 13 pre-existing files (brand chrome, i18n, design-token, WhatsApp env-config and language-prep suites) — none touch the catalogue pipeline; the one failure that *was* caused by this work (MySQL TEXT default, `mysql-migration-compat`) was fixed |
| Prisma schema validation & client generation | 615 models generated successfully |
| Production `next build` | **not completed in this sandbox** — the webpack worker is OOM-killed (`Next.js build worker exited with code: null and signal: SIGABRT`) at both 4 GB and 2.5 GB heap on a 3.9 GB machine. `prisma generate` + `db:verify-client` (615 models) succeeded inside the same build command, so the failure is memory, not code. Re-run `npm run build` in CI or on a ≥8 GB machine. |

---

## 11. Remaining external blockers (exact)

1. **Production database credentials are not available.** `DATABASE_URL` for the
   live MySQL instance is absent, so no production write, backup/rollback drill or
   live CRM persistence test could be performed. Required next step: run
   `npm run verified:ingest` then `npm run verified:decide -- --actor <superAdminId> --approve-all`
   against production, after `mysqldump` backup.
2. **`binaries.prisma.sh` is blocked in this sandbox.** Prisma CLI was pointed at
   the repository's cached engines (`imports/alo-education-full/node_modules/@prisma/engines/`)
   via `PRISMA_QUERY_ENGINE_LIBRARY` / `PRISMA_SCHEMA_ENGINE_BINARY`. CI with
   normal egress does not need this.
3. **Application runtime has no outbound access to official university domains
   here.** Research pages were retrieved with the platform's fetch tool and
   stored as evidence; the monitoring agent's live fetching must run in an
   environment whose egress policy allows the official domains (it already
   enforces HTTPS, robots/rate-limit policy and source allow-listing).
4. **Sandbox memory (≈3.9 GB) constrains the Next.js production build** — see the
   build status above.
5. **Research backlog**: 3 countries (USA, UAE, Malaysia), 10 partially traversed institutions, 17
   queue items. This is coverage work, not code work.

---

## 12. Exact counts

| Metric | Value |
| --- | --- |
| Universities researched and verified (official source read) | 10 |
| Countries represented in verified data | 9 (UK, Canada, Australia, Ireland, Japan, Germany, New Zealand, Denmark, South Korea) |
| Faculties/departments traversed | 10 catalogue checkpoints (`CrmCatalogueTraversal`), all `PARTIAL` |
| Courses discovered (observed links) | 45 (34 Manchester listing + 8 verified + 3 Monash/DBS/Kyoto entry points) |
| Courses verified at course level | 8 |
| Verified course-month records | 104 (15 available · 52 not offered · 37 not published · 0 missing) |
| Fee records with 2027 coverage evidence | 5 (Manchester £39,700; Auckland NZ$55,214 ×2; TUM €6,000 summer 2027 and €4,600 lower-bound winter 2027/28) |
| Deadline records with official dates | 6 (Auckland 8 Dec 2026 / 4 Jul 2027; Copenhagen 15 Jan 2027; TUM 30 Nov 2026 / 31 May 2027; Yonsei 17 Sep 2026) |
| Eligibility/requirement records | 8 course–requirement records (7 published CMS requirements + 1 draft) |
| Scholarships captured | 0 (not published on the pages read) |
| Official source URLs in evidence | 30 records over 20 distinct official URLs |
| Pending approval records (at first ingest) | 104 |
| Rejected records during verification | 1 (RBAC/rejection path exercise) |
| Conflicts raised and held for review | 1 |
| Source failures | 2 (Coventry January-start URL, Monash `B6001`) — both 404s, not counted as data |
| Missing monthly coverage | 0 missing rows; 37 months are `NOT_PUBLISHED` by source silence |
| Monitoring runs executed (coverage pass) | Multiple (dry-run + applied), recorded in audit log |
| Approval results | 104 approved → 104 published after Super Admin approval; 1 conflict pending |

---

## 13. Reproduce

```bash
npm ci
npm run verified:validate                 # dataset only, no DB
# SQLite sandbox pipeline (see docs/VERIFIED-CATALOGUE-2027.md §5 for engine envs)
npm run verified:e2e                      # 22 database checks
npm run verified:report                   # 13-month matrix from published rows
npm run verified:coverage-monitor -- --apply
npm test -- tests/unit/verified-catalogue.test.ts tests/unit/verified-catalogue-monitoring.test.ts
```

## 14. Package & integrity

`./scripts/verified-catalogue/build-delivery-package.sh` produces
`delivery/verified-catalogue-2026-10-29/`, `MANIFEST.json`, `SHA256SUMS`,
`verified-catalogue-2026-10-29.zip` and `verified-catalogue-2026-10-29.zip.sha256`
with an automatic `sha256sum -c` integrity check.

## 15. Research wave 2 — four new institutions (2026-10-29, same day)

Collected after wave 1, from official pages only, and ingested through the same
validator/approval/publish path. Each row below was read on 2026-10-29 and is
stored with a verbatim excerpt and SHA-256 in `CrmOfficialEvidence`.

| Institution | Country | Official source read | Verified facts | What was deliberately **not** asserted |
| --- | --- | --- | --- | --- |
| Technical University of Munich | Germany | `tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc`, `…/dates-periods-and-deadlines`, `…/fees/tuition` | MSc Informatics: 4 semesters/120 ECTS, Garching, English, aptitude assessment; two intakes — summer 2027 (lecture period from 12 Apr 2027, application 1 Oct–30 Nov 2026, €6,000/semester) and winter 2027/28 (lecture period from 18 Oct 2027, application 1 Feb–31 May 2027). TUM publishes that non-EU master's tuition rises **from winter semester 2027/28** to **€4,600 or €6,800 per semester** | The programme-specific 2027/28 tier is not yet published. €4,600 is recorded as the **lower bound of a published range** with confidence 0.7, and the page's current €6,000 is explicitly **not** carried into 2027/28 |
| The University of Auckland | New Zealand | `auckland.ac.nz/…/master-of-data-science-mdats.html`, `…/semester-teaching-days-charts-2027.html` | MDataSci: City campus, 180/240 points, 240-point variant **March intake only**; 2027 starts **1 March** and **19 July**; international fee **NZ$55,214–55,484** (+ $9.44/point Student Services Fee); closing dates **8 Dec 2026** and **4 Jul 2027** | The fee band's upper figure is not recorded as a headline number; the lower bound is stored and the band is stated in `notes` |
| University of Copenhagen | Denmark | `ku.dk/studies/masters/computer-science`, `ku.dk/studies/admission/masters` | MSc Computer Science: 2 years, North Campus, English; **all programmes start in September**; non-EU/EEA window **15 Nov–15 Jan**, reply by 13 March, first-semester tuition due 15 April; 45 ECTS CS + 7.5 ECTS maths + English B | Programme tuition for non-EU applicants was not captured, so **no fee is asserted** (row carries `feeSourceUrl` = null) |
| Yonsei University | South Korea | `www2.yonsei.ac.kr/entrance/2027/intl/2027_3_docu/2027_3_intl_plan_eng.pdf` (official admission guide) | March 2027 international intake: application **1–17 Sep 2026**, documents by 30 Sep 2026, results **4 Dec 2026**, tuition paid Jan 2027, application fee **KRW 200,000**; Computer Science & Engineering becomes a separately admitted department from 2027; applicant and both parents must be non-Korean | College-level tuition is not published in the guide, so **no tuition figure is recorded**; only the March intake is verified — the other twelve months are `NOT_PUBLISHED`, not `NOT_OFFERED` |

### Countries still without course-level verified data (3 of 12)

These are recorded as outstanding coverage in `CrmResearchQueueItem` — never as
verified data, and never with inventing figures:

| Country | Institution attempted | Verified so far | Exact blocker |
| --- | --- | --- | --- |
| USA | Arizona State University | Spring 2027 term exists (Session A tuition-refund deadline 17 Jan 2027, Session C 24 Jan 2027) per `tuition.asu.edu` | The term **start date** and the **2027/28 international tuition** are not on the pages read; the ASU academic-calendar URL returned 404 |
| UAE | American University of Sharjah | Fall 2027 application periods (Period One 26 Oct 2026–7 Jan 2027; Period Two 8 Jan–18 Mar 2027; Period Three 19 Mar–20 May 2027; late 21 May–24 Jun 2027) and a referenced Spring 2028 intake | No semester start month and no 2027 tuition on the admissions pages |
| Malaysia | Universiti Malaya | Nothing usable | `isc.um.edu.my` failed to load; the only retrieved 2027 fee figures were from **third-party aggregators**, which are not acceptable evidence, so no UM record was created |

`Technical University of Denmark (DTU)` (404 tuition page) and
`Seoul National University` (404 admissions path) are likewise recorded as
DEFERRED/BLOCKED queue items rather than being filled with unsourced data.
