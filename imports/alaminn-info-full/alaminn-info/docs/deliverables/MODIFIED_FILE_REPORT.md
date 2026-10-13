# MODIFIED_FILE_REPORT.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Modified File Report |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | List all files MODIFIED in this production build (relative to the prior state), with a one-line description of what changed. |

---

## How this report was generated

The list below was compiled from the worklog entries of all prior production tasks plus this task (DOCS-001). Each modified file is verified present on disk and the modification summarized.

For files modified across many commits, only the most recent production-relevant change is summarized.

---

## Modified files

### Configuration

| # | File | Modification summary |
|---|---|---|
| 1 | `package.json` | Added scripts: `db:backup`, `db:restore`, `db:verify`, `db:seed`, `security:test`, `images:blur`, `images:modern`, `test:unit`, `test:integration`, `test:security`, `test:watch`, `test:coverage`, `verify:production`. Updated `engines.node` to `>=20.0.0`. Updated `build` script to copy `.next/static` and `public` into `.next/standalone/` (cPanel standalone mode). |
| 2 | `package-lock.json` | Regenerated after `npm install` to reflect the dependency tree. |
| 3 | `tsconfig.json` | Path alias `@/*` → `./src/*` confirmed. `noEmit` true (typecheck only). Strict mode enabled. |
| 4 | `next.config.ts` | Enabled `output: 'standalone'` for cPanel deployment. Configured image optimization, ESLint, TypeScript strict checks. |
| 5 | `vitest.config.ts` | Configured v8 coverage at 40% threshold on `src/lib/**` + `src/app/api/**`. Path alias `@/*` → `./src/*`. 15s test timeout. |

### Prisma

