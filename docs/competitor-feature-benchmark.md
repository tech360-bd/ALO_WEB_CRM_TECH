# Competitor feature benchmark

**Purpose:** record which public product capabilities were studied, and which
equivalent ALO Education capability exists in this repository — verified by file,
not by intention.
**Date of review:** 2026-10-25 (public marketing pages and store listings only).
**What was *not* done:** no competitor site was scraped, no source code copied, no
description, image, ranking or eligibility algorithm reused, and no competitor data
imported. No ALO claim below is based on a competitor's numbers.

## 1. Capabilities studied (public product descriptions)

| Capability | ApplyBoard | Edvoy | ALO equivalent |
|---|---|---|---|
| Large institution/course search | Yes (recruitment-partner platform) | Yes — "750+ institutions", "75,000+ courses" | Implemented: `/universities`, `/courses`, `/course-finder` over `CrmUniversity`/`CrmCourse` |
| Filters (country, level, subject, intake, fees) | Yes | Yes | Implemented: `/api/courses` + `src/lib/course-finder/*` |
| Course comparison side-by-side | "Search Compare", up to 24 programmes (Apr 2025) | Yes ("compare courses") | Implemented: `/compare`, `CourseComparisonList`, `CourseComparison` |
| Shortlist / favourites | Yes | Yes ("save your favourite programmes") | Implemented: `CourseShortlist`, `/student/saved` |
| Application tracking | Application Journey Tracker / ATS with estimated processing times | Real-time offer and document tracking | Implemented: `/application-manager`, `/api/applications/*`, `ApplicationTask`, Kanban/calendar views |
| Counsellor hand-off | Recruitment-partner counselling workflow | 1:1 counsellor chat | Implemented: `/counselor`, `/book-consultation`, `ConsultationRequest` |
| Document upload and checklists | Yes | Yes (paperless upload) | Implemented: `src/lib/application-manager/document-readiness.ts`, `/api/student/documents`, private storage |
| AI course matching | Yes (partner tools) | "Genie" matcher with tiers + predictive admission score | **Partly**: `/ai/course-match`, `src/lib/ai/*`. ALO does **not** publish an admission-probability score (see §3) |
| Scholarships/funding discovery | Yes | Yes | Implemented: `/scholarships`, `/api/scholarships`, `Scholarship` models |
| Research-degree discovery (MRes/PhD/studentships) | Limited | Limited | Implemented in the PhD module (`src/lib/phd/*`, 47 `Phd*` models) — **no public UI yet** (gap) |
| Eligibility check | Yes | Yes (instant eligibility) | Implemented: `/eligibility-check`, `src/lib/course-finder/eligibility-rules.ts` |
| Agent/partner portal | Core business | Partner programme | Implemented: `/partner`, `/partner-admin`, B2B tenant security tests |

## 2. ALO features that are deliberately *different* from the benchmarks

| ALO feature | Why it differs |
|---|---|
| Verification badge + source link on every published record | Neither benchmark promises per-record sourcing; ALO gates publication on it (`publicCourseWhere()`) |
| Visible "unknown" states for fees/deadlines | Benchmarks tend to fill the card; ALO shows "not published" rather than a guess |
| Research-workflow depth (proposal, supervisor outreach, funding deadlines, commission isolation) | ALO serves a doctoral workflow, not only undergraduate conversion |
| No admission-probability score | An unvalidated probability is a promise ALO cannot keep |
| No "95 % acceptance" style claims | Not evidence-backed; would be a misleading commercial claim |

## 3. Explicit non-goals (refusals)

1. **No admission-likelihood score.** A recommendation may say "your profile matches
   these published requirements"; it may not output "82 % chance".
2. **No scraped competitor catalogue.** Benchmarks were read, not harvested.
3. **No visual or copy cloning.** Layouts, wording and imagery are ALO's own.
4. **No ranking of supervisors** by title, institution or publication count.
5. **No "fully funded" label** without official funding terms.

## 4. Acceptance checklist for the discovery platform

| # | Check | Status |
|---|---|---|
| 1 | University directory search + filters | Implemented (`/universities`, `/api/universities`); not re-tested end-to-end in this pass (no DB) |
| 2 | Course detail page across every qualification level | Implemented at `/course/[slug]`, `/courses/[slug]`; only VERIFIED + source-linked rows render — so coverage today is thin by design |
| 3 | Comparison of ≥3 courses | Implemented; comparison limits defined in `CourseComparisonList` |
| 4 | Shortlist persistence per student | Implemented (`CourseShortlist`, `/student/saved`) |
| 5 | Eligibility check uses the student's own profile | Implemented (`/eligibility-check`, eligibility rules); requires a logged-in student |
| 6 | Counsellor request from a course page | Implemented (`/book-consultation`) |
| 7 | Source link + last-checked date visible | Implemented on public course pages |
| 8 | Research-degree catalogue publicly browsable | **Not implemented** (services exist, no public route) |
| 9 | Import preview → approve → execute | Implemented; DB verification BLOCKED here |
| 10 | Accessible/responsive listing states | Implemented (existing design system); not audited with an accessibility tool in this pass |
