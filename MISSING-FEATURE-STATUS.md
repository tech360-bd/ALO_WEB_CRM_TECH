# Missing Feature Status

**Branch:** `arena/92d9a42c-alo-web-crm-tech` · **Updated:** 2026-11-16

## Blocking items (require infrastructure this environment does not have)

- **No MySQL/MariaDB server is reachable from this environment.** `prisma migrate deploy` fails with
  `P1001: Can't reach database server at 127.0.0.1:3306` (apt access is denied, no `mysqld` binary,
  no Docker). Migrations (51, including this branch's) are written and statically audited but never
  applied to a live database.
- **Database-backed integration tests cannot run.** `TEST_DATABASE_URL` is not set; 148 tests are
  skipped by design.
- **Safe seed cannot be proven** without tables to seed into.
- **AI Command Center database evidence** (persistent command execution, approval, rollback against a
  live DB) is not verified — only static/unit coverage.
- **Live provider OAuth/webhook/API verification** (SMS, WhatsApp, email, payment, university APIs)
  was not performed; no credentials exist. System reports `NOT CONFIGURED`, never `SUCCESS`.
- **End-to-end journeys A–D (spec §126)** not executed.
- **Backup/restore (spec §87)** documented and safety-tested in scripts, never run against a live DB.
- **Performance (spec §100)** not measured.
- **Clean-extract gate** not passed in this environment.
- **Full RBAC/ownership matrix automation** for every role × scope not implemented; core RBAC is
  implemented and regression-tested.
- **DB-level enum constraints on status columns** deliberately not applied — see
  `FEATURE-GAP-REPORT.md` §4.8 (needs a verified migration path against a live MySQL).

## Completed in this pass (2026-11-16)

- **§109 AI Daily Management Briefing built end-to-end**: `buildDailyBriefing()`
  (`src/lib/intelligence/daily-briefing.ts`) — 10 sections from live DB counts/sums, independent
  failure isolation, deterministic highlights, links to underlying records; API route
  `/api/intelligence/daily-briefing` (management-only); admin UI `/admin/daily-briefing`; linked from
  Super Admin Quick Actions; 10 unit tests.
- Fixed `scripts/verify-15-cron.ts` final gate asserting obsolete `CRON_JOBS.length === 15` — now
  derives from `CRON_JOB_COUNT`.
- Lint hygiene: `student-help.tsx` — clean `eslint .` (0 errors, 0 warnings).
- Reproducible build: `ALO_BUILD_HEAP_MB=6144` documented; 4 GB swap installed on the host to run
  the 32 MB generated Prisma type-check.
- Typecheck PASS (`tsc --noEmit`), tests PASS (3,917 passed / 148 skipped / 0 failed), cron
  certification PASS (`failed: 0`), prisma validate/generate PASS (offline engines).
- New docs: `FEATURE-GAP-REPORT.md` (spec §123/§124 matrix + maturity levels + explicit not-done list).
- `FINAL-VERIFICATION-REPORT.md` re-graded with fresh evidence from this run.
- Design-system guard caught and fixed: sub-11px text in the new briefing page.

## Previously completed (2026-10 pass)

- Corrected project snapshot and inventories.
- Fixed React lint blockers in communication components.
- Added real Playwright config and browser smoke/auth tests.
- Verified production build and standalone source-tree startup.
- Added disposable MySQL backup/restore scripts and test.
- Outbound webhooks (s77), Realtime SSE (s86), Attention engine (s108), Opportunity Graph (s110),
  Application risk (s111), Student success (s112), Feature flags (s117), Rule versioning (s106),
  Policy monitoring (s64), Parents (s13), University portal (s39).
