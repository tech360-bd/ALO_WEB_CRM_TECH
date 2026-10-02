# ALO Education — Hostinger Production Deployment (authoritative)

This is the single authoritative deployment document. Where any other file in
this repository disagrees with it, this file wins and the other file is
historical.

Everything below is either **verified from the repository** or explicitly
marked **NOT VERIFIED — HOSTINGER ACCESS REQUIRED**. Nothing here is assumed.

---

## 1. Deployment contract

```text
HOSTING_PROVIDER=Hostinger
DEPLOYMENT_OWNER=Hostinger            # Hostinger owns production deployment
CI_OWNER=GitHub Actions               # GitHub Actions validates only
PRODUCTION_BRANCH=main
PRODUCTION_DOMAIN=https://aloeducation.com
REPOSITORY=engralaminn-collab/alo_education_z....ai
RUNTIME=Node.js 22.x
PACKAGE_MANAGER=npm
```

### Ownership flow

```text
feature / arena branch
        ↓
GitHub CI  (install · lint · typecheck · tests · Prisma · MySQL · build)
        ↓
Pull Request
        ↓
CI GREEN
        ↓
merge to main                      ← the production release event
        ↓
Hostinger GitHub integration
        ↓
automatic Hostinger deployment
        ↓
https://aloeducation.com
```

### Branch policy

| Branch | Role | Is a push here a production deployment? |
| --- | --- | --- |
| `arena/**` | development / validation only | **No** |
| `development` | development / validation only | **No** |
| `main` | production | **Yes** — merging to `main` is the release event |

A push to `arena/01a0fbce-alo-education-z-ai` runs CI and nothing else. It must
never be described as a production deployment.

### What GitHub Actions must never do

Verified by `tests/deployment-ownership.test.mjs` (16 assertions, run in CI):

- no SSH or SCP to Hostinger
- no service restarts
- no production migrations over SSH
- no production credentials as repository secrets
- no deployment job selectable from a push to `main`

`.github/workflows/deploy-production.yml` and `deploy-recovery.yml` are retained
only as refusal notices: they are `workflow_dispatch`-only and exit 1.

---

## 2. Hostinger application configuration

Set this in hPanel → Node.js application. The values come from the repository's
actual scripts (`package.json`, `server.js`), not from assumption.

```text
Repository      : engralaminn-collab/alo_education_z....ai
Branch          : main
Node version    : 22.x
Package manager : npm
Install command : npm ci
Build command   : npm run build
Start command   : npm start
Startup file    : server.js
```

Why `server.js` is the correct startup file (verified):

- `npm start` is `NODE_ENV=production node server.js`.
- Root `server.js` asserts Node 22, requires `.next/standalone/server.js`, and
  throws if the standalone build is missing.
- `npm run build` ends with `node scripts/prepare-standalone.mjs`, which
  produces that standalone output.

### Port and hostname

**Do not set `PORT`** unless Hostinger assigns a fixed port in the application
settings. The application already behaves correctly:

- `server.js` sets `HOSTNAME=0.0.0.0` itself.
- It validates `PORT` only if one is supplied; otherwise the Next.js standalone
  default applies.

The port `3044` that appears throughout older documents belongs to the retired
PM2 + nginx/Caddy VPS architecture. It is **NOT VERIFIED** for Hostinger and must
not be treated as the production port.

### Docker / docker-compose

`Dockerfile`, `docker-compose.yml`, `ecosystem.config.cjs`, `nginx.conf` and
`Caddyfile` are retained for history. They describe the retired self-hosted
stack. Hostinger Node.js hosting uses none of them, and the `MYSQL_*` variables
they need are **not read by the application**.

---

## 3. Environment variables

The authoritative, machine-readable classification of every variable lives in:

```text
docs/environment-classification.json      # regenerate: node scripts/audit-env-vars.mjs
```

The application code is authoritative. A variable that appears only in
`.env.production.example` and is never read by code is reported as `UNUSED`.

### Required in production (verified against the consuming code)

| Variable | Why it is required |
| --- | --- |
| `NODE_ENV=production` | Enables the fail-closed security branches (encryption key, demo login, secure download). |
| `DATABASE_URL` | Prisma datasource `env("DATABASE_URL")`. The single authoritative connection source. |
| `NEXTAUTH_URL` | next-auth v4 absolute callback/redirect base. |
| `NEXTAUTH_SECRET` | next-auth v4 session signing. Without it `portal-auth/login` returns **without setting a session cookie** — login appears to succeed but no session exists. |
| `ENCRYPTION_KEY` | AES-256-GCM key for stored integration tokens. Must be **exactly 64 hexadecimal characters**; `src/lib/social/token-encryption.ts` throws in production otherwise. |
| `FILE_SIGN_SECRET` | Signs secure download URLs; throws in production when shorter than 32 characters. |
| `NEXT_PUBLIC_APP_URL` | Public origin. **Inlined into the browser bundle at build time**, so it must be present before `npm run build`. |

