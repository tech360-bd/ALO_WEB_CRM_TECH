# DEVELOPMENT GUIDELINE — alaminn.info

This document is the canonical engineering rulebook for the **alaminn.info**
platform. Every contributor — human or agent — must read it before opening a
pull request, running a deploy, or marking the project "production-ready".
Where this document conflicts with ad-hoc notes in `worklog.md` or commit
messages, **this document wins**.

---

## 1. Project Identity

| Field | Value |
| --- | --- |
| Project name | `alaminn.info` |
| Package name | `alaminn-info` (see `package.json`) |
| Domain | `https://alaminn.info` (canonical, no trailing slash) |
| Operator | Al Aminn |
| Description | Premium executive authority platform for Al Aminn |
| Architecture | Single public homepage route + protected Command Center / admin backend |
| Public surface | One App Router route: `src/app/page.tsx` (single-page, section-based) |
| Protected surface | Command Center UI (`src/components/site/command-center.tsx`) gated behind NextAuth session, served from the same route; mutating actions go through `src/app/api/v1/admin/*`, `src/app/api/v1/ai/*`, etc. |
| Current version | 1.0.0 (`package.json`) |
| Node engine | `>=20.0.0` (declared in `package.json#engines`) |

The platform is intentionally **single-route** on the public side. All public
content lives as sections inside `src/app/page.tsx` (hero, expertise, impact,
ecosystem, case studies, ALO Labs, insights, resources, verification &
evidence registry, profile, contact-finale, footer). Do not add new public
routes without explicit approval — that constraint is what keeps the public
bundle small and free of CRM/admin code.

---

## 2. Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.1.x (App Router, `output: "standalone"`) |
| Language | TypeScript 5, `strict` mode (see `tsconfig.json`) |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`), `tailwindcss-animate`, `tw-animate-css` |
| UI primitives | shadcn/ui — **New York** style (see `components.json`) |
| Icons | `lucide-react` (tree-shaken via `experimental.optimizePackageImports`) |
| Animation | `framer-motion` (tree-shaken) |
| ORM | Prisma 6 (`@prisma/client` + `prisma` CLI) |
| Database | SQLite (currently `db/custom.db`) — MySQL/Postgres is an open production decision |
| Auth | NextAuth v4 (`next-auth@^4.24.11`) + custom HMAC session layer (`src/lib/auth.ts`) |
| RBAC | Custom matrix in `src/lib/rbac.ts`, 11 roles, ~60 permissions |
| Validation | Zod 4 |
| Email | `nodemailer` (SMTP) + `@react-email/components` (templates) + optional Resend (`src/lib/email/transport.ts`) |
| Analytics | First-party, cookie-less, DNT-aware (`src/lib/analytics.ts`) |
| Tests | Vitest 4 + `@testing-library/react` + `jsdom` |
| Backend AI SDK | `z-ai-web-dev-sdk` (server-side only — never in client bundles) |
| Mini-services | 4 standalone Bun/Node processes (notification `:3001`, email-worker `:3002`, audit-worker `:3003`, health-monitor `:3004`) |
| Process manager (prod) | `node` directly, or `pm2` on VPS — never `bun run dev` |

### RBAC roles (exact, in declared order)

```
SUPER_ADMIN, OWNER, EXECUTIVE_ASSISTANT, CRM_MANAGER,
PARTNERSHIP_MANAGER, CONTENT_MANAGER, MARKETING_MANAGER,
PROJECT_MANAGER, AI_REVIEWER, SECURITY_AUDITOR, VIEWER
```

Permission strings are namespaced `<resource>.<action>` (e.g.
`inquiries.update`, `ai_approvals.decide`). The client NEVER enforces
permissions — `requirePermission()` / `requireRole()` from `@/lib/rbac` must
be called inside every protected API route.

---

## 3. Project Layout

```
src/
  app/
    layout.tsx                # Root layout: <html>, fonts, SiteChrome, Toaster
    page.tsx                  # Single public route — all sections composed here
    icon.tsx, apple-icon.tsx  # Generated favicons
    robots.ts, sitemap.ts     # SEO
    api/
      health/                 # /api/health, /api/health/deep
      v1/
        admin/dashboard/      # Protected: admin overview
        ai/tasks/, ai/approvals/  # Protected: AI workspace
        analytics/track/      # Public: beacon endpoint
        auth/login, auth/logout, auth/session
        inquiries/            # Public POST, admin GET
        meetings/, meetings/admin/
        newsletter/, newsletter/verify/
        public/projects, public/articles  # Public read-only
  components/
    site/                     # Project-specific UI (navbar, footer, sections, command-center, etc.)
    ui/                       # shadcn/ui primitives (button, dialog, table, …)
  lib/
    auth.ts, rbac.ts          # Session + RBAC source of truth
    db.ts                     # Prisma client singleton
    env.ts                    # Centralized env validation (zod) — prod refuses to start on missing vars
    logger.ts                 # Structured logger (redacts secrets)
    observability.ts          # withObservability HOC + request context
    request-context.ts        # AsyncLocalStorage request IDs
    shutdown.ts               # Graceful shutdown handlers
    analytics.ts, utm.ts      # First-party analytics
    email/{transport,layout,templates,queue,index}.ts
    site-data.ts              # Static content + navigation
    blur-placeholders.ts
    utils.ts                  # cn() + shared helpers
  hooks/                      # use-mobile, use-count-up, use-toast
  instrumentation.ts          # Next.js startup hook (env validation)
  middleware.ts               # Security headers + path rules
