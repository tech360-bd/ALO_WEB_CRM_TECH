> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education production recovery plan

**Date:** 2026-09-28
**Branch:** `arena/01a0c218-alo-education-z-ai`
**Implementation candidate:** `89442efb84b1a9624b7367c3501a588e0fadef4a`
**Latest validated audit tip:** `7fda9cdcc1b65d628e9fae6de9f4443b1d3c9ce7` (documentation-only after the implementation candidate)
**Remote branch:** verified with `git ls-remote` and refreshed tracking ref; remote equals the latest validated audit tip before this plan refresh; subsequent changes in this file are documentation-only.
**Default branch:** `main` at `992e99636e281d6aca600919d7f9c71fe9ce75d7`.
**Production:** no deployment, migration, live database mutation, DNS/SSL/firewall change, PM2 restart, or VPS mutation performed.

## 1. Current repository state

| Check | Result | Evidence |
|---|---|---|
| Current branch | **PASS** | `arena/01a0c218-alo-education-z-ai` |
| Working tree | **PASS** | `git status -sb` is clean before this plan refresh; the plan refresh itself is the only pending documentation change |
| Local vs remote branch | **PASS** | `git rev-list --left-right --count HEAD...origin/arena/01a0c218-alo-education-z-ai` = `0 0` after refreshing the stale local tracking ref |
| Branch vs `origin/main` | **AHEAD / NOT MERGED** | The latest validated audit tip contains 14 commits not in `origin/main`; no merge into `main` was performed |
| Unresolved Git conflicts | **PASS** | `git diff --name-only --diff-filter=U` returned no paths |
| Conflict markers | **PASS** | Exact marker scan over source, workflows, Prisma and tests returned none |
| Published history | **PRESERVED** | No reset, force-push, branch deletion, or history rewrite |
| PR state | **OPEN / NOT MERGED** | PR #18 targets `main`; approval and merge were not performed |

The local remote-tracking ref initially showed stale `cba906df` although `git ls-remote` showed the published branch at `3fb1e4e2`. The tracking ref was refreshed with an explicit fetch refspec; this changed only local metadata, not published history.

## 2. Trusted validation evidence on the exact candidate

The candidate was pushed fast-forward only; no force-push, reset, or history rewrite was used. The latest PR validation run checked out the exact candidate `89442efb84b1a9624b7367c3501a588e0fadef4a`:

| Evidence | Result | Exact reference |
|---|---|---|
| GitHub Actions CI run | **PASS** | PR #18 run `36419251748`, https://github.com/engralaminn-collab/alo_education_z....ai/actions/runs/36419251748 |
| CI job duration | **PASS** | `Lint · Typecheck · Tests · Prisma · Build` completed successfully in `11m53s` |
| Prisma schema validation | **PASS** | CI step `Prisma validate` completed successfully on the official Prisma distribution |
| Prisma engine/client generation | **PASS** | CI step `Prisma generate (needed for typecheck)` completed successfully |
| Generated-client verification | **PASS** | CI step `Verify generated Prisma client` checked `node_modules/.prisma/client/default.js` and loaded `PrismaClient` |
| Lint | **PASS** | CI step `Lint` completed successfully; prior local `npm run lint` also passed |
| Typecheck | **PASS** | CI step `Typecheck` completed successfully with the configured heap/swap gate |
| Tests | **PASS WITH EXPLICIT SCOPE** | CI step `Tests (blocking; DB-integration files skip-with-reason when no test DATABASE_URL)` completed successfully; unit/security tests ran, disposable-DB integration did not |
| Production build | **PASS** | CI step `Production build (dummy env, runner validation only)` completed successfully, including standalone artifact check |
| Secret scan | **PASS** | CI tracked-file secret-leak scan completed successfully |
| Workflow YAML parse | **PASS** | Local `js-yaml` parsing passed for `.github/workflows/ci.yml` and `.github/workflows/deploy-production.yml` after the migration-backup heredoc repair |
| Latest audit-tip CI | **PASS** | Run `36423162778`, exact head `7fda9cdcc1b65d628e9fae6de9f4443b1d3c9ce7`, job `108930600289`, completed successfully in `12m24s`; docs-only commits did not change application/workflow implementation |

### Current local validation after reproducible install (exact branch `9a8da6c8`)

