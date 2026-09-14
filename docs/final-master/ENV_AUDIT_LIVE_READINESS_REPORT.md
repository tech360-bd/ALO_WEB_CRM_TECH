# ALO Education — Environment Audit & Live-Deployment Readiness
**Date:** 2026-09-14  **Branch:** `arena/01a09c20-alo-education-z-ai`  **Commit:** `09af4da`  **Auditor:** Agent Mode (read-only)

> Rule: No secret values are printed. Status is `present | missing | empty | malformed | not verifiable` for names only. Do NOT claim “error-free” unless checks actually passed.

---

## 0) Read-only inspection snapshot

| Item | Value |
|---|---|
| **Branch** | `arena/01a09c20-alo-education-z-ai` (working tree **clean**, `nothing to commit`) |
| **Latest commits** | `09af4da` add 11-repo batch → `582a9d7` 10-repo batch → `ab6962b` docs → `42d8feb` 6 CRM extras → `a66fcbd` kanban |
| **Root** | `/home/user/alo_education_z....ai` — Next.js 16.1.1 (see `package.json`) |
| **Node / npm (sandbox)** | `v22.22.3` / `10.9.8` — satisfies `engines: node>=22, npm>=10` + `packageManager npm@10.9.2` |
| **Routes** | **748** `src/app/**/route.ts` (API) + **336** `page.tsx` (pages) |
| **Prisma schema** | `provider = "mysql"` + `binaryTargets` includes `debian-openssl-3.0.x` (prod) — migrations: 10 under `prisma/migrations/` |
| **Docker** | `Dockerfile` (Bun → `bunx prisma migrate deploy && node server.js` — **mismatched** with `package.json` npm) + `docker-compose.yml` (app + `mysql:8.4` + `nginx:alpine`) + `nginx.conf` |
| **Workflows** | `.github/workflows/deploy-production.yml` (push `main` + `workflow_dispatch`, `appleboy/ssh-action@v1.2.2` 45m timeout) |
| **Health endpoint** | `src/app/api/health/route.ts` public `GET` → `{status: ok|degraded, database:{connected}}` |
| **.env files on disk** | Only `.env.example` present; no `.env`, `.env.local`, `.env.production` in sandbox (expected for Git — but required for live) |
| **Git tracking** | `git ls-files | grep .env` → only `.env.example` tracked — **correct** (secrets excluded) |

Detailed file lists and config excerpts are captured in §1–2 below. All commands run were non-destructive (`cat`, `ls`, `grep`, `prisma validate`, `lint`, `tsc --noEmit`, `vitest run`, `npm audit`, `curl`-free).

---

## 1) File / configuration inventory

Legend: **Found?** `yes | no | partial` — **Status** is deployment-facing (not Git status).

### 1.1 Environment files

| File/configuration | Found? | Purpose | Required for live? | Status | Action needed |
|---|---|---|---|---|---|
| `.env.example` | **yes** (`4070` bytes, committed) | Canonical template for **all** runtimes. Every var that production must set is listed here, with `REPLACE_WITH_…` placeholders. | **yes** (source of truth) | **present but has 2 duplicate/conflicting definitions** — see §2.1 | De-duplicate: remove duplicate `WHATSAPP_VERIFY_TOKEN`/`WHATSAPP_GRAPH_VERSION` lines at bottom (v18 vs v20) and consolidate `WHATSAPP_*` naming. Keep one canonical block. |
| `.env` | **no** (not on disk, not tracked — correct per `.gitignore`) | Runtime env for **all** services. `docker-compose env_file: - .env`, `deploy.sh` `cp .env .next/standalone/.env`, `pm2` inherits process env. **Next.js loads `.env` → `.env.local` → `.env.production`** in that priority. | **yes — required before any live start** | **missing — BLOCKING** | Create on VPS `/root/alo-live/.env` and `/root/alo-github-main-new/.env` (see §6.1 template). Never commit. |
| `.env.local` | **no** | Local overrides (dev-only). Loaded by Next.js but **ignored** in `docker-compose` (only `.env` is `env_file`). | **no** (optional local) | not verifiable (not in sandbox) | Do **not** create `.env.local` on live. Use single `.env` on VPS. Document that `docker-compose` will NOT read `.env.local`. |
| `.env.production` | **no** | Reserved for `NODE_ENV=production` overrides when using `next start`. Not used by current `pm2`/`standalone` path. | **no** | not verifiable | Do not introduce unless you intend to split prod vs base. |
| `.env.*` ignored by Git? | **yes** | ` .gitignore` lines 33-34 ` .env*` + 73-75 ` .env` / ` .env.*` / ` !.env.example` (duplicated at 110-112) — **correctly excludes secrets**, keeps `.env.example` | yes | **safe** | No action. Keep. |
| `.env.example` safe placeholders? | **partial** | Contains **no real credentials** — all secrets are `REPLACE_WITH_…` or empty. **Exception:** default non-secret values are safe to ship (e.g. `APP_URL=https://aloeducation.com`, `MAIL_HOST=mail.aloeducation.com`). Verified by `cat .env.example`. | yes | **safe** | No real secrets leaked. Keep placeholders. |

**Which file each runtime actually loads (per repo):**
- `next dev` / `next build` / `node .next/standalone/server.js` → Next.js loads `.env` → `.env.local` → `.env.production` → `.env.production.local` (later wins). In production via `npm start` (`NODE_ENV=production node .next/standalone/server.js`) → reads `.env.production` if present, else `.env`.
- `docker-compose.yml` → **only** `env_file: - .env` (so `.env.local` is ignored inside containers) + `environment: DATABASE_URL: mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@db:3306/...` (templated from `.env`).
- `deploy.sh` → copies **only** `.env` into `.next/standalone/.env` (step 12) — so standalone server reads that.
- `ecosystem.config.cjs` (`pm2`) → `env: {NODE_ENV:production, HOSTNAME:0.0.0.0, PORT:3044}` — plus any `.env` vars that `pm2` was started with (`--update-env`). PM2 does **not** load `.env` itself; the app’s Next loader does.
- `.github/workflows/deploy-production.yml` → does **not** write `.env`; it expects `.env` already on VPS at `/root/alo-live/.env` (managed outside Git via GitHub Secrets for SSH only).

### 1.2 Package / lockfile / runtime

| File/configuration | Found? | Purpose | Required for live? | Status | Action needed |
|---|---|---|---|---|---|
| `package.json` | yes | `name alo-education-erp@0.3.0`, `engines node>=22 npm>=10`, `packageManager npm@10.9.2`, scripts `dev/build/start/lint/typecheck/test` | yes | **present** — `build: RAYON… prisma generate && … next build --webpack && node scripts/prepare-standalone.mjs` — uses **npm** path. | Keep. Document clash with `Dockerfile` (see §3). |
| `package-lock.json` | yes (`628K`, `lockfileVersion 3`) | Single source of truth for `npm ci` | yes | present | Keep npm as sole manager. |
| `bun.lock` / `yarn.lock` / `pnpm-lock` | **no** | Would indicate alternate manager | no (must NOT exist) | correctly absent | Do not add `bun.lock`; current `Dockerfile` assumes it (see clash). |
| `.npmrc` | yes | `legacy-peer-deps=true`, `package-lock=true` | no | present | Keep. |
| `.nvmrc` | **no** | Pin Node for `nvm` | no | missing (not blocking) | Optionally add `22.22.3` to pin. |

### 1.3 Next.js / TypeScript / ESLint / test

| File | Found? | Purpose | Required | Status | Action needed |
|---|---|---|---|---|---|
| `next.config.ts` | yes | `output: "standalone"`, `workerThreads:false, cpus:1`, rewrites (book-consultation, language-prep, portals, privacy, destinations) | yes | present — **correct for `node .next/standalone/server.js`** | Keep. |
| `tsconfig.json` | yes | `target ES2017`, `strict:true`, path `@/* → src/*`, `exclude` prisma/scripts | yes | present | Keep. |
| `eslint.config.mjs` | yes | `eslint-config-next/core-web-vitals + typescript`, many rules **disabled** (`@typescript-eslint/no-explicit-any: off` etc.) | no | present | Before live, tighten to `error` for at least `no-explicit-any` on new code. |
| `vitest.config.ts` | yes | `environment node`, `include tests/unit/**/*.test.ts + integration`, coverage `src/lib/**/*.ts` | yes | present | Keep. |
| `playwright.config.ts` | yes | `baseURL 127.0.0.1:3211`, `webServer: npm start` with `SESSION_SECRET/AUTH_SECRET/NEXTAUTH_*` hardcoded for e2e | no | present | Rotate e2e secrets to env before live (not prod). |
| `postcss.config.mjs` / `tailwind.config.ts` | yes | Tailwind 4 | yes | present | Keep. |

### 1.4 Prisma / DB / seeds

