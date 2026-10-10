# ALO Education — Course Finder Platform: Verification & Remediation Report

**Date:** 2026-10-09
**Branch:** `arena/c2f1b27c-alo-education-z-ai`
**Base commit:** `527cf97` (main)
**Runtime:** Next.js 16.4.0, Node 22.22.3, Prisma 6.19.3

---

## Headline result

| | Before | After |
|---|---|---|
| Checklist items passing | 32 / 36 | **36 / 36** |
| URL checks passing | 50 / 54 | **54 / 54** |
| Server-side 404s during the sweep | 3 | **0** |
| Server-side exceptions / 5xx | 0 | **0** |
| Unit + integration tests passing | 1284 / 1285 | **1286 / 1287** |

Three confirmed defects were fixed at root cause with regression tests. The one
remaining test failure (`whatsapp-media-ingestion`) and one failing test file
(`tests/integration/consultation-workflow`) are **pre-existing** — proven by
re-running them with my changes stashed, where they fail identically.

---

## Phase A — what actually exists (verified, not assumed)

### Access limitations, stated plainly

- **External reference sites are unreachable.** `tclglobal.co.uk`, `gostudyin.com`,
  `aloeducation.com`, `alocrm.base44.app`, `studies-overseas.com`, the `space-z.ai`
  hosts and the Cloud Run host all fail to resolve from this environment. Egress is
  limited to `github.com`, `registry.npmjs.org` and `pypi.org`. **No feature was
  copied from any of them**, and nothing in this report claims otherwise.
- **Two of the listed repos are not accessible** to this GitHub integration:
  `engralaminn-collab/alo-education-uk-final` and `engralaminn-collab/alo-education-last`
  (`Resource not accessible by integration`). `alo-ukvi-ai-markting-platform-copy` and
  `ALO-Education_LAST-TRY` do not resolve at all. `msitarzewski/agency-agents` is
  public but unrelated to this codebase.
- **No university or course data was "collected" from the web.** All data used here
  was already committed in this repository (see *Data assets* below). I seeded it
  into a local database; I did not scrape or invent any of it.

### Architecture as found

| Concern | Finding |
|---|---|
| Framework | Next.js 16.4.0 App Router, React 19, TypeScript strict |
| Package manager | npm 10.9.2, Node 22 pinned (`.nvmrc`, `scripts/assert-node22.cjs`) |
| Database / ORM | MySQL via Prisma 6.19.3 — **531 models** |
| Auth | NextAuth JWT + a custom `alo_portal_session` cookie, `POST /api/portal-auth/login` |
| Route guard | `src/proxy.ts` (498 lines): `PUBLIC_ROUTES`, `SENSITIVE_API_ROUTES`, `ROLE_ROUTES`, `getDashboardRoute` |
| Scale | **399 pages**, **895 API route handlers** |
| Tests | Vitest — 118 files; Playwright config present for e2e |

### The five Course Finder experiences already exist

This is **not** five disconnected applications. All five surfaces read the same
authoritative table, which is the central architectural requirement:

| # | Experience | Route | Backing query |
|---|---|---|---|
| 1 | Public | `/course-finder` → `EnhancedCourseFinder` | `db.crmCourse` via `/api/course-finder` |
| 2 | Student | `/student/course-finder`, `/student/saved`, `/student/compare` | `db.crmCourse` via `/api/courses/search` |
| 3 | Partner | `/partner-admin/course-finder`, `/partner/search-programs` | `db.crmCourse` via `/api/courses/search` |
| 4 | Staff CRM | `/crm/course-finder` | `db.crmCourse` via `/api/courses/search` |
| 5 | Super Admin | `/admin/courses` (+ create/edit), `/admin/import-center/courses` | `db.crmCourse` via `/api/course-finder/admin` |

14 `/api/course-finder/*` endpoints exist (search, detail, compare, shortlist,
saved, eligible, eligibility-engine, pro, guide, journey, universities, admin) and
20 components under `src/components/course-finder/`.

**Verified:** `db.university` is referenced by **0** files while `db.crmUniversity`
is referenced by **50** — there is no competing legacy university catalogue.

### Data assets already in the repo

Committed CSVs (not collected by me, and not synthetic):