prisma/
  schema.prisma               # 18 models, 6 enums (see docs/database.md)
  seed.ts
scripts/
  backup-db.ts, restore-db.ts, verify-db.ts
  security-tests.ts           # 22-category security suite
  seed-admin.ts               # Bootstrap first OWNER from ADMIN_EMAIL/ADMIN_PASSWORD
  generate-blur-placeholders.ts, generate-modern-images.ts
tests/
  setup.ts
  lib/{env,rbac,auth,email-templates}.test.ts
  api/{health,inquiries}.test.ts
  unit/utm.test.ts
docs/                         # README, deployment, environment, api, security, architecture, database, disaster-recovery, backup-restore, security-report, CLAIM_REGISTER
db/
  custom.db                   # SQLite database (NEVER commit unsanitized)
  backups/                    # Timestamped .db backups (retention: 30)
mini-services/                # notification-service, email-worker, audit-worker, health-monitor
public/
  brand/                      # portrait.{avif,webp,jpg,png}, portrait-lifestyle.*
  favicon.svg, logo.svg
```

### API domain map

| Domain | Path prefix | Auth | Purpose |
| --- | --- | --- | --- |
| admin | `/api/v1/admin/*` | `requireRole` | Command Center overview & operations |
| ai | `/api/v1/ai/*` | `requirePermission(ai_tasks.*, ai_approvals.*)` | AI workspace tasks + approvals |
| analytics | `/api/v1/analytics/track` | Public (beacon) | First-party event tracking |
| auth | `/api/v1/auth/{login,logout,session}` | Mixed | Session lifecycle |
| inquiries | `/api/v1/inquiries` | Public POST / admin GET | Contact form pipeline |
| meetings | `/api/v1/meetings*` | Public POST / admin GET | Scheduling pipeline |
| newsletter | `/api/v1/newsletter*` | Public | Subscribe + verify |
| public | `/api/v1/public/*` | Public read-only | Projects, articles |

---

## 4. Environment Variables

All keys live in `.env.example` at the repo root. Copy it to `.env` on the
server and fill in real values. **Never commit the real `.env`.** Validation
is centralized in `src/lib/env.ts` and enforced at startup via
`src/instrumentation.ts` — production will refuse to boot on missing
required vars.

| Key | Required in prod | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` on the server, `development` locally |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public URL (SEO, sitemap, OG tags). No trailing slash. |
| `NEXTAUTH_URL` | Yes | NextAuth canonical URL. Usually equal to `NEXT_PUBLIC_SITE_URL`. |
| `AUTH_SECRET` | Yes | 32+ char random string signing session cookies. Generate with `openssl rand -base64 32`. |
| `DATABASE_URL` | Yes | SQLite absolute path, e.g. `file:/home/USERNAME/alaminn.info/db/custom.db` |
| `EMAIL_FROM` | Yes | Sender address, e.g. `"Al Aminn <hello@alaminn.info>"` |
| `EMAIL_REPLY_TO` | Yes | Reply-to address, e.g. `hello@alaminn.info` |
| `SMTP_HOST` | Yes (if using SMTP) | SMTP server hostname |
| `SMTP_PORT` | Yes (if using SMTP) | SMTP port (typically 587 for STARTTLS, 465 for TLS) |
| `SMTP_USER` | Yes (if using SMTP) | SMTP username |
| `SMTP_PASS` | Yes (if using SMTP) | SMTP password |
| `RESEND_API_KEY` | Optional | Alternative to SMTP. If set, transport prefers Resend. |
| `LOG_LEVEL` | Optional | `error` \| `warn` \| `info` \| `debug`. Defaults to `info`. |
| `BACKUP_RETENTION_COUNT` | Optional | Number of backups to retain in `db/backups/`. Defaults to `30`, hard-capped at 30. |
| `ADMIN_EMAIL` | Bootstrap only | Used by `scripts/seed-admin.ts` to create the first OWNER. Rotate or remove after initial setup. |
| `ADMIN_PASSWORD` | Bootstrap only | Same as above. Rotate immediately after first login. |

### Rules

- No real secrets in `.env.example` — only placeholders.
- `NEXT_PUBLIC_*` variables are inlined into the client bundle. Anything
  prefixed `NEXT_PUBLIC_` must be safe to expose to browsers.
- All other variables are server-only. Importing them from a client
  component is a build error by design.
- Rotate `AUTH_SECRET` and `ADMIN_PASSWORD` immediately after first
  production setup. Rotating `AUTH_SECRET` invalidates all sessions.

---

## 5. Development Rules

1. **Backend AI SDK stays server-side.** `z-ai-web-dev-sdk` must only be
   imported from server components, API routes, or `src/lib/**`. Never from
   `src/components/**` (unless the file is explicitly marked
   `"use server"`). Pulling it into a client bundle leaks the API key.
2. **Public bundle must not contain private CRM data.** The homepage is a
   single route composed of section components. Do not import
   `src/app/api/v1/admin/*` types or Prisma models directly into client
   components. Public pages fetch only from `/api/v1/public/*`.
3. **Admin data flows only through protected APIs.** Any data behind
   `requireRole` / `requirePermission` must originate from
   `/api/v1/admin/*`, `/api/v1/ai/*`, `/api/v1/inquiries` (admin GET),
   `/api/v1/meetings/admin`, etc. Never bypass via server actions reading
   the DB without an RBAC check.
4. **All API input validated with Zod.** Every POST/PUT/PATCH body, every
   query string, every route param. Parse, then trust. See existing routes
   in `src/app/api/v1/inquiries/route.ts` for the pattern.
5. **Errors logged safely via `@/lib/logger`.** Structured JSON, request
   ID attached from `AsyncLocalStorage`, secrets redacted, no stack traces
   in production responses.
6. **No secrets in source.** Secrets live in `.env`, loaded through
   `src/lib/env.ts`. Hardcoded tokens, passwords, or API keys in `.ts`
   files are blocking review comments.
7. **Mobile-first.** Every section starts at `base:` and scales up. Test
   at 375px, 768px, 1280px before sign-off.
8. **Accessibility is non-negotiable.** Touch targets ≥ 44×44 px, ARIA
   labels on icon-only buttons, semantic HTML (`<section>`, `<nav>`,
   `<main>`, `<footer>`, `<button>` not `<div onClick>`), keyboard
   navigability for the Command Center and all modals.
9. **Footer stays sticky.** Root layout uses `min-h-screen flex flex-col`
   with `mt-auto` on the footer so short pages still pin the footer to the
   viewport bottom. Do not break this pattern.
10. **No random framework changes.** Do not swap Tailwind for another CSS
    engine, do not migrate from NextAuth to a different auth library, do
    not switch from Prisma to a raw driver, do not change `output:
    "standalone"`. Propose architectural changes in `worklog.md` first.
11. **Single public route.** Do not add `/about`, `/blog`, etc. New public
    content goes in as a section in `src/app/page.tsx`.
12. **Commit hygiene.** Small, atomic commits. Each commit must pass
    `bun run lint` and `npx tsc --noEmit` locally.

---

## 6. Production Rules

1. **Never run the dev server as production.** `bun run dev` (or
   `next dev`) compiles on-demand, leaks source maps, and has no
   production hardening. It is for local iteration only.
2. **Never use `bun run dev` for live traffic.** The dev server uses
   Turbopack, watches files, and reloads on change — all unsuitable for
   prod. Even if Bun is your runtime, run the standalone server, not
   `next dev`.
3. **Production uses the standalone build.** `next build` produces
   `.next/standalone/server.js` (plus `.next/static` and `public/` which
   the `build` script copies in). Start with
   `NODE_ENV=production node .next/standalone/server.js`.
4. **TypeScript build errors MUST block production.** `next.config.ts`
   sets `typescript.ignoreBuildErrors = false` and
   `eslint.ignoreDuringBuilds = false`. Do not flip these to `true` to
   "ship faster" — that is the fastest way to ship a runtime crash.
5. **No 15-minute heavy review cron on shared cPanel.** The QA cron
   (`scripts/security-tests.ts` + agent-browser review) is CPU- and
   memory-heavy. On shared cPanel hosts it will get OOM-killed and may
   impact neighbours. Run it only on a VPS, a dedicated container, or
   trigger it manually.
6. **Cookies secure in production.** Session cookies set
   `secure: true`, `httpOnly: true`, `sameSite: "lax"` (or `"strict"`
   where possible) when `NODE_ENV === "production"`. The auth layer in
   `src/lib/auth.ts` enforces this; do not weaken it.
7. **No stack traces in responses.** The logger redacts and writes them
   server-side. API error responses return a generic message + request
   ID, never a raw `Error.stack`.
8. **`output: "standalone"` is mandatory.** It produces a self-contained
   `.next/standalone/` directory with only the needed `node_modules`.
   This is what gets deployed.
9. **Production health checks.** `/api/health` (shallow) and
   `/api/health/deep` (DB + dependencies) must return 200 before traffic
   is routed to a new instance.

---

## 7. Feature Workflow

Every new feature follows the same sequence. Skip a step and you risk
shipping a broken or insecure change.

1. **Backup the database.**
   ```bash
   bun run db:backup
   bun run db:verify
   ```
   Verify the backup integrity before touching the schema.

2. **Update the Prisma schema.** Edit `prisma/schema.prisma`. Bump the
   `SCHEMA_VERSION` constant if one applies. Document the change in the
   schema's inline comments.

3. **Push the schema.**
   ```bash
   bun run db:push        # development — syncs schema without migrations
   # or, for production-grade migrations:
   bun run db:migrate
   ```
   `db:push` is fine for SQLite development. For production data
   preservation, use `db:migrate` and review the generated SQL.

4. **Build the API route** under `src/app/api/v1/<domain>/route.ts`.
   - Import `requirePermission` or `requireRole` from `@/lib/rbac`.
   - Validate every input with Zod.
   - Log via `@/lib/logger`.
   - Return shaped errors (see existing routes for the response envelope).
   - Add an audit log entry for mutating actions.

5. **Build the UI.**
   - **Server component** fetches data (from protected APIs or directly
     via Prisma when the call is server-side and RBAC-checked).
   - **Client component** renders the data. Client components never
     import Prisma or `z-ai-web-dev-sdk`.
   - Mobile-first, accessible, sticky footer preserved.

6. **Add tests.** New lib code → `tests/lib/`. New API route →
   `tests/api/`. Pure functions → `tests/unit/`. Coverage on critical
   paths (env, rbac, auth, email) is already in place — extend, do not
   regress.

7. **Run the quality gates** (see §8). All five must pass.

8. **Update the worklog.** Append a section to `worklog.md` with:
   Task ID, agent name, what changed, files touched, stage summary.

---

## 8. Quality Gates

All five gates must pass before merge or deploy. No exceptions, no
"it's just a typo" exemptions.

| Gate | Command | Expected |
| --- | --- | --- |
| Lint | `bun run lint` | 0 errors, 0 warnings |
| Typecheck | `npx tsc --noEmit` | 0 errors |
| Unit/integration tests | `bun run test` | All pass |
| Security suite | `bun run security:test` | 22/22 pass, 0 critical |
| Database integrity | `bun run db:verify` | "Database is healthy" (0 anomalies) |
| Production build | `npm run build` (or `bun run build`) | Standalone output succeeds |

The `build` script in `package.json` is:
```
next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
```
A successful build leaves a deployable `.next/standalone/` directory. If
the build fails, do not deploy. If `ignoreBuildErrors` is `true`
anywhere, fail the PR.

After build, smoke-test the standalone server:
```bash
NODE_ENV=production node .next/standalone/server.js &
curl -sS http://127.0.0.1:3000/api/health
curl -sS http://127.0.0.1:3000/api/health/deep
```

---

## 9. Database Hygiene

1. **Never commit `db/custom.db` with live data.** The repository may
   carry a sanitized seed DB only. If you accidentally stage it, remove
   with `git rm --cached db/custom.db` and rotate any credentials that
   may have leaked.
2. **Backup before schema changes.**
   ```bash
   bun run db:backup
   bun run db:verify
   ```
   If `db:verify` reports anomalies, stop. Do not push schema changes
   against a corrupt database.
3. **Verify after every backup.** The backup script writes a timestamped
   `.db` to `db/backups/`. `db:verify` checks integrity (PRAGMA
   integrity_check), row counts, and schema consistency.
4. **Decide SQLite vs MySQL for production.** SQLite is fine for current
   scale (single-host, ~hundreds of rows). For multi-instance
   deployments, switch to MySQL or Postgres by updating `DATABASE_URL`
   and `prisma/schema.prisma`'s `provider`. This decision must be made
   before scaling horizontally — SQLite does not handle concurrent
   writers across processes.
5. **Backup retention is 30 max.** `BACKUP_RETENTION_COUNT` defaults to
   30. The backup script prunes older files automatically. Do not raise
   this above 30 — disk usage on shared hosts is a real constraint.
6. **Backups live in `db/backups/`.** Each file is named
   `alaminn-YYYY-MM-DD-HHMMSS.db`. Do not move them out of this
   directory without updating the restore script.
7. **Restore procedure.** Use `bun run db:restore` and follow the
   prompts. The script will refuse to overwrite a live DB without an
   explicit confirmation, and will never delete a backup it did not
   create. See `docs/disaster-recovery.md` for the full runbook.

---

## 10. Deployment

### Path A — cPanel Node.js App

1. In cPanel, open **Setup Node.js App**.
2. Create an app:
   - **Node version**: 20+ (matches `package.json#engines`).
   - **Application root**: `alaminn.info` (or your cPanel user path).
   - **Application URL**: `https://alaminn.info`.
   - **Application startup file**: `server.js` (cPanel expects this
     name; symlink or copy `.next/standalone/server.js` to `server.js`
     in the app root).
3. Upload the standalone build:
   - `.next/standalone/` (rename to fit cPanel's `server.js` expectation).
   - `.next/static/` (must sit at `.next/standalone/.next/static/`).
   - `public/` (must sit at `.next/standalone/public/`).
   - `prisma/`, `db/`, `.env`.
4. Set environment variables in the cPanel UI (or via `.env` at the app
   root). Never paste secrets into the cPanel UI text field if it logs.
5. Install dependencies: `npm install --omit=dev` (or rely on the
   standalone bundle which already includes the minimal `node_modules`).
6. Run `npx prisma generate` once after deploy to ensure the client is
   built for the runtime Node version.
7. Start the app from the cPanel UI. Tail logs via cPanel's "Log
   Stream" or `tail -f` on the log file cPanel creates.

### Path B — Cloud VPS (recommended for production scale)

1. **Build**:
   ```bash
   npm ci
   npm run build
   ```
   This produces `.next/standalone/server.js`.
2. **Start** (direct):
   ```bash
   NODE_ENV=production node .next/standalone/server.js
   ```
   Or with pm2 for process management and restart-on-crash:
   ```bash
   pm2 start .next/standalone/server.js --name alaminn-info
   pm2 save
   pm2 startup
   ```
3. **Reverse proxy** with nginx or Caddy. Caddy is preferred (automatic
   TLS):
   ```caddyfile
   alaminn.info {
     reverse_proxy 127.0.0.1:3000
     encode gzip zstd
   }
   ```
   The repo already includes a `Caddyfile` with `XTransformPort` rules
   for the mini-services mesh.
4. **SSL** via Let's Encrypt. Caddy does this automatically; with nginx
   use `certbot --nginx`.
5. **Env** at `.env` in the app root. `src/lib/env.ts` validates at
   startup; missing required vars abort the boot.
6. **Logs** to stdout/stderr; pm2 captures them at
   `~/.pm2/logs/alaminn-info-out.log` and `-err.log`. Pipe to journald
   or a log shipper.

### Common build & start commands

| Step | Command |
| --- | --- |
| Install deps | `npm ci` (or `bun install`) |
| Build | `npm run build` |
| Start | `NODE_ENV=production node .next/standalone/server.js` |
| Smoke test | `curl -sS http://127.0.0.1:3000/api/health` |

### Rollback

1. Stop the running app (`pm2 stop alaminn-info` or kill the `node`
   process).
2. Restore the previous standalone build (keep the prior
   `.next/standalone/` around, or rebuild from the prior git SHA).
3. Restore the prior DB backup:
   ```bash
   bun run db:restore
   # select the timestamped backup from before the deploy
   ```
4. Restart the app. Verify `/api/health/deep` returns 200.
5. Document the rollback in `worklog.md` with timestamp, reason, and
   SHA being rolled back to.

---

## 11. Security

1. **`AUTH_SECRET` required (32+ chars).** Generated with
   `openssl rand -base64 32`. `src/lib/env.ts` refuses to boot production
   without it. Rotating it invalidates every active session — coordinate
   with users before rotating.
2. **`EMAIL_FROM` required.** Transactional email (inquiry
   acknowledgements, newsletter verification, meeting confirmations, AI
   approval notifications, auth security alerts) must come from a
   branded, deliverable address. Production refuses to boot without it.
3. **Admin routes protected via `requireRole` + NextAuth session.**
   Every `/api/v1/admin/*`, `/api/v1/ai/*`, `/api/v1/meetings/admin`,
   `/api/v1/inquiries` (admin GET), etc. calls `requirePermission()` or
   `requireRole()` from `@/lib/rbac` before any work. The frontend role
   state is decoration only — the server is the source of truth.
4. **No CRM leak on public pages.** The homepage (`src/app/page.tsx`)
   fetches only from `/api/v1/public/*`. No admin types, no Prisma
   models, no `z-ai-web-dev-sdk` imports in the public bundle. Verify
   with `next build`'s bundle analysis if a regression is suspected.
5. **Session cookies `secure` + `httpOnly` in production.** Enforced in
   `src/lib/auth.ts` based on `NODE_ENV`. `sameSite` is `"lax"` minimum.
6. **Rate limiting on auth + inquiry endpoints.** In-memory limiter
   present (see `docs/security.md` for limits table). Note: in-memory
   limits are single-host only — for multi-instance deploys, move to
   Redis-backed limiting.
7. **No secrets in the client bundle.** `NEXT_PUBLIC_*` only. Anything
   else imported from a client component is a build error.
8. **No stack traces in production responses.** The logger writes them
   server-side; API responses return a generic message + request ID.
   Verify with `bun run security:test` (the suite includes a
   stack-trace leak test).
9. **Security headers** set in `src/middleware.ts`:
   `X-Content-Type-Options: nosniff`,
   `X-Frame-Options: DENY`,
   `Referrer-Policy: strict-origin-when-cross-origin`,
   plus others. CSP is currently not set — see `docs/security.md` §11
   for the honest limitation.
10. **Password hashing** uses scrypt (constant-time comparison in
    `src/lib/auth.ts`). Never store plaintext or weak hashes.
11. **Audit log** is application-append-only. Every mutating admin
    action writes an entry. Note: it is not tamper-evident at the DB
    level — see `docs/security.md` for the follow-up.
12. **SameSite=Lax is the sole CSRF defense.** There is no CSRF token
    today. Do not weaken `sameSite` further. If you add a state-changing
    GET endpoint (you shouldn't), you must add CSRF protection first.

---

## 12. Sign-off

A change may be called "production-ready" only when **all** of the
following are true. If any one is false, the change is not
production-ready — say so explicitly in `worklog.md`.

| # | Check | How to verify |
| --- | --- | --- |
| 1 | Lint passes | `bun run lint` → 0 errors, 0 warnings |
| 2 | TypeScript passes | `npx tsc --noEmit` → 0 errors |
| 3 | Tests pass | `bun run test` → all green |
| 4 | Security tests pass | `bun run security:test` → 22/22, 0 critical |
| 5 | Database verify passes | `bun run db:verify` → "Database is healthy" (0 anomalies) |
| 6 | Production build passes | `npm run build` → standalone output produced |
| 7 | Standalone start works | `NODE_ENV=production node .next/standalone/server.js` boots, `/api/health` returns 200 |
| 8 | Domain routes tested | `https://alaminn.info/` loads, sections render, no console errors |
| 9 | Admin APIs protected | `curl -i https://alaminn.info/api/v1/admin/dashboard` without auth returns **401** (not 200, not 302 to a page) |

If any check fails, the correct phrasing is:
> "Not production-ready: <check> failed because <reason>. Next action: <fix>."

Do not soften this. Do not say "should be fine" or "likely ready". The
sign-off is binary: either all nine checks pass, or the platform is not
production-ready. This rule exists because the cost of a false
"production-ready" claim — to users, to the operator's reputation, to
the audit trail — is far higher than the cost of an extra verify cycle.

---

End of document. Last reviewed against source at `package.json`,
`next.config.ts`, `src/lib/rbac.ts`, `src/lib/env.ts`, `.env.example`,
and the existing `docs/` corpus. Keep this file in sync with the code —
when the code changes, update this document in the same commit.