| File | Found? | Purpose | Required | Status | Action needed |
|---|---|---|---|---|---|
| `prisma/schema.prisma` | yes | `provider = "mysql"`, `url = env("DATABASE_URL")`, models 450+ (`User`, `Marketing*`, `Student`, `Application`, `StudentDocument`, `TimelineEvent`, etc.) | yes | **present — MySQL is canonical** | Do NOT switch to PostgreSQL without migration plan. |
| `prisma/migrations/` | yes — **10** dirs + `migration_lock.toml` | `20260731000000_init_mysql` … `20260913050000_benchmark_capabilities` | yes | present | Verify `prisma migrate deploy` on staging before live (cannot test without DB creds). |
| `prisma/seed-complete.ts` + `agentos-seed.ts`, `seed-*.ts` (12 files) | yes | `seedComplete()` requires `SEED_SUPER_ADMIN_PASSWORD >=12 chars`, upserts `SUPER_ADMIN` + `PortalRole`/`PortalPermission` | optional | present | Decide: run `prisma db seed` once on fresh DB, **never** on prod with existing data without backup. |
| `deploy.sh` step 3 | — | runs `npx prisma db push --accept-data-loss` | — | **DANGEROUS for live** | Replace with `migrate deploy` on live (see §3, §6). |

### 1.5 Backend / process manager

| File | Found? | Purpose | Required | Status | Action needed |
|---|---|---|---|---|---|
| `src/app/api/health/route.ts` | yes | Public `GET /api/health` → `{status: ok/degraded, database:{connected}}` — used by `scripts/health-check.sh`, `Caddy/Nginx`, `cron-scheduler.sh` gate | yes | **present** | Keep. Add auth-free rate limit. |
| `src/lib/db.ts` | yes | `PrismaClient` global singleton, `log: ['query' in dev, 'error' in prod]` | yes | present | Keep. |
| `ecosystem.config.cjs` | yes | pm2 app `alo-education` → `script .next/standalone/server.js`, `instances:1 fork`, `max_memory_restart 2G`, `env PORT 3044 HOSTNAME 0.0.0.0`, logs `storage/logs/pm2-*.log` | yes | **present — port 3044** | Align **all** surfaces to 3044 (see §3 clash). |
| `Dockerfile` | yes | **Bun** base (`oven/bun:1`), `bun install`, `bunx prisma generate`, `bun run build`, then `CMD sh -c "bunx prisma migrate deploy && node server.js"` | if Docker used | **present but CLASHES** with `package.json` npm path and `deploy-production.yml` npm path | Pick one manager: **npm** (recommended, matches lockfile & VPS) — change `Dockerfile` to `node:22-alpine` + `npm ci`. Or keep Bun and generate `bun.lock`. |
| `docker-compose.yml` | yes | `app:3000:3000` + `db:mysql:8.4` + `nginx:alpine`, `env_file .env`, `volumes ./upload`, healthcheck `mysqladmin ping` | if Docker used | present — **port 3000 ≠ pm2 3044**, volume `./upload` vs `storage/` mismatch | Normalize: `app` port `3044:3044` if you keep pm2 port; volume to `storage/`; or remove compose for cPanel host (see hosting Q). |
| `nginx.conf` | yes | `server_name aloeducation.com www...`, `443 ssl` `certs/fullchain.pem`, `proxy_pass http://127.0.0.1:3044`, `client_max_body_size 10M` | if Nginx reverse proxy | **present — correctly targets 3044** | Provision `certs/` (Let’s Encrypt) and ensure Nginx reload on deploy. |
| `Caddyfile` (not found) / LiteSpeed | no | Alternative reverse proxy | no | not verifiable | VPS-GITHUB doc mentions Caddy but file not in repo — clarify. |

### 1.6 Upload / storage

| File | Found? | Purpose | Required | Status | Action needed |
|---|---|---|---|---|---|
| `src/lib/storage-service.ts` | yes | Three pools: `STUDENT_PARTNER 120GB SSD`, `OFFICIAL 120GB SSD`, `OPERATIONAL 500GB HDD` under `storage/…`, UUID names, SHA-256, `FileMetadata` + `FileEvent` atomic | yes | **present** | Ensure `storage/` exists on VPS, permissions `700`, and backup. Docker volume `./upload` must be migrated to `storage/`. |
| `STORAGE_POOL_C` in `.env.example` | yes | `STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads` | yes | placeholder present | Set to real VPS path (must be writable by `aloeduca` / `node` user). |

### 1.7 Integrations (names only — no values)