A fresh `npm ci` completed from `package-lock.json` and installed Prisma `6.19.3` / `@prisma/client` `6.19.3`. The generated client entrypoint was present and loadable after installation. A fresh engine-dependent `prisma validate`, `prisma generate`, and `prisma format --check` still failed at the official Prisma TLS request; no bypass or alternate binary was used.

| Command | Result | Exact evidence |
|---|---|---|
| `npm ci` | **PASS** | 1,175 packages installed; npm reported 3 high vulnerabilities |
| `npx --no-install prisma --version` | **BLOCKED** | Prisma `6.19.3` resolved; official engine checksum request failed with `Client network socket disconnected before secure TLS connection was established` |
| `npx --no-install prisma validate` | **BLOCKED** | Same official engine TLS/network failure |
| `npx --no-install prisma generate` | **BLOCKED** | Same official engine TLS/network failure |
| `npx --no-install prisma format --check` | **BLOCKED** | Same official engine TLS/network failure |
| Generated client entrypoint/loadability | **PASS** | `node_modules/.prisma/client/default.js` present and `PrismaClient` export loadable after `npm ci`; this does not replace fresh generation |
| `npm run lint` | **PASS** | Exit code 0 |
| `npm run typecheck` | **PASS** | Exit code 0 after reproducible install |
| `npm test` | **PASS / PARTIAL** | 28 files passed, 1 skipped; 275 tests passed, 7 skipped; consultation DB file skipped without `DATABASE_URL` |
| `npm run test:integration` | **PASS / PARTIAL** | 1 file/22 tests passed; 1 consultation file/7 tests skipped without `DATABASE_URL` |
| `npm run build` | **BLOCKED** | Mandatory `prisma generate` stopped at the official engine TLS failure |
| `npm audit --omit=dev --audit-level=high` | **FAIL / REVIEW REQUIRED** | 3 high Prisma CLI-chain advisories; no forced upgrade applied |

The sandbox remains unable to obtain the official Prisma engine directly: DNS and TCP connection to `binaries.prisma.sh:443` succeeded, but TLS failed with OpenSSL `SSL_ERROR_SYSCALL`; `npx prisma --version` reported `Client network socket disconnected before secure TLS connection was established`. No TLS verification bypass, mirror, untrusted binary, or version change was used. The trusted CI runner is therefore the validated resolution path, while local Prisma commands remain **BLOCKED** by the sandbox network.

The CI test step intentionally receives no `DATABASE_URL`; `tests/integration/consultation-workflow.test.ts` uses `describe.skipIf(!HAS_TEST_DB)`. Therefore the green CI job is not evidence of a real MySQL integration run. `tests/integration/visa-security-negative.test.ts` is deterministic mock/security coverage and is included in the normal Vitest run. Playwright/E2E, live provider, authorized staging database and production checks remain unverified.

## 3. Issue register

### Critical issues

| ID | Severity | Area | Evidence / affected files | Status | Required correction and verification | Production impact / rollback |
|---|---|---|---|---|---|---|
| `REC-001` | Critical | Prisma/toolchain | Local `npx prisma --version` and direct `curl` reached the official host but failed during TLS (`SSL_ERROR_SYSCALL` / `Client network socket disconnected before secure TLS connection was established`). | **RESOLVED IN TRUSTED CI / LOCAL BLOCKED** | CI run `36419251748` on exact candidate `89442efb` passed `Prisma validate`, `Prisma generate`, explicit generated-client verification, typecheck and build. Local sandbox remains blocked; do not disable TLS or switch providers/versions. | No production action is authorized from the local blocker. CI evidence removes the candidate validation blocker; no rollback applicable. |
| `REC-002` | Critical | Build gate | The local build was previously blocked at mandatory `prisma generate` by `REC-001`; the trusted CI build now includes Prisma generation and `.next/standalone/server.js` validation. | **VERIFIED IN TRUSTED CI / LOCAL NOT REPRODUCIBLE** | CI run `36419251748` completed `Production build (dummy env, runner validation only)` successfully on exact candidate `89442efb`. | This is a runner validation artifact, not a production deployment; deployment remains approval-gated. |
| `REC-003` | Critical | Type safety | The prior local typecheck lacked generated Prisma exports; after `npm ci`, the generated client entrypoint was present and local typecheck passed. Fresh local generation remains blocked by engine download. | **VERIFIED IN CI AND LOCAL TYPECHECK / GENERATION BLOCKED LOCALLY** | CI run `36424601811` passed generated-client verification and typecheck; local `npm run typecheck` passed on the exact branch. | The exact tested SHA is known; no deploy is authorized until separate DB/runtime gates and approval are satisfied. |
| `REC-004` | Critical | Database/migrations | `prisma/schema.prisma` contains the payroll unique constraint and `prisma/migrations/20260928000000_payroll_safety/migration.sql` adds/reconciles columns and an index. No database was inspected or migrated. | **CONFIRMED RISK / NOT VERIFIED** | On a disposable or authorized staging DB, run migration status and inspect actual schema/duplicates. Before any production opt-in: verified backup, duplicate preflight, reviewed compatibility and approval. Never run `migrate reset`, `db push`, or unapproved `migrate deploy`. | Migration may fail safely on duplicate rows or schema drift; never force it through production. Rollback is forward-fix or verified DB restore, not automatic downgrade. |
| `REC-005` | Critical | Production access/deployment | No authorized VPS shell/database/test-account access is available. | **NOT VERIFIED** | Obtain approved staging/live read-only access or CI evidence; verify server identity, directory, runtime, PM2, port, health, backups and deployed SHA before deployment. | Live health, data preservation, rollback and deployment cannot be claimed. |

