# Production Deployment Matrix

2026-10-01 — **BLOCKED**. Phases 0–6 evidence checkpoint, not completed production certification.

## Repository
| Item | Actual value | Status |
|---|---|---|
| Repository / owner | engralaminn-collab/alo_education_z....ai | GitHub verified |
| Default / production-trigger branch | main | Verified |
| Working branch | arena/01a0f2b5-alo-education-z-ai | Session-fixed |
| Original main baseline | df1961fd705e26e159d3a6c7b0aa5d7830f4d5ed | Historical baseline; see latest checkpoint and Git for branch HEAD |
| Framework | Next.js / React, standalone App Router | Source inspected |
| Runtime | Local Node 22.22.3, npm 10.9.8; engines Node >=22, npm >=10 | Hosting version NOT VERIFIED |
| Scope | 368 page.tsx files, 820 route.ts files | Counts, not functional certification |

## Build
Current command results are in the verification appendix. Next.js and eslint-config-next were updated to 16.3.6 to remove the newly observed critical advisory. Three high Prisma-chain advisories remain. No forced upgrade used.

## Database
MySQL, Prisma 6, 479 models, 11 migrations. Earliest HR migration alters a table created by the later initialization migration. Production migration status/connection NOT VERIFIED. No migrate deploy/reset/db push/seed executed. Engine download TLS failure blocks validate/generate. Backup restore and migration-order reconciliation are prerequisites to any production migration.

## Environment
See PRODUCTION_ENVIRONMENT_MATRIX.md for source references. GitHub secret/variable listing returns HTTP 403: Resource not accessible by integration. Hosting settings are unknown. NEXTAUTH_SECRET, DATABASE_URL, encryption/file-signing keys and selected provider configuration must be provisioned securely, not committed.

## Authentication
| Component | Location | Status |
|---|---|---|
| Login/session/password hashing | src/lib/auth.ts | NextAuth JWT, bcrypt, ACTIVE-user check; live NOT VERIFIED |
| Portal sessions | src/lib/auth-middleware.ts | Source exists; live NOT VERIFIED |
| Student sessions | src/lib/student-auth.ts | Separate session authority; live NOT VERIFIED |
| RBAC/admin | src/proxy.ts, src/lib/permissions.ts | Source exists; exhaustive resource review incomplete |
| Password reset | src/app/api/auth/reset-password/route.ts | Live NOT VERIFIED |

## External services
Groq/OpenRouter/Z.ai/local AI adapters exist (src/lib/ai.ts, ai-gateway.ts). No controlled live test performed. EXTERNAL PROVIDER CONFIGURATION REQUIRED: selected GROQ_API_KEY, OPENROUTER_API_KEY, ZAI_API_KEY or LOCAL_AI_URL/LOCAL_AI_MODEL, as applicable. Do not silently substitute providers.
Email, WhatsApp/Meta, SMS, OAuth/social, Nextcloud, Chatwoot, Ghost, research and video integrations have source references in the environment matrix. Credentials and real operation NOT VERIFIED. src/lib/email-service.ts currently fabricates successful message IDs without transport, even when SMTP variables are set: confirmed unresolved defect, not merely missing configuration.

## Deployment / domain
Hosting provider, supported Node runtime, cPanel application root, repository path, startup settings and deployment API/hook are NOT VERIFIED. The requested target remains cPanel managed Node, not a static copy. Production and recovery workflows now contain no historical remote transport. The production workflow runs reusable CI and then fails explicitly at the unconfigured cPanel deployment gate. This is a safety interlock, not working auto-deployment. No new .cpanel.yml or fictitious provider hook was invented.

HTTPS requests to /api/health, /, /destinations, /universities, /course-finder, /student/login, /partner/login, /employee/login all failed from this sandbox with `TLS/SSL connection has been closed (EOF)`. This is not proof of an application HTTP failure; no response was obtained. Authentication, portals, CRM and database-backed smoke tests remain NOT VERIFIED. DNS/email configuration was untouched.

## Security / history
Fetched complete main ancestry without switching branches. Heuristic scan examined 9,614 text-sized historical blobs. Current private-key candidate is placeholder prose, not a demonstrated live key. Historical database credential candidates exist in DEPLOYMENT.md and documentation/CPANEL-DEPLOYMENT-GUIDE.md; values withheld. Rotate affected database credentials unless rotation is already independently verified. This scan does not prove all Git history is clean. .env files are ignored; tracked environment files are examples. Main is unprotected and production environment has no protection rules according to GitHub API.

