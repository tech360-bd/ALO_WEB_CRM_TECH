# ALO Education — 36-Page Verification Report

**Date:** 2026-10-09
**Branch:** `arena/c2f1b27c-alo-education-z-ai`
**Commit:** `527cf97`
**Runtime:** Next.js 16.4.0 dev server, Node 22.22.3

## Result

**32 of 36 checklist items pass. 4 items have confirmed defects.**

54 individual URL checks were run (several checklist items cover more than one
route). **50 passed, 4 failed.** No server-side exception, unhandled rejection,
React Server Component render error, or 5xx response was produced by any page —
every defect found is an **access-control routing** problem, not a crash.

Server logs across all runs: `191 × 200`, `3 × 404`, `0 × 5xx`, `0 errors logged`.

## How it was tested

No MySQL server is reachable in this environment, so the app was run against its
own documented offline-verification path (`ALO_DB_DRIVER=sqlite`,
`src/lib/db.ts`), using the committed SQLite mirror schema
(`prisma/verification-mirror/schema.sqlite.prisma`).

Setup performed:

1. `npm install` — 1197 packages.
2. Prisma client generation. `prisma generate` normally downloads engine
   binaries from `binaries.prisma.sh`; that host is unreachable here, so the
   download was bypassed by pointing `PRISMA_QUERY_ENGINE_LIBRARY` and
   `PRISMA_SCHEMA_ENGINE_BINARY` at the WASM builds already vendored in
   `node_modules/prisma/build/`. Verified: **531 models** (`npm run db:verify-client`).
3. Schema created from the repo's own DDL emitter (`npm run awf:ddl`):
   **1674 statements, 531 tables, 0 failures.**
4. Data seeded from the repo's canonical CSVs plus its own seed scripts:
   - `prisma/seed.ts` → super admin, base RBAC
   - `prisma/seed-rbac.ts` → **25 roles, 508 permission grants, 22 staff accounts**, demo student + partner
   - `universities.csv` / `courses.csv` / `scholarships.csv` → **19 countries, 560 universities, 800 courses, 250 scholarships**
   - The 10 canonical CRM aliases in the login route's `crmRoleMap` (`bm@`, `app@`, `visa@`, `hr@`, …)

Every page was then requested **as the persona it is built for** — a real login
through `POST /api/portal-auth/login` with a separate cookie jar per persona —
and the server-rendered HTML was scanned for Next.js error markers, 404
markers, and proxy redirects.

## Checklist results

| # | Page | Result | Checks |
|---|------|--------|--------|
| 01 | Homepage | PASS | `/` (anonymous) → 200 |
| 02 | Destinations | PASS | `/destinations` → 200 |
| 03 | Country overview | PASS | `/destinations/uk` → 200 |
| 04 | Country admission requirements | PASS | `/destinations/uk/admission-requirements` → 200 |
| 05 | Country cost calculator | PASS | `/destinations/uk/cost-calculator` → 200 |
| 06 | Country courses | PASS | `/destinations/uk/courses` → 200 |
| 07 | Country scholarships | PASS | `/destinations/uk/scholarships` → 200 |
| 08 | Country universities | PASS | `/destinations/uk/universities` → 200 |
| 09 | Country visa guide | PASS | `/destinations/uk/visa-guide` → 200 |
| 10 | Universities | PASS | `/universities` → 200 |
| 11 | University detail | PASS | `/universities/university-of-oxford` → 200 |
| 12 | Course Finder | PASS | `/course-finder` → 200 |
| **13** | **Course detail** | **FAIL** | `/course/{slug}` (anonymous) → **307 → `/login`** |
| 14 | Course comparison | PASS | `/compare` → 200; `/compare/countries` → 200 |
| 15 | Scholarships | PASS | `/scholarships` → 200 |
| 16 | Eligibility checker | PASS | `/eligibility-check` → 200 |
| 17 | Application guide | PASS | `/application-guide` → 200 |
| 18 | Research opportunities | PASS | `/research-opportunities` → 200 |
| 19 | Student login and portal | PASS | `/student/login`, `/student/dashboard`, `/student/applications` → 200 |
| 20 | Partner login and portal | PASS | `/partner/login`, `/partner/dashboard`, `/partner/students` → 200 |
| 21 | Employee login and portal | PASS | `/employee/login`, `/employee/dashboard`, `/employee/profile` → 200 |
| 22 | Counselor portal | PASS | `/employee/counselor-dashboard`, `/counselor/dashboard` → 200 |
| 23 | Application Team portal | PASS | `/employee/application-manager-dashboard`, `/application-manager/applications` → 200 |
| 24 | Visa portal | PASS | `/employee/visa-dashboard`, `/employee/visa-cases` → 200 |
| 25 | Finance portal | PASS | `/employee/finance-dashboard` → 200 |
| 26 | Marketing portal | PASS | `/employee/marketing-dashboard` → 200; `/crm/marketing` → 200 (via `/marketing/dashboard` rewrite) |
| **27** | **HR portal** | **FAIL** | `/employee/hr-dashboard`, `/crm/hrm` (`hr@`) → **307 → `/`** |
| 28 | Branch Manager portal | PASS | `/employee/branch-manager-dashboard` → 200 |
| 29 | Front Desk portal | PASS | `/employee/front-desk-dashboard` → 200 |
| **30** | **Support portal** | **FAIL** | `/employee/support-dashboard` (`support@`) → **307 → `/`** |
| 31 | CRM dashboard | PASS | `/crm/dashboard` → 200 |
| 32 | Admin dashboard | PASS | `/admin/dashboard`, `/admin/login` → 200 |
| 33 | Super Admin dashboard | PASS | `/super-admin/dashboard`, `/crm/super-admin` → 200 |
| 34 | AI Command Center | PASS | `/admin/ai-command-center` → 200 |
| 35 | Unified Communication Center | PASS | `/crm/ucc`, `/employee/ucc` → 200 |
| 36 | Settings, RBAC and audit | PASS | `/admin/settings`, `/admin/role-permissions`, `/admin/audit-logs`, `/admin/access-control-center` → 200 |

