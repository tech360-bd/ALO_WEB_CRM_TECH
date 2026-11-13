# Section E — Retirement plan: duplicate POST eligibility endpoint

Status: **PLAN ONLY — nothing removed.** Removal waits for compatibility and regression
checks to complete, and preserves the maintained public equivalent.

---

## 1. What exists

| | Deprecated | Maintained |
|---|---|---|
| Route | `src/app/api/course-finder/eligibility/route.ts` | `src/app/api/course-finder/eligibility-engine/route.ts` |
| Methods | POST only | POST |
| Lines | 265, `// @ts-nocheck` at line 1 | typed |
| Engine | inline rule-based matching | `src/lib/university-course/eligibility-engine` |
| Rate limiting | **none** | `rateLimitMiddleware(req, 'lead_create')` |
| Gate | `PUBLISHED` + `VERIFIED` inline | `public-catalog` helpers |
| Writes | `db.finderEligibilityResult.create()` on every call | anonymous assessment record |
| Public page | none live | `/eligibility-check` (`EligibilityCheckerEnhanced`) |

## 2. Consumer census (2026-11-02)

| Kind | Finding |
|---|---|
| Internal callers in `src/` | **1** — `src/components/course-finder/eligibility-checker.tsx:200` |
| Is that component mounted? | **No.** Nothing imports `eligibility-checker`; the live component is `eligibility-checker-enhanced.tsx`, which calls `/api/course-finder/eligibility-engine`. |
| Live consumers of the maintained equivalent | 8 files (course finder enhanced, compare page, `/eligibility-check`, partner search, student course page, `/api/agent/course-advisor`, `/api/data-quality`, the engine route itself) |
| External/consumer references in the repo inventory | 0 (only documentation: `docs/API_FUNCTIONALITY_MATRIX.md:478`, `docs/BRANCH-MERGE-FUNCTION-LEDGER.csv`) |
| Tests referencing it | 0 |
| In `SENSITIVE_API_ROUTES`? | No — see §3. |
| In the public list in `src/proxy.ts`? | **Yes.** `"/api/course-finder"` is in `PUBLIC_API_READ_ROUTES` (line 187), which matches this path, so the POST is reachable **without authentication**. |

## 3. Why this is worth retiring rather than leaving alone

The endpoint is anonymously reachable, has **no rate limiter**, and performs
`crmCourse.findMany()` plus one `finderEligibilityResult.create()` per request. That is an
unbounded anonymous write path into the database, on a route whose only caller is dead
code, duplicating a maintained route that *is* rate-limited.

That combination means retirement has value independent of tidiness, and it also gives a
low-risk interim mitigation that does not wait for removal.

## 4. Sequencing

Each step is separately reversible; none requires downtime.

| Step | Action | Exit criterion |
|---|---|---|
| **0. Freeze** | Declare the route deprecated in the file header; add `export const dynamic = 'force-dynamic'` (already effectively dynamic). No behaviour change. | merged, reviewed |
| **1. Observe** | Log one line per request (`route=course-finder/eligibility`, hashed IP, user-agent family). No body logging — it contains nationality and grades. | 14 consecutive days with zero external traffic |
| **2. Interim mitigation** | Apply the same `rateLimitMiddleware(req, 'lead_create')` the maintained route uses. This closes the anonymous-write amplification without changing the contract. **Recommended even if retirement stalls.** | load test shows the limit enforced |
| **3. Deprecation response** | Return `308`-style guidance: `410 Gone` with `{ success: false, error: 'Use /api/course-finder/eligibility-engine', deprecated: true }` and `Deprecation`/`Sunset` headers, for one release. Keep the handler deployable. | no 4xx spike beyond expected |
| **4. Orphan cleanup** | Delete `src/components/course-finder/eligibility-checker.tsx` in the same change as step 5 — it is the only reference. | build green |
| **5. Removal** | Delete the route file; remove `finderEligibilityResult` usage; update `docs/API_FUNCTIONALITY_MATRIX.md` and the ledger entry. | full suite equal-or-better than baseline |
| **6. Data** | `finderEligibilityResult` **rows are not deleted** by this plan. Retention is a separate data decision. | recorded, not executed |

## 5. Compatibility and regression checks required before step 5

* [ ] `grep -rn "course-finder/eligibility\b"` over `src/`, `tests/`, `docs/`, scripts,
      and `prisma/` returns only the route and the orphan component.
* [ ] No deployment dependency: confirm nothing in `next.config.*`, `proxy.ts`,
      `vercel.json`/Docker/nginx rewrites, cron definitions or external integrations calls
      the path. (`proxy.ts` only needs the public-list entry removed with the route.)
* [ ] Confirm the maintained route answers the same question for every field the old
      component sent (`nationality`, `countryOfResidence`, `highestQualification`,
      `subject`, `grade`, `gpa`, plus preferences): compare response shapes field by field.
* [ ] Confirm `/eligibility-check` and `/ai/course-match` flows still pass.
* [ ] Run the full required checks; compare to the recorded baseline
      (`07-VERIFICATION-LOG.md`). Removal must not increase failures.
* [ ] Confirm the retention decision for `finderEligibilityResult` rows.

## 6. Rollback

Steps 0–3 are code-only and revert by reverting the commit. Step 5 is a file deletion;
revert restores the route. No schema change, no data migration, no external contract that
cannot be restored within one deploy.

## 7. Explicitly not doing

* Not removing the route in this phase.
* Not touching `src/lib/university-course/eligibility-engine`, `eligibility-engine/route.ts`,
  `/eligibility-check`, or `EligibilityCheckerEnhanced` — the maintained public equivalent
  is preserved.
* Not deleting `finderEligibilityResult` rows.
