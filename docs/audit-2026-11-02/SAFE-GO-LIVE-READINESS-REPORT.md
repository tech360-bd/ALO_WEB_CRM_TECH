# 9 · SAFE GO-LIVE READINESS REPORT

> **SUPERSEDED (2026-11-02, Phase 0C):** §2 "three blockers" is revised in
> [`phase0c/08-GO-LIVE-BLOCKER-REPORT-REVISED.md`](phase0c/08-GO-LIVE-BLOCKER-REPORT-REVISED.md).
> B1 ("7 endpoints with no auth at all") is **withdrawn** — a fail-closed Next 16 proxy gate protects all
> seven. B2 ("31 failing tests") is **unmeasured** — the Prisma client cannot be generated offline.
> B3 is confirmed and sharpened: **0 of 8 courses** meet the field-level `VERIFIED` rule.


**Verdict: NOT READY.** Three independent blockers — one security, one test-gate, one data — each sufficient on its own. This is a factual gate assessment, not a judgement of effort: the platform is large and mostly coherent, but it cannot be called go-live safe today.

---

## 1. Gate assessment

| # | Gate | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Repository identified and inspectable | **PASS** | `tech360-bd/ALO_WEB_CRM_TECH`, branch `arena/ececf40c…`, clean tree |
| 2 | No lost work on branches | **PASS** | 47/48 non-PR branches are 0 commits ahead of `main` (report 7) |
| 3 | Application code quality (static) | **PASS** | ESLint 2,699 files → 0 errors, 1 warning |
| 4 | TypeScript typecheck | **BLOCKED** | `tsc` needs the generated Prisma client; `prisma generate` fails here (engine download blocked). CI runs it on a runner |
| 5 | Unit test gate | **FAIL** | 22 files / 31 tests fail, **pre-existing** on base commit (report 8 A2). `npm test` is a **blocking** CI step → pipeline red |
| 6 | Integration tests (real MySQL) | **NOT RUN / BLOCKED** | requires `TEST_DATABASE_URL`; 14 suites self-skip |
| 7 | End-to-end browser tests | **NOT RUN** | requires server + Playwright browsers; none installed here |
| 8 | Database schema validity | **BLOCKED** | `npx prisma validate` cannot run (no engine); not validated in this audit |
| 9 | Migration drift | **UNKNOWN** | CI has a fresh-MySQL migrate+drift job; it was not observable from this environment |
| 10 | Secrets in tracked files | **NOT VERIFIED** | CI has `scripts/ci/npm-security-audit.mjs` + a secret scan; not executed here. Repo contains `.env.*.example` with placeholders only (no live secrets found in `.env` because no `.env` exists) |
| 11 | API authentication coverage | **FAIL** | 7 endpoints with **no auth at all**; 102 mutating routes need triage (report 5 §6) |
| 12 | Catalogue data verified | **FAIL** | 8 verified courses; 0 of 6 destinations with course coverage; generated URLs 404; 153 status conflicts |
| 13 | Public visibility rule correct | **FAIL (fix pending)** | approved records could not become public until unmerged commit `7e4c3922` |
| 14 | Backup + restore | **PARTIAL** | 3 backup mechanisms exist; **no restore test evidence** |
| 15 | Deployment authority | **AMBIGUOUS BY DESIGN** | `deploy-production.yml` **refuses** to deploy from GitHub Actions ("Hostinger owned"); `docker-compose.yml` and `server.js` exist. Which pipeline actually ships is unconfirmed |
| 16 | Production/staging identity | **BLOCKED** | not determinable from the repository; owner confirmation required |
| 17 | Live health check | **NOT RUN** | no network path to the deployed site from this sandbox |

**Score: 3 PASS · 4 FAIL · 1 PARTIAL · 3 BLOCKED · 3 NOT RUN/UNVERIFIED.** No gate that requires a running system passed, because none could be run — that is stated rather than assumed.

---

## 2. The three go-live blockers

### B1 — Unauthenticated endpoints (security, P0)

Seven route handlers contain **zero** auth/session/role/token checks: `hr/leave`, `hr/devices`, `official-emails`, `university-agreements`, `b2b-contacts`, `communications/templates`, `interview-questions`.
Guarded equivalents exist under `/api/employee-access/*`, so the likely fix is retirement rather than new work — but it must be verified and deployed before public exposure.

### B2 — Red test gate (process, P0)

`npm test` is blocking in CI and currently fails 31 tests. Two failing suites are security-related (`phd/storage-security`, `phd/auth-access`). A pipeline that is red cannot certify a release, and a release that bypasses CI cannot claim safety.

### B3 — Catalogue data is not publishable (product, P0)

- 8 verified courses out of ~11,000 generated rows;
- generated course URLs return 404 (`ox.ac.uk/courses/…`);
- 153 universities have contradictory verification labels;
- the public gate is correct but nothing in the data satisfies it at scale — which is exactly why the live Course Finder looks empty.

---

## 3. What is genuinely good (protect it)

1. **One public visibility rule**, used consistently by every public surface, with 57 passing tests around it.
2. **Import safety**: dry-run, quarantine, synthetic-host rejection, batch/error tables, approval queue, Super-Admin re-resolution server-side.
3. **Source evidence model** (`CrmOfficialEvidence`: SHA-256, excerpt, field scope, retrieval date) is better than most commercial catalogues.
4. **CI is comprehensive** (2 jobs: lint/typecheck/test/prisma/build, plus MySQL-8 migrate + drift + integration + boot smoke).
5. **Deployment ownership is explicit** — GitHub Actions refuses to deploy production, removing a whole class of accidents.
6. **Zero lint errors** in 2,699 files; no removed API routes across the last audit cycle.

---

## 4. Minimum path to a defensible go-live

| Step | Action | Gate cleared |
| --- | --- | --- |
| 1 | Retire or guard the 7 unauthenticated routes; triage the remaining 102 | Security |
| 2 | Fix or formally quarantine the 22 failing suites; get `npm test` green | Process |
| 3 | Obtain `DATABASE_URL` for a **non-production** database; run `prisma validate`, `migrate deploy` on fresh MySQL, integration suite | Schema/runtime |
| 4 | Decide the verification vocabulary and the fate of synthetic data | Data |
| 5 | Merge/approve `7e4c3922` (or fix the publish status another way) | Publication |
| 6 | Complete one destination end-to-end (New Zealand, 8 universities — universe already verified) | Data credibility |
| 7 | Run one restore test and record it | Recovery |
| 8 | Confirm production/staging ownership and which pipeline deploys | Deployment |

Steps 1, 2, 5 and 7 are **days**, not months, and do not depend on new data collection. Steps 3, 4, 6 and 8 need owner decisions or access.

---

## 5. Explicit non-claims

- No claim that production is broken — production was never contacted.
- No claim that the 7 unguarded routes are exploitable in production (there may be a proxy-level gate; `src/proxy.ts` exists but the routes carry no in-handler check, and defence-in-depth says they must).
- No claim that any test "passed" that was not executed here; integration, e2e, typecheck and prisma validation are marked NOT RUN/BLOCKED.
- No claim of complete data coverage: 70 identity-verified institutions, 8 verified courses.