| File | Rows |
|---|---|
| `ALO_MASTER_COURSE_DATABASE.csv` | 4.3 MB |
| `02_ALO_COURSE_MASTER.csv` | 21.6 MB |
| `course_intakes.csv` | 36.1 MB |
| `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` | 51.5 MB |
| `universities.csv` | 560 universities |
| `courses.csv` | 11,200 courses |
| `scholarships.csv` | 3,411 scholarships |
| `tuition_fees.csv`, `application_deadlines.csv`, `english_requirements.csv`, `course_requirements.csv` | 8.7–11.6 MB each |

Plus 560 universities compiled into `src/lib/university-data-*.ts` and 19 countries
in `src/lib/country-destinations-data.ts` with per-fact `sourceUrl` and
`lastVerifiedAt`.

---

## Defects found and fixed

All three were **silent**: every affected request returned HTTP 200 and nothing was
logged. They were found by following redirects and diffing the rendered payload, not
by status code.

### Defect 1 — public course detail pages were locked behind login *(fixed)*

`GET /course/{slug}` as an anonymous visitor returned `307 → /login?callbackUrl=…`.

`PUBLIC_ROUTES` listed `/courses` and `/course-finder` but not `/course`. Because
`matchesPath` is boundary-aware, `/courses/{slug}` was public while `/course/{slug}`
was treated as a portal route.

This mattered beyond UX: `src/app/sitemap.ts:110` publishes exactly these URLs —
`mapRows(databaseEntries.crmCourses, '/course')` — so every course URL in the
sitemap was sending crawlers to a login screen. The page emits a public canonical
URL and OpenGraph tags, and `src/app/course/` contains only `[slug]/page.tsx`, which
reads `CrmCourse` through its `published` + `VERIFIED` + source-linked filter.

`src/proxy.ts`'s own comments record this exact failure class being fixed before for
other pages (commit `61eca94`), which is what made it recognisable as a regression
rather than intended gating.

**Fix:** added `"/course"` to `PUBLIC_ROUTES`; added a `308` redirect for bare
`/course` → `/course-finder` in `next.config.ts`, mirroring the existing `/courses`
alias, since `src/app/course/` has no index page.

**Verified:** `/course/{slug}` → `200`, 52,204 B of real course content (was
34,796 B of login page). Bare `/course` → `308` → `/course-finder` → `200`.

**Not widened:** the sibling authenticated endpoints stay protected —
`/api/course-finder/{saved,shortlist,compare,eligible,admin}` all still reject
anonymous access, asserted in the new test suite.

### Defect 2 — 7 staff roles were issued session roles the proxy could not resolve *(fixed)*

`POST /api/portal-auth/login` minted the session claim by upper-casing its own
`crmRoleMap` value, while the proxy authorised against its own `ROLE_ROUTES` keys.
Nothing tied the two vocabularies together. `hr` and `support_agent` became `HR` and
`SUPPORT_AGENT`; for an unrecognised role `ROLE_ROUTES[token.role]` is `undefined`,
so every portal page failed the allow-list check and `getDashboardRoute()`'s
`default` branch returned `"/"` — dumping HR and Support staff on the public
homepage from their own dashboards.

Statically cross-checking the two files, **7 of 15** mapped accounts were affected:
`CEO`, `HR`, `SUPPORT_AGENT`, `DOCUMENT_OFFICER`, `DATA_MANAGER`, `AI_MANAGER`,
`PARTNER_MANAGER`.

**Semantic equivalence was proven before changing anything**, as required, by
resolving each role's actual permission grants through `prisma/seed-rbac.ts`'s own
`resolveGrants` logic:

```
hr              vs hr_manager        14/14 grants identical
support_agent   vs support_staff      9/9  grants identical
finance         vs finance_officer   12/12 grants identical
marketing       vs marketing_manager 14/14 grants identical
```

Because both spellings resolve through the same `DEFAULT_ROLE_PERMISSIONS` entry,
normalising them is **permission-neutral** — it grants nothing new.

**Fix:** new shared module `src/lib/session-roles.ts` holding the canonical
vocabulary, the proven-equivalent alias map, and `pageSessionRole()`. Both the proxy
and the login handler now resolve roles through it, so the two vocabularies cannot
drift apart again. `crmRoleMap` itself was deliberately left untouched — it still
carries the business role used for `department`, the login response and `Employee`
records.

