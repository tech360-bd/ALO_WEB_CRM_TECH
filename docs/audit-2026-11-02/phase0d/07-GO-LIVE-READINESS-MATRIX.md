# Phase 0D · 07 — Updated Go-Live Readiness Matrix

**Supersedes** `phase0c/08-GO-LIVE-BLOCKER-REPORT-REVISED.md` §2 and
`../SAFE-GO-LIVE-READINESS-REPORT.md` §1.
**Decision date:** 2026-11-02 · **Mode:** read-only; no application change, no database connection.

---

## 1. The 17 gates, re-scored against Phase 0D evidence

| # | Gate | Phase 0A | **Phase 0D** | Evidence for the change |
|---|---|---|---|---|
| 1 | Repository inspectable | PASS | **PASS** | unchanged |
| 2 | No lost work on branches | PASS | **PASS** | unchanged |
| 3 | Static code quality | PASS | **PASS** | ESLint 2,699 files, 0 errors, 1 warning |
| 4 | TypeScript typecheck | BLOCKED | **BLOCKED** | needs generated Prisma client; engine download blocked |
| 5 | Unit test gate | FAIL (31) | **FAIL, re-classified** | 142/173 pass; **10 Prisma-blocked + 3 no-DB + 2 test-double + 16 genuine** (report 05) |
| 6 | Integration tests (MySQL) | NOT RUN | **NOT RUN** | needs `TEST_DATABASE_URL`; Phase 0E not started |
| 7 | Browser E2E | NOT RUN | **NOT RUN** | no server + Playwright in sandbox |
| 8 | Schema validity | BLOCKED | **BLOCKED** | `prisma validate` needs the engine; 618 models parse statically |
| 9 | Migration drift | UNKNOWN | **UNKNOWN** | CI-only job; not observable here |
| 10 | Secrets in tracked files | NOT VERIFIED | **NOT VERIFIED** | still unexecuted; no `.env` present |
| 11 | API authentication coverage | FAIL | **PASS (with P2 debt)** | 1,099 routes: 659 role-gated, 261 handler-gated, 69 public, 33 public-write, 77 auth-only; **3 mutating auth-only, 2 are `410` tombstones** (report 04) |
| 12 | Catalogue data verified | FAIL | **FAIL — sharpened** | 8 courses at 4–6/10 field coverage; **0 of 8 meet field-level `VERIFIED`**; 8,735 synthetic |
| 13 | Public visibility rule correct | FAIL (fix pending) | **FAIL — new cause** | gate is correct *and* nothing satisfies it: `PARTIALLY_VERIFIED ≠ VERIFIED`, so 0 publishable without a code change (report 01 §4) |
| 14 | Backup + restore | PARTIAL | **PARTIAL** | unchanged; no restore evidence |
| 15 | Deployment authority | AMBIGUOUS | **AMBIGUOUS** | `deploy-production.yml` still refuses; shipping pipeline unconfirmed |
| 16 | Production/staging identity | BLOCKED | **BLOCKED** | Phase 0E gate: 8 owner attestations outstanding (report 06) |
| 17 | Live health check | NOT RUN | **NOT RUN** | no network path |

**Score: 4 PASS · 3 FAIL · 1 PARTIAL · 3 BLOCKED · 4 NOT RUN/UNVERIFIED · 2 UNKNOWN.**
(11, 12, 13 are the FAILs; 14 PARTIAL; 4/8/16 BLOCKED; 6/7/10/17 not run; 9/15 unknown.)

## 2. Blocker list after Phase 0D

| ID | Severity | Blocker | Status |
|---|---|---|---|
| **B1** | **P0** | No course reaches field-level `VERIFIED`; and `PARTIALLY_VERIFIED` cannot pass the public gate | **Open** — policy approved, publication still impossible without a code change |
| **B2** | ~~P1~~ → **P3** | `onNavigate("public-country")` in 8 components | **Downgraded** — all 8 are orphans; live routing at `/destinations/[slug]` works |
| **B3** | **P1** | Release gate unmeasured: 16 genuine failures unresolved + Prisma blocked | **Open** — now itemised per test |
| **B4** | **P2** | 7 handlers rely solely on the proxy for authz | **Open** — defence-in-depth debt |
| **B5** | **P2** | Identity counts inflated by duplicates (NZ 9 vs 8) | **Open** — 12 confirmed aliases, 21 suspects |
| **B6** | **P2** | Four competing course-coverage models | **Open** — must be resolved before any import |
| **B7** | **BLOCKED** | Staging/production identity unconfirmed | **Open** — 8 attestations required (report 06) |
| **B8** | **P3** | Offline page promises background sync that is not shipped | **Open** — 1-string fix or a product decision |
| **B9** | **P3** | `/api/course-finder/eligibility` unguarded duplicate, dead caller | **Open** — retire route + 2 orphans |

## 3. What is now genuinely resolved

| Item | Resolution |
|---|---|
| Verification labels | Approved policy applied to the recovery dataset; legacy values preserved |
| Evidence relinks | 3 validated against 6 criteria; 1 promotes a course (4/10 → 6/10) |
| "7 unauthenticated endpoints" | Withdrawn — all 7 proxy-gated and role-allow-listed |
| "31 code-test failures" | Replaced by a per-test classification: 10 Prisma, 3 no-DB, 2 test-double, 16 genuine |
| Broken public navigation | Downgraded — dead code, not a live failure |
| File-purpose coverage | 0 of 9,789 rows without a purpose (Phase 0C) |

## 4. Minimum path to a defensible public launch

1. **Decide publication for `PARTIALLY_VERIFIED`** (B1). Two admissible options:
   * extend the public gate for a `PARTIALLY_VERIFIED` + evidenced-fields-only render, with a
     "not confirmed" UI state (needs code approval), **or**
   * keep everything internal and launch with an honest empty catalogue.
   Doing neither leaves 8 real courses invisible *and* undocumented as to why.
2. **Triage the 16 genuine test failures** (B3) on a networked machine, resourcing `prisma generate`.
3. **Resolve the four coverage models** (B6) before any import is designed.
4. **Clear the Phase 0E gate** (B7) — 8 owner attestations, no exceptions.
5. Optional but cheap: retire the duplicate eligibility route (B9), correct the offline copy (B8),
   dedupe NZ (B5).

## 5. Statements that are safe to make today

| Claim | Verdict |
|---|---|
| "We have 8 courses with official evidence at field level, 4–6 of 10 core fields each" | **True** |
| "79 identity-verified institutions (78 distinct)" | **True** — identity only |
| "New Zealand: all 8 universities" | **True** — after the Auckland dedupe |
| "Our catalogue is verified" | **False** — 0 courses are field-complete |
| "All tests pass" | **False** — 142/173 |
| "The 31 failures are infrastructure" | **False** — 16 are genuine |
| "7 endpoints are unauthenticated" | **False** — withdrawn |
| "Country pages are broken" | **False** — `/destinations/[slug]` serves them with the public gate |

## 6. Standing constraints (unchanged)

No application change, database write, commit, push, merge, deployment or public publication without
separate approval. Phase 0D produced files only: 7 reports, 5 datasets, 3 scripts, all uncommitted.
