# Verification evidence — 2026-10-29 UTC

## Completed checks

- `npm run data:course-month:check` — PASS: 13 month rows; January, April and September 2027 are source-supported starts; the other 10 assessed months remain `NOT_PUBLISHED`; 5 official source URLs; catalogue-completion flag remains false; zero writes. The environment's dependencies were absent, so this run used temporary npm-cache `tsx`/`zod` binaries via ignored local `node_modules` symlinks; no package lock or tracked dependency artifacts were changed.
- `./node_modules/.bin/vitest run tests/unit/course-month-coverage-schema.test.ts` — PASS, 5/5 focused schema/dataset tests. Vitest and Zod were also supplied from the temporary npm cache. This is not the full test suite.
- `python3 scripts/verify-course-month-staging.py` — PASS: 1 individual course page, 5 official URLs, 13 contiguous month rows, 3 `VERIFIED_AVAILABLE`, 10 `NOT_PUBLISHED`, 0 2027/28 fee rows, 6 scholarship course-month associations, 12 destination countries tracked, 0 complete institutional catalogues, 0 live DB writes.
- JSON parse via Python's `json.tool` — PASS.
- `git diff --check` — PASS.
- Official pages opened with the research browser: Aston A–Z catalogue, AI MSc individual course page, English-language requirements, Aston-in-Bangladesh page, international scholarships.

## Blocked checks (environment, not passing)

- `npm run lint` — BLOCKED, `eslint: not found` (full root dependencies are absent).
- `npm run typecheck` — BLOCKED at generated-client preflight, `@prisma/client` unavailable.
- `npm run db:validate` — BLOCKED, `prisma: not found`. Direct validation using an incomplete imported Prisma CLI failed because `prisma_schema_build_bg.wasm` is missing. A registry-installed Prisma CLI then required `binaries.prisma.sh`, outside the available network allowlist; schema-engine download failed.
- `npm run build` — BLOCKED, `prisma: not found`.
- MySQL migration, duplicate matching, persistence, approval/rejection, authentication/RBAC, production build, browser tests, scheduler execution/restart recovery and portal/cache synchronization — NOT RUN; no `DATABASE_URL`, generated Prisma client, or test database is configured.

## Acceptance status

- Complete end-to-end verification rounds: **0 of 5**.
- The passing focused tests and offline integrity checks do not establish database persistence or production readiness.
- No production data was changed and no production deployment is claimed.