Roles with **no** proven equivalent (`CEO`, `DOCUMENT_OFFICER`, `DATA_MANAGER`,
`AI_MANAGER`, `PARTNER_MANAGER`) are **not** mapped to anything. Inventing an
allow-list for them would be a permission grant disguised as a bug fix. They now fall
back to the baseline `EMPLOYEE` role — access their `Employee` record already implies
— instead of emitting an unresolvable string.

Legacy sessions are handled: page-session JWTs live 7 days, so `resolveSessionRole()`
also normalises at request time in the proxy, and existing `HR` / `SUPPORT_AGENT`
tokens keep working without a forced re-login. This is applied to the API
`SENSITIVE_API_ROUTES` check too, not just page routing.

**Verified:** `/employee/hr-dashboard` (`hr@`) → 200, 51,685 B;
`/employee/support-dashboard` (`support@`) → 200, 51,715 B; `ceo@` → 200 on
`/employee/dashboard`. No homepage bounces remain.

### A privilege-escalation bug caught in my own fix

The first draft of the alias map included `marketing → MARKETING_MANAGER` (their
grants are indeed identical, 14/14). But `MARKETING` is *itself* a canonical session
role, so `resolveSessionRole('MARKETING')` returned `MARKETING_MANAGER` — silently
promoting marketing staff to the manager role.

The idempotency test caught it. Fixed structurally rather than by deleting one entry:
`normalizeCrmRole()` now resolves a canonical role **before** consulting the alias
map, and a dedicated test asserts no alias key shadows a `SESSION_ROLES` member.

### Defect 3 — role fallback dashboards pointed at pages that do not exist *(fixed)*

`getDashboardRoute()` is where the proxy sends a role that hit a route outside its
allow-list. Three targets had no page and no rewrite:

| Role | Old target | Reality |
|---|---|---|
| `FINANCE` | `/finance/dashboard` | no `src/app/finance/` at all → **404** |
| `VISA_OFFICER`, `VISA_INTERVIEW_OFFICER` | `/visa/dashboard` | `src/app/visa/` has only `page.tsx` + `readiness/` → **404** |
| `HR_MANAGER` | `/hrm/dashboard` | no `src/app/hrm/` at all → **404** |

Confirmed in server logs: `GET /finance/dashboard 404`, `GET /visa/dashboard 404` (×2).
`ROLE_ROUTES` grants these roles `/finance`, `/visa` and `/hrm` prefixes that contain
**no pages whatsoever**, while their real dashboards live under `/employee/*`.

**Fix:** repointed to `/employee/finance-dashboard`, `/employee/visa-dashboard` and
`/employee/hr-dashboard`. Each target was checked to sit **inside that role's own
allow-list** — a fallback outside it would fail the same check that produced it and
redirect to itself forever.

`MARKETING_MANAGER` / `MARKETING` intentionally keep `/marketing/dashboard`: that is
a `next.config.ts` rewrite to `/crm/marketing`, and `/crm` is *not* in their
allow-list, so pointing the fallback directly at `/crm/marketing` would loop.

The `default: return "/"` branch is kept. An unrecognised role has an empty
allow-list, so any authenticated fallback would loop; a public route terminates
instead. Roles should no longer reach it, because `pageSessionRole()` now fails back
to `EMPLOYEE`.

**Verified:** finance and visa fallbacks render 200; a finance user hitting a
disallowed route now lands on `/employee/finance-dashboard` (200) instead of a 404.
Zero 404s across the final 72-request sweep.

---

## Regression tests added

`tests/unit/session-role-vocabulary.test.ts` — **15 tests**, all passing. The
assertions are derived from the real source files rather than a hand-maintained list,
so a future role or alias that breaks either contract fails the build:

- Every role the login handler can mint resolves to a role with a `ROLE_ROUTES`
  allow-list (parsed out of `crmRoleMap` in the route source).
- Every declared `SESSION_ROLES` member has a proxy allow-list — no orphan vocabulary.
- The proven-equivalent aliases map correctly; canonical roles are idempotent; legacy
  `HR` / `SUPPORT_AGENT` claims resolve without re-login.
- No alias key shadows a canonical role (the privilege-escalation guard).
- Non-staff user types pass through verbatim; unknown roles fail back to `EMPLOYEE`.
- **Every** role's fallback dashboard resolves to a real page file, following
  `next.config.ts` alias chains — and every alias target in the config resolves, so
  no alias dead-ends. This is the test that would have caught Defect 3.