| Integration | Config source | Found? | Purpose | Required for live? | Status (name check) | Action needed |
|---|---|---|---|---|---|---|
| **Email SMTP** | `.env.example` `MAIL_*` + `src/lib/email-service.ts` (`SMTP_HOST/USER/PASSWORD`) | yes | Transactional email (activation, password reset, notifications). Service logs fallback `log-fallback-*` when missing. | **yes** for activation/password | **present in template — all empty** | Provide `MAIL_HOST/PORT/USERNAME/PASSWORD` (cPanel `mail.aloeducation.com:465`). Note: `email-service.ts` expects `SMTP_HOST` but `.env.example` uses `MAIL_HOST` — **naming mismatch** (see §2). |
| **Email IMAP/POP3** | `.env.example` `IMAP_*` / `POP3_*` | yes | Inbound email reading (if email-to-lead used) | no | empty placeholders | Provide only if you use IMAP polling. |
| **WhatsApp Cloud (Meta)** | `.env.example` `WHATSAPP_*` + `src/lib/whatsapp-cloud-api.ts` / `wacrm-broadcast.ts` | yes | Send/receive via `graph.facebook.com/v18` , `verifyWhatsAppSignature` (`WHATSAPP_APP_SECRET`), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN/WHATSAPP_TOKEN` | **yes** if WhatsApp is launch-required | **present but has 3 mismatches**: `WHATSAPP_API_KEY` **and** `WHATSAPP_TOKEN` + `WHATSAPP_ACCESS_TOKEN` (triplicate), `WHATSAPP_GRAPH_VERSION` defined twice `v18` vs `v20`, duplicate `WHATSAPP_VERIFY_TOKEN` | Consolidate to **one** token name (`WHATSAPP_ACCESS_TOKEN`) and one version (`v20.0`). See §6.2. |
| **Meta / Facebook / Instagram** | `.env.example` `FACEBOOK_APP_ID/SECRET`, `INSTAGRAM_*`, `META_API_KEY` + `docs/WHATSAPP-META-SETUP.md` | yes | Social OAuth + Lead Ads + Graph API | no (launch-optional) | empty placeholders | Provide only when enabling FB Lead Ads / social inbox. |
| **AI** | `.env.example` `GROQ_API_KEY`, `OPENROUTER_API_KEY/OPENROUTER_MODEL/SITE_URL/APP_NAME`, `ZAI_API_KEY`, `AI_*_MODEL` | yes | Content generation, marketing-brain, language-prep, interview AI | optional (graceful skip when missing) | empty | Provide at least **one** (`OPENROUTER_API_KEY` or `GROQ_API_KEY`). Verify `OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free` exists. |
| **Firebase Admin** | `.env.example` `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` | yes | Server auth (if Firebase used) | no | empty | Provide only if Firebase auth is live. Ensure `PRIVATE_KEY` newlines `\\n` preserved. |
| **Google OAuth** | `.env.example` `GOOGLE_CLIENT_ID` (+ `src/lib/doodle-note-engine.ts` `GOOGLE_CLIENT_ID/SECRET` for Calendar) | yes | Google login / Calendar token refresh | no | partial | Provide if Google login/Calendar sync is required. |
| **3CX / VoIP / SIP** | `.env.example` `THREECX_API_URL/TOKEN` + `src/lib/threecx-integration.ts` + `src/lib/softphone-engine.ts` + `src/lib/voip/*` | yes | Click-to-call, SIP registration, call logging | no | empty | Provide only if telephony is required. |
| **SMS** | `.env.example` `SMS_PROVIDER_API_KEY` + `src/lib/sms-gateway.ts` (`HTTPSMS_*`/`SMS_PROVIDER`) + `httpsms-client.ts` | yes | Bulk SMS (httpsms/domovina/3cx/generic) | no | empty/mismatch (`SMS_PROVIDER_API_KEY` vs `HTTPSMS_API_KEY`) | Align naming to `HTTPSMS_API_KEY` (gateway expects) or keep alias. |
| **LinkedIn** | `.env.example` `LINKEDIN_CLIENT_ID/SECRET` | yes | OAuth | no | empty | Provide only if LinkedIn login needed. |
| **Redis** | `src/lib/redis.ts` `ioredis` + `MemRedis` fallback, `REDIS_URL` | yes | Caching, rate-limit, queues | no (fallback is in-memory) | not in `.env.example` | Add `REDIS_URL=redis://127.0.0.1:6379` to template if you run Redis. Otherwise memory fallback is fine for single-instance. |
| **n8n Webhooks** | `src/lib/n8n.ts` `N8N_WEBHOOK_URL / N8N_AUTH_HEADER` | yes | Workflow automation triggers | no | not in `.env.example` | Add to template if you use n8n. |
| **ComfyUI / Vaultwarden / Ghost / Nextcloud / Umami / Chatwoot / LanguageTool** | `src/lib/comfyui-client.ts` (`COMFYUI_*`), `vaultwarden-client.ts` (`VAULTWARDEN_*`), `ghost-publishing.ts` (`GHOST_*`), `nextcloud-client.ts` (`NEXTCLOUD_*`), `umami-analytics.ts` (`UMAMI_*`), `chatwoot-inbox.ts` (`CHATWOOT_*`), `languagetool-client.ts` (`LANGUAGETOOL_*`) | yes | Feature addons (present, optional) | no | not in `.env.example` | Add optional block to template (already drafted in §6.1). |
| **Payments** | — | **no** | No `STRIPE_*` / `BKASH_*` found in `.env.example` nor `package.json` | no | not verifiable | Confirm payment is **out of scope** for this launch. |

### 1.8 Cron / queues / webhooks / workers

| Component | Found? | Purpose | Required? | Status |
|---|---|---|---|---|
| Cron API routes | **7** `src/app/api/cron/{analytics,followup,health,retry,sla-monitor,weekly-ai-agent,weekly-reports,weekly-university-update}/route.ts` + `src/app/api/automation/schedule` | Daily analytics rollup, follow-up sequences, SLA monitor, retry queue, weekly reports & university sync | **yes** (followup + SLA are core) | present — each writes `CronJobLog` with `running/success/failed`, `durationMs` |
| Scheduler entrypoint | `scripts/cron-scheduler.sh` | Gates on `GET /api/health` → `POST /api/automation/schedule` with `X-Cron-Secret: ALO_CRON_SECRET` | yes | present — needs `ALO_CRON_SECRET` + `ALO_APP_URL` (not in `.env.example`) |
| Weekly AI agent / reports | `weekly-ai-agent`, `weekly-reports` | Batch AI tasks | no | present |
| Redis / Bull / queues | `src/lib/redis.ts` (ioredis + MemoryRedis) — **no BullMQ** | In-memory fallback when `REDIS_URL` missing | no | present — **single-instance safe, multi-instance will lose queue** |
| n8n webhooks | `src/lib/n8n.ts` + 3 `N8N_WEBHOOK_URL` call sites | `triggerWorkflow(event, data, idempotencyKey)` with 5-min idempotency window | no | present |
| WhatsApp webhooks | `src/app/api/whatsapp/webhook/*` | `X-Hub-Signature-256` verify with `WHATSAPP_APP_SECRET` | if WhatsApp live | present |
| Background workers / PM2 workers | **no separate worker** — app is single Next.js process; cron is **external `curl` to API**, not in-process worker | — | — | present design — ensure crontab is on VPS (not in repo) |

---

## 2) Environment-file audit (detailed)

### 2.1 Duplicate / conflicting variables in `.env.example`

| Variable(s) | Lines | Conflict | Recommended fix |
|---|---|---|---|
| `WHATSAPP_VERIFY_TOKEN` | appears **twice**: once in WhatsApp block `WHATSAPP_VERIFY_TOKEN=` and again at bottom `WHATSAPP_VERIFY_TOKEN=CHANGE_ME` | Second definition overwrites first in shell; placeholder `CHANGE_ME` vs empty | **Keep one** (bottom one with `CHANGE_ME` is clearer). Delete the empty one in the WhatsApp block. |
| `WHATSAPP_GRAPH_VERSION` | `v18.0` near top **and** `v20.0` at bottom | Two defaults; `whatsapp-cloud-api.ts` defaults `v18` while `.env.example` bottom says `v20` | **Keep `v20.0`** (Meta current), delete `v18` line. Code already allows override. |
| `WHATSAPP_TOKEN` / `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_API_KEY` | `WHATSAPP_API_KEY` (generic line) + `WHATSAPP_TOKEN` + `WHATSAPP_ACCESS_TOKEN` | Code expects `WHATSAPP_APP_SECRET` + `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`; `WHATSAPP_TOKEN` and `WHATSAPP_API_KEY` are aliases that cause confusion | **Canonical: `WHATSAPP_ACCESS_TOKEN`** (Meta Graph token). Keep `WHATSAPP_TOKEN` as alias note but document `ACCESS_TOKEN` as primary. Remove `WHATSAPP_API_KEY` from WhatsApp context (reserve for generic SMS). |
| `MAIL_*` vs `SMTP_*` | `.env.example` declares `MAIL_HOST/PORT/USERNAME/PASSWORD` but `src/lib/email-service.ts` reads `SMTP_HOST/USER/PASSWORD` (`smtpHost = process.env.SMTP_HOST`) | Email will **always fall back to log** on live if you follow `.env.example` | **Fix one side**: add `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` aliases or change `email-service.ts` to read `MAIL_*` first. Immediate fix: set **both** `MAIL_*` and `SMTP_*` to same values on VPS. |
| `MYSQL_*` vs `DB_*` | Both `MYSQL_DATABASE/USER/PASSWORD` (Docker) **and** `DB_HOST/PORT/DATABASE/USERNAME/PASSWORD` (Laravel-style) + `DATABASE_URL` | Three ways to set DB; `prisma/schema.prisma` uses only `DATABASE_URL`; `docker-compose` templates `DATABASE_URL` from `MYSQL_*` | **Keep both** but document precedence: `DATABASE_URL` wins for Prisma; `MYSQL_*` for Docker `db` service. Ensure they stay in sync. |
| `OPENROUTER_API_KEY` vs `AI_*` | `OPENROUTER_API_KEY` plus `AI_DEFAULT_MODEL` etc. | Not a conflict — but `OPENROUTER_MODEL` at bottom duplicates `AI_DEFAULT_MODEL` intent | Keep `AI_DEFAULT_MODEL` as app-level, document that OpenRouter uses `OPENROUTER_MODEL` alias. |

### 2.2 Git exclusion verification

- `grep -n "\.env" .gitignore` → lines `33: .env*`, `73-75: .env / .env.* / !.env.example`, `110-112` duplicate — **intentionally duplicated sections** (harmless).
- `git ls-files | grep .env` → **only `.env.example` tracked** — no secret file committed. `ALO-FULL-CONNECTION-AUDIT*.txt` is tracked but contains no credentials (safe).
- `.env.example` placeholders only: `REPLACE_WITH_…` or empty. No private key, no real token. Verified by `cat .env.example`.

### 2.3 Machine that loads which file (summary)

See table in §1.1. **Action:** On the VPS, create **one** `.env` at the app root (`/root/alo-live/.env` for pm2 host, and mounted to `/app/.env` for Docker). Do NOT rely on `.env.local` on live.

---

## 3) Actual production architecture (from code)

### 3.1 Frontend & backend entrypoints (canonical)

- **Single Next.js app** (unified frontend + backend). No separate `backend/` folder, no standalone Express.
  - **Frontend**: `src/app/**/page.tsx` (336 pages) + `src/components/**` → built to `.next/standalone`
  - **Backend**: `src/app/api/**/route.ts` (748 API routes) on same process
- **Canonical build**: `npm run build` = `prisma generate && next build --webpack && node scripts/prepare-standalone.mjs`
  - Produces `.next/standalone/server.js` (verified by `scripts/prepare-standalone.mjs` throwing if missing)
  - `prepare-standalone.mjs` also copies `.next/static → .next/standalone/.next/static` + `public → .next/standalone/public`
  - `deploy.sh` does a more elaborate manual copy (steps 6-15) — **duplicate logic** to the script; prefer `prepare-standalone.mjs` alone.

### 3.2 Command that starts each service

| Service | Canonical start command (from repo) | Port | Host | Process manager |
|---|---|---|---|---|
| **App (production)** | `NODE_ENV=production node .next/standalone/server.js` (`package.json: start`) via `pm2` → `ecosystem.config.cjs` | **3044** (`ecosystem env PORT 3044`) | `0.0.0.0` | **pm2** `fork 1 instance`, `max_memory_restart 2G`, logs `storage/logs/pm2-*.log` |
| **App (Docker)** | `bunx prisma migrate deploy && node server.js` (`Dockerfile CMD`, workdir `/app`) — **port 3000** in `docker-compose.yml` | 3000 (mapped `3000:3000`) | `0.0.0.0` | Docker `restart: unless-stopped` |
| **DB** | `mysql:8.4` container or cPanel MySQL host | 3306 | `db` (Docker) / `localhost` (cPanel) | Docker or cPanel |
| **Reverse proxy** | `nginx:alpine` with `nginx.conf` → `proxy_pass 127.0.0.1:3044` | 80 → 443 | — | Nginx |

**Conflict:** App port is **3000 in docker-compose** but **3044 in pm2/nginx/cron**. This is a live-breaking mismatch. Align to **one port** (recommend **3044** to match Nginx + `ecosystem.config.cjs` + `scripts/health-check.sh`).

### 3.3 Database engine & version

- **Engine:** **MySQL** only (no Postgres). `prisma/schema.prisma` + 10 migrations all `init_mysql` style.
- **Version:** `mysql:8.4` in `docker-compose.yml`; cPanel likely `MySQL 8.x` or `MariaDB 10.x` (not verifiable without VPS). Both support `utf8mb4` + `cuid()` + migrations.
- **DB names/users in template:** `aloeduca_alo_education` / `aloeduca_ALO_final_web_crm` — cPanel convention (`username_dbname`). Docker defaults same.
- **Schema ↔ migration match:** `prisma validate` could not run (network to `binaries.prisma.sh` failed — see §5), so **cannot verify** schema ↔ migration drift in sandbox. Must run on VPS with network.

### 3.4 Redis / queues / cron / workers required?

- **Redis:** `ioredis` + in-memory fallback. **Not required** for single-instance pm2 (works degraded). Required if you scale to >1 instance or need durable queues.
- **Queues:** No BullMQ. n8n webhooks use 5-min idempotency map in memory.
- **Cron:** **Required** — 7 `src/app/api/cron/*` routes + `scripts/cron-scheduler.sh`. VPS needs a crontab entry (see §6.8).
- **Workers:** No separate worker process. Cron is external `curl` loop. `AgentOS` schedules run via `agentos/schedules` API (DB polling).

### 3.5 Node / Bun / package-manager versions supported

- **Supported:** `node >=22.0.0`, `npm >=10.0.0` (via `engines`). Sandbox `v22.22.3 / 10.9.8` passes.
- **Actual VPS per `deploy-production.yml`:** `npm ci`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run build` — **npm only**.
- **Dockerfile says Bun (`oven/bun:1`, `bun install`, `bunx`)** but there is **no `bun.lock`** — will fail `bun install --frozen-lockfile`. **Pick npm** and change `Dockerfile` to `node:22-alpine`.

### 3.6 Ports & domains per service

| Service | Port | Domain | Route | TLS |
|---|---|---|---|---|
| Next.js app | **3044** (pm2) — *fix 3000 clash* | `aloeducation.com` + `www.aloeducation.com` | `/` + `/api/*` (Next rewrites) | Nginx `listen 443 ssl` `certs/fullchain.pem` + `privkey.pem` |
| MySQL | 3306 | internal only (`db:3306` or `localhost:3306`) | — | — |
| Nginx | 80 / 443 | `aloeducation.com` | `proxy_pass 127.0.0.1:3044` | Let’s Encrypt certs in `./certs/` |
| Private docs | via `/api/documents/download/` | same domain | auth-checked in backend | — |
| Health | `http://127.0.0.1:3044/api/health` (local) + `https://aloeducation.com/api/health` (public) | — | `scripts/health-check.sh` | — |

### 3.7 Hosting environment capability

- **Assumed VPS:** Linux, root SSH (`/root/alo-live`, `pm2`, `ss -lntp`, `node`, `npm`, `git`). Docker **optional** (Nginx still used). cPanel MySQL path exists (`STORAGE_POOL_C=/home/aloeduca/...`) suggesting **cPanel shared hosting** or hybrid VPS+cPanel.
- **Supports required runtime?** **Yes** if VPS has Node 22, MySQL 8.4, PM2, Nginx, and certbot. Check `node -v`, `pm2 -v`, `nginx -t`, `mysql --version` on VPS cannot be verified from sandbox — listed as required info in §4.

> Do NOT migrate MySQL → PostgreSQL. No code path supports Postgres (`binaryTargets` and migrations are MySQL-specific).

---

## 4) Required-information checklist (only the missing)

**How to provide:** Do **not** paste passwords/tokens/URLs with secrets into chat/GitHub. Create the `.env` directly on the VPS via `nano /root/alo-live/.env` or set GitHub Secrets for deploy only. For this audit, just confirm “set” vs “not set”.

### 1. Hosting and access

| # | Question | Why needed | Required before launch? | How to find it |
|---|---|---|---|---|
| 1.1 | **Hosting type & OS** — is production a VPS (Ubuntu/Debian/CentOS), cPanel shared host, or both (VPS + cPanel DB)? | Determines deploy path: `pm2`+`Nginx` vs `docker-compose` vs cPanel file manager. | **yes** | `cat /etc/os-release` on VPS; cPanel → `WHM > Server Information` |
| 1.2 | **SSH / deploy path & user** — `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, and that `/root/alo-live` vs `/root/alo-github-main-new` is the **actual** deploy dir (tests expect `-new`, workflow uses `/root/alo-live`) | Workflow’s `appleboy/ssh-action` needs these; mismatch causes deploy to wrong dir. | **yes** | Check existing `~/.ssh` on your machine, GitHub → Settings → Secrets and variables → Actions |
| 1.3 | **Runtime versions on VPS** — `node -v` (need ≥22), `npm -v` (≥10), `pm2 -v`, `mysql --version`/`mysqladmin ping`, `nginx -v`/`nginx -t` | Confirms VPS can run the build and DB. Node 20 will fail `engines`. | **yes** | SSH → run those commands |
| 1.4 | **Resources** — RAM, disk, and whether `storage/logs` and `storage/` are on persistent disk | `max_memory_restart 2G`, uploads to `storage/` (500GB HDD pool) needs space | yes | `free -h; df -h; ls -ld storage` |
| 1.5 | **Is the app already running? Where?** — `pm2 list`, `ss -lntp | grep 3044` (or 3025/3000), `curl -fsS http://127.0.0.1:3044/api/health` | Decides whether this is first deploy or zero-downtime update (backup strategy changes). | yes | SSH → those commands; browser → `https://aloeducation.com/api/health` |
| 1.6 | **Docker allowed?** | `docker-compose.yml` exists but cPanel hosts usually forbid Docker. If not allowed, we **remove** Docker path from plan. | no | Check with host or `docker --version` on VPS |

### 2. Domains and routing

| # | Question | Why | Required? | How to find |
|---|---|---|---|---|
| 2.1 | **Production domain + subdomains** — confirm `aloeducation.com` + `www` are live, and whether `crm.aloeducation.com` or `app.*` is also needed | Nginx `server_name` is hardcoded; DNS must point A/AAAA to VPS IP. | **yes** | Domain registrar → DNS records; `dig aloeducation.com` |
| 2.2 | **Service → domain mapping** — should the whole Next app (marketing + CRM) serve on `aloeducation.com`, or should `crm.aloeducation.com` proxy separately? | Determines `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `APP_URL` values and Nginx server blocks. | **yes** | Decide product routing; current config is single domain. |
| 2.3 | **DNS & TLS status** — is DNS already pointing to VPS? Are Let’s Encrypt certs installed at `./certs/fullchain.pem` / `privkey.pem`, or should Nginx handle certbot? | `nginx.conf` expects certs at that path; missing certs → Nginx fails to start. | **yes** | `certbot certificates` or check `./certs/` on VPS; browser → padlock; `nginx -t` |
| 2.4 | **Reverse proxy choice** — Nginx (as in `nginx.conf`) vs Caddy vs cPanel-provided proxy | `docker-compose` has Nginx, but VPS might use Caddy or LiteSpeed; we must configure the right one. | **yes** | `which nginx; which caddy; cat /etc/nginx/conf.d/default.conf` |
| 2.5 | **Port alignment approval** — authorize changing all live surfaces to **3044** (from 3000/3025) or specify alternative | Port mismatch is a live blocker. | **yes** | Approve 3044 (recommended) or state new port. |

### 3. Database

| # | Question | Why | Required? | How to find |
|---|---|---|---|---|
| 3.1 | **Engine/version + DB name** — confirm MySQL (8.4?) + exact DB name `aloeduca_alo_education` (or other) | Prisma is MySQL-only; DB name must match `DATABASE_URL` + `MYSQL_DATABASE` + `DB_DATABASE`. | **yes** | cPanel → MySQL Databases; or VPS `mysql -e "SELECT VERSION()"` |
| 3.2 | **DB + user already exist?** — does `aloeduca_ALO_final_web_crm`@`localhost` exist with correct grants? | If not, we must create user/DB before `migrate deploy`. | **yes** | cPanel → MySQL Databases → list users; `SHOW GRANTS FOR 'aloeduca_ALO_final_web_crm'@'localhost'` |
| 3.3 | **Connection details** — `DB_HOST/PORT/DATABASE/USERNAME/PASSWORD` + `DATABASE_URL` (URL-encoded password) | `DATABASE_URL` is the live Prisma connection. Must be set on VPS `.env`. | **yes** | From cPanel MySQL or VPS `env` (never paste into chat). |
| 3.4 | **Backup location & restore** — where does `scripts/backup-mysql.sh` write (`/home/aloeduca/alo-web-crm-shared/backups`) and is that dir on durable storage? When was last backup? | Production data must be restorable; `db push` risk noted. | **yes** | `ls -lh /home/aloeduca/alo-web-crm-shared/backups` + `mysqldump` test on VPS |
| 3.5 | **Preserve prod data?** | If DB already has live students/applications, `migrate deploy` is safe (additive) but `db push --accept-data-loss` (in `deploy.sh`) would be destructive. | **yes** | Confirm: “fresh DB, OK to seed” vs “existing data, preserve”. |

### 4. Application secrets

| # | Question | Why | Required? | How to find |
|---|---|---|---|---|
| 4.1 | `NEXTAUTH_SECRET` / `AUTH_SECRET` / `JWT_SECRET` / `SESSION_SECRET` | NextAuth JWT signing; losing this invalidates all sessions. Must be **long random** (≥32 chars), **same across deploys** (do NOT rotate without logout window). | **yes — blocking** | Generate once: `openssl rand -base64 48` on VPS, paste into `.env` via `nano` (not chat). |
| 4.2 | `ENCRYPTION_KEY` | AES-256-GCM for `token-encryption.ts` (32-byte hex = 64 hex chars). Wrong length crashes prod. | **yes — blocking** | `openssl rand -hex 32` on VPS. |
| 4.3 | `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | First SUPER_ADMIN (`prisma/seed-complete.ts` requires ≥12 chars). | **yes for fresh DB**, no for existing | Generate: strong password (12+ chars), store in password manager. |
| 4.4 | Which of the 50+ integration secrets are launch-required? — at minimum: SMTP `MAIL_*/SMTP_*`, WhatsApp `WHATSAPP_ACCESS_TOKEN/PHONE_NUMBER_ID/APP_SECRET/VERIFY_TOKEN`, and one AI key | Without SMTP, employee activation emails fail; without WhatsApp secrets, WhatsApp sends fall back to `log-fallback` only. | **SMTP is blocking**, others optional per launch scope | Decide scope: “launch with email-only, WhatsApp after Meta app approved” vs full. Enter each secret directly on VPS `.env`. |
| 4.5 | Where to enter secrets securely | Secrets must never appear in chat, logs, or GitHub. | **yes** | VPS: `nano .env` + `chmod 600 .env`; GitHub deploy: `DEPLOY_SSH_KEY` is a GitHub Secret (not a file on disk). |

> **Safe non-secret config you MAY share in chat:** `APP_URL`, `MAIL_HOST` (not password), `PORT`, `WHATSAPP_GRAPH_VERSION` version string, domain names. **Never** share: `*_SECRET`, `*_PASSWORD`, `*_TOKEN`, `PRIVATE_KEY`, full `DATABASE_URL` with password.

### 5. External integrations

| # | Question | Why | Required? | How to find |
|---|---|---|---|---|
| 5.1 | Which integrations are **launch-required**? (email, WhatsApp, AI, payment, telephony, social login) | Each needs env + callback URLs; scoping avoids blocking on non-critical approvals. | **yes** | Check product scope with stakeholders |
| 5.2 | WhatsApp/Meta app setup — Business Manager verified? Phone number ID approved? Webhook URL `https://aloeducation.com/api/whatsapp/webhook` subscribed with `VERIFY_TOKEN`? Graph version locked to `v20`? | Determines whether WhatsApp will deliver; `verifyWhatsAppSignature` will reject if `APP_SECRET` mismatched. | if WhatsApp required | Meta Developers Console → WhatsApp → API Setup |
| 5.3 | Email deliverability — is `mail.aloeducation.com:465` (SSL) reachable from VPS, SPF/DKIM set for `aloeducation.com`? | Otherwise activation emails land in spam / `sendEmail` falls back to log only. | **yes** | cPanel → Email → Deliverability; `telnet mail.aloeducation.com 465` on VPS |
| 5.4 | Social OAuth apps — FB/IG/LinkedIn app IDs ready? Redirect URIs set to `https://aloeducation.com/api/auth/callback/*`? | `FACEBOOK_APP_SECRET` etc. only work with correct redirect. | if social login required | Meta/LinkedIn Developer portals |
| 5.5 | n8n / ComfyUI / Vaultwarden / Ghost / Nextcloud — are self-hosted instances running? URLs? | Determines optional `N8N_WEBHOOK_URL`, `COMFYUI_API_URL`, etc. | no | Self-host dashboard or Docker `ps` |
| 5.6 | AI provider mode — test vs production keys, rate limits, billing | Free-tier OpenRouter models may rate-limit on launch day. | no | OpenRouter / Groq dashboards |

