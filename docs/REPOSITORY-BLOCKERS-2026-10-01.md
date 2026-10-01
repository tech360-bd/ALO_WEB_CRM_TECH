# Repository blocker checkpoint — 2026-10-01

**BLOCKED — the 21-point elimination request is not complete.** This checkpoint preserves tested email repairs and records hard blockers without deploying, changing production data, rewriting historical migrations or inventing hosting configuration.

## Changes in this checkpoint

- Replaced fabricated SMTP/log-fallback success with actual SMTP submission using patched Nodemailer 10.0.13 (`smtp-mailer` npm alias). Alias deliberately separates the application transport from NextAuth's optional v7 peer. Uses standard createTransport/sendMail/close APIs; Node >=20 required by dependency, repository already requires >=22. Types use DefinitelyTyped 8.0.2; isolated email TypeScript check passed.
- Required SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM; validated SMTP_PORT; TLS required, certificate validation not disabled; 10-second connection/greeting and 30-second socket timeouts; remote/file content access disabled.
- Transport errors become explicit unsuccessful results without returning provider secrets. Only a successful accepted submission with a transport-returned Message-ID succeeds. Message-ID is the transport's message identifier, **not** proof of inbox delivery or necessarily a provider queue ID. No fallback IDs.
- Employee creation distinguishes saved account from failed activation email, so clients must use resend rather than recreate. Resend returns 502 on failed submission. Password reset returns non-enumerating conditional wording, not a false assertion of delivery; provider failure is handled internally without revealing account existence. A successful public reset response means request handled, not mail delivered.
- Added service and response-semantic tests, updated example env files (no secrets), added migration and cron reconciliation reports.

## Test gate for this working patch

| Check | Result |
|---|---|
| npm ci | PASS |
| npm run lint | PASS; 23 existing warnings |
| npm test | 357 passed / 7 skipped (40 files); DB-dependent tests skipped, not passed |
| npm run test:integration | 22 passed / 7 skipped; no live DB proof |
| Email tests | 10 new tests passed. Mocked transport acceptance, rejected/missing IDs, missing config, bad port, provider/transport exception; resend success/failure; reset non-enumeration. No real SMTP credentials used |
| npm audit | FAIL: 3 high, 0 critical |
| prisma validate / generate | FAIL before schema/client verification: outbound engine TLS failure |
| generated client load / typecheck | FAIL: generated Prisma model metadata missing |
| npm run build | FAIL during engine download |
| standalone verification | FAIL: server artifact absent locally |
| npm run start | Actual process attempted, exit 1 MODULE_NOT_FOUND .next/standalone/server.js; no listener |
| prisma migrate status | FAIL at engine TLS download; production history unknown |
| DB/auth initialization and portal runtime | NOT VERIFIED; no running production server or verified DB |

Prior GitHub CI run 36770007622 passed Prisma generation/client verification/typecheck/build for checkpoint 616b007b. That is historical evidence isolating the sandbox restriction, **not verification of this new commit**. See PR #19 for current-commit CI.

## Prisma diagnosis

Prisma / @prisma/client 6.19.3; Node 22.22.3; npm 10.9.8; Debian 12, x64, OpenSSL 3.0.20. Platform detection selects debian-openssl-3.0.x. Schema binaryTargets: native, debian-openssl-1.1.x, rhel-openssl-3.0.x, debian-openssl-3.0.x, linux-musl-openssl-3.0.x. No wrong-target evidence; no Prisma version/target changes made.

Exact failure URL: `https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine.gz.sha256`.

Node error: `Client network socket disconnected before secure TLS connection was established`; independent curl: `SSL_ERROR_SYSCALL`. npm registry succeeds from same sandbox. Cause is external sandbox outbound TLS restriction, not a proven Prisma schema defect. Whether cPanel has the same restriction is NOT VERIFIED: host must confirm target platform and outbound engine access, or accept correctly generated build artifacts. No fake generated client or bypass was used.

## Dependency findings

| Package | Severity / affected range | Fix evidence | Action / risk |
|---|---|---|---|
| deepmerge-ts (installed 7.1.5 under Prisma config) | HIGH, <8.0.0; GHSA-ggr8-5vv4-36mx, recursive graph stack exhaustion | Fixed range >=8.0.0 | No forced major override without upstream/API regression validation |
| @prisma/config 6.19.3 | HIGH transitive; audit range 6.13.0-dev.1–8.1.0-dev.4 | npm suggests prisma 6.12.0 | Downgrade/compatibility risk; not applied |
| prisma 6.19.3 | HIGH transitive; same reported range | npm suggests 6.12.0, isSemVerMajor true | No version churn; remains release blocker |

Nodemailer 7.0.13 was briefly evaluated and removed after audit found HIGH advisories. Final lock pins patched alias 10.0.13; current audit reports no Nodemailer finding. Next.js remains 16.3.6 from the preceding repair. No npm audit fix --force or advisory suppression.

