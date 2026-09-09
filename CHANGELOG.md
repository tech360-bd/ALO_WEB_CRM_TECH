# Changelog

All notable changes to the ALO Education ERP project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-07-27

### Summary

Multi-phase remediation completed. The project now passes the full clean-install gate (npm ci → prisma migrate reset → seed → typecheck → lint → test → build → runtime verification). Ready for staging deployment.

### Added

- **Prisma migrations** committed (`20260726191824_init`, `20260726193613_add_rbac_junctions_and_scope`)
- **Idempotent seed script** (`prisma/seed-complete.ts`) — creates 5 portal users + 13 RBAC roles + sample data; safe to rerun
- **`scripts/prepare-standalone.mjs`** — cross-platform standalone build preparation (replaces fragile `cp` chains)
- **`scripts/generate-inventories.mjs`** — generates all 5 CSV inventories (DB, routes, APIs, env vars, migrations)
- **`scripts/check-users.mjs`** — DB inspection helper
- **Ubuntu deployment artifacts** (`deploy/ubuntu/`):
  - `alo-education.service` — hardened systemd unit
  - `Caddyfile` — HTTPS reverse proxy with security headers
  - `deploy.sh` — idempotent deployment script
  - `backup.sh` — DB + .env + source backup with 14-day retention
  - `restore.sh` — restore from backup
  - `rollback.sh` — rollback to previous backup
  - `health-check.sh` — HTTP + service health probe
- **`DEPLOYMENT-GUIDE.md`** — full Ubuntu deployment guide
- **`DEVELOPMENT-GUIDE.md`** — developer onboarding guide
- **`REPAIR-REPORT.md`** — comprehensive repair report
- **`CLEAN-INSTALL-REPORT.md`** — clean-install gate verification log
- **`TEST-REPORT.md`** — test execution summary
- **`SECURITY-AUDIT.md`** — security controls audit
- **CSV inventories** (5 files): DATABASE, ROUTE, API, ENVIRONMENT-VARIABLE, MIGRATION
- **Test suite**: 4 test files, 36 tests (password hashing, permissions, data scope, consultation workflow)
- **`.env.example`** — comprehensive template with 50 documented variables
- **`eslint.config.mjs`** — modern flat config

### Changed