### 6. Operations

| # | Question | Why | Required? | How to find |
|---|---|---|---|---|
| 6.1 | **Email sender** — `MAIL_FROM_ADDRESS` `noreply@aloeducation.com` verified? `MAIL_FROM_NAME`? | Must match SMTP account or mail is rejected. | **yes** | cPanel → Email Accounts |
| 6.2 | **File/object storage** — is `storage/` (`STORAGE_POOL_C`) on VPS disk, S3, or cPanel `public_html`? Permissions `700`? Backup included? | `storage-service.ts` writes UUID files; wrong path → uploads fail with `ENOENT`. | **yes** | `ls -ld storage; df -h` on VPS |
| 6.3 | **Queues/workers** — should we install Redis (`REDIS_URL`) for rate-limit + queues, or stay on `MemoryRedis` (single-instance)? | `MemoryRedis` loses state on restart; fine for 1 pm2 instance. | no | Decide scaling: 1 vs N instances |
| 6.4 | **Scheduled jobs** — install `cron-scheduler.sh` as `crontab -e` entry? `ALO_CRON_SECRET` + `ALO_APP_URL` values? | Without crontab, `analytics`, `followup`, `sla-monitor` never run. | **yes** (if follow-up/SLA needed) | See §6.8 |
| 6.5 | **Monitoring / logs** — is `pm2 logs` + `storage/logs/pm2-*.log` sufficient, or do you need Uptime Kuma / Sentry / Prometheus? External alert for `GET /api/health`? | Degraded DB (`status degraded`) must page someone. | **yes** | Check VPS `pm2 logs` + set Uptime Kuma `https://aloeducation.com/api/health` |
| 6.6 | **Backup policy** — daily `mysqldump` via `scripts/backup-mysql.sh` to `/home/aloeduca/alo-web-crm-shared/backups`, retention (7/30 days), off-site copy, restore drill | Without backups, `migrate deploy` risk is unrecoverable. | **yes** | Approve path & cron; test restore to staging |