- Every fallback target sits inside its own role's allow-list, so none can loop.
- `/course` and `/course/{slug}` are public; private course APIs are not; portal,
  admin, CRM and student pages remain behind authentication.

Existing suites re-run: `proxy-security`, `public-route-matrix`,
`public-routes-english-funnel`, `permissions`, `api-authz-regression`,
`erp-routes-authz-regression`, `finance-authz-regression`,
`auth-session-hardening` — **72 tests, all passing**, unchanged from baseline.

---

## Checklist results after the fix — 36 / 36

| # | Page | Result |
|---|---|---|
| 01 | Homepage | PASS |
| 02 | Destinations | PASS |
| 03 | Country overview | PASS |
| 04 | Country admission requirements | PASS |
| 05 | Country cost calculator | PASS |
| 06 | Country courses | PASS |
| 07 | Country scholarships | PASS |
| 08 | Country universities | PASS |
| 09 | Country visa guide | PASS |
| 10 | Universities | PASS |
| 11 | University detail | PASS |
| 12 | Course Finder | PASS |
| 13 | Course detail | **PASS** *(was FAIL — login redirect)* |
| 14 | Course comparison | PASS |
| 15 | Scholarships | PASS |
| 16 | Eligibility checker | PASS |
| 17 | Application guide | PASS |
| 18 | Research opportunities | PASS |
| 19 | Student login and portal | PASS |
| 20 | Partner login and portal | PASS |
| 21 | Employee login and portal | PASS |
| 22 | Counselor portal | PASS |
| 23 | Application Team portal | PASS |
| 24 | Visa portal | PASS |
| 25 | Finance portal | PASS |
| 26 | Marketing portal | PASS |
| 27 | HR portal | **PASS** *(was FAIL — homepage bounce)* |
| 28 | Branch Manager portal | PASS |
| 29 | Front Desk portal | PASS |
| 30 | Support portal | **PASS** *(was FAIL — homepage bounce)* |
| 31 | CRM dashboard | PASS |
| 32 | Admin dashboard | PASS |
| 33 | Super Admin dashboard | PASS |
| 34 | AI Command Center | PASS |
| 35 | Unified Communication Center | PASS |
| 36 | Settings, RBAC and audit | PASS |

---

## Actual commands run, and their real results

| Command | Result |
|---|---|
| `npm install` | 1197 packages, exit 0 |
| `npm run db:verify-client` | **Verified generated Prisma client: 531 models** |
| `npm run awf:ddl` + apply | 1674 statements → **531 tables, 0 failures** |
| `npx vitest run` (full) | **1286 passed, 1 failed** (118 files: 116 passed, 2 failed) |
| `npx vitest run` (8 authz/proxy files) | **72 passed** |
| `npx vitest run tests/unit/session-role-vocabulary.test.ts` | **15 passed** |
| `npx eslint` on the 4 changed files | **exit 0, no findings** |
| `npx tsc -p` (scoped to `session-roles.ts`) | **exit 0, no type errors** |
| `npx tsc --noEmit` (whole project) | **could not complete — OOM at 3 GB heap** |
| 36-item live sweep | **54 / 54 checks pass**, 72 requests all 200, 0 errors |

### Honest caveats on the checks above

- **Whole-project `tsc --noEmit` does not fit in this sandbox** (3.9 GB RAM). It
  aborts with `JavaScript heap out of memory` at both the default and a 3 GB heap,
  and also when scoped to just `proxy.ts` + the test, because `next/server` and the
  531-model Prisma client type surface are too large. This is why the repo ships
  `tsconfig.chunk.json`. **I could not obtain a whole-project type-check result and
  am not claiming one.** The new logic module type-checks clean in isolation, all
  four changed files lint clean, and every changed code path is exercised at runtime
  by the live sweep.
- **The 1 failing test and 2 failing test files are pre-existing**, not regressions.
  Proven by `git stash`-ing my changes and re-running those two files: they fail
  identically (`whatsapp-media-ingestion` expects a `'MIME type'` error but gets
  `'file size does not match downloaded bytes'`; `consultation-workflow` fails to
  load). Both are unrelated to Course Finder, routing or RBAC.
- **No production build was run.** `npm run build` requires the same Prisma engine
  download that is blocked here, plus far more RAM than this sandbox has. Nothing in
  this report should be read as build or deploy verification.
- **The dev server was killed twice by sandbox memory pressure** while compiling the
  heaviest pages. No application error was logged on either occasion. `/crm/marketing`
  alone took 8.4 s of application code and is genuinely slow.