### High issues

| ID | Severity | Area | Evidence / affected files | Status | Required correction and verification | Production impact / rollback |
|---|---|---|---|---|---|---|
| `REC-006` | High | Full test suite | Local `npm test` passed 28 files/275 tests and skipped 1 consultation file/7 tests; `npm run test:integration` passed 1 file/22 tests and skipped 7 consultation tests. No disposable MySQL/MariaDB run was available. | **PARTIAL / DB INTEGRATION NOT VERIFIED** | The unit/security suite is locally and CI-verified. Run `DATABASE_URL=<disposable DB>` with `npm test` and `npm run test:integration`; never point it at production. | Integration coverage is not complete release evidence until the generated client is exercised against an authorized disposable DB. |
| `REC-007` | High | CI validation | The reported PR run failed during lint on malformed remote versions of `src/app/api/counselor/hr-self/route.ts` and `src/app/api/counselor/tasks/route.ts`. The repaired candidate has one implementation per route. | **FIXED / VERIFIED LOCALLY AND IN CI** | Local `npm run lint` and CI run `36419251748` both passed on the current candidate lineage. | Previous PR failure is resolved in the pushed candidate; no deployment until required checks and approval remain satisfied. |
| `REC-008` | High | Payroll | Payroll routes and controls were changed in `src/app/api/admin/payroll/route.ts`, `src/app/api/hrm/payroll/route.ts`, `src/app/api/employee-access/payroll/route.ts`, `src/lib/hrms/payroll-controls.ts`, and Prisma schema/migration. | **CODE FIXED / DATABASE NOT VERIFIED** | Run generated-client typecheck, unit/route transaction tests, staging DB transaction tests, duplicate/race tests, permissions, ownership and maker-checker tests. | Payroll must remain disabled from production use until schema and transaction behavior are verified. |
| `REC-009` | High | Authentication/session security | Portal/student login responses no longer return raw session tokens; HttpOnly cookies and cookie-aware middleware were added. Legacy bearer compatibility remains. | **CODE FIXED / RUNTIME NOT VERIFIED** | Test invalid credentials, suspended/pending users, portal type mismatch, cookie session, revocation, ownership, brute-force throttling and legacy client compatibility against a disposable DB. | Cookie migration and cluster-wide throttling remain runtime risks. |
| `REC-010` | High | Deployment workflow | `.github/workflows/deploy-production.yml` requires exact SHA, pinned host verification, SSH passphrase input, preserved data backups, opt-in migrations and health/rollback checks. Its YAML now parses after repairing the migration-backup heredoc indentation. | **CODE REVIEWED / YAML VERIFIED / LIVE NOT VERIFIED** | `js-yaml` parsing passed locally; CI validates the repository separately. Verify GitHub secrets/variables by names only and obtain trusted ED25519 host-key evidence before deployment. | Misconfigured secrets, SSH identity, or server state can block deployment; host verification must not be disabled. |
| `REC-011` | High | Rollback | `scripts/rollback.sh` and Ubuntu compatibility wrapper use exact commit rollback and preserve `.env`, storage and uploads; no live rollback rehearsal occurred. | **CODE REVIEWED / NOT VERIFIED** | Rehearse against a disposable/staging release; verify known-good SHA, build, PM2 restart, health and persistent-data preservation. | Do not claim rollback readiness from source inspection alone. |
| `REC-019` | High | Deployment workflow parser | Before repair, the migration backup Node heredoc in `.github/workflows/deploy-production.yml` was not indented inside its YAML `run: |` block; local `js-yaml` parsing failed at the `env:` line. | **FIXED / YAML VERIFIED** | Commit `89442efb` indents the heredoc body correctly; `js-yaml` now parses both CI and deployment workflows. Keep workflow syntax validation in review and run the deployment workflow only after its separate production gates pass. | A parser-invalid workflow could not safely deploy or migrate; no live action occurred. Rollback is the prior published workflow commit if needed. |