---

# Defects

## Defect 1 — Public course detail pages are locked behind login (item 13)

**Severity: High.** Breaks the public funnel and SEO.

`GET /course/foundation-certificate-in-medicine` as an anonymous visitor returns
`307 → /login?callbackUrl=%2Fcourse%2Ffoundation-certificate-in-medicine`.

**Cause.** `PUBLIC_ROUTES` in `src/proxy.ts` lists `/courses` and
`/course-finder`, but **not `/course`** (singular). Because `matchesPath`
respects path boundaries, `/courses/{slug}` is public while `/course/{slug}` is
not, so the proxy treats it as a portal route and redirects to login.

**Why this is a bug, not intended gating.** `src/app/sitemap.ts` line 110
publishes exactly these URLs to search engines:

```ts
...mapRows(databaseEntries.crmCourses, '/course'),
```

The page itself is a public marketing page — `src/app/course/[slug]/page.tsx`
emits a public canonical URL and OpenGraph tags, and `src/app/course/` contains
**only** `[slug]/page.tsx` (no admin or private sub-routes). Every
sitemap-listed course URL therefore currently sends crawlers and prospective
students to the login screen.

The file's own comments record this exact failure mode being fixed before for
other pages:

> *"Production verification (2026-10-08, commit 61eca94) showed these redirected
> anonymous visitors to /login?callbackUrl=... because they were missing from
> this list — breaking the public funnel."*

**Fix.** Add `"/course"` to `PUBLIC_ROUTES` in `src/proxy.ts`.

---

## Defect 2 — 7 staff roles are issued session roles the proxy does not recognise (items 27, 30)

**Severity: High.** Those staff are locked out of every portal page.

`POST /api/portal-auth/login` derives the session role from `crmRoleMap`
(`src/app/api/portal-auth/login/route.ts`) via `pageSessionRole()`, which
upper-cases the CRM role. The proxy then authorises against
`ROLE_ROUTES[token.role]` and, on a miss, redirects to
`getDashboardRoute(token.role)` — whose `default` branch returns `/`.

**7 of the 15 mapped CRM accounts produce a role string that appears in neither
`ROLE_ROUTES` nor `getDashboardRoute`:**

| Login | `crmRole` | Session role | Recognised? | Result |
|-------|-----------|--------------|-------------|--------|
| `ceo@alo.edu.bd` | `ceo` | `CEO` | ✗ | bounced to `/` |
| `hr@alo.edu.bd` | `hr` | `HR` | ✗ | bounced to `/` |
| `support@alo.edu.bd` | `support_agent` | `SUPPORT_AGENT` | ✗ | bounced to `/` |
| `doc@alo.edu.bd` | `document_officer` | `DOCUMENT_OFFICER` | ✗ | bounced to `/` |
| `data@alo.edu.bd` | `data_manager` | `DATA_MANAGER` | ✗ | bounced to `/` |
| `ai@alo.edu.bd` | `ai_manager` | `AI_MANAGER` | ✗ | bounced to `/` |
| `partner@alo.edu.bd` | `partner_manager` | `PARTNER_MANAGER` | ✗ | unreachable (account is `userType=PARTNER`, so the `employee` portal rejects it first) |

Recognised and working: `SUPER_ADMIN`, `BRANCH_MANAGER`, `COUNSELOR`,
`APPLICATION_TEAM`, `VISA_OFFICER`, `FINANCE`, `MARKETING_MANAGER`, `FRONT_DESK`.

Each of the 7 was confirmed live — e.g. `hr@alo.edu.bd`:

```
[login hr] OK as hr@alo.edu.bd sessionRole=HR
BOUNCED-HOME  /employee/hr-dashboard  status=200 hops=307->/
BOUNCED-HOME  /crm/hrm                status=200 hops=307->/
```