- **`package.json` scripts** — Added `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `db:format`, `db:validate`, `db:generate`, `db:push`, `db:migrate`, `db:deploy`, `db:reset`, `db:seed`, `check`
- **`package.json` `start`** — Changed from `bun .next/standalone/server.js` to `NODE_ENV=production node .next/standalone/server.js`
- **`package.json` `prisma.seed`** — Added: `"tsx prisma/seed-complete.ts"`
- **`package.json` `build`** — Now runs `prisma generate && next build && node scripts/prepare-standalone.mjs`
- **`next.config.ts`** — Removed `typescript.ignoreBuildErrors: true`; standalone output mode; SPA rewrites
- **`src/app/api/portal-auth/login/route.ts`** — Fixed portalType/userType matching: staff users with `userType:"ADMIN"` can now log in via the employee portal (previously rejected because the code only accepted `userType:"EMPLOYEE"`)
- **`src/components/website/public-pages/PublicPages.tsx`** — Removed unverifiable "10,000+ COURSES" badge → "SEARCH COURSES"
- **`src/components/auth/RegisterPage.tsx`** — Removed unverifiable "10,000+ courses" claim → "hundreds of courses"

### Removed

- **`typescript.ignoreBuildErrors = true`** — Build suppression eliminated; all TS errors are now fixed at source
- **Bun dependency** — Production no longer requires Bun; standard `node` runtime
- **`@types/bcryptjs`** — Removed (bcryptjs v3 ships its own types)
- **Fictional team members** (Sarah Johnson, Michael Chen, Emily Rodriguez) — Removed from seed scripts and UI fallbacks
- **Fabricated marketing claims** — "10,000+ students", "4.9/5 reviews", "5,000+ reviewers" removed
- **`mode: "insensitive"`** filters — Removed (MySQL incompatible); replaced with case-insensitive Prisma queries where needed

### Fixed

- **`npm ci` failure** — Lockfile repaired (`@types/bcryptjs` version mismatch resolved)
- **`withAuth(...)()` pattern** — All API routes standardized on the correct `withAuth(handler, options)(request)` pattern
- **Prisma schema drift** — Resolved: `CrmCourseIntakeFee.course`, `role.permissions`, `OtpCode.code/used`, `PasswordResetToken.token`, `MarketingComment.convertedToLead`, `PartnerLead.studentName/studentEmail` all aligned with API code
- **`ZAI` not callable** — Import style fixed; AI integration behind provider interface
- **Login portal mismatch** — Employee portal now accepts both `EMPLOYEE` and `ADMIN` userTypes
- **TypeScript errors** — From many (cataloged in 18 categories A–R) to **zero**
- **Lint errors** — To **zero** (3 cosmetic warnings remain)
- **Consultation workflow** — Full 10-step flow implemented: validate → detect duplicates → create/update lead → assign round-robin → timeline entry → notification → audit log
- **Build pipeline** — Standalone output now produced reliably via `prepare-standalone.mjs`

### Security

- **Session tokens** — 48-byte cryptographically random hex
- **Session expiry** — 7 days, checked on every request
- **Session revocation** — Supported via `revokedAt` field
- **Disabled user blocking** — `status !== "active"` returns 403
- **Bearer token auth** — On all protected API routes
- **RBAC enforcement** — `requireRoles`, `requirePermissions`, `requireUserTypes` options
- **Super-admin bypass** — Implemented for admin endpoints
- **Login attempt logging** — For brute-force detection
- **Audit logging** — On all sensitive actions
- **SQL injection protection** — Prisma parameterized queries throughout
- **XSS protection** — React escapes by default
- **Path traversal protection** — File uploads sanitized
- **Security headers** — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP/COEP/CORP
- **systemd hardening** — NoNewPrivileges, ProtectSystem=strict, ProtectHome, ProtectKernelTunables, etc.
- **App binding** — `127.0.0.1:3000` only (never `0.0.0.0`); public access via Caddy HTTPS proxy only

### Known Limitations (Not Blocking for Staging)

- **MySQL** — Acceptable for staging; production should migrate to MySQL (documented in DEPLOYMENT-GUIDE.md)
- **E2E tests** — `tests/e2e/` directory exists but empty (Playwright browsers not installed)
- **Real university data** — Universities table empty by default (per spec rule Q, requires verified public sources)
- **External provider credentials** — Email/WhatsApp/SMS/AI providers stubbed (`*_PROVIDER=none`)
- **TLS certificate** — Auto-provisioned by Caddy once a real domain points to the server

---

## [0.2.0] — 2026-07-26 (pre-remediation baseline)

### Known Issues (now fixed in 0.3.0)

- `npm ci` failed due to `@types/bcryptjs` version mismatch
- `npx tsc --noEmit` reported many errors (cataloged in `tsc-errors.txt`, 416 lines)
- `next.config.ts` contained `typescript.ignoreBuildErrors = true`
- `package.json` `start` script used Bun
- No committed Prisma migrations
- No configured seed command
- `withAuth(...)()` pattern missing Request argument in many routes
- Prisma schema drift: many APIs referenced fields/relations absent from generated client
- MySQL-incompatible `mode: "insensitive"` filters
- Fictional team members (Sarah Johnson, Michael Chen, Emily Rodriguez) in seed and UI
- Fabricated marketing claims ("10,000+ students", "4.9/5 reviews")
- ZAI SDK import style incorrect ("Value of type 'typeof ZAI' is not callable")

---

## [0.1.0] — Initial project setup

- Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui
- Prisma + MySQL
- 156-table schema
- 139 API routes
- SPA architecture (1 page route, Zustand state)
- Brand colors: `#0057B8` primary, `#E8501A` CTA