---

## Environment notes (why the setup was non-trivial)

No MySQL server is reachable and `binaries.prisma.sh` is blocked, so `prisma generate`
fails out of the box. Both were solved using mechanisms already in the repo:

- Ran on the documented offline path `ALO_DB_DRIVER=sqlite` (`src/lib/db.ts`) with the
  committed mirror schema `prisma/verification-mirror/schema.sqlite.prisma`.
- Bypassed the engine download by pointing `PRISMA_QUERY_ENGINE_LIBRARY` and
  `PRISMA_SCHEMA_ENGINE_BINARY` at the WASM builds already vendored in
  `node_modules/prisma/build/`. The mirror client then generates with `engine=none`
  and runs through `@prisma/adapter-libsql`.
- **Production remains MySQL.** `prisma/schema.prisma` was not modified and no
  database engine was changed.

Seeded via the repo's own scripts — `prisma/seed.ts`, `prisma/seed-rbac.ts`
(25 roles, 508 grants, 22 staff accounts) — plus the canonical CSVs
(19 countries, 560 universities, 800 courses, 250 scholarships) and the 10 canonical
`crmRoleMap` alias accounts.

---

## Remaining open items (need decisions, not guesses)

1. **`HR_MANAGER` is granted `/hrm`, which contains no pages.** So an HR Manager
   reaching `/crm/hrm` is redirected to `/employee/hr-dashboard` — correct and no
   longer a dead-end, but they still cannot open the CRM HR module. Granting `/crm`
   would widen access considerably (CRM holds far more than HRM). **Business decision.**
2. **`CEO`, `DOCUMENT_OFFICER`, `DATA_MANAGER`, `AI_MANAGER`, `PARTNER_MANAGER`** now
   fail back to the `EMPLOYEE` baseline (`/employee` only). A CEO with "full
   visibility" almost certainly should reach more. Deliberately **not** invented —
   each needs an explicit route allow-list. **Business decision.**
3. **Two scholarship models are both live:** `Scholarship` (18 files) and
   `CrmScholarship` (17 files). Universities and courses have a single source
   (`CrmUniversity`, `CrmCourse`), but scholarships do not, which conflicts with the
   "one authoritative catalogue" principle. Needs a consolidation decision —
   non-trivial, as both have live readers.
4. **Two parallel search APIs** (`/api/course-finder` and `/api/courses/search`) query
   the same `CrmCourse` table with independently written filter logic. Not a data
   duplication problem, but the query logic can drift. Worth converging on one
   service.
5. **Surfaces 2–4 do not share the public component.** Only `/course-finder` uses
   `EnhancedCourseFinder`; the student, CRM and partner pages are bespoke inline
   implementations (102, 49 and 96 lines). They share data but not UI, so filter
   behaviour can diverge between roles.

---

## Scope statement

This turn delivered **Phase A** (inspection and architecture mapping) and the
**remediation of every defect Phase A confirmed**, with regression tests.

Phases B–H of the master prompt — the full student eligibility engine, application
state machine and document lifecycle; partner referral attribution; staff SLA
integration; super-admin publication governance and import pipeline; i18n; and
production deployment verification — are **not** implemented and are not claimed
here. They are substantial features requiring schema decisions, and several depend on
the open business decisions listed above. They should be scheduled as separate,
reviewable increments rather than asserted as done.

## Files changed

| File | Change |
|---|---|
| `src/lib/session-roles.ts` | **new** — shared session-role vocabulary, alias map, `pageSessionRole`, `resolveSessionRole` |
| `src/proxy.ts` | `/course` added to `PUBLIC_ROUTES`; role claims resolved via the shared module; 3 dead-end fallback dashboards repointed; `ROLE_ROUTES` + `getDashboardRoute` exported for test |
| `src/app/api/portal-auth/login/route.ts` | local `pageSessionRole` replaced by the shared implementation |
| `next.config.ts` | bare `/course` → `/course-finder` redirect |
| `tests/unit/session-role-vocabulary.test.ts` | **new** — 15 regression tests |
| `PAGE_VERIFICATION_REPORT.md` | this report |

No secrets, no dependency-lock churn (`package-lock.json` was touched incidentally by
`npm install` and reverted), and no scratch files: the harness lives in gitignored
`.awf-tmp/`.