## Blockers
| Severity | File / area | Problem | Required next action | External dependency |
|---|---|---|---|---|
| Critical | Hosting | No verified cPanel mechanism/runtime | Confirm supported configuration before implementing deployment | Provider/account access |
| High | prisma/migrations | Ordering inconsistency | Backup/restore and ledger reconciliation | Production DB |
| High | Prisma CLI | Engine download TLS failure | Network-enabled runner | Network |
| High | deployment workflows | Transport removed; cPanel deployment not implemented | Implement only against confirmed provider contract | Confirmed cPanel contract |
| High | src/lib/email-service.ts | Fake send success | Integrate existing verified transport or fail honestly | Selected email provider |
| High | dependencies | 3 Prisma-chain advisories | Compatibility-reviewed remediation | Build validation |
| High | audit/ledger/cron | Earlier audit unresolved storage, ledger and worker defects | See ALO-EDUCATION-PRODUCTION-COMPLETION-REPORT.md | DB/runtime verification |

No production deployment, migration or provider send performed. A review-only checkpoint commit/push is recorded separately in GITHUB-DELIVERY.md if successful. Earlier report test totals are historical, not current verification. Work stops short of the hard production gates; repository remediation is incomplete.

## Current verification checkpoint

Commands executed after the dependency patch and deployment changes (2026-10-01):

| Command | Exit | Result |
|---|---:|---|
| npm ci | 0 | Lockfile install succeeded after patch |
| npm run lint | 0 | Final lint pass |
| npm run typecheck | 1 | Prisma metadata missing; generated client guard blocks |
| npm test | 0 | 347 passed, 7 skipped; 37 files passed / 1 skipped |
| npm run test:integration | 0 | 22 passed, 7 skipped (overlaps npm test) |
| npx prisma validate | 1 | Engine download TLS failure |
| npx prisma generate | 1 | Engine download TLS failure |
| npx prisma migrate status | 1 | Engine download TLS failure; production not connected |
| npm run build | 1 | Engine download TLS failure, before Next compilation |
| node scripts/verify-standalone.mjs | 1 | Missing standalone server; no successful artifact |
| npm run start | 1 | MODULE_NOT_FOUND: .next/standalone/server.js; process exited, no port |
| node scripts/production-smoke.mjs https://aloeducation.com | 1 | HTTPS network/TLS failure; no readiness verification |
| npm audit --json | 1 | 3 high, 0 critical after Next.js patch |
| git diff --check | 0 | Whitespace clean |

Four workflow YAML files parsed with js-yaml; GitHub server-side validation of the changed workflow is not yet observed. Old tests enforcing a fixed production port were replaced with checks that the new production workflow contains no fixed-port/remote-transport contract. Five executable artifact-verifier tests were added. The total is not directly comparable with the previous suite count.

Verbatim Prisma error:

```
Error: request to https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine.gz.sha256 failed, reason: Client network socket disconnected before secure TLS connection was established
```

Evidence is in docs/audit/2026-10-01/. Earlier environment references are a pre-edit snapshot; removed workflow references are historical, not deployment requirements. New smoke code uses no provider secret or guessed hosting variable. Full dynamic/SDK environment coverage and all 820 route behaviors remain unverified. The earlier full audit is an inventory and risk register, not fresh live certification.

## Latest repair checkpoint — 2026-10-01 (supersedes prior current-result claims)

| Item | Status | Evidence / next step |
|---|---|---|
| Honest SMTP transport and caller responses | FIXED IN REPOSITORY | email-service and regression tests; no fabricated send IDs |
| SMTP delivery/inbox verification | WAITING FOR EXTERNAL CREDENTIAL | SMTP host/sender/credentials and controlled mailbox test |
| Prisma engine locally | BLOCKED | External TLS restriction; exact evidence in REPOSITORY-BLOCKERS-2026-10-01.md |
| Latest local build/start | BLOCKED | No generated client or standalone artifact; earlier CI is not this patch |
| Migration ordering, payroll backfill | BLOCKED | Repository chain requires database-history-aware repair; MIGRATION-SAFETY-REPORT.md |
| Database connection / backup restore | WAITING FOR DATABASE | Never migrated production |
| Audit failure atomicity / journal storage / cron stubs | BLOCKED | Verified repository defects; not fixed by credentials |
| Portal/auth production behavior | NOT VERIFIED | Unit/static tests do not certify live DB flows |
| Prisma transitive dependency highs | BLOCKED | 3 HIGH, no safe forced downgrade applied |
| cPanel deployment contract | WAITING FOR CPANEL | No real paths/startup/restart/Node contract supplied |
| GitHub Actions secret availability | NOT VERIFIED | Listing returned 403; no assumption of configured secrets |

Full current result and scope: [REPOSITORY-BLOCKERS-2026-10-01.md](REPOSITORY-BLOCKERS-2026-10-01.md). Status remains BLOCKED, not ready for cPanel configuration alone.
