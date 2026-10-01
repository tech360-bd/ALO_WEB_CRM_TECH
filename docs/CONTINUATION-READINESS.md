# Production blocker continuation — 2026-10-01

**BLOCKED: this is a tested partial repair, not completion of every repository blocker.** No deploy, merge, production data change, production migration, secret assumption or hosting configuration fabrication.

## Git / CI

Started clean at 4ecdd245 on arena/01a0f2b5-alo-education-z-ai, PR #19. Verified actual run 36773968351 completed SUCCESS: npm ci, secret scan, Prisma validate/generate/client verification, lint, typecheck, tests, integration command, standalone production build. It verifies the starting checkpoint, not later modifications. Current repair commit must pass its own CI; consult PR #19 for exact SHA and run.

## Repairs and boundaries

| Problem | Files | Fix / verification | Status |
|---|---|---|---|
| Migration chain dependencies | MIGRATION_DEPENDENCIES.json, MIGRATION_RECONCILIATION.md, scripts/preflight/database-readonly.sql | Chronological inventory; both HR models traced; no historical SQL edited | BLOCKED: applied history unknown, canonical baseline/forward reconciliation cannot be selected safely |
| Payroll uniqueness | MIGRATION_RECONCILIATION.md | Aggregate vs individual rows distinguished; SELECT-only duplicate/index preflight and reviewed mapping plan | PRODUCTION DATA VERIFICATION REQUIRED; no automatic survivor selection |
| Required audit writes outside transactions | transactional-audit.ts; employee create/resend; payroll APIs; central-security-engine.ts | Named mutations and audit writes now share transaction; strict writers propagate failure only in transaction | Fixed for named paths; other callers remain unresolved (AUDIT_ATOMICITY.md) |
| Payload capacity | schema.prisma + scripts/preflight/candidates | Explicit LongText target and non-automatic widening SQL candidate; no truncation in strict writers | Database reconciliation required; schema target is not proof migration has been applied |
| Legacy approval race/authorization | agentos/approval-transition.ts and approvals route | SUPER_ADMIN only, no acting-as, atomic conditional pending update + audit; HTTP 409 on second decision | Regression tests passed, including competing decisions and audit rollback using transaction double; real DB concurrency unverified |
| Payroll list IDOR | api/hrm/payroll | Own-employee check now applies to list and slip with explicit employeeId | Three scope tests passed |
| Stub/unsafe worker execution | cron-definitions.ts, worker.ts | All 15 unverified jobs disabled; worker honors flag | Quarantined, not implemented or production-ready |
| Fabricated university scan | api/cron/weekly-university-scan | Authenticated 503 DISABLED, no evidence or data writes | Fabrication removed; real scanner still missing |
| Dependency HIGH chain | package.json/lock, ci.yml | Scoped deepmerge-ts 8.0.0 override under Prisma config, reviewed API risk, config compatibility tests; blocking audit CI step | npm audit 0 vulnerabilities |
| Known fixture passwords | scripts/seed-{portal-admin,all-portal-users}.ts | Removed defaults; explicit credentials and NODE_ENV=test required | Never run as production seed; broader historical fixture inventory is not certified clean |
| SMTP | Existing email-service.ts and tests preserved | TLS/auth transport + explicit failure unchanged; 11 email tests now include audit failure preventing send | No live delivery claimed |

## Local test gate

- npm ci: PASS after override.
- npm audit: PASS, zero vulnerabilities.
- npm run lint: PASS, 23 existing warnings.
- npm test: 376 passed, 7 skipped (46 files). Real DB-dependent skips remain unverified.
- npm run test:integration: 22 passed, 7 skipped.
- Prisma validate/generate/migrate status: attempted again, TLS engine download failure before schema/DB status.
- Full typecheck: stops at missing Prisma metadata. Build: stops at same engine download. Neither is a local pass.
- npm run start: actual process exit 1, missing .next/standalone/server.js. **LOCAL START BLOCKED BY BUILD ARTIFACT**.
- Prior checkpoint CI proves generation/build on networked runner, not cPanel. New CI must establish same for repair commit.

Local platform remains Debian12 x64 / debian-openssl-3.0.x, Node22.22.3 / npm10.9.8 / Prisma6.19.3. Exact TLS URL and error retained in REPOSITORY-BLOCKERS-2026-10-01.md. No targets changed.

## Remaining repository / business blockers (NOT external credentials)

- Migration chain still cannot run from empty DB; no speculative rewriting of historical meaning. Requires applied-history evidence to finish repository repair.
- Legacy logAuditAction/logHrmAudit/default logSecurityAudit callers remain non-atomic; broad per-call-site completion has not occurred. See inventory; do not call all audit storage safe.
- Finance: overlapping payroll representations, commission transition graph, journal linkage, settlement evidence, refunds/reversals and retention policy need explicit decisions and implementation; see FINANCIAL_LIFECYCLE_AUDIT.md. Paid flags do not mean funds moved.
- Scheduler: disabled jobs still need real implementations, durable locking, idempotency, bounded execution and persisted failure handling. Existing separate HTTP jobs are not approved for production scheduling.
- Other AgentOS/runtime simulation and legacy fixture/security surfaces remain outside these focused repairs. No universal "no fake AI" or "all routes secure" claim.
- Authentication tests include source assertions and mocked storage; live login/logout, HttpOnly sessions, RBAC/SUPER_ADMIN, TOTP/CSRF and cross-portal DB behavior are not certified.

## Genuine external requirements

Hosting platform: cPanel, as supplied by user; Node version, Passenger/Node Selector support, app root, application URL, startup/restart contract, writable persistent storage, env mechanism, outbound HTTPS/SMTP, database access and cron limits **NOT VERIFIED**. No server wrapper/.htaccess/.cpanel.yml or paths invented. Repository start contract is Next standalone server.js; compatibility with actual Passenger remains unknown.

Database: MySQL provider; actual engine version/SSL, host/name/user and secure password, schema/history, backup timestamp and restore capability required. Production connection unverified. Keep SKIP_MIGRATIONS=true until backup verified, plan reviewed and applied history known. No reset or accept-data-loss operation.

SMTP: secure provider host/port/from/user/password and controlled recipient verification required. TLS required, authentication implemented; no live provider response or inbox delivery verified. Preserve mail DNS.

Production environment variable values belong in hosting secure configuration, not Git/chat. GitHub secrets availability is not assumed. Requested and actual variable names reconciled in PRODUCTION_ENVIRONMENT_MATRIX.md.

## Delivery

Working branch only; main unchanged, PR #19 remains draft. No production merge authorized. Test/CI success does not clear the explicit repository blockers above.
