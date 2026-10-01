> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education production recovery final report

**Report date:** 2026-09-28
**Branch:** `arena/01a0c218-alo-education-z-ai`
**Validated implementation/workflow candidate:** `89442efb84b1a9624b7367c3501a588e0fadef4a`
**Latest validated branch tip:** `9a8da6c83a44234f2338fa969c788686e4e66b82` (documentation-only after the implementation candidate)
**Base:** `origin/main` `992e99636e281d6aca600919d7f9c71fe9ce75d7`
**PR:** [#18](https://github.com/engralaminn-collab/alo_education_z....ai/pull/18), open, targeting `main`
**Decision:** **NOT READY for merge or production deployment**

The implementation/workflow candidate was validated by CI run `36419251748`; the subsequent recovery-plan and final-report commits changed documentation only. The current exact branch tip was also checked by CI run `36424601811`. No merge, production deployment, migration, live database mutation, VPS change, DNS/SSL/firewall change, or PM2 restart was performed.

## 1. Executive result

| Gate | Status | Evidence / limitation |
|---|---|---|
| Published branch synchronization | **PASS** | Fast-forward pushes only; local and remote branch were compared at `0 0`; no force-push, reset, discarded work, or history rewrite |
| Candidate CI | **PASS** | Implementation candidate run `36419251748`, job `108917730224`, exact head `89442efb`; all workflow steps succeeded. Current exact branch-tip run `36424601811`, job `108935362514`, also succeeded |
| Prisma official engine access | **PASS IN TRUSTED CI / BLOCKED LOCALLY** | Official engine download, validation, generation and generated-client verification passed in GitHub Actions; the sandbox TLS path still fails |
| Lint | **PASS** | Local `npm run lint` passed on the repaired candidate; CI `Lint` step passed |
| Typecheck | **PASS** | CI `Typecheck` passed; local `npm run typecheck` also passed after reproducible `npm ci` installed the generated client package files |
| Unit/security test suite | **PASS** | Local `npm test`: 28 files passed, 1 skipped; 275 tests passed, 7 skipped. CI blocking test step also passed |
| Disposable-DB integration tests | **PARTIAL / NOT VERIFIED** | Local and CI runs safely skipped the 7 consultation tests because no disposable `DATABASE_URL` was supplied; no real MySQL integration run occurred |
| Production build | **PASS IN CI / BLOCKED LOCALLY** | CI build passed with standalone artifact check; local build remains blocked at official Prisma engine download |
| Workflow syntax | **PASS** | `js-yaml` parsed `.github/workflows/ci.yml` and `.github/workflows/deploy-production.yml`; the migration-backup heredoc parser defect was repaired |
| Browser/E2E | **NOT VERIFIED** | Playwright browsers and an executable application environment were not available |
| Live/provider/server/database validation | **NOT VERIFIED** | No authorized live or disposable staging environment was available |
| Merge | **NOT PERFORMED** | PR has no approval decision; explicit approval is still required |
| Deployment/migration | **NOT PERFORMED** | Production-safety stop remains active |

There are no current exact-candidate CI failures. Historical failed/cancelled runs remain preserved as evidence and are not relabeled as current success.

## 2. Exact commands and results

### Repository and synchronization

| Command / action | Result |
|---|---|
| `git fetch origin --prune` plus explicit branch ref refresh | **PASS**; stale local tracking metadata was refreshed without changing published history |
| `git ls-remote origin refs/heads/arena/01a0c218-alo-education-z-ai` | **PASS**; remote tip matched the pushed candidate |
| `git rev-list --left-right --count HEAD...origin/arena/01a0c218-alo-education-z-ai` | **PASS**; `0 0` after the final push |
| `git diff --name-only --diff-filter=U` | **PASS**; no unresolved merge paths |
| Exact conflict-marker scan over source, workflows, Prisma and tests | **PASS**; no unresolved markers |
| `gh pr view 18` | **PASS / OPEN**; target `main`, merge state `CLEAN`, review decision empty, required CI check successful |

The branch remains ahead of `origin/main` and is not merged. The recovery plan is maintained at `AUDIT/production-recovery-plan.md`.

### Prisma diagnosis and safe resolution

Local diagnosis was performed without weakening TLS:

- `npx prisma --version` with Prisma and `@prisma/client` `6.19.3` failed at the official `https://binaries.prisma.sh/.../schema-engine.sha256` request with `Client network socket disconnected before secure TLS connection was established`.
- Direct `curl` resolved `binaries.prisma.sh`, connected to TCP 443, then failed during TLS with OpenSSL `SSL_ERROR_SYSCALL`.
- `NODE_TLS_REJECT_UNAUTHORIZED` was unset and `PRISMA_ENGINES_MIRROR` was unset.
- No TLS bypass, certificate suppression, version change, untrusted mirror, or downloaded binary was used.

Safe resolution and evidence:

1. The exact branch candidate was sent to the GitHub Actions PR runner, which has trusted network access to the official Prisma distribution.
2. `Prisma validate` passed.
3. `Prisma generate` passed.
4. The added `Verify generated Prisma client` gate checked `node_modules/.prisma/client/default.js` and loaded `PrismaClient` from `@prisma/client`.
5. Typecheck and production build then passed on the same checkout.

The local sandbox path remains **BLOCKED**, but the candidate validation blocker is **RESOLVED IN TRUSTED CI**. The generated client is not committed; it is produced and verified by the runner.

### Trusted CI runs

Primary implementation/workflow validation:

- Workflow: `CI — Pull Request Validation`
- Run: [36419251748](https://github.com/engralaminn-collab/alo_education_z....ai/actions/runs/36419251748)
- Job: `Lint · Typecheck · Tests · Prisma · Build`
- Job ID: `108917730224`
- Checked-out SHA: `89442efb84b1a9624b7367c3501a588e0fadef4a`
- Duration: `11m53s`
- Conclusion: `success`
- Steps passed: checkout, Node setup, lockfile install, tracked-file secret scan, Prisma validate, Prisma generate, generated-client verification, lint, swap provisioning, typecheck, tests, production build, standalone artifact validation and summary.

The current exact branch tip was independently checked by [run 36424601811](https://github.com/engralaminn-collab/alo_education_z....ai/actions/runs/36424601811), job `108935362514`, exact head `9a8da6c83a44234f2338fa969c788686e4e66b82`, with conclusion `success` after approximately 12m44s. The post-implementation commits changed audit documents only; they did not change application or workflow implementation.

The test job is intentionally scoped safely: no `DATABASE_URL` is present, so DB-backed integration files self-skip with an explicit reason. The deterministic `visa-security-negative.test.ts` security regression file is not a real database or live API test and must not be represented as one.

### Local/static commands

| Command | Result |
|---|---|
| `npm ci` | **PASS**; 1,175 packages installed from the lockfile; npm reported 3 high vulnerabilities |
| `npx --no-install prisma --version` | **BLOCKED**; Prisma 6.19.3 was confirmed, but the official engine checksum request failed during TLS |
| `npx --no-install prisma validate` / `generate` / `format --check` | **BLOCKED** by the same official engine TLS/network failure |
| Generated client entrypoint/loadability after `npm ci` | **PASS**; `node_modules/.prisma/client/default.js` present and `PrismaClient` export loadable; this does not replace a successful fresh `prisma generate` |
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** locally and in CI after `npm ci` supplied the generated client files |
| `npm test` | **PASS / PARTIAL** locally: 28 files and 275 tests passed; 1 file and 7 tests skipped for missing disposable DB. CI also passed with the same safe scope |
| `npm run test:integration` | **PASS / PARTIAL**: 1 file and 22 tests passed; consultation file skipped with 7 tests because no `DATABASE_URL` was supplied |
| `npm run build` | **BLOCKED LOCALLY** at mandatory Prisma generation; **PASS IN CI** with `.next/standalone/server.js` check |
| `bash -n scripts/*.sh deploy/ubuntu/*.sh` | **PASS** |
| `js-yaml` parse of all four workflow files | **PASS** |
| `npm audit --omit=dev --audit-level=high` | **FAIL / REVIEW REQUIRED** with 3 high Prisma CLI-chain advisories; no forced upgrade was applied |

## 3. Application-surface validation matrix

This matrix deliberately separates source/static/unit evidence from runtime or provider evidence. “Implemented” is not treated as “live verified.”

| Surface / acceptance area | Status | Evidence and remaining boundary |
|---|---|---|
| Public website and public route inventory | **PARTIAL** | Source and route inventory were reviewed; CI lint/typecheck/build passed. Public HTTPS, caching, forms, SEO, responsive behavior and production data were not browser-tested |
| Public leads / consultation | **PARTIAL** | Lead routes and source were reviewed; unit/security coverage ran. The real lead workflow in `tests/integration/consultation-workflow.test.ts` requires a disposable MySQL database and was skipped in CI |
| Portal identity, portal type and role mapping | **PARTIAL** | Cookie/session changes and RBAC code were reviewed; deterministic security tests passed. Direct API login/session/role tests with real records were not run |
| Authentication and session cookies | **PARTIAL** | Portal/student login responses use HttpOnly cookies and preserve legacy bearer compatibility in code. Invalid credentials, suspended/pending users, revocation, expiry, cookie attributes and multi-instance behavior were not exercised against a DB/browser |
| Proxy and handler-level RBAC | **PARTIAL** | Proxy maps and sensitive handler checks were reviewed; unit security coverage passed. Direct requests bypassing the proxy for every sensitive route were not run in a live server |
| Ownership and cross-record/file access | **PARTIAL** | Ownership/security source and negative tests were reviewed. Cross-user API calls, signed-file access, direct private URLs, expiry and download audit trails were not runtime-verified |
| Payroll | **PARTIAL** | Payroll controls, transactional writes, approval/payment distinction, duplicate-period constraints and maker-checker code were reviewed; relevant unit tests ran in CI. MySQL schema compatibility, duplicate/race behavior, real transaction rollback and authorization with persisted data remain unverified |
| Pagination | **NOT VERIFIED** | Source contains many `skip`/`take` and list handlers, but the required controls, URL state, counts, page sizes, filters/search/sort combinations, refresh/back-forward/direct navigation, zero/one/boundary results and mutation behavior were not comprehensively browser/API tested |
| File storage and uploads | **PARTIAL** | Storage routes and security expectations were reviewed; no live upload, signed download, ownership, retention or data-preservation test was run |
| Webhooks and public integration endpoints | **NOT VERIFIED** | Source and signature/idempotency patterns were reviewed. Provider delivery, replay, retry, signature, rate-limit and live secret behavior were not exercised |
| WhatsApp, 3CX, SMTP/SMS and other providers | **NOT VERIFIED** | Provider adapters and route guards exist, but no provider authorization, health check, send/receive, retry or failure-mode test account was available |
| AI gateway, tool loop and agent approvals | **PARTIAL** | Local unit coverage and source review cover the tool-loop/approval design; external model/provider credentials, quotas, side effects, final-iteration behavior in a live provider and audit persistence were not verified |
| Marketing/social/calendar/content workflows | **PARTIAL** | Source routes and supplied product references were reviewed; provider connection, publishing, analytics, collaboration and real media behavior were not verified |
| Browser/E2E, responsive and accessibility behavior | **NOT VERIFIED** | Playwright execution, role-based browser matrix, uploads/downloads, pagination, forms, keyboard/focus and responsive layouts were not run |
| Deployment workflows and scripts | **PASS FOR STATIC SAFETY / NOT VERIFIED LIVE** | YAML parses; exact-SHA, pinned host fingerprint, required SSH port, backup, migration opt-in, health-check and rollback controls were reviewed. GitHub secrets, SSH identity, VPS and PM2 were not exercised |
| Migration safety | **NOT VERIFIED** | Prisma schema/migration were reviewed only. No staging schema inspection, duplicate preflight, `migrate status`, migration-on-copy or forward-fix/restore rehearsal occurred |
| Backup and restore | **NOT VERIFIED** | Workflow/script backup paths were reviewed. No backup was created, integrity-checked, restored or timed in an authorized environment |
| Rollback | **PARTIAL** | Exact-SHA rollback script and data-preservation behavior were source-reviewed and build-gated. No disposable/staging rollback rehearsal or live health recovery occurred |
| Production health and observability | **NOT VERIFIED** | `scripts/health-check.sh` requires local DB-connected health and optional public health; no server, PM2, port 3044, HTTPS, logs or alerting check was performed |

## 4. Security, payroll and regression scope

The current CI result is a meaningful repository gate, not a substitute for an authorized environment. The following are explicitly **not verified**:

- Direct API authentication tests for invalid credentials, suspended users, portal mismatch, session revocation, cookie behavior and brute-force expiry/reset.
- Direct handler-level RBAC and ownership tests when proxy middleware is bypassed.
- Cross-student/cross-employee/file ownership tests against persisted records.
- Payroll duplicate-period, maker-checker separation, approval/payment state, race and partial-transaction tests against MySQL.
- Lead creation/update/deduplication and persistence across reconnects against MySQL.
- Webhook signature, replay/idempotency, retry and provider-delivery tests.
- Pagination combinations and navigation behavior listed in the acceptance criteria.
- Browser, accessibility, mobile and upload/download matrices.

The in-memory portal/student rate limiters remain a **CONFIRMED LIMITATION** for multi-instance brute-force protection. A shared limiter is required before claiming cluster-wide protection.

## 5. Issue resolution register

The authoritative detailed issue register remains `AUDIT/production-recovery-plan.md`. Current outcomes are summarized here; no issue is silently dropped.

| ID | Severity | Area | Final status | Resolution / remaining action |
|---|---|---|---|---|
| `REC-001` | Critical | Prisma/toolchain | **PARTIAL: CI RESOLVED / LOCAL BLOCKED** | Official Prisma 6.19.3 engine access, validation, generation and generated-client load passed in trusted CI; local TLS path remains blocked |
| `REC-002` | Critical | Build gate | **PASS IN CI / LOCAL BLOCKED** | Exact-candidate build and standalone artifact passed in CI; no production artifact was deployed |
| `REC-003` | Critical | Type safety | **PASS IN CI AND LOCAL TYPECHECK / GENERATION BLOCKED LOCALLY** | Generated client was verified in CI and loadable after `npm ci`; local `npm run typecheck` passed, but fresh `prisma generate` remains blocked by engine download |
| `REC-004` | Critical | Database/migrations | **NOT VERIFIED** | Requires disposable/staging schema inspection, duplicate preflight, migration-on-copy and explicit approval; no migration ran |
| `REC-005` | Critical | Production access/deployment | **NOT VERIFIED** | No authorized VPS/database/test-account access; live claims are prohibited |
| `REC-006` | High | Full test suite | **PARTIAL** | Local run passed 28 files/275 tests and skipped 1 file/7 tests; DB-backed consultation integration needs disposable MySQL. CI gate also passed with the same scope |
| `REC-007` | High | CI validation / counselor routes | **PASS** | Route repair passes local lint and trusted CI; historical malformed-route failure remains preserved as history |
| `REC-008` | High | Payroll | **PARTIAL** | Code and CI unit coverage passed; persisted schema, race, transaction and real authorization behavior remain pending |
| `REC-009` | High | Authentication/session security | **PARTIAL** | Cookie/session code and static/security coverage passed; direct persisted API/browser matrix remains pending |
| `REC-010` | High | Deployment workflow | **PARTIAL** | Static YAML/workflow safety verified; GitHub secret values, server fingerprint evidence and live deployment remain unverified |
| `REC-011` | High | Rollback | **PARTIAL** | Exact-SHA/data-preserving script reviewed; no staging/live rehearsal |
| `REC-012` | Medium | In-memory rate limiting | **PARTIAL / LIMITATION** | Single-process limiter exists; shared multi-instance limiter and runtime tests remain required |
| `REC-013` | Medium | Schema drift | **NOT VERIFIED** | Requires actual target schema and disposable migration test |
| `REC-014` | Medium | Browser/E2E | **NOT VERIFIED** | Playwright/browser matrix was not run |
| `REC-015` | Medium | Webhooks/integrations | **NOT VERIFIED** | Provider fixtures and authorized test accounts were unavailable |
| `REC-016` | Medium | Dependency audit | **PARTIAL / REVIEW REQUIRED** | Historical audit found 3 high transitive Prisma-chain advisories; upgrade/remediation was not applied without testing |
| `REC-017` | Low | Documentation | **PASS AS HISTORICAL CONTROL** | Historical audits were preserved; this plan/report identify current evidence |
| `REC-018` | Low | Prisma configuration | **PARTIAL / NON-BLOCKING** | Prisma 7 configuration warning remains; separate upgrade task required |
| `REC-019` | High | Deployment workflow parser | **PASS** | Migration-backup heredoc indentation was repaired in `89442efb`; both workflow files now parse; no live action occurred |

## 6. Deployment, migration and rollback status

**Deployment status: NOT PERFORMED.**

**Migration status: NOT PERFORMED.**

**Live database mutation: NONE.**

The following production controls remain required and were not bypassed:

- Deploy only an exact, previously validated 40-character commit SHA.
- Keep SSH host verification enabled and preserve the known ED25519 fingerprint `SHA256:K0041d6kUdse+U6+vHijY73qb1ur/GsedNae8g8a+tU` unless fresh trusted evidence proves a change.
- Require the configured SSH port; do not fall back silently to port 22.
- Preserve `.env`, `storage`, `uploads` and `public/uploads`; never use `git clean -fdx` as a deployment shortcut.
- Keep migrations disabled by default. An explicit migration opt-in requires a verified logical database backup, schema/duplicate review and approval.
- Require health checks after deployment and use a known-good exact SHA for rollback.
- Never claim backup, restore, PM2, port 3044, public HTTPS, database connectivity or rollback success without direct evidence.

## 7. Required next actions and approval gates

1. Obtain an approved disposable MySQL/MariaDB environment and a verified backup of that disposable database.
2. Run Prisma migration status, inspect schema and payroll duplicates, apply the migration on a copy, test forward-fix/restore behavior, and run `DATABASE_URL=<disposable-db> npm test` plus `npm run test:integration`. Do not use production credentials.
3. Run the required direct API authentication/RBAC/ownership/file-access/payroll/pagination matrix against that disposable environment; keep authorization checks in handlers.
4. Install approved Playwright browsers and run anonymous, role-based, ownership, pagination, upload/download, responsive and accessibility cases.
5. Exercise provider/webhook fixtures with test accounts, signatures, retries and idempotency; classify any unavailable provider as `NOT VERIFIED`.
6. Review the exact candidate and required PR check. Obtain explicit review/merge approval. This task must not merge PR #18.
7. If a separately approved deployment is later requested, record target SHA, CI run, artifact, server fingerprint, backup ID, migration decision, expected downtime and rollback SHA before starting. The default must remain `SKIP_MIGRATIONS=true`.
8. After any authorized staging/live action, record server identity, deployed SHA, PM2 status, local/public health, database status, logs and rollback evidence. Without that evidence, production readiness remains **NOT READY**.

**Final conclusion:** repository recovery, synchronization, Prisma trusted-runner validation, generated-client verification, lint, local/CI typecheck, local/CI unit/security gates, CI build gate and workflow-syntax repair are complete. The release is still **NOT READY** because database-backed integration, browser/E2E, provider, live server, backup/restore, migration compatibility and rollback evidence are unavailable, and no explicit merge or deployment approval exists.
