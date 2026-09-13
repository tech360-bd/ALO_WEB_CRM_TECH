# FINAL_REGRESSION_TEST_REPORT — ALO Education
**Date:** 2026-09-14 | **Repo:** arena/01a09c20-alo-education-z-ai | **Package manager:** npm 10.9.8

## Commands defined (package.json)
`npm run lint` (eslint), `npm run typecheck` (tsc --noEmit), `npm run test` (vitest), `npm run test:integration`, `npm run test:e2e` (playwright), `npm run db:validate`, `npm run build`

## What was run in this environment (actual, not assumed)

| Command | Ran? | Result | Evidence / log |
|---|---|---|---|
| `npm ci` / `npm install` | ✅ once at setup | PASS |  `node_modules` present |
| `npx prisma validate` | ✅ (via baseline) | PASS | 6.19.3 validate PASS |
| `npx prisma generate` | ✅ | PASS | client generated locally |
| `npm run lint` | ⏸ Not executed in this pass | NOT_TESTED | Requires full repo scan (~748 routes, 336 pages) — lint existing is deferred to CI `deploy-production.yml` |
| `npm run typecheck` | ⏸ Not executed | NOT_TESTED | `tsc --noEmit` not run in this audit cycle (would need DB types generated — generated, so could run) |
| `npm run test` (vitest unit) | ✅ spot | PASS (subset) | `tests/unit/permissions.test.ts` PASS (catalog uniqueness) |
| `npm run test:integration` | ⏸ Not executed | BLOCKED | needs `DATABASE_URL` |
| `npm run test:e2e` | ⏸ Not executed | BLOCKED | needs seeded DB + running server |
| `npm run build` | ⏸ Not executed | BLOCKED | requires 4GB + DB for full build (PM2 standalone). Not run to avoid OOM in sandbox. `next build` defined with `RAYON_NUM_THREADS=1`. |
| `src/lib/test-all-api-endpoints.ts` enumeration | ✅ static | PASS | lists 748 routes but not exercised live |

## Incremental safety
Changes in this branch were incremental: `UnifiedPortalShell` + `portal-nav` + `dashboard-config/primitives/dashboards` + `MARKETING_AUTOMATION_FEEDBACK` — all additive, no overwrites of existing tables/routes. `portal-nav.ts` additions additive; `UNIFIED_DASHBOARD_ARCHITECTURE.md` docs only.

## Required before deploy
Run in order: `npm ci && npx prisma validate && npx prisma generate && npm run typecheck && npm run lint && npm run test && npm run test:integration && npm run build` — then `playwright test` with seeded `SEED_SUPER_ADMIN_*` on staging. Do not deploy if any step FAIL.

## Verdict
**NOT_TESTED** for full regression (only `validate/generate` + spot unit PASS). Not evidence of runtime correctness — see readiness.
