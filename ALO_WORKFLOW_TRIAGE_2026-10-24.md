# Workflow triage — all 78 runs

**Date:** 24 October 2026 · **Scope:** every GitHub Actions run on
`tech360-bd/ALO_WEB_CRM_TECH` (`actions/runs` reports `total_count: 78`).

---

## 1. Inventory

| Workflow | Runs | Success | Failure | Cancelled |
|---|---|---|---|---|
| CI — Pull Request Validation (`ci.yml`) | 66 | 14 | 43 | 9 |
| Health & Dependency Monitor (`health-monitor.yml`) | 11 | 8 | 3 | 0 |
| Production deployment disabled — Hostinger owned (`deploy-production.yml`) | 1 | 0 | 1 | 0 |
| **Total** | **78** | 22 | 47 | 9 |

`deploy-recovery.yml` has never run (manual-only, no dispatch recorded).

**Almost all of the 47 failures are historical.** The 43 CI failures are
concentrated in the 12–14 October branch era (lockfile/install breakage and
advisory noise from `arena/*-alo-education-z-ai` branches). The pipeline was
**green on `main` at run #64 (23 Oct, 15:11Z)**. Everything failing after that
point is one of the two live defects in §2.

---

## 2. The two live failures

### 2.1 CI runs #65–#68 — `Dependency security audit (high and critical block)`

