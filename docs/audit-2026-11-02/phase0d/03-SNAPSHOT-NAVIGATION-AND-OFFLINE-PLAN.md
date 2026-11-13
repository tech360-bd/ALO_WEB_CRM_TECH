# Phase 0D · 03 — Snapshot Navigation & Offline-Capability Integration Plan

**Scope:** `lib/view-registry`, `lib/offline`, the eight `onNavigate("public-country", …)` components,
and the eligibility API caller.
**Instruction followed:** preserve both libraries and their dependencies; do **not** copy snapshot
directories into `src/` without dependency and compatibility review. That review is below — and it is
the reason the recommendation is *preserve as archive, do not restore*.

---

## 1. The `onNavigate("public-country", …)` trace

**Eight components reference it.** All eight are **orphans** — no file imports any of them:

| # | Component | Disposition | Imports |
|---|---|---|---|
| 1 | `src/components/alo/views/public-home.tsx` | orphan | 0 |
| 2 | `src/components/alo/views/public-course.tsx` | orphan | 0 |
| 3 | `src/components/alo/views/public-university.tsx` | orphan | 0 |
| 4 | `src/components/alo/views/public-destinations.tsx` | orphan | 0 |
| 5 | `src/components/alo/views/public-search.tsx` | orphan | 0 |
| 6 | `src/components/alo/views/public-admission-requirements.tsx` | orphan | 0 |
| 7 | `src/components/alo/views/public-visa-support.tsx` | orphan | 0 |
| 8 | `src/components/alo/views/super-admin-dashboard.tsx` | orphan | 0 |

`public-country.tsx` — the component the navigation was meant to reach — is itself an orphan.

`auth-login.tsx` references the *string* `"super-admin-dashboard"` as a role→view key; it does not
import the component. So there is no live path from any rendered page into this generation.

**Therefore the Phase 0C "broken navigation" blocker (B2, P1) is downgraded to P3.** It is a real defect
in dead code, not a user-facing failure. That correction matters: it removes a P1 from the release
blocker list and moves it to cleanup.

## 2. Why the view registry cannot simply be restored

Three independent findings, each of which alone would block a restore:

**(a) The key does not match.** `onNavigate("public-country", slug)` passes `public-country`.
`lib/view-registry.ts` has no such key — its public group maps **`country`**
(`VIEW_GROUP = { … country: 'public' … }`, `case 'country': import('@/components/alo/new/pages/country-page')`).
`public-country` appears only as a member of the `ViewKey` union in `alo-types.ts`. So even in the
archive this call had no registry entry; it fell through to a default or a no-op. The missing registry
was never the cause — the view name was already stale when the archive was taken.

**(b) None of the registry's targets exist.** The four group files reference **49** `@/components/…`
targets.

| Resolve in current `src/` | Count |
|---|---:|
| Yes | **0** |
| No | **49** |

Every target lives in `components/alo/new/**` or `components/platform/**` — snapshot-only trees.
Restoring the registry would require importing ~100 snapshot components, i.e. exactly the bulk copy the
instruction prohibits, and would duplicate the UI that the App Router already serves.

**(c) A replacement already exists and is live.** Country navigation is a real route with seven
sub-routes, all server-rendered and all behind the public gate:

```
/destinations                      /destinations/[slug]
/destinations/[slug]/universities  /destinations/[slug]/courses
/destinations/[slug]/scholarships  /destinations/[slug]/admission-requirements
/destinations/[slug]/cost-calculator  /destinations/[slug]/visa-guide
```

`src/app/destinations/[slug]/page.tsx` renders `PremiumCountryPage` and queries through
`publicCourseWhere` / `publicUniversitiesInCountryWhere` / `publicScholarshipsInCountryWhere` /
`publicRequirementWhere` from `@/lib/public-catalog` — the same visibility helpers used everywhere else.
Live pages already link there (`src/app/courses/[slug]/page.tsx` breadcrumbs,
`src/app/aqf-compliance/page.tsx`, every destination sub-page).

**Recommendation:** keep `lib/view-registry` **in place as an archive and do not wire it up**. Restoring
it would add a second, parallel navigation system whose targets do not compile.

## 3. Offline capability — a live shell and a missing engine

| Component | State | Detail |
|---|---|---|
| `public/sw.js` | **live** | registered by `src/components/pwa/PwaRegister.tsx`, which `src/app/layout.tsx` imports. Cache `alo-education-v2-20261009-static` |
| Service-worker policy | **deliberate** | *"Never cache API data, documents or portal HTML"*; caches only the offline URL, manifest, icons, `_next/static`, `/images`, `/icons`; API requests are skipped entirely |
| `src/app/offline/page.tsx` | **live** | fallback page |
| `lib/offline/**` (8 files) | **absent from `src/`** | cache-manager, conflict-manager, db, index, network-status, schema, sync-engine, sync-queue |
| Dependencies | **none installed** | no `idb`, `dexie` or `workbox` in `package.json`; the engine is hand-rolled over IndexedDB |