---

## 5) Safe validation (actually run — non-destructive)

> Ran in sandbox `/home/user/alo_education_z....ai` with no secrets, no DB, no network to `binaries.prisma.sh`. Results are verbatim.

| Check | Command | Result | Meaning |
|---|---|---|---|
| **Prisma validate** | `npx prisma validate` | **FAILED — network** `request to https://binaries.prisma.sh/.../schema-engine.gz.sha256 failed, reason: Client network socket disconnected before secure TLS connection was established` | `schema.prisma` syntax **could not be verified** offline. Must re-run on VPS where `binaries.prisma.sh` is reachable. Schema *looks* valid but not proven. |
| **Package lock** | `npm ls` + `node -e lockfileVersion` | `lockfileVersion 3`, `npm ls` lists `@dnd-kit` etc. without top-level errors | Lockfile consistent; `npm ci` should work on VPS. |
| **ESLint** | `npm run lint` (`eslint .`) | **5 errors, 1 warning** — see below | Not live-blocking but must fix before production lint gate. |
| **TypeScript** | `npx tsc --noEmit --skipLibCheck` | **Failed — ~40 errors** (pre-existing, not from 11-repo batch which alone is clean) | `strict` fails; build may still pass via `next build` (which is looser) but TS gate fails. |
| **Vitest (all)** | `npm test` (`vitest run`) | **131 tests: 130 passed, 1 failed** — `tests/unit/deployment-config.test.ts` expect on `deploy-production.yml` | Deployment mismatch detected (see deploy-config detail). |
| **Deployment-config tests** | `npx vitest run tests/unit/deployment-config.test.ts` | **12 tests: 11 passed, 1 failed** | Failure below. |
| **Production build** | `npm run build` (`prisma generate && next build --webpack && prepare-standalone`) | **FAILED at `prisma generate`** — same network error as validate (`binaries.prisma.sh` disconnected) — **no `.next/standalone` produced** | Build **cannot be verified** in sandbox; must be run on VPS with network. `EXIT:0` in wrapper is misleading — `prisma generate` error is the blocker but script did not abort in this timed run? Full log shows error; actual build would fail. |
| **Health / routes** | `cat src/app/api/health/route.ts` + `find src/app/api -name route.ts` | `health` present (`ok/degraded`), **748 API routes** + **336 pages** inventoried | Route inventory done without running. |
| **Secret scan (no values)** | `git ls-files | grep .env` + `grep -r DATABASE_URL .env.example` | Only `.env.example` tracked; placeholders only | No secrets leaked to Git. |
| **`npm audit`** | `npm audit` | **12 vulns** (4 moderate, 7 high, 1 critical) — `sharp`, `uuid`, `gaxios` via Firebase | Must run `npm audit fix` (some fixes outside range) — not live-blocking but track. |
| **Auth/RBAC** | Not run (needs DB) | **not verifiable** offline | Must run `prisma db seed` + login flow on staging. |