### Medium issues

| ID | Severity | Area | Evidence / affected files | Status | Required correction and verification | Production impact / rollback |
|---|---|---|---|---|---|---|
| `REC-012` | Medium | In-memory rate limiting | `src/app/api/portal-auth/login/route.ts` uses an in-memory per-IP/email counter; student login already uses an in-memory limiter. | **CONFIRMED LIMITATION** | Use the existing shared rate-limit/Redis-equivalent service before claiming protection across multiple instances; test expiry, failures and success reset. | Single-process protection only; multi-instance brute-force gaps are possible. |
| `REC-013` | Medium | Schema drift | Committed migration history and current `EmployeePayroll`/`EmployeePayrollItem` models require additive reconciliation. | **SUSPECTED / NOT VERIFIED** | Validate on a fresh disposable DB and inspect the real target schema before opt-in deployment. | Migration can fail closed; do not use destructive schema commands. |
| `REC-014` | Medium | Browser/E2E | Playwright production build/browser execution was not verified because build/client and browser/runtime access were unavailable. | **NOT VERIFIED** | Install/enable approved Playwright browsers and run anonymous, authenticated-role, ownership, pagination, forms, uploads/downloads, responsive and accessibility matrices. | UI regressions remain possible despite source/unit checks. |
| `REC-015` | Medium | Webhooks/integrations | Public lead/webhook/proxy paths are implemented and security-reviewed, but live provider delivery, signatures, retries and idempotency were not exercised. | **NOT VERIFIED** | Use staging webhook fixtures and provider test accounts; verify signatures, replay/idempotency, request limits and protected route behavior. | Live integrations may still be misconfigured or unavailable. |
| `REC-016` | Medium | Dependency audit | `npm ci` and `npm audit --omit=dev --audit-level=high` report 3 high Prisma CLI-chain vulnerabilities involving `@prisma/config`/`deepmerge-ts`; npm proposes a breaking forced Prisma change. | **CONFIRMED / REVIEW REQUIRED** | Review the audit path separately; do not apply `npm audit fix --force` or a breaking Prisma upgrade in recovery without testing. | CLI/development risk; production runtime impact requires dependency review. |

### Low / documentation issues

| ID | Severity | Area | Evidence / affected files | Status | Required correction and verification | Production impact / rollback |
|---|---|---|---|---|---|---|
| `REC-017` | Low | Documentation | Existing historical audit reports contain dates/branch descriptions from earlier audit states. | **CONFIRMED / HISTORICAL** | Preserve historical reports; use this recovery plan and final report for the candidate state. Do not rewrite evidence history. | Documentation clarity only. |
| `REC-018` | Low | Prisma configuration | Prisma warns that `package.json#prisma` configuration is deprecated for Prisma 7. | **CONFIRMED / NON-BLOCKING** | Migrate to `prisma.config.ts` only as a separately tested Prisma upgrade task. | No current deployment blocker with Prisma 6.19.3. |

## 4. Application and deployment dependency map

```text
GitHub push / PR #18
  -> branch protection and required checks (latest candidate CI run is green; approval is still pending)
  -> npm ci using package-lock.json
  -> Prisma validate/generate (trusted CI PASS; local sandbox direct access remains blocked)
  -> ESLint
  -> TypeScript typecheck
  -> Vitest unit/integration tests
  -> Next.js standalone production build
  -> artifact validation (.next/standalone/server.js)
  -> explicit production approval
  -> SSH to configured AlmaLinux target with host fingerprint + passphrase
  -> exact candidate SHA checkout in /root/alo-github-main
  -> preserve .env, storage, uploads and database
  -> optional, separately approved backup-gated Prisma migration
  -> PM2 `alo-education` on port 3044
  -> local /api/health and public HTTPS smoke checks
  -> rollback to recorded verified previous SHA if health fails
```