**The honesty defect:** the live offline page tells the user *"No internet connection. Some cached
pages and CRM data may still be available. **Your actions will sync when you reconnect.**"* There is no
sync queue in the shipped app, so that sentence describes a capability the product does not have.

Two legitimate resolutions, and only two:

* **Option A — restore offline sync.** Requires the 8 files, an IndexedDB wrapper, and a service-worker
  change to allow authenticated/data requests to be queued. That is a security decision (queued portal
  data on a shared device), not a copy-paste. Not recommended without an explicit product decision.
* **Option B — make the copy true (recommended).** Keep the shell and the offline fallback, and change
  the sentence to what actually happens: cached pages are available; form submissions cannot be queued
  and must be retried after reconnecting. One string, no dependency, no security change.

Either way `lib/offline` is **preserved** — nothing is deleted in this phase.

## 4. The eligibility caller, end to end

```
src/components/course-finder/eligibility-checker.tsx:200   (orphan)
        └─ POST /api/course-finder/eligibility             (only POST; @ts-nocheck; no guard)
                └─ db.crmCourse.findMany({ where: { approvalStatus:'PUBLISHED', verificationStatus:'VERIFIED' } })
```

* The endpoint's **only** caller is an orphan, and that component's only host
  (`components/alo/views/public-country.tsx`) is also an orphan → the chain is dead.
* The route **does** filter to published + verified courses, so it cannot leak unpublished rows. Its
  residual risk is an unauthenticated compute endpoint and a duplicate, `@ts-nocheck` implementation —
  not disclosure.
* The live public flow uses a different, maintained endpoint:
  `src/app/eligibility-check/page.tsx` → `EligibilityCheckerEnhanced` → `POST /api/course-finder/eligibility-engine`
  (explicitly public in `proxy.ts`, engine in `src/lib/university-course/eligibility-engine`).

**Recommendation:** retire `/api/course-finder/eligibility` and the two orphan components rather than
authorising them. Retiring removes the duplication; adding auth would preserve a second implementation
of the same engine and still leave dead UI.

## 5. Safe integration proposal (for approval — nothing implemented)

### 5.1 Scope

| Item | Action | Why |
|---|---|---|
| `lib/view-registry/**` | **preserve, do not wire** | 0/49 targets resolve; App Router replaces it |
| `lib/offline/**` | **preserve, do not wire** | needs a dependency + a data-caching security decision |
| 8 orphan components | **leave in place; decide delete separately** | no runtime effect today |
| `/api/course-finder/eligibility` + 2 orphan components | **retire** (with tests first) | duplicate engine, dead callers |
| Offline page copy | **correct** | currently promises a sync capability that is not shipped |
| Any *revived* component | use `next/link` / `useRouter().push(`/destinations/${slug}`)` | reuse current routing and the public gate |

### 5.2 Ordered work, smallest first

1. **Copy fix** (1 string) — remove the sync promise or implement it.
2. **Retire the duplicate eligibility path** — delete the route + 2 orphans in one change, so the 401 can
   never resurface.
3. **Destinations link audit** — confirm every live country entry point uses `/destinations/[slug]`;
   add a lint-level check that `onNavigate("public-country"` appears nowhere in `src/`.
4. **Only if a product owner wants the archived views back:** revive per-component with the App Router,
   not via the registry — one component per approved change, each with its own tests.

### 5.3 Tests required with any of the above

| Level | Test | Asserts |
|---|---|---|
| Route | `GET /destinations/[slug]` for a known slug | 200, renders country name, no unpublished course |
| Route | `GET /destinations/[slug]` for `verified-only` data | only `PUBLISHED` + `VERIFIED` rows appear |
| Route | `POST /api/course-finder/eligibility` after retirement | **404**, so the dead path cannot be re-linked silently |
| Route | `POST /api/course-finder/eligibility-engine` | 200 anonymously (public by design), and never returns unpublished rows |
| Component | country card renders an `<a href="/destinations/{slug}">` | real anchor, so it is crawlable and works without JS |
| Component | offline page | does not claim background sync unless a queue exists |
| Regression | repository grep | `onNavigate("public-country"` must not appear in `src/**` outside archived views |
| Regression | snapshot comparison | `lib/view-registry` and `lib/offline` remain present and byte-identical |

## 6. Decisions requested

1. Offline: **Option B (correct the copy)** or Option A (restore sync, with a data-at-rest decision)?
2. Eligibility: **retire** the duplicate route, or add auth and keep it?
3. The 8 orphan components: leave as archive (default here) or schedule deletion?
4. Confirm `lib/view-registry` should stay unwired.

Nothing in this plan has been implemented. No application file was modified.