**Detail: ESLint errors (5)**
```
src/components/website/ServiceDetailHub.tsx:82:149 'Calendar' is not defined
src/lib/employee-access-engine.ts:133 Do not assign to variable `module`
src/components/student/...: react-hooks/immutability (fetchProfile)
... + 2 others
```

**Detail: TypeScript errors (sample, ~40 total)**
```
src/lib/agentos/agent-service.ts:8 Cannot find member 'AgentDefinition' in '@prisma/client' (prisma generate not run)
src/lib/rbac/*: No PortalRole/PortalPermission export (schema drift vs code)
src/lib/sms-gateway.ts:45 Property 'send3cxSms' does not exist
... plus prior course-finder/visa/prisma whereInput errors
```
> These errors are **pre-existing** on `main` (not from the 11-repo add). They do NOT affect the 11 new files (`doodle-note`, `cap`, `vaultwarden`, `ghost`, `twenty`, `languagetool`, `umami`, `nextcloud`, `chatwoot`, `double-entry`, `wacrm` — verified `npx tsc` filtered to those: **0 errors**).

**Detail: Deployment-config failure (1)**
```
tests/unit/deployment-config.test.ts:64
expect(workflow).toMatch(/3044/);  // ok
expect(workflow).not.toMatch(/reset --hard origin\/main/); // FAILS
// workflow HAS `git reset --hard origin/main` — test forbids destructive reset
```
Test intent: forbid `reset --hard` on live (it discards uncommitted VPS fixes and is non-rollback-safe). Workflow currently does `git reset --hard origin/main` — test correctly flags it.

**What could NOT be tested (needs VPS/network/DB):**
- `prisma migrate deploy` / `prisma db push` / `prisma generate` (network to `binaries.prisma.sh`)
- `next build` complete + `prepare-standalone.mjs` (blocked on Prisma)
- `curl /api/health` live
- MySQL connectivity (`DATABASE_URL`)
- PM2 restart (`pm2` not in sandbox; `ecosystem.config.cjs` not exec’d)
- Nginx `nginx -t` / `certbot`
- Redis `PING`, IMAP/SMTP `telnet`, WhatsApp webhook verification

---

## 6) Deployment plan (step-by-step — actual commands)

Use the repo’s **actual** scripts. Do **not** execute without §4 answers and backup.

### 6.1 Missing files — safe templates (create on VPS only, never commit)

**File: `/root/alo-live/.env` (or `/root/alo-github-main-new/.env` — pick one canonical dir)**
Create from `.env.example` as base. Below is the **consolidated** template (duplicates removed, mismatches noted). Replace every `REPLACE_WITH_…` on the VPS itself (`nano .env`). `chmod 600 .env`.

```env
# === Core ===
NODE_ENV=production
APP_ENV=production
APP_DEBUG=false
HOSTNAME=0.0.0.0
PORT=3044
TZ=Asia/Dhaka
APP_URL=https://aloeducation.com
NEXT_PUBLIC_APP_URL=https://aloeducation.com
NEXTAUTH_URL=https://aloeducation.com
PUBLIC_WEBSITE_URL=https://aloeducation.com

# === Database (MySQL 8.4) — keep MYSQL_* and DATABASE_URL in sync ===
MYSQL_ROOT_PASSWORD=REPLACE_WITH_LONG_RANDOM_ROOT_PASSWORD
MYSQL_DATABASE=aloeduca_alo_education
MYSQL_USER=aloeduca_ALO_final_web_crm
MYSQL_PASSWORD=REPLACE_WITH_LONG_RANDOM_DATABASE_PASSWORD
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=aloeduca_alo_education
DB_USERNAME=aloeduca_ALO_final_web_crm
DB_PASSWORD=REPLACE_WITH_REAL_PASSWORD
DATABASE_URL="mysql://aloeduca_ALO_final_web_crm:REPLACE_WITH_URL_ENCODED_PASSWORD@localhost:3306/aloeduca_alo_education?connection_limit=10"

# === Secrets (generate on VPS: openssl rand -base64 48 / openssl rand -hex 32) ===
NEXTAUTH_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
AUTH_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
JWT_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
SESSION_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
ENCRYPTION_KEY=REPLACE_WITH_REQUIRED_32_BYTE_HEX_KEY  # openssl rand -hex 32 = 64 hex chars
ALO_CRON_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET       # for X-Cron-Secret; NOT in .env.example — add

# === Super admin seed (only for fresh DB) ===
SEED_SUPER_ADMIN_EMAIL=admin@aloeducation.com
SEED_SUPER_ADMIN_PASSWORD=REPLACE_WITH_UNIQUE_ONE_TIME_ADMIN_PASSWORD_12PLUS

# === Email (cPanel) ===
# NOTE: set BOTH MAIL_* and SMTP_* to same values until code is unified
MAIL_FROM_ADDRESS=noreply@aloeducation.com
MAIL_FROM_NAME="ALO Education"
MAIL_HOST=mail.aloeducation.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USERNAME=noreply@aloeducation.com
MAIL_PASSWORD=REPLACE_WITH_EMAIL_PASSWORD
SMTP_HOST=mail.aloeducation.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@aloeducation.com
SMTP_PASSWORD=REPLACE_WITH_EMAIL_PASSWORD
# optional IMAP/POP3 for inbound — leave empty if not used
IMAP_HOST=mail.aloeducation.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USERNAME=noreply@aloeducation.com
IMAP_PASSWORD=REPLACE_WITH_EMAIL_PASSWORD

# === Storage ===
STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads   # cPanel path; change for VPS (/root/alo-live/storage/uploads)

# === WhatsApp / Meta (canonical) ===
WHATSAPP_ACCESS_TOKEN=REPLACE_WITH_META_CLOUD_TOKEN
WHATSAPP_PHONE_NUMBER_ID=REPLACE_WITH_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=REPLACE_WITH_WABA_ID
WHATSAPP_APP_SECRET=REPLACE_WITH_APP_SECRET
WHATSAPP_VERIFY_TOKEN=REPLACE_WITH_RANDOM_VERIFY_TOKEN  # must match Meta webhook verify token
WHATSAPP_GRAPH_VERSION=v20.0
WHATSAPP_BUSINESS_PHONE=01805020100
# ALO number pool
ALO_MAIN_WHATSAPP_NUMBER=01805020100
ALO_COMPLAINT_WHATSAPP_NUMBER=01805020100
ALO_FOLLOWUP_WHATSAPP_NUMBER=01805020100
ALO_COO_WHATSAPP_NUMBER=01805020101
ALO_24_7_SUPPORT_NUMBER=01805020101
ALO_EMPLOYEE_WHATSAPP_START=01805020102
ALO_EMPLOYEE_WHATSAPP_END=01805020119

# === AI ===
GROQ_API_KEY=
OPENROUTER_API_KEY=
ZAI_API_KEY=
AI_DEFAULT_MODEL=glm-4-flash
AI_FAST_MODEL=glm-4-flash
AI_SMART_MODEL=glm-4-plus
AI_AGENT_MODEL=glm-4-flash
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_SITE_URL=https://aloeducation.com
OPENROUTER_APP_NAME="ALO Education WhatsApp AI"

# === Firebase (if used) ===
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nREPLACE_WITH_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# === OAuth (if social login used) ===
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
META_API_KEY=

# === Telephony / SMS (if used) ===
THREECX_API_URL=
THREECX_API_TOKEN=
SMS_PROVIDER_API_KEY=
EMAIL_PROVIDER_API_KEY=
HTTPSMS_API_KEY=
HTTPSMS_PHONE_ID=
SMS_PROVIDER=threecx

# === Health / deploy ===
HEALTH_PORT=3044
PM2_NAME=alo-education
DEPLOY_DIR=/root/alo-live
REDIS_URL=redis://127.0.0.1:6379
N8N_WEBHOOK_URL=
N8N_AUTH_HEADER=
ALO_APP_URL=https://aloeducation.com

# === Optional addons (11-repo batch) — leave empty if self-host not running ===
COMFYUI_API_URL=
COMFYUI_API_KEY=
VAULTWARDEN_URL=
VAULTWARDEN_TOKEN=
GHOST_URL=
GHOST_ADMIN_API_KEY=
GHOST_CONTENT_API_KEY=
NEXTCLOUD_URL=
NEXTCLOUD_USERNAME=
NEXTCLOUD_PASSWORD=
UMAMI_URL=
UMAMI_WEBSITE_ID=
CHATWOOT_URL=
CHATWOOT_API_KEY=
LANGUAGETOOL_URL=https://api.languagetool.org
DOODLE_NOTE_MODEL=gpt-4o-mini
```

### 6.2 Required env vars & secure entry locations

| Location | How to set | Secret vs non-secret |
|---|---|---|
| **VPS `/root/alo-live/.env`** | `ssh $DEPLOY_USER@$DEPLOY_HOST -p $DEPLOY_PORT` → `nano /root/alo-live/.env` (create from template above, `chmod 600`) | All secrets live here. |
| **GitHub Actions Secrets** (deploy only) | `GitHub repo → Settings → Secrets and variables → Actions → New repository secret`: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (private key), `DEPLOY_PORT` | **Only SSH deply secrets** — never app secrets. App secrets stay on VPS, not in GitHub. |
| **Docker** (if used) | Same `.env` file mounted as `env_file: - .env` | — |
| **Verification** | On VPS: `grep -c "REPLACE_WITH" /root/alo-live/.env` must be `0` before start; `node -e "console.log(process.env.DATABASE_URL?'set':'missing')"` | Report only `set/missing`, not the value. |