## Unresolved repository-side blockers

1. **Migrations — BLOCKED:** first migration alters EmployeeHR before initialization; payroll uniqueness can fail on empty backfilled keys. See MIGRATION-SAFETY-REPORT.md for ordering, FK cascades, destructive seed inventory and reconciliation requirements. Do not silently reorder or baseline historical production migrations.
2. **Audit durability — BLOCKED:** PortalAuditLog is DB-backed (survives application restarts if its DB is persistent), but logAuditAction catches storage failure, records empty IP/userAgent and is frequently called after a business transaction commits. CrmAuditLog, PortalAuditLog and AuditLog payloads lack explicit text sizing, making MySQL VARCHAR(191) payload capacity a risk for real metadata/journal lines. AgentAuditLog provides another persistence path. Global throw-only change was not applied: business transactions and audit writes need atomic per-caller repair with failure tests, approved forward schema changes, request-context propagation and DB restart verification. Console output is not an audit substitute.
3. **Accounting — BLOCKED:** legacy double-entry-ledger persists journals in CrmAuditLog, not a dedicated journal table. It validates integer cents and balanced lines and uses deterministic PKs for new-post idempotency; this does not prove historical deduplication or atomicity with Payment/Commission writes. Payment/Commission use Float; refund/reversal, currency, period and allocation reconciliation remain incomplete. No financial data or speculative ledger rewrite performed.
4. **Cron — BLOCKED:** 15 worker declarations do not resolve to actual HTTP route files; broken lock fallback, scheduling cadence and console-only jobs persist. Existing weekly-university-scan creates simulated evidence. See CRON-RECONCILIATION.md and CRON-JOBS.md. These are not solved by supplying a cron secret. Do not enable worker or simulated scan.
5. **Approval race — BLOCKED:** legacy agent-service processApproval uses plain update; safe conditional transactional route elsewhere does not fix this method. Needs call-path validation and concurrent-decision tests.
6. **Dependency highs — BLOCKED:** safe upstream-compatible Prisma transitive remediation remains unresolved.

## Security and portal verification scope

Current test suite includes auth-session-hardening, api-authz-regression, cron-auth-regression, finance-authz-regression, proxy-security, ucc-webhook-security and workforce-route-security. Some are static source assertions, others run real middleware with mocked DB/session; none certify production login/logout, session persistence, CSRF, TOTP, lockout or SUPER_ADMIN against the actual DB. Email consumer tests intentionally isolate response semantics; their mocked auth is test-only and not authorization evidence.

Admin (`/admin`, `/api/admin`), student (`/api/student/auth`, `/api/student-portal`), CRM (`/api/crm`), staff/employee (`/api/employee`, `/api/employees`), counselor (`/api/counselor`), partner (`/api/partner-portal`, `/api/partner`) and public routes remain NOT VERIFIED end-to-end. Existing audit inventory is preserved; this checkpoint does not claim every portal or all 820 API routes were exhaustively tested. Positive/negative live DB role-matrix, upload/private-document access, financial persistence and webhook tests remain required. No universal “security clean” claim is made.

## External handoff, separate from code defects

- **WAITING FOR CPANEL:** provider; app/repository/persistent-storage paths; domain/HTTPS mapping; Node application support/version; startup contract and Passenger behavior; restart/deploy mechanism; artifact handling; cron timezone/executable/timeouts; writable private storage; outbound SMTP/Prisma access. No .cpanel.yml with invented paths. No VPS/SSH/PM2 production transport.
- **WAITING FOR DATABASE:** secure connection, expected schema/history and MySQL version, backup+restore verification, staging database, reconciliation authorization and initial-admin provisioning. No production migration/seed run; SKIP_MIGRATIONS remains true.
- **WAITING FOR EXTERNAL CREDENTIAL:** SMTP provider/sender and secrets; auth/encryption/signing secrets; enabled third-party integration credentials. GitHub secret listing previously returned 403; existence is not assumed. Use secure hosting/CI settings, never chat or Git.
- Names only for core configuration: DATABASE_URL, APP_URL, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, NEXTAUTH_SECRET, AUTH_SECRET, JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY, FILE_SIGN_SECRET, SMTP_HOST, SMTP_PORT, SMTP_FROM, SMTP_USER, SMTP_PASSWORD, ALO_CRON_SECRET, CRON_SECRET. Full inventory: PRODUCTION_ENVIRONMENT_MATRIX.md. Initial provisioning only: SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD.

## Delivery

Repository: engralaminn-collab/alo_education_z....ai. Session branch: arena/01a0f2b5-alo-education-z-ai. Draft PR #19. Commit message requested: Resolve production readiness blockers. The commit title does not imply all blockers are resolved. No force push, no main update, no deployment or production-data operation.

BLOCKED
