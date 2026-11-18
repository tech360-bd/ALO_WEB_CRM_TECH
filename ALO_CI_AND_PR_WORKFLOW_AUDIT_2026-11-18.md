# Pull request and workflow failure audit — 2026-11-18

## Scope and inventory

Reviewed the repository's available GitHub pull requests and Actions history through 2026-11-18, plus the latest failures on the checked-out `main` commit (`eab6ae5b`, merge of PR #62).

- Pull requests: **61 total** — 60 merged, 1 closed, 0 open.
- Actions runs available: **334**, from 2026-10-12 through 2026-11-18.
- Stored PR check rollups: **39 of 61 PRs** contain at least one failed check conclusion (70 failed check conclusions total: 36 CI quality-gate, 32 MySQL integration, 2 CodeQL). These include old/merged PR heads; they are not 39 open problems on the current tree. No PR remains open to fix in place.

| Workflow | Runs | Success | Failure | Cancelled | Still running |
|---|---:|---:|---:|---:|---:|
| CI — Pull Request Validation | 198 | 43 | 118 | 36 | 1 |
| CodeQL Advanced | 97 | 97 | 0 | 0 | 0 |
| GitHub Advanced Security | 2 | 1 | 1 | 0 | 0 |
| Health & Dependency Monitor | 36 | 12 | 24 | 0 | 0 |
| Production deployment disabled — Hostinger owned | 1 | 0 | 1 | 0 | 0 |
| **Total** | **334** | **153** | **144** | **36** | **1** |

Historical run conclusions are immutable; this change does not rewrite old runs or claim those old commits passed. The one GitHub Advanced Security failure was an AI findings run on PR #49 (`Processing Request (Linux)`); another run for the same PR succeeded. CodeQL has no failures in the available history.

## Current-head failures found and repaired

The latest push run on `main` was `44247933409` (2026-11-18). Its two actionable CI failures were independently confirmed through the GitHub check annotations:

1. **Environment variable classification was stale.** Regenerated `docs/environment-classification.json` from the current source tree. It now includes the `UPLOAD_DIR` reference and updated classification counts. `npm run audit:env -- --check` passes.
2. **Prisma migration/schema drift in the Super Admin AI workforce tables.** PR #62's migration created several columns with different types or missing defaults compared with `schema.prisma` (including `LONGTEXT` versus `VARCHAR`/`TEXT`, `FLOAT` versus Prisma's MySQL `DOUBLE`, and omitted TEXT defaults). Added a forward-only migration, `prisma/migrations/20261118070000_align_super_admin_ai_column_contract/migration.sql`, to align the existing tables without editing an already-released migration. Removed the redundant non-unique `AgentResourceQuota.agentId` index declaration because `@unique` already supplies the required index.

The GitHub annotations identified 12 drift statements, all pertaining to these AI workforce tables and the now-removed redundant index. The correction is deliberately a normal forward migration; the original migration checksum/history remains intact.

## Failures that are not repository-code fixes

- **Health & Dependency Monitor:** its latest observed failure was the public-production smoke check; the weekly production dependency audit in that same run passed. Previous repository triage identified stale/missing routes at the Hostinger/LiteSpeed edge while `/api/health` remained reachable. This requires a Hostinger-owned deployment/cache action. GitHub deployment workflows intentionally refuse production changes, and this audit does not bypass that safety boundary or weaken the health checks. The public health check may remain red until the production owner deploys the current build and purges cache.
- **Production deployment disabled workflow:** the sole failure is intentional; its purpose is to refuse GitHub Actions production deployment. Changing it to green would remove a safety signal.
- **Historical CI failures:** many belong to earlier commits/PR attempts, including runs later superseded by successful changes. Those cannot be repaired retroactively. The current-head actionable errors above are what this branch corrects.

## Local verification

Passed:

- `npm ci --ignore-scripts --no-audit --no-fund` — installed the lockfile dependencies without attempting external Prisma engine downloads.
- `npm run audit:env -- --check`
- `npm run lint`
- `npx vitest run tests/unit/lob-default-drift-filter.test.ts` — 34 tests passed.
- `node --test tests/secret-findings.test.mjs tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` — 25 tests passed.
- `git diff --check`

Not run locally: Prisma/MySQL migration execution, full Vitest suite, typecheck, and production build. No local MySQL server/client or Docker runtime is available, and install scripts were intentionally skipped to avoid an unavailable external Prisma-engine download. GitHub Actions must validate the forward migration against its disposable MySQL 8.4 service after this branch is published.