Generate secrets on the server, never in the repository:

```bash
openssl rand -base64 48      # NEXTAUTH_SECRET, FILE_SIGN_SECRET
openssl rand -hex 32         # ENCRYPTION_KEY — produces exactly 64 hex characters
```

### DATABASE_URL form

```text
mysql://USER:URL_ENCODED_PASSWORD@HOST:3306/DATABASE
```

URL-encode the password (`@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`).
Use the host Hostinger reports for the database. Do not assume `localhost` —
that is only correct if hPanel confirms the database is on the application host.

### Declared but NOT consumed by the application

Verified: zero `process.env` references across `src/`, `scripts/`, `prisma/`,
`server.js`.

| Variables | Verdict |
| --- | --- |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_CHARSET`, `DB_COLLATION` | Laravel-style second database configuration. Prisma + `DATABASE_URL` is canonical. Leave unset — maintaining both invites drift. |
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | docker-compose-only. Not needed in the Hostinger application environment. |
| `AUTH_SECRET`, `JWT_SECRET`, `SESSION_SECRET` | Never read. This project uses **next-auth v4**, which reads `NEXTAUTH_SECRET`; `AUTH_SECRET` is the Auth.js v5 name. Setting them has no effect. |
| `APP_ENV`, `APP_DEBUG`, `PUBLIC_WEBSITE_URL` | Laravel-era leftovers. Use `NODE_ENV` and `NEXT_PUBLIC_APP_URL`. |

### Public variables

Every `NEXT_PUBLIC_*` value is compiled into client JavaScript and is readable
by anyone. Never place a secret in one.

`NEXT_PUBLIC_DEVELOPMENT_DEMO_PASSWORD` **must stay empty in production**. Demo
login is already hard-disabled when `NODE_ENV=production`
(`src/lib/stores/portal-store.ts`), so the variable has no production purpose.

### Email transport (verified)

The application's only mail sender is `src/lib/email-service.ts` (nodemailer,
via the `smtp-mailer` npm alias). It reads **SMTP_HOST, SMTP_PORT (default
587), SMTP_USER, SMTP_PASSWORD, SMTP_FROM**. These are optional for boot:
without them the app starts and email sending fails explicitly with
`SMTP_NOT_CONFIGURED` — there is no logging-only or fake-success fallback.

`MAIL_*`, `IMAP_*` and `POP3_*` are **never read** (zero code references,
destructured reads included) and must not be treated as required.

---

## 4. Database migrations

Prisma is the only database layer. The migration chain is validated on every
push against a disposable MySQL 8.4 service in CI: fresh `migrate deploy`,
`migrate status`, and an authoritative `migrate diff` that must be empty.

Controlled production procedure — run manually, never from CI:

```bash
# 1. Back up first. Always.
# 2. Inspect what would be applied:
npx prisma migrate status

# 3. Apply:
npx prisma migrate deploy
```

Never run against production:

- `prisma migrate reset` — destroys all data
- `prisma db push` — bypasses the migration history and causes the drift this
  repository has already had to reconcile once

### Checksum warning for `20261002010000_reconciliation_missing_tables`

This migration declared literal defaults on `TEXT`/`LONGTEXT` columns
(`DEFAULT '{}'`), which MySQL rejects with **error 1101**. It therefore could
never apply to a *fresh* database, and CI's fresh-database job failed on it.
Because every statement is `CREATE TABLE IF NOT EXISTS`, the failure was
invisible on databases that already had the tables — MySQL skips definition
processing entirely when the table exists.

It has been corrected in place to the expression-default form Prisma itself
emits (`DEFAULT (_utf8mb4'{}')`). Correcting the file was the only option: a
later migration cannot repair a migration that aborts the chain.

**If this migration is already recorded as applied on production**, Prisma will
refuse the next `migrate deploy` with a checksum mismatch. Resolve it, after
confirming the tables really do exist:

```bash
npx prisma migrate status                                   # confirm what is recorded
npx prisma migrate resolve --applied 20261002010000_reconciliation_missing_tables
npx prisma migrate deploy
```

---

## 5. Seeding — one time only, never automatic

**`npm run db:seed` resets the Super Admin password.** `prisma/seed-complete.ts`
upserts `portalUser` with `update: { passwordHash, firstLoginRequired: true }`,
so every run overwrites the administrator credential.

Therefore:

- Do **not** add seeding to the Hostinger build or start command.
- Run it once, manually, on first provisioning:

```bash
SEED_SUPER_ADMIN_EMAIL=admin@aloeducation.com \
SEED_SUPER_ADMIN_PASSWORD='<unique one-time value, 12+ chars>' \
  npm run db:seed