Repository architecture is a Next.js 16 monolith with React 19, Node.js 22, npm, Prisma 6.19.3, MySQL, NextAuth/portal sessions, PM2 standalone startup, and Caddy/Nginx/systemd deployment artifacts. There are 819 API route files and 30 test files in the checkout. The repository includes public website, student/partner/employee/admin/CRM/marketing/AI/communications/storage and reporting surfaces, but live/provider behavior remains unverified without a disposable DB, credentials and browser/runtime access.

## 5. Recovery and validation sequence

### Phase A — unblock trusted validation

1. **Complete:** GitHub Actions run `36419251748` used an approved network-enabled runner with access to the official Prisma distribution.
2. **Complete:** `npm ci` ran from `package-lock.json` without suppressing install errors.
3. **Complete:** `Prisma validate` and `Prisma generate` passed.
4. **Complete:** the new `Verify generated Prisma client` step checked the generated entrypoint and loaded `PrismaClient`; generated artifacts were not committed.
5. **Complete with scope:** CI passed typecheck, lint, blocking Vitest and production build on the exact candidate. The default test job had no disposable `DATABASE_URL`, so DB integration remains pending.
6. Install/run Playwright browsers in the approved test environment and capture results.

### Phase B — database compatibility

1. Create a verified backup of a disposable/staging database, never production first.
2. Run `npx prisma migrate status` and inspect schema/duplicate payroll rows.
3. Test the payroll migration on a copy.
4. Verify rollback/forward-fix behavior and data counts.
5. Obtain explicit approval before any production migration; keep deployment default `SKIP_MIGRATIONS=true`.

### Phase C — security and application regression

Run direct API tests for anonymous/invalid sessions, portal type and roles, suspended users, ownership, file access, rate limiting, public leads, webhook signatures, payroll permissions, maker-checker, duplicate runs and partial transaction failure. Keep sensitive-handler authorization even if proxy checks pass.

### Phase D — GitHub synchronization and PR

1. Confirm the latest validated audit tip `7fda9cdcc1b65d628e9fae6de9f4443b1d3c9ce7` was the remote branch tip before this documentation refresh; current local/remote comparison is `0 0` after the refresh is pushed.
2. Wait for GitHub Actions checks on PR #18; do not merge while any required check is missing/failed.
3. Review changed files and generated-artifact status.
4. Obtain explicit merge approval; do not merge in this recovery task.

### Phase E — controlled deployment approval gate

Before any deployment, produce a separate approval record containing target SHA, CI results, build artifact, verified server fingerprint, backup ID, migration decision, expected downtime and rollback SHA. This task has not received deployment approval, so deployment remains stopped.

### Phase F — live verification

With authorized access only: verify server OS/runtime, `/root/alo-github-main`, PM2 process, port 3044, local/public health, HTTPS, DB connectivity, logs, key public pages, login/role behavior, lead submission and non-destructive portal workflows. Mark unavailable evidence `NOT VERIFIED`.

## 6. Approval gates and stop conditions

Deployment and migration must stop if any of the following occurs:

- Prisma engine/client generation is blocked.
- Typecheck, required tests, lint or build fails.
- Candidate SHA differs between tested and deployed code.
- SSH host fingerprint is missing/mismatched/untrusted.
- Backup is missing or not verified.
- Production schema/data state is unknown for a migration.
- Required credentials or authorized test accounts are unavailable.
- Health checks or smoke tests fail.
- Rollback target is not a known-good verified release.

**Current decision: NOT READY / NOT VERIFIED for production deployment.** Trusted CI has resolved the Prisma/toolchain validation blocker on the exact candidate, and local lint/typecheck/unit tests now pass after `npm ci`; fresh local Prisma engine operations and the build remain network-blocked. Disposable-DB integration, browser/E2E, live/provider, server, backup/restore, migration compatibility and rollback checks remain unverified. The next approval gate is required PR review/approval; merge and deployment remain prohibited without explicit approval.