| # | File | Modification summary |
|---|---|---|
| 6 | `prisma/schema.prisma` | Expanded from ~10 models to **55 models** across 6 domains: Identity & Auth (3), CRM (8), Content (5), AI Workspace (2), Audit & Logs (2), Notifications (1), Analytics & Documents (2), Site Settings & Media (2), Higher Study Platform (19), English Learning Platform (11). Added `@@index` declarations for query performance. Added `Json` fields for flexible metadata. Total: 1,281 lines. |
| 7 | `prisma/seed.ts` | Expanded to seed ~274 records across all 55 models (universities, courses, scholarships, research, supervisors, English courses, tutors, etc.). Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` env vars for admin user creation. |

### Source code (`src/`)

| # | File | Modification summary |
|---|---|---|
| 8 | `src/lib/auth.ts` | Custom HMAC-SHA256 session cookie auth (NOT NextAuth). scrypt password hashing (N=16384, r=8, p=1, 64-byte hash, 16-byte salt). 8-hour session TTL. HttpOnly + Secure + SameSite=Lax cookies. `timingSafeEqual` for signature comparison. |
| 9 | `src/lib/rbac.ts` | 11 roles (SUPER_ADMIN, OWNER, EXECUTIVE_ASSISTANT, CRM_MANAGER, PARTNERSHIP_MANAGER, CONTENT_MANAGER, MARKETING_MANAGER, PROJECT_MANAGER, AI_REVIEWER, SECURITY_AUDITOR, VIEWER). 100+ permissions namespaced `<resource>.<action>`. `requirePermission()` + `requireRole()` server-side guards. |
| 10 | `src/lib/env.ts` | Centralized env validation. Throws `FATAL` in production on missing `AUTH_SECRET` (< 32 bytes) or `EMAIL_FROM`. Dev fallbacks for local development. Cached after first access. |
| 11 | `src/lib/db.ts` | Prisma client singleton (prevents multiple instances in dev hot-reload). Reads `DATABASE_URL` from `env()`. |
| 12 | `src/lib/cron-auth.ts` | NEW-ish module: `verifyCronAuth()` helper for `/api/cron/*` endpoints. Fail-closed (503 if `CRON_SECRET` missing). Constant-time comparison via `timingSafeEqual`. Accepts `x-cron-secret` header OR `?secret=` query param. |
| 13 | `src/lib/higher-study/integration.ts` | ALO Education referral integration. URL builder, PII guard (25 forbidden keys), `HigherStudyReferral` persistence, status transitions (`created → transferred → completed → failed → expired`), 24h TTL, sweeper function. |
| 14 | `src/lib/english-learning/integration.ts` | Parallel English Learning referral integration. Same PII guard pattern. 5 allowed context keys (courseSlug, tutorSlug, testSlug, level, campaignCode). 3 referral types (course-package, tutor-booking, mock-test-bundle). |
| 15 | `src/lib/higher-study/api-helpers.ts` | `generateReferralCode()` (12-char randomBytes base36), `signReferralToken()` (HMAC-SHA256), `verifyReferralToken()` (constant-time), `hashIp()` (sha256 truncated to 16 hex chars), `getDeviceCategory()`. |
| 16 | `src/lib/english-learning/api-helpers.ts` | Parallel helpers for the English Learning platform. |
| 17 | `src/proxy.ts` | Renamed from `middleware.ts` (Next.js 16 convention). Pass-through proxy that injects security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) on every response. Assigns request IDs. Increments request counter for `/api/health/deep`. |
| 18 | `src/lib/email/transport.ts` | SMTP transport (nodemailer) with SSL/TLS support. Falls back to Resend API if `RESEND_API_KEY` set. Falls back to dev console transport in development. |
| 19 | `src/lib/email/templates.ts` | 10 email templates (inquiry ack, OTP, account activation, consultation confirmation, counsellor assignment, scholarship deadline alert, course enquiry, PhD enquiry, referral failure notice, administrator alert). |
| 20 | `src/lib/email/queue.ts` | Email queue with retry (3 attempts, exponential backoff: 60s/300s/900s). Used by the `email-worker` mini-service. |

### Entry point

| # | File | Modification summary |
|---|---|---|
| 21 | `server.js` | cPanel entry point. Inline `.env` parser (no `dotenv` dependency). Sets `NODE_ENV=production`. Requires `.next/standalone/server.js`. Refuses to start if standalone build is missing. |

### Tests

| # | File | Modification summary |
|---|---|---|
| 22 | `tests/setup.ts` | Vitest setup. Registers `@testing-library/jest-dom` matchers when jsdom is the environment. No-op under node. |
| 23 | `tests/lib/auth.test.ts` | 24 tests for `src/lib/auth.ts` (password hashing, session cookies, signature verification, TTL). |
| 24 | `tests/lib/email-templates.test.ts` | 20 tests for `src/lib/email/templates.ts` (renders, escapes HTML, plain-text fallback). |
| 25 | `tests/lib/env.test.ts` | 23 tests for `src/lib/env.ts` (FATAL on missing prod secrets, dev fallbacks). |
| 26 | `tests/lib/rbac.test.ts` | 27 tests for `src/lib/rbac.ts` (11 roles, 100+ permissions, hasPermission, requirePermission). |
| 27 | `tests/unit/utm.test.ts` | 18 tests for `src/lib/utm.ts` (UTM parsing, decoding, truncation). |
| 28 | `tests/api/health.test.ts` | 11 integration tests for `/api/health`, `/api/health/deep`, `/api/readiness`. |
| 29 | `tests/api/inquiries.test.ts` | 17 integration tests for `POST /api/v1/inquiries` (validation, rate limit, honeypot, DB writes, email trigger). |
| 30 | `tests/api/admin-auth.test.ts` | 7 integration tests for `POST /api/v1/auth/login`, `/logout`, `GET /session`. |

### cPanel deploy scripts

| # | File | Modification summary |
|---|---|---|
| 31 | `deploy/cpanel/setup-cpanel.sh` | One-time cPanel setup. Pre-flight checks, `npm install`, SQLite→MySQL schema swap, `prisma generate`, `prisma db push`, `prisma/seed.ts`, `db:verify`, `npm run build`, static asset staging. |
| 32 | `deploy/cpanel/redeploy.sh` | Incremental redeploy. Flags: `--no-seed` (default), `--seed` (force re-seed), `--no-build` (just restart). Attempts `passenger-config restart-app` automatically. |
| 33 | `deploy/cpanel/.env.production` | Production env template. Pre-filled MySQL credentials, strong random hex secrets, cPanel SMTP defaults, mini-service ports. Marks `ADMIN_PASSWORD` and `SMTP_PASSWORD` as `CHANGE_ME`. |

### Operational scripts

| # | File | Modification summary |
|---|---|---|
| 34 | `scripts/backup.sh` | NEW in BACKUP-001 task. ~10 KB. mysqldump + gzip + SHA-256 + 30-day retention + flock + credential isolation via `--defaults-extra-file` (mode 0600, trap-cleaned). |
| 35 | `scripts/restore.sh` | NEW in BACKUP-001 task. ~12 KB. Interactive restore. Pre-restore safety snapshot. SHA-256 verification. `gunzip -t` integrity. Requires typing `RESTORE`. Table count post-check (55 expected). |
| 36 | `scripts/verify-backup.sh` | NEW in BACKUP-001 task. ~6 KB. Offline verification (5 checks: file exists, SHA-256, gzip integrity, 55 CREATE TABLEs, key tables present). |
| 37 | `scripts/seed-admin.ts` | Pre-existing, modified to read `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from env. Upserts the admin user (idempotent). |
| 38 | `scripts/verify-db.ts` | Pre-existing, modified to check 55 tables, row counts, admin user, FK constraints. |
| 39 | `scripts/security-tests.ts` | Pre-existing, 22 security tests covering SQLi, XSS, CSRF, IDOR, rate limiting, broken auth, cookie security, header security, clickjacking, directory traversal, open redirect, SSRF, command injection, mass assignment, privilege escalation, session fixation, replay, cookie tampering, large payload, malformed JSON, file upload abuse, brute force. |
| 40 | `scripts/verify-production.sh` | Pre-existing, verifies the production artefact (`.next/standalone/server.js`, static chunks, public assets, Prisma client, `.env`, schema provider). |

### `.htaccess` files

| # | File | Modification summary |
|---|---|---|
| 41 | `public/.htaccess` | NEW in HTACCESS-001 task. ~2.3 KB. Dotfile / .env / backup / SQL dump / archive / log / sourcemap / TS-JSX source deny rules. Explicit grant exception for `_next/static/*.js`. `Options -Indexes`. 6 security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS via env=HTTPS). mod_deflate compression. mod_expires caching (1y static, 1h JSON, 0s HTML). |
| 42 | `.htaccess` (project root) | NEW in HTACCESS-001 task. ~1.5 KB. Global dotfile block. Explicit `.env` / `.env.*` block (Files + FilesMatch for resilience). Config file block (package.json, tsconfig.json, next.config.ts, etc.). server.js source block. mod_rewrite 403 rules for 11 internal directories (prisma/, src/, scripts/, tests/, docs/, mini-services/, deploy/, storage/, node_modules/, .next/, db/). `Options -Indexes`. `ServerSignature Off`. |
| 43 | `storage/.htaccess` | NEW in HTACCESS-001 task. 6 lines. `Require all denied` (blocks all uploads/backups/logs/exports). |
| 44 | `db/.htaccess` | NEW in HTACCESS-001 task. 4 lines. `Require all denied` (blocks SQLite dev DB + migration artifacts). |
| 45 | `docs/.htaccess` | NEW in HTACCESS-001 task. 4 lines. `Require all denied` (blocks internal documentation). |

---

## Summary

| Category | Count |
|---|---|
| Configuration | 5 |
| Prisma | 2 |
| Source code (`src/`) | 13 |
| Entry point | 1 |
| Tests | 9 |
| cPanel deploy scripts | 3 |
| Operational scripts | 7 |
| `.htaccess` files | 5 |
| **Total modified** | **45** |

---

## Verification

To verify the modified files are present and up-to-date:

```bash
cd ~/alaminn.info

# Check modification times
ls -la package.json tsconfig.json next.config.ts vitest.config.ts
ls -la prisma/schema.prisma prisma/seed.ts
ls -la src/lib/auth.ts src/lib/rbac.ts src/lib/env.ts src/lib/cron-auth.ts src/proxy.ts
ls -la src/lib/higher-study/integration.ts src/lib/english-learning/integration.ts
ls -la server.js
ls -la tests/lib/*.test.ts tests/unit/*.test.ts tests/api/*.test.ts
ls -la deploy/cpanel/setup-cpanel.sh deploy/cpanel/redeploy.sh deploy/cpanel/.env.production
ls -la scripts/backup.sh scripts/restore.sh scripts/verify-backup.sh scripts/seed-admin.ts
ls -la public/.htaccess .htaccess storage/.htaccess db/.htaccess docs/.htaccess

# Verify schema size
wc -l prisma/schema.prisma
# Expect: 1281 lines
```

---

## Reference

- **Production build cycle tasks**: DOCS-001, HTACCESS-001, BACKUP-001
- **Pre-existing modifications**: from earlier development tasks
- **Audit date**: 2026-07-19
- **Total modified files**: 45
