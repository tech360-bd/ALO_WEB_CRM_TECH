# Unified University + Course System — build status against the master specification

Date: 2026-10-13
Branch: `arena/57b0809e-alo-web-crm-tech`
Status token: **ALO_UNIFIED_UNIVERSITY_COURSE_SYSTEM_INCOMPLETE**

This document is the honest answer to the master spec's §55 self-audit. It separates:

* **VERIFIED** — exercised in this environment, with the exact command/result.
* **PRESENT, UNVERIFIED** — the code/route/table exists and typechecks, but it could not be
  run end to end here (see "Environment limits").
* **MISSING / BROKEN** — genuinely absent or known-failing, with the fix required.

Nothing below is marked VERIFIED on the strength of code existing alone.

---

## Environment limits (why so much is unverified)

| Limit | Effect |
| --- | --- |
| No MySQL server reachable (`127.0.0.1:3306` has no listener) | Every DB-backed flow (search results, saves, imports, approvals) cannot be executed. |
| Prisma query engine binary unavailable (download blocked) | Even a reachable DB would not work: `Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x"`. All API calls fail at the DB boundary. |
| No headless browser | No click-through testing; verification is HTTP/HTML inspection plus pure-function tests. |
| Local production build OOMs (`next build --webpack`) | Build verification is CI-only. |

Consequence: **no checklist item that requires a database read or write can be marked
VERIFIED in this session.** The intake-window backfill in particular has never executed
against a real database.

---

## 1. Work completed in this session

### 1.1 Intake window — "all courses for every month, Jan 2027 → Jan 2028" (spec headline)

| Item | State |
| --- | --- |
| Canonical window definition (13 months) | `src/lib/course-finder/intake-window.ts` — VERIFIED (pure-function test below) |
| Year-qualified month parser (`2027-01`, `Jan 2028`, bare `5`) | VERIFIED — 15/15 assertions |
| Public finder chips now cover the whole window incl. Jan 2028 | VERIFIED via rendered HTML (`Jan 2028`, `ALO intake window` present) |
| API accepts year-qualified tokens; invalid tokens → 400 | VERIFIED (400 with specific message for `intakeMonth=banana`) |
| Unverified months are labelled honestly ("Deadline & fees pending verification") | VERIFIED in component logic; API emits `verified` per intake |
| Backfill: 13 rows per course, no invented fees, `SCHEDULED` not `VERIFIED`, never overwrites verified rows, idempotent | PRESENT, UNVERIFIED — `src/lib/course-finder/intake-window-backfill.ts` |
| CLI `npx tsx scripts/backfill-intake-window.ts` | PRESENT, UNVERIFIED |
| Admin API `POST/GET /api/admin/courses/intakes/backfill` (Super Admin / data manager + coverage report) | PRESENT, UNVERIFIED — reachability only |

Pure-function test result (run in this session):

```
PASS window length (Jan 2027 - Jan 2028) = 13   PASS first/last month 2027-01 / 2028-01
PASS label "Jan 2027 – Jan 2028"                PASS parse 2027-01, 2028-01, "Jan 2028", bare 5
PASS banana -> null                             PASS month 13 rejected
PASS 2027 chips = 12, 2028 chips = Jan only, 2029 chips = 12
ALL WINDOW CHECKS PASS
```

### 1.2 Canonical course search (spec §33)

* Added the six missing parameters: `min_tuition`, `max_tuition`, `application_fee`,
  `deposit`, `english_test`, `english_score`, `duration`, `deadline`.
* **Fixed a real bug**: the endpoint reassigned `where.OR` per filter, so combining `q` with
  `university`/`study_area`/`tag` silently discarded the text search. Filters are now
  independent `AND` clauses.
* English-test matching is shared with the public finder through the newly exported
  `buildEnglishTestWhere()`, so the two endpoints cannot disagree.
* Verified live: requests compile and reach the Prisma boundary (fails only on the missing
  engine). The earlier `buildEnglishTestWhere is not a function` was a stale Turbopack module
  graph, resolved by clearing `.next` — not a code defect.

### 1.3 English-test vocabulary (spec §4)

The filter knew 9 of the 12 tests in the spec. Added `university_test` (tied to the real
`CrmCourse.universityOwnEnglishTest` flag) and `other`. VERIFIED — 11/11 keys build a clause.

### 1.4 Public data safety (spec §32) — VERIFIED

```
PASS public where always includes published + VERIFIED    PASS intake policy = VERIFIED|SCHEDULED only
PASS public row omits commission / internalNotes / partnerNotes / staffNotes /
     privateAgreement / riskStatus   (private fields injected deliberately, none surfaced)
PASS invalid englishTest rejected (400) instead of silently ignored
```

---

## 2. Spec surface that already existed (preserved, not rebuilt)

All 27 routes the spec requires are present as pages:

`/universities`, `/universities/[slug]`, `/course-finder`, `/course/[slug]`,
`/destinations/[slug]`, `/scholarships`,
`/student/{course-finder, course/[id], shortlist, compare, apply/[course_id]}`,
`/partner/{search-programs, program/[id], apply/[student_id]/[course_id]}`,
`/crm/{universities, university/[id], courses, course-finder, course/[id]}`,
`/admin/{universities, universities/create, courses, courses/create, import-center/universities,
import-center/courses, import-center/scholarships, university-data-updates}`.