All four most recent CI runs (both `main` pushes and both PR builds for PRs #18
and #19) fail at the **first gate after install**, so the nine steps behind it
never execute.

Evidence — failing step per run:

| Run | Event | Branch | Failing step |
|---|---|---|---|
| #68 (`40042246464`) | push | `main` | Dependency security audit (high and critical block) |
| #67 (`40042144747`) | pull_request | `arena/a37d47ac` | same |
| #66 (`40023724577`) | push | `main` | same |
| #65 (`40023704597`) | pull_request | `arena/65a95bf2` | same |

Reproduced locally — `node scripts/ci/npm-security-audit.mjs`:

```
✗ dependency audit FAILED — 9 effective high/critical vulnerability chain(s):
  - @remotion/bundler [high] (transitive)
  - @remotion/cli [high] (transitive)
  - @remotion/lambda [high] (transitive)
  - @remotion/media [high] (transitive)
  - @remotion/serverless [high] (transitive)
  - @remotion/studio [high] (transitive)
  - @remotion/studio-protocol [high] (transitive)
  - @remotion/studio-server [high] (transitive)
  - zod [high] — https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 (high, range <4.6.6)
```

**Root cause.** `GHSA-mrhx-c7xc-m3w5` — *"Zod can exhaust memory while validating
oversized constrained collections"*, high, published 2026‑10‑01 and **updated
2026‑10‑23T18:26Z**. The lockfile pinned `zod 4.5.4`, which is inside the
vulnerable range `< 4.6.6`. The advisory landing in npm's database on 23 Oct is
exactly what turned a green `main` red 2.5 hours later.

The eight `@remotion/*` entries are **not separate bugs**: each of them depends
on zod. Five pin it exactly (`@remotion/lambda`, `media`, `studio`,
`studio-protocol`, `studio-server` → `"zod": "4.5.4"`), so the audit's fixpoint
pass inherits the same advisory down the chain.

**Fix applied.**

| File | Change |
|---|---|
| `package.json` | `"zod": "^4.0.2"` → `"^4.6.7"` (4.6.6 is the first patched release; 4.6.7 is current) |
| `package.json` | added `"zod": "$zod"` to `overrides` so the five `@remotion/*` exact pins resolve to the patched release instead of nesting a vulnerable copy. `$zod` is npm's documented way to reference the direct dependency's own range — a literal version there is rejected with `EOVERRIDE`. |
| `package-lock.json` | re-resolved: one `zod` copy at **4.6.7** (`sha512-g8W2D2kU6a8untc0…`), root dependency `^4.6.7` |

**Why an override rather than waiting for upstream.** The newest `@remotion`
release (4.0.538, checked against the registry today) still pins `zod 4.5.4`, so
there is no upstream fix to adopt. zod 4.6.x is a minor release in the same
major line — no documented breaking change — so widening the pin is the
supported path. Residual risk is confined to Remotion's studio schema validation
(`@remotion/studio-protocol`); the video-engine entry points are exercised by
`tsc` and the build, but a full `remotion render` was not run in this
environment (§5).

The pre-existing `braces` waiver in `npm-security-audit.mjs` is now unused —
the script prints no waiver line, meaning that advisory no longer applies to the
resolved tree. The waiver mechanism was left in place.

### 2.2 Health & Dependency Monitor runs #9, #10, #11 — `Public readiness and anonymous smoke checks`

Failing runs: 2026‑10‑14, 2026‑10‑22, 2026‑10‑23 (`39898367545`, `39720426478`,
`38509297719`) — the step `node scripts/production-smoke.mjs https://aloeducation.com`
is the only failing step in each; the weekly `npm audit --omit=dev` job passes.

**Root cause: a production deployment gap, not repository code.** Probed live
today:

| Path | Live result | Exists in repo? |
|---|---|---|
| `/api/health` | **200 JSON**, `database.connected: true` | yes |
| `/` | 200, full homepage | yes |
| `/universities` | **404 — LiteSpeed Web Server default page** | yes (`src/app/universities/page.tsx`) |
| `/student/login` | **404 — LiteSpeed default page** | yes (`src/app/student/login/page.tsx`) |
| `/api/workforce/metrics` | **404 — LiteSpeed default page** (must be 401/403) | yes (`src/app/api/workforce/metrics`) |

The 404 body is the hosting server's own page, not Next.js's — so the request
never reaches the application for those paths, while `/api/health` and `/` are
served normally. The deployed build predates (or is missing) those routes; the
app and database are demonstrably up. Earlier audit evidence agrees: the live
site still renders figures the repository removed, i.e. production is running an
older build.

**Fix applied — diagnostics only, the gate still fails closed.** Production
cannot be redeployed from here: `deploy-production.yml` exists precisely to
*refuse* deployment from GitHub Actions ("Hostinger owned"), and no hosting
credentials are available. Rewriting the check to pass would hide a real
user-facing breakage, so `scripts/production-smoke.mjs` was made diagnostic
instead:

* every check now runs before the exit code is decided — one failing route no
  longer hides the state of the other nine checks;
* a 404 is classified as **edge/hosting** (LiteSpeed default page, or a body with
  no Next.js build markers) versus **application** (Next.js answered), because
  those need different remediation;
* a single remediation block is printed when edge 404s are present: deploy
  current `main` to Hostinger → purge the LiteSpeed cache → re-run;
* if `/api/health` is the failing check, it says so separately — that one *is* an
  outage.

Pass/fail semantics are unchanged: any deviation from the expected status still
exits 1.

---

## 3. The one intentional failure

`deploy-production.yml` run #1 (2026‑10‑13, manual dispatch) fails at
"Refuse production changes from GitHub Actions", which is literally `exit 1` in
the workflow. It is a refusal notice, not a broken pipeline. Left as-is: turning
it green would remove the guard's signal.

---

## 4. Verification performed

| Check | Command | Result |
|---|---|---|
| Dependency audit gate | `node scripts/ci/npm-security-audit.mjs` | **✓ 0 effective high/critical advisories** (was 9) |
| Health-monitor audit step | `npm audit --omit=dev --package-lock-only --audit-level=high` | exit 0 (4 moderate only — below the gate) |
| Lockfile coherence | `npm ci` from the edited lock | installed 1,317 packages, `zod 4.6.7` present, single copy |
| Lint | `npm run lint` | exit 0 |
| Types | `npx tsc -p tsconfig.arena-critical-check.json --noEmit` | **only 7 pre-existing `@prisma/client` errors**, caused by this sandbox being unable to download Prisma engines; no zod-related error anywhere |
| Unit tests | `npx vitest run` | 2,610 passed; 14 files / 3 tests fail **all** with `Cannot find module '.prisma/client/default'` — the same missing generated client, not a code failure. CI runs `prisma generate` before the tests. |
| Secret scan | `bash scripts/ci/scan-credentials.sh` + `node --test tests/secret-findings.test.mjs` | pass (9/9) |
| Deployment-ownership tests | `node --test tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` | 16/16 pass |
| Env classification | `npm run audit:env -- --check` | ✓ up to date |

---

## 5. Outcome — CI is green again

| Run | Trigger | Result |
|---|---|---|
| **#69** | PR #20 (this fix) | **success** — both jobs passed: `Lint · Typecheck · Tests · Prisma · Build` (15m 31s) and `MySQL 8 · Migrate · Integrate · Boot` (8m 28s) |
| **#70** | push to `main` after merging PR #20 (`40da1ebb`) | **success** |

Every step that had been skipped since run #65 — secret scan, deployment-ownership
tests, env classification, Prisma validate/generate, lint, typecheck (with swap),
tests and the production build — executed and passed. `main` is green for the
first time since run #64.

---

## 6. Not verified here

1. ~~CI itself has not re-run.~~ Done — runs #69 and #70 are green (§5).
2. **`next build`** cannot run in this sandbox (>4 GB heap; 3 GB machine), so the
   production-build step is unproven locally — it was green at run #64.
3. **Prisma-dependent typecheck/tests** need `prisma generate`, which downloads
   engines from `binaries.prisma.sh` (blocked here). CI has that egress.
4. **`remotion render`** was not exercised, so the zod override is verified by
   types, the CI build and lockfile resolution — not by rendering a video. If
   Remotion's studio schemas ever misbehave, this override is the first suspect.
5. **Production is still serving 404s** for `/universities`, `/student/login`,
   `/api/workforce/*` and others. Until `main` is deployed to Hostinger and the
   LiteSpeed cache purged, the Health & Dependency Monitor will keep failing —
   correctly.