### 6.3 Credential rotation (if needed)

- If any secret was ever pasted into chat/GitHub/logs, **rotate immediately** on provider (Meta token, SMTP password, DB password) and update VPS `.env` + `pm2 restart --update-env`.
- `NEXTAUTH_SECRET`/`AUTH_SECRET` rotation logs out all users — do during maintenance window and warn staff.
- `ENCRYPTION_KEY` rotation **must** include re-encryption of existing `token-encryption.ts` rows — do not rotate until a migration script exists.

### 6.4 Database backup & migration plan

1. **Backup before any migration** (on VPS, as deploy user):
   ```bash
   bash scripts/backup-mysql.sh        # writes /home/aloeduca/alo-web-crm-shared/backups/aloeduca_alo_education_YYYYMMDD_HHMMSS.sql.gz
   ls -lh /home/aloeduca/alo-web-crm-shared/backups | tail
   # also keep a second copy off-site: scp or rclone
   ```
2. **Check migration status** (never on prod without backup):
   ```bash
   npx prisma migrate status           # shows pending / applied
   npx prisma validate                 # must pass (network required)
   ```
3. **Apply migrations** (additive, safe):
   ```bash
   npx prisma migrate deploy           # NOT `db push`, NOT `migrate dev`
   ```
   `deploy.sh` currently runs `prisma db push --accept-data-loss` — **replace with `migrate deploy` on live**. `db push` is for local dev only.
4. **Seed only on fresh DB** (after `migrate deploy`, if DB was empty):
   ```bash
   npx prisma db seed                  # or: npx tsx prisma/seed-complete.ts
   # writes SUPER_ADMIN from SEED_SUPER_ADMIN_* — change password immediately after
   ```
   If prod DB has data, **skip seed** (or run idempotent `upsert` seed only with `--` flag after backup).
5. **Verify**:
   ```bash
   npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT COUNT(*) FROM User;"
   ```

### 6.5 Build & test commands (actual repo scripts)

Run **on the VPS** as deploy user, in `/root/alo-live`:

```bash
# 1. Sync code (see §6.9 for safe workflow)
git fetch origin main
git status

# 2. Install (npm only — no bun.lock)
npm ci

# 3. Prisma client (needs network to binaries.prisma.sh)
npx prisma generate

# 4. Lint / typecheck / unit tests (non-destructive)
npm run lint
npx tsc --noEmit --skipLibCheck   # should be 0 new errors; pre-existing 40 noted
npm test                          # 130/131 pass expected until workflow fix

# 5. Build (produces .next/standalone)
npm run build                     # = prisma generate + next build --webpack + prepare-standalone.mjs
ls -lh .next/standalone/server.js  # must exist or deploy aborts
```

Do **not** run `prisma migrate dev` or `prisma db push` on live.

### 6.6 Service / process configuration

**PM2 (canonical live path):**
- Config: `ecosystem.config.cjs` (`PORT 3044`, `HOSTNAME 0.0.0.0`, `fork 1`, `max_memory_restart 2G`, logs `storage/logs/`)
- On VPS:
  ```bash
  mkdir -p storage/logs
  pm2 start ecosystem.config.cjs        # first start
  # or zero-downtime after code update:
  pm2 restart alo-education --update-env
  pm2 save
  pm2 startup                           # enable on boot
  pm2 describe alo-education | grep -E 'status|script path|exec cwd|node.js version'
  ss -lntp | grep 3044
  ```

**Docker (alternative, if host supports it):**
- Fix `Dockerfile` to npm **or** fix `bun.lock`:
  - Option A (npm, recommended): `FROM node:22-alpine` + `npm ci` + `npx prisma generate && npm run build`
  - Option B (Bun): keep `oven/bun:1` but commit `bun.lockb` (`bun install` must have it for `--frozen-lockfile`)
- Align port to **3044**: change `docker-compose.yml` `ports: "3044:3044"` + `nginx.conf` already 3044.

### 6.7 Domain, reverse-proxy, TLS

- **Nginx** (`nginx.conf` is ready for `aloeducation.com`/`www`):
  ```bash
  sudo nginx -t
  sudo mkdir -p ./certs
  # If no certs yet:
  sudo certbot --nginx -d aloeducation.com -d www.aloeducation.com
  # or if using the repo's self-managed certs path:
  sudo cp /etc/letsencrypt/live/aloeducation.com/fullchain.pem ./certs/fullchain.pem
  sudo cp /etc/letsencrypt/live/aloeducation.com/privkey.pem ./certs/privkey.pem
  sudo systemctl reload nginx
  # verify
  curl -I https://aloeducation.com
  ```
- **Caddy** — file not in repo; if VPS uses Caddy instead of Nginx, translate `nginx.conf` to `Caddyfile` (`reverse_proxy 127.0.0.1:3044`) and set `tls { ca https://acme-v02.api.letsencrypt.org/directory }`.

### 6.8 Worker, queue, webhook, scheduled-job setup

**Cron (required for follow-ups / SLA / analytics):**
- Add to **VPS `crontab -e`** (as deploy user):
  ```cron
  # ALO cron — every 5 minutes, gated on /api/health
  */5 * * * * ALO_APP_URL="https://aloeducation.com" ALO_CRON_SECRET="__from_env_ALO_CRON_SECRET__" /bin/bash /root/alo-live/scripts/cron-scheduler.sh >> /var/log/alo-cron.log 2>&1
  # Daily backup at 02:15 Dhaka
  15 2 * * * /bin/bash /root/alo-live/scripts/backup-mysql.sh >> /var/log/alo-backup.log 2>&1
  ```
- Also ensure **individual cron API routes** are reachable without cron if needed (manual `curl`):
  ```bash
  curl -s http://127.0.0.1:3044/api/cron/health | jq
  curl -s http://127.0.0.1:3044/api/cron/sla-monitor | jq
  curl -s http://127.0.0.1:3044/api/cron/followup | jq
  ```

**Redis / queues:** If `REDIS_URL` set, `ioredis` connects; otherwise `MemoryRedis` runs. For single pm2 instance this is fine. For multi-instance, set `REDIS_URL=redis://127.0.0.1:6379` and install Redis 7.x.

**Webhooks:**
- WhatsApp: Meta console → Webhooks → Callback URL `https://aloeducation.com/api/whatsapp/webhook` + Verify Token (`WHATSAPP_VERIFY_TOKEN`) + Subscribe `messages`, `message_status` — token must match `.env`.
- n8n: set `N8N_WEBHOOK_URL` + `N8N_AUTH_HEADER` in `.env` if `triggerWorkflow` is used.

### 6.9 Deployment & rollback (actual repo workflow)

**Current workflow (`.github/workflows/deploy-production.yml`):** Push to `main` → SSH → `git reset --hard origin/main` → `npm ci` → `prisma generate` → `migrate deploy` → `npm run build` → `pm2 restart` → `curl http://127.0.0.1:3025`

**Fix before live:** Port `3025` → `3044` and replace destructive `reset --hard` with safe fetch+checkout if you want rollback.

**Recommended safe deploy (manual, first time):**
```bash
# on VPS
cd /root/alo-live
git fetch origin main
git rev-parse HEAD > /tmp/pre-deploy.sha  # save rollback point
git checkout main
git pull --ff-only origin main            # safer than reset --hard
npm ci
npx prisma generate
bash scripts/backup-mysql.sh
npx prisma migrate deploy
npm run build
pm2 restart alo-education --update-env
sleep 6
curl -fsS http://127.0.0.1:3044/api/health | jq
curl -fsS https://aloeducation.com/api/health | jq  # if Nginx up
```

**Workflow fix (next commit):**
```diff
-      - "3044" not found check + grep ':3025' → change to ':3044'
-      - `git reset --hard origin/main` → `git checkout main && git pull --ff-only origin/main`
-      - health check curl `http://127.0.0.1:3025/` → `http://127.0.0.1:3044/api/health`
```

**Rollback:**
```bash
# on VPS
cd /root/alo-live
BAD=$(cat /tmp/pre-deploy.sha)
git reset --hard $BAD
npm ci
npx prisma generate
# only if migration was applied and must be reverted (needs `prisma migrate resolve --rolled-back <name>`):
npx prisma migrate resolve --rolled-back "20260913050000_benchmark_capabilities"
npm run build
pm2 restart alo-education --update-env
# restore DB if needed:
gunzip -c /home/aloeduca/alo-web-crm-shared/backups/aloeduca_alo_education_YYYYMMDD_HHMMSS.sql.gz | mysql -h localhost -u aloeduca_ALO_final_web_crm -p aloeduca_alo_education
```

### 6.10 Post-deploy smoke tests & monitoring

**Smoke tests (same as `deploy.sh` steps 20-21, on VPS):**
```bash
BASE=http://127.0.0.1:3044
for p in "/" "/universities" "/courses" "/destinations" "/course-finder" "/about" "/contact" "/api/health"; do
  curl -s -o /dev/null -w "%{http_code} $p\n" $BASE$p