```

- Change the password through the application immediately afterwards
  (`firstLoginRequired` is set, which forces this).
- The rest of the seed is idempotent (upserts), so re-running is structurally
  safe — but it will still reset the administrator password.

---

## 6. Connecting Hostinger to GitHub (operator action)

**NOT VERIFIED — HOSTINGER ACCESS REQUIRED.** None of the following can be
observed from the repository. Nothing in this repository can prove or enable it.

1. hPanel → Websites → `aloeducation.com` → Node.js application.
2. Connect the GitHub repository `engralaminn-collab/alo_education_z....ai`.
3. Set the deployment branch to `main`.
4. Enable automatic deployment on push.
5. Set Node.js version 22.x.
6. Set install / build / start commands from §2.
7. Add the environment variables from §3 in hPanel (never in the repository).
8. Trigger one manual deployment and confirm it succeeds before relying on
   automatic deployment.

---

## 7. Deployment verification procedure

Run after Hostinger is connected. Each step must be evidenced, not assumed.

| # | Step | How to verify |
| --- | --- | --- |
| 1 | Harmless commit pushed to `main` | commit SHA visible on GitHub |
| 2 | GitHub CI succeeds | both CI jobs green for that SHA |
| 3 | Hostinger detects the commit | deployment entry appears in hPanel |
| 4 | Hostinger build completes | build log ends successfully |
| 5 | Application starts | process running, no restart loop |
| 6 | Site responds | `curl -I https://aloeducation.com` → `200` |
| 7 | Health endpoint | `curl https://aloeducation.com/api/health` → healthy |
| 8 | Database connectivity | health payload reports the database reachable |
| 9 | Authentication | log in, confirm a session cookie is issued |
| 10 | Static assets | `/_next/static/...` returns `200` |
| 11 | Server-side secrets present | no fail-closed errors in the application log |
| 12 | No secret leakage | `NEXT_PUBLIC_*` only; grep the served HTML/JS for secret-shaped strings; confirm no stack traces in API responses |

### Auto-live acceptance test

```text
harmless code change → git push origin main → CI GREEN
    → Hostinger detects commit → Hostinger deploys
    → https://aloeducation.com reflects the new version
```

Status: **NOT VERIFIED — HOSTINGER ACCESS REQUIRED.** This cannot be executed or
observed from the repository or from CI.

---

## 8. Current known production blockers

| Blocker | Evidence | Owner |
| --- | --- | --- |
| Production site is not passing its public health check | The scheduled `Health & Dependency Monitor` workflow, which runs `scripts/production-smoke.mjs https://aloeducation.com` from GitHub's network, has failed **every day from 2026-09-18 through 2026-10-02** (15+ consecutive runs). | Hostinger / operator |
| Hostinger → GitHub auto-deployment unconfirmed | Not observable from the repository. | Operator |
| Credentials in git history | **Verified 2026-10-02:** commit `5cc4e6b6` (2026-09-11) committed a real, non-placeholder database `DATABASE_URL` (user `user_edu`, host `127.0.0.1:3306`, db `db_education`) into `documentation/CPANEL-DEPLOYMENT-GUIDE.md`. The value was scrubbed by `05c1e1f0` (2026-09-18) but remains recoverable from public history. The current tree is clean under the full CI secret-scanner logic (re-verified 2026-10-02 over every tracked file, docs included). History must not be rewritten, so **that database password is compromised and must be rotated.** | Operator |

---

## 9. Secret hygiene

- Never commit real secrets. `.gitignore` ignores `.env` and `.env.*` while
  allowing `.env.example` and `.env.production.example`.
- CI runs a secret-leak scan over **every tracked file, documentation included** —
  docs are where credentials historically leaked here.
- Test and fixture credentials must be generated dynamically or use unmistakable
  placeholders. Credential-shaped literals in adversarial security tests are
  assembled at runtime from fragments for exactly this reason.
- Removing a secret from the current tree does not undo exposure. Rotate it.