**The portal pages themselves are fine.** Re-requesting the same URLs as a role
the proxy *does* recognise renders them correctly, which isolates the fault to
the role mapping rather than the pages:

```
OK  /employee/hr-dashboard       (hr_manager@ → EMPLOYEE)  200  51685B
OK  /employee/support-dashboard  (support_staff@ → EMPLOYEE) 200 51715B
OK  /crm/hrm                     (superAdmin)              200  54021B
```

**Note the near-miss naming.** `ROLE_ROUTES` defines `HR_MANAGER` and
`SUPPORT_STAFF`, while `crmRoleMap` emits `hr` and `support_agent`. `seed-rbac.ts`
creates **both** spellings as real roles (`hr`/`hr_manager`,
`support_staff`/`support_agent`), so the two vocabularies coexist and only one
is wired into the proxy.

**Fix — either**
- (a) align `crmRoleMap` to the vocabulary the proxy knows
  (`hr → hr_manager`, `support_agent → support_staff`), **or**
- (b) add the 7 missing roles to `ROLE_ROUTES` and `getDashboardRoute`.

Option (a) is the smaller change; option (b) is needed if those roles are meant
to stay distinct. Either way this needs a product decision on what each role
should reach, so it is **not** patched here.

---

## Defect 3 — Role fallback dashboards point at routes that do not exist

**Severity: Medium.** A 404 dead-end for three role families.

`getDashboardRoute()` is where the proxy sends a user who hits a route their
role is not allowed on (and where `/login` sends an already-authenticated user).
Three of its targets have **no page and no rewrite**:

| Role | Fallback target | Exists? | Observed |
|------|-----------------|---------|----------|
| `FINANCE` | `/finance/dashboard` | ✗ no `src/app/finance/` | **404** |
| `VISA_OFFICER`, `VISA_INTERVIEW_OFFICER` | `/visa/dashboard` | ✗ `src/app/visa/` has only `page.tsx` + `readiness/` | **404** |
| `HR_MANAGER` | `/hrm/dashboard` | ✗ no `src/app/hrm/` | would 404 |
| `MARKETING_MANAGER`, `MARKETING` | `/marketing/dashboard` | ✓ via `next.config.ts` rewrite → `/crm/marketing` | 200 |

Confirmed in server logs: `GET /finance/dashboard 404`, `GET /visa/dashboard 404` (×2).

So a Visa Officer or Finance Officer who navigates to any route outside their
allow-list lands on a 404 instead of their dashboard. `ROLE_ROUTES` grants these
roles `/finance` and `/visa` prefixes that contain no pages at all, while their
real dashboards live under `/employee/visa-dashboard` and
`/employee/finance-dashboard` (both verified working).

**Fix.** Point the fallbacks at the pages that exist —
`FINANCE → /employee/finance-dashboard`,
`VISA_OFFICER`/`VISA_INTERVIEW_OFFICER → /employee/visa-dashboard`,
`HR_MANAGER` → `/employee/hr-dashboard` — or add the missing
`/finance`, `/visa/dashboard`, `/hrm` routes/rewrites.

---

## Observation (not a defect) — `/crm/marketing` reaches its page via a double hop

`/crm/marketing` as `marketing@alo.edu.bd` returns
`307 → /marketing/dashboard`, which `next.config.ts` rewrites back to
`/crm/marketing`. It renders correctly (200, 59660B), but only because
`ROLE_ROUTES['MARKETING_MANAGER'] = ["/marketing", "/employee"]` does not
include `/crm`. Worth tidying so the canonical URL is served directly.

## Observation — dev-server stability under load

The dev server was killed twice by sandbox memory pressure while compiling the
heaviest pages (`/crm/marketing` alone took 8.4s of application code). No
application error was logged on either occasion — every request that completed
returned 200. Verification was completed by re-running in smaller batches. This
is an environment constraint, not an app defect, but `/crm/marketing` is a
genuinely slow page.

---

## Reproducing

Scripts written for this run live in `.awf-tmp/` (gitignored):

| File | Purpose |
|------|---------|
| `apply-ddl.mjs` | Creates the 531 SQLite tables from `npm run awf:ddl` output |
| `seed-pagecheck.ts` | Loads `universities.csv` / `courses.csv` / `scholarships.csv` + countries |
| `seed-crm-accounts.ts` | Provisions the 10 `crmRoleMap` alias accounts |
| `page-check.mjs` | The 36-item / 54-check sweep (`ONLY_ITEMS=` to subset) |
| `focused-check.mjs` | Defect isolation: fallback targets + page-vs-role checks |
| `role-analysis.mjs` | Static `crmRoleMap` ⇄ `ROLE_ROUTES` cross-check |

```bash
set -a; . ./.env; set +a
node .awf-tmp/page-check.mjs          # full sweep
node .awf-tmp/role-analysis.mjs       # role mapping cross-check
```

`.env` is gitignored and holds only locally generated secrets.