done
curl -fsS http://127.0.0.1:3044/api/health | python3 -m json.tool
curl -fsS https://aloeducation.com/api/health | python3 -m json.tool   # public
```

**Monitoring:**
- `pm2 logs alo-education --lines 100` + `tail storage/logs/pm2-*.log`
- `scripts/health-check.sh` (local `3044`) + `scripts/health-check.sh --public` (https)
- Uptime Kuma / Better Uptime → `https://aloeducation.com/api/health` every 60s, alert if `status != ok` for 2 consecutive checks.
- `pm2 save && pm2 startup` to survive reboot.
- Daily backup cron + weekly restore drill to staging.

---

## 7) Final report

### Verdict: **NOT READY** — 4 blocking, 7 non-blocking, 3 not verifiable

**Do NOT deploy** until blockers and §4 answers are addressed. The project is **not live** and was **not deployed** in this audit (read-only). Nothing claims “zero errors” or “production-ready” — checks below show failures.

### 7.1 Files — found / missing / duplicated / unsafe

| Category | Detail |
|---|---|
| **Found & safe** | `.env.example` (placeholders only, tracked), `package.json`+`package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `prisma/schema.prisma` + 10 migrations, `ecosystem.config.cjs`, `nginx.conf`, `src/app/api/health/route.ts`, `src/lib/{db,storage-service,redis,n8n,email-service,whatsapp-cloud-api}` and 748+ api routes, 336 pages, `scripts/{backup-mysql,cron-scheduler,health-check,prepare-standalone,mjs}` |
| **Missing (blocking)** | **No `.env` on live** (expected in sandbox, but required on VPS before any start), **no `ALO_CRON_SECRET` in `.env.example`** (cron will 401), **no `REDIS_URL` in `.env.example`** (optional but should be templated) |
| **Duplicated / conflicting** | `.env.example`: `WHATSAPP_VERIFY_TOKEN` ×2 (empty + `CHANGE_ME`), `WHATSAPP_GRAPH_VERSION` ×2 (`v18` vs `v20`), `WHATSAPP_*` triplicate token naming, `MAIL_*` vs `SMTP_*` mismatch (email will silently no-op), `Dockerfile` (Bun) vs `package.json`+workflow (npm) clash, port `3000` (compose) vs `3044` (pm2/nginx) vs `3025` (workflow health check) |
| **Unsafe** | `deploy.sh` line `prisma db push --accept-data-loss` is **destructive on live with data**; `deploy-production.yml` `git reset --hard origin/main` is destructive and non-rollback-safe (flagged by test) |

### 7.2 Env var names missing (without values)

All of these are **names only** — provide values only on VPS `.env`, never in chat:

- **Blocking secrets** (must be set, long random): `NEXTAUTH_SECRET`, `AUTH_SECRET`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY` (64 hex chars), `DATABASE_URL` / `MYSQL_PASSWORD` / `DB_PASSWORD`, `MAIL_PASSWORD`/`SMTP_PASSWORD`, `ALO_CRON_SECRET` (missing from template — must be added)
- **Blocking DB** (must match cPanel): `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `DATABASE_URL`, `DB_HOST/PORT/DATABASE/USERNAME/PASSWORD`
- **Conditionally blocking** (if scope includes): `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (5 names — triplicate alias must be consolidated), `MAIL_HOST/PORT/USERNAME/PASSWORD` or `SMTP_HOST/PORT/USER/PASSWORD` (email), `SEED_SUPER_ADMIN_PASSWORD` (≥12 chars for fresh DB)
- **Not verifiable whether set** (because no `.env` exists): every integration key listed in §1.7 — report as “present in template, empty placeholder, must be set if feature is launch-required”

### 7.3 Tests actually run & exact results

| Test | Ran? | Exact result | Pass? |
|---|---|---|---|
| `prisma validate` | **yes** | `Error: request to https://binaries.prisma.sh/.../schema-engine.gz.sha256 failed ... Client network socket disconnected` | **FAIL (network)** — cannot verify schema ↔ migration match |
| `npm ci` lock check | yes (via `npm ls`) | `lockfileVersion 3`, deps list normal | PASS |
| `npm run lint` | **yes** | **5 errors, 1 warning** (Calendar undef, assign-to-module, react-hooks) | **FAIL** |
| `npx tsc --noEmit --skipLibCheck` | **yes** | **~40 errors** (AgentDefinition, PortalRole, CommunicationThreadWhereInput, sla-engine `never`, sms-gateway `send3cxSms`, electron) — **11 new lib files: 0 errors** | **FAIL** (pre-existing) |
| `npm test` (Vitest 131 tests) | **yes** | **130 passed, 1 failed** — `deployment-config.test.ts` forbids `reset --hard` | **FAIL** |
| `npx vitest run tests/unit/deployment-config.test.ts` | **yes** | **11/12 passed** — failed `nginx target is 3044...` on `reset --hard` line | **FAIL** |
| `npm run build` | **yes** | **FAILED at `prisma generate`** — same `binaries.prisma.sh` network error (same root cause as validate) | **FAIL (network)** — no `.next/standalone` built in sandbox |
| `npm audit` | **yes** | **12 vulns** (4 moderate, 7 high, 1 critical: `sharp`, `uuid`, `gaxios`) | WARN |
| `curl /api/health` | **not runnable** (no DB, no running app) | — | **not verifiable** |
| `prisma migrate status` / `prisma db push` | **not run** (destructive / needs DB) | — | **not verifiable** |

No issue was **fixed** in this audit — **all issues are identified only** (read-only per instructions). No file was modified, no migration run, no secret rotated, no backup taken, no deploy executed.

### 7.4 Issues fixed vs identified

- **Fixed:** *none* (read-only pass — as requested).
- **Identified:** §2 duplicates, §3 port/manager clashes, §5 lint/TS/test/build failures, §7.3 audit results, §4 missing info.

### 7.5 Information / access still required from you

Answer **all** of §4 (22 questions across 6 sections). At minimum, before any build on VPS, provide:

1. Hosting/OS + SSH deploy dir decision (`/root/alo-live` vs `-new`) — §4 #1.1-1.2
2. Whether app is already running and on which port — §4 #1.5
3. Domain DNS/TLS status — §4 #2.3
4. Approval to unify port to **3044** — §4 #2.5
5. DB engine/version + whether DB/user exist + whether prod data must be preserved — §4 #3.1, #3.2, #3.5
6. Which integrations are launch-required vs deferred — §4 #5.1
7. File storage path + backup retention — §4 #6.2, #6.6

Provide these as **“set / not set / not applicable”** flags, not secret values.

### 7.6 Next safe action

**Do NOT run migrations or deploy.** Do this sequence:

1. **Answer §4** (hosting, domain, DB, secrets scope, operations).
2. On **VPS**, create `/root/alo-live/.env` from §6.1 template (fill `REPLACE_WITH_…` via `nano`, `chmod 600`, verify `grep -c REPLACE_WITH → 0`), and apply §6.2 duplicates fix to `.env.example` (single commit, no secrets).
3. On **VPS**, fix the two code blockers (one-commit each, no secrets):
   - `ecosystem.config.cjs` + `nginx.conf` + workflow port → **3044** everywhere
   - `Dockerfile` → switch to `node:22-alpine` + `npm ci` (or commit `bun.lock`)
   - `src/lib/email-service.ts` → read `MAIL_*` **or** `SMTP_*` (alias)
   - `deploy.sh` → replace `prisma db push --accept-data-loss` with `prisma migrate deploy`
   - `deploy-production.yml` → replace `reset --hard` with `pull --ff-only` + fix `3025→3044`
4. On **VPS** (with network), run the non-destructive gates:
   ```bash
   npm ci && npx prisma validate && npx prisma generate
   npm run lint --fix; npx tsc --noEmit --skipLibCheck; npm test
   npx prisma migrate status && npm run build && ls -lh .next/standalone/server.js
   bash scripts/health-check.sh   # after `pm2 start`
   ```
5. Then schedule the migration window: `bash scripts/backup-mysql.sh` → `npx prisma migrate deploy` → `pm2 restart --update-env` → smoke tests ( §6.10).

> Until steps 1-4 pass (`prisma validate` PASS, `lint` 0 errors, `typecheck` 0 errors or acknowledged, `vitest` 131/131, `build` produces `server.js`), the verdict stays **NOT READY**. After those gates + DB backup + network-validated build, verdict can move to **READY** for a canary deploy.

---

**Artifacts for your records:** This report `docs/final-master/ENV_AUDIT_LIVE_READINESS_REPORT.md` + `cat` outputs on file. No secrets were committed; no destructive command was run.