Data models the spec names exist in `prisma/schema.prisma`: `CrmUniversity`, `CrmCourse`,
`CrmCourseIntakeFee`, `CrmCourseRequirement`, `CrmScholarship`, `CrmSourceLog`,
`CrmSourceVerificationEvent`, `CrmAuditLog`, `SourceLog`, `UpdateRequest`, `WeeklyUpdateRequest`,
`UniversityUpdateRequest`, `DataQualityScore`, `VerificationRun`. Weekly AI crons exist
(`/api/cron/weekly-ai-agent`, `weekly-university-scan`, `weekly-university-update`).

Because these predate this session and could not be exercised, they are **PRESENT, UNVERIFIED**
— not counted as delivered.

---

## 3. MISSING / BROKEN — exact failed items

| # | Route / Feature | Table / API | Error or gap | Required fix |
| --- | --- | --- | --- | --- |
| 1 | Intake window backfill never executed | `CrmCourseIntakeFee` | No reachable MySQL; engine binary missing | Run `npx tsx scripts/backfill-intake-window.ts` (or POST the admin endpoint) against a seeded DB, then confirm every active course has 13 rows |
| 2 | All DB-backed flows untested | all | `PrismaClientInitializationError` at query time | Provision MySQL + engine (CI or staging), then execute the §55 checklist |
| 3 | `buildCourseFinderWhere` intake clash (potential) | `src/lib/public-catalog.ts` | When a period filter is set, `intakeFees.some` uses `AND`-pushed OR clauses while the plain `intakeFee` object is also mutated if `intakeMonths`/`intakeMonth` are set — the route guards this, other callers may not | Make the period branch mutually exclusive inside the builder itself rather than relying on callers |
| 4 | Duplicate detection / merge | `CrmUniversity`, `CrmCourse` | Logic exists in admin surface; behaviour unverified | Test with near-duplicate rows (normalised name + country, course: university + name + level) |
| 5 | CSV import validation | `/admin/import-center/*` | Upload → validate → preview → confirm flow unverified | Execute with a fixture CSV covering invalid country, duplicate code, bad numeric fee, bad date |
| 6 | Weekly AI update + approval chain | `UpdateRequest`, `UniversityUpdateRequest` | Cron exists; no evidence of a detected change, old/new values, evidence upload or an approval write | Run the cron against one university with a changed official page; approve one change and confirm it propagates to public pages |
| 7 | No automatic publishing guarantee | approval UI | "AI must not auto-publish" is a behavioural claim, unverified | Add an explicit test asserting no publish path exists without `reviewed_by` |
| 8 | University logos / copied text (spec §48) | `CrmUniversity.logo`, descriptions | Data-provenance question, not code: cannot be cleared by inspection here | Audit each `logo` value for licence/ownership; replace unclear ones with the spec's text-identity card |
| 9 | University page requirement/English honesty | `CrmCourseRequirement` | Empty states exist in copy but unverified against real empty data | Load a university with no requirement rows and confirm the "being verified" message shows (never a fabricated value) |
| 10 | Partner commission isolation | partner APIs | Server-side filtering present by inspection; unverified | Attempt to read another partner's student/commission with a partner session and confirm 403/empty |
| 11 | Student eligibility / match score | `/api/course-finder/eligible` | Algorithm present; output unverified | Test with a profile per label (Eligible / Likely / Need Review / Not Eligible / Missing Information) |
| 12 | Sorting options (spec §43) | search APIs | Public/student/partner/staff sort sets not all confirmed | Verify each sort key returns stable, sensibly ordered results |
| 13 | N+1 / index verification (spec §37) | MySQL | No DB to `EXPLAIN` | Run `EXPLAIN` on the search query in staging and confirm the recommended indexes are used |

---

## 4. Checklist verdict (spec §55)

* **DATABASE** — all boxes UNVERIFIED (no DB).
* **PUBLIC** — page rendering verified for `/course-finder`; every DB-dependent box UNVERIFIED.
  The "no commission / no private data" boxes are **VERIFIED at the row-shaping layer** (§1.4).
* **STUDENT / PARTNER / STAFF / SUPER ADMIN** — UNVERIFIED (require DB + sessions).
* **AI UPDATE** — UNVERIFIED (cron and tables exist; no run evidence).
* **SECURITY** — partially VERIFIED: no hardcoded credentials in the touched code, public
  field filtering proven, invalid input rejected. RBAC/CSRF/rate-limit enforcement UNVERIFIED.
* **PERFORMANCE** — UNVERIFIED (no DB, no browser).

## 5. To close this out

1. Provision MySQL (or the sqlite verification harness the repo already supports for
   AI-workforce scripts) with a working Prisma engine.
2. Run the intake backfill; then run the §55 checklist as an executable test suite rather
   than a manual list.
3. Work the MISSING/BROKEN table above; items 3, 4, 5, 6, 10, 11 are the highest-risk.
4. Only then change the token to `ALO_UNIFIED_UNIVERSITY_COURSE_SYSTEM_READY`.
