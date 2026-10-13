# CPANEL_DEPLOYMENT_GUIDE.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — cPanel Deployment Guide (27-Step Production Procedure) |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Step-by-step, command-by-command deployment procedure for Alaminn.info on cPanel shared/VPS hosting with MySQL 8, Phusion Passenger, and the Next.js 16 standalone build. Each step states the command, the **WHY**, the **success signal**, and the **failure recovery**. |

---

## Audience

This guide is written for the operator who has terminal/SSH access to the cPanel host and is performing the **first production deploy** or a **clean redeploy**. After completing all 27 steps, the platform is live at `https://alaminn.info` with database, backups, crons, and health monitoring configured.

## Production target

| Item | Value |
|---|---|
| Application root | `/home/aloeduca/alaminn.info` (OUTSIDE `public_html`) |
| Domain | `https://alaminn.info` |
| Database | MySQL 8.0.37 · `aloeduca_alamin_crm` · `utf8mb4_unicode_ci` |
| Database user | `aloeduca_alamin_crm` |
| Entry point | `server.js` (loads `.env`, boots `.next/standalone/server.js`) |
| Node version | 22.x preferred (20.x minimum) |
| App mode | Production |
| Framework | Next.js 16 App Router · TypeScript · Tailwind 4 · shadcn/ui |
| ORM | Prisma 6 (SQLite dev, MySQL 8 prod) |
| Models | 55 (grouped by Identity, CRM, Higher Study, English Learning, Audit, Media) |

## Pre-flight checklist (verify before starting)

- [ ] cPanel account with Terminal access (cPanel → Advanced → Terminal) OR SSH
- [ ] Domain `alaminn.info` DNS A record points at the cPanel server
- [ ] Node.js 22.x available (cPanel → Software → Setup Node.js App shows Node 22.x)
- [ ] MySQL 8 wizard available (cPanel → Databases → MySQL Database Wizard)
- [ ] The `alaminn-info-cpanel.zip` package uploaded to the server home directory
- [ ] ALO Education shared the four integration secrets (see Step 9)

---

## Step 1 — Backup current state (if redeploying)

### Command
```bash
# Skip on first deploy (nothing exists yet)
cd ~
[ -d alaminn.info ] && tar -czf alaminn.info.predeploy.$(date +%Y%m%d_%H%M%S).tgz \
  --exclude='alaminn.info/node_modules' \
  --exclude='alaminn.info/.next' \
  alaminn.info/ || echo "First deploy — no prior state to back up."

# Database safety snapshot
[ -f alaminn.info/.env ] && bash alaminn.info/scripts/backup.sh || true
```

### Why
If this is a redeploy over an existing install, you must be able to roll back. The tar preserves source code + `.env` + Prisma migrations. The DB snapshot preserves the live data so a failed migration can be reversed.

### Success
- Tar file appears in `~/alaminn.info.predeploy.YYYYMMDD_HHMMSS.tgz` (~5–20 MB)
- `storage/backups/alaminn_info_YYYYMMDD_HHMMSS.sql.gz` exists with matching `.sha256`

### On failure
- `tar: Cannot open: No such file` → first deploy, safe to ignore
- `backup.sh: command not found` → run from app root: `cd alaminn.info && bash scripts/backup.sh`
- DB snapshot fails → check `.env` has `DATABASE_URL=mysql://...` and MySQL is reachable

---

## Step 2 — Upload the project ZIP

### Command
```bash
# Option A: cPanel File Manager upload (manual)
# Option B: SSH/scp from your local machine
scp alaminn-info-cpanel.zip aloeduca@YOUR_SERVER_IP:~/
```

### Why
The cPanel Node.js Application Manager requires the source on disk. Uploading a single ZIP and extracting in the next step is far faster than rsync over a slow link.

### Success
- `~/alaminn-info-cpanel.zip` exists
- `ls -lh alaminn-info-cpanel.zip` shows 30–80 MB

### On failure
- `scp: connection refused` → SSH port may be 22 (default) or a custom port; verify in cPanel → Security → SSH Access
- ZIP is corrupted (size < 5 MB) → re-download from the build artefacts

---

## Step 3 — Extract the archive

### Command
```bash
cd ~
unzip -q alaminn-info-cpanel.zip -d alaminn.info
ls alaminn.info/ | head -20
```

### Why
The ZIP contains the full project tree; extraction produces the application root at `/home/aloeduca/alaminn.info`. The folder name MUST be `alaminn.info` (the cPanel Node.js App Manager maps "Application root" → `/home/<user>/<root>`).

### Success
- `package.json`, `server.js`, `prisma/`, `src/`, `deploy/cpanel/`, `scripts/`, `public/` are visible
- No "end-of-central-directory signature not found" error

### On failure
- `unzip: command not found` → install `unzip` via `yum install unzip` (VPS) or use cPanel File Manager's Extract button
- Wrong folder name → `mv extracted-folder alaminn.info`

---

## Step 4 — Set ownership

### Command
```bash
chown -R aloeduca:aloeduca ~/alaminn.info
ls -ld ~/alaminn.info
```

### Why
Passenger runs the app as the cPanel account user (`aloeduca`). Files owned by `root` or another user are not readable/executable by Passenger and produce 502/503 errors.

### Success
- `ls -ld` shows `drwxr-xr-x ... aloeduca aloeduca ... alaminn.info`
- All files recursively owned by `aloeduca:aloeduca`

### On failure
- `chown: changing ownership of 'X': Operation not permitted` → you must run as root or via sudo; on shared cPanel without root, contact hosting support
- File manager upload created files owned by `nobody` → run `chown` again, then `find . -type d -exec chmod 755 {} \;`

---

## Step 5 — Set permissions

### Command
```bash
cd ~/alaminn.info

# Directories: 755 (rwxr-xr-x)
find . -type d -not -path './node_modules/*' -exec chmod 755 {} \;

# Files: 644 (rw-r--r--)
find . -type f -not -path './node_modules/*' -not -path './.next/*' \
  -not -path './scripts/*' -exec chmod 644 {} \;

# Executable scripts
chmod 755 scripts/*.sh server.js

# .env must be 600 (only owner can read)
[ -f .env ] && chmod 600 .env

# Storage subdirs must be writable by the app
mkdir -p storage/backups storage/logs storage/uploads storage/exports
chmod 755 storage storage/*
```

### Why
- 755/644 is the cPanel-compatible default that lets Passenger read files without exposing them as world-writable (which would be a security flag).
- `chmod 600 .env` ensures the secrets file is readable ONLY by `aloeduca` — never world-readable.
- Scripts must be executable (`+x`) so cPanel cron can invoke them directly.

### Success
- `ls -la .env` shows `-rw-------` (mode 600)
- `ls -l scripts/backup.sh` shows `-rwxr-xr-x`
- `ls -ld storage/backups` shows `drwxr-xr-x`

### On failure
- `chmod: cannot access '.env': No such file or directory` → expected before Step 9 (`.env` doesn't exist yet)
- "Disk quota exceeded" → free up space in cPanel → Disk Usage

---

## Step 6 — Create the MySQL database

### Command (cPanel UI)
1. cPanel → **Databases → MySQL Database Wizard**
2. **New Database**: type `alamin_crm` → cPanel prefixes to `aloeduca_alamin_crm`
3. Click **Next Step**

### Why
The MySQL database is the single source of truth for all 55 Prisma models. Naming it `aloeduca_alamin_crm` matches the production `.env` template so the connection string works without edits.

### Success
- cPanel → **MySQL Databases → Current Databases** lists `aloeduca_alamin_crm` (0 tables)

### On failure
- "Database already exists" → either reuse it (drop tables first via `npx prisma migrate reset`) or pick a new name and update `DATABASE_URL` in `.env`
- "Database name too long" → cPanel limits database names to 64 chars including the username prefix; `aloeduca_alamin_crm` is well within

---

## Step 7 — Create the MySQL user

### Command (cPanel UI)
1. In the MySQL Database Wizard (continuing from Step 6):
2. **Username**: `alamin_crm` → cPanel prefixes to `aloeduca_alamin_crm`
3. **Password**: `ALO2026a` (or use the Password Generator for a stronger one)
4. **Password Generator**: enable "I have copied this password in a safe place" → click **Use Password**
5. Click **Create User**

### Why
The application connects to MySQL as this user. Reusing the same name for both database and user is conventional on cPanel and simplifies audit logs (queries in `slow_query_log` show `aloeduca_alamin_crm@localhost`).

### Success
- cPanel → **MySQL Databases → Current Users** lists `aloeduca_alamin_crm`

### On failure
- "Username already exists" → reuse the user; assign to the new DB in Step 8
- Password too weak → use ≥ 12 chars, mixed case, digits, symbols

---

## Step 8 — Grant ALL PRIVILEGES to the user on the database

### Command (cPanel UI)
1. In the MySQL Database Wizard (continuing from Step 7):
2. Check **ALL PRIVILEGES**
3. Click **Next Step**
4. Wizard confirms "User aloeduca_alamin_crm was added to database aloeduca_alamin_crm"

### Why
Prisma requires CREATE, ALTER, DROP, INDEX, INSERT, SELECT, UPDATE, DELETE, REFERENCES on the database for `prisma db push` and `prisma migrate deploy`. ALL PRIVILEGES is the simplest grant; on restricted hosting, ask the DBA for the minimum list above.

### Success
- cPanel → **MySQL Databases → Current Databases** shows `aloeduca_alamin_crm` with the user `aloeduca_alamin_crm` and a checkmark under "Privileged Users"
- Terminal test:
  ```bash
  mysql -u aloeduca_alamin_crm -p'ALO2026a' -e "SHOW DATABASES;" | grep alamin_crm
  ```
  Expect: `aloeduca_alamin_crm`

### On failure
- `ERROR 1045 (28000): Access denied` → password mismatch; reset via cPanel → MySQL Databases → Current Users → Change Password
- `ERROR 1044 (42000): Access denied for user ... to database` → user lacks privileges; re-grant ALL PRIVILEGES
- Ensure the database collation is `utf8mb4_unicode_ci`:
  ```bash
  mysql -u aloeduca_alamin_crm -p'ALO2026a' -e \
    "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME \
     FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='aloeduca_alamin_crm';"
  ```
  Expect: `utf8mb4` / `utf8mb4_unicode_ci`

---

## Step 9 — Add environment variables (create `.env`)

### Command (Terminal)
```bash
cd ~/alaminn.info

# Copy the production template (already configured for MySQL 8)
cp deploy/cpanel/.env.production .env
chmod 600 .env

# Edit secrets BEFORE going live
nano .env
```

### What to change in `.env`
| Variable | Change to |
|---|---|
| `ADMIN_PASSWORD` | A strong unique password (≥ 12 chars, mixed case, digits, symbols) |
| `SMTP_PASSWORD` | Your cPanel email account password (Step 19) |
| `SMTP_USER` | Your actual cPanel email address (e.g. `noreply@alaminn.info`) |
| `CRON_SECRET` | `openssl rand -hex 32` (NEW — required by 11 cron endpoints) |
| `ALO_EDUCATION_API_URL` | The ALO Education API base URL (provided by ALO) |
| `ALO_EDUCATION_API_KEY` | The ALO Education server-to-server API key |
| `ALO_EDUCATION_SIGNING_SECRET` | Shared HMAC secret for verifying ALO callbacks |
| `HIGHER_STUDY_REFERRAL_SECRET` | Pre-filled with random hex; OK to keep, or regenerate with `openssl rand -hex 32` |
| `ENGLISH_LEARNING_REFERRAL_SECRET` | Pre-filled with random hex; OK to keep, or regenerate |
| `ENGLISH_PLATFORM_URL` | URL of the English Learning destination platform |
| `WHATSAPP_TOKEN` | Cloud API token (optional, leave blank if not used) |
| `WHATSAPP_PHONE_NUMBER_ID` | Cloud API phone number ID (optional) |
| `ANALYTICS_ID` | External analytics ID (optional, leave blank for first-party) |
| `ADMIN_EMAIL` | `admin@alaminn.info` (or your operational admin email) |
| `ADMIN_NAME` | `Al Aminn` (or your operational admin name) |
| `LOG_LEVEL` | `info` (lower to `debug` only for incident response) |

### Already pre-set (do NOT change unless you know why)
- `DATABASE_URL=mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm`
- `AUTH_SECRET` (HMAC cookie signing)
- `NEXTAUTH_URL=https://alaminn.info`
- `SMTP_HOST=mail.alaminn.info`
- `SMTP_PORT=465`
- `SMTP_SECURE=ssl`

> **Note on `NEXTAUTH_URL`/`NEXTAUTH_SECRET`**: Despite the names, **NextAuth is NOT used**. Alaminn.info implements a custom HMAC-SHA256 session-cookie auth (see `src/lib/auth.ts`). The env vars are kept for backward-compatibility with cPanel's auto-detection and for any future NextAuth migration; they are functionally inert today.

### Why
`.env` lives at `/home/aloeduca/alaminn.info/.env` — outside `public_html`, so it is **never** web-accessible. `server.js` parses it inline (no `dotenv` dependency) and loads the vars into `process.env` before booting the Next.js standalone server.

### Success
- `ls -la ~/alaminn.info/.env` shows `-rw------- 1 aloeduca aloeduca ... .env`
- `cat .env | grep -c 'CHANGE_ME'` returns `0` (all CHANGE_ME values replaced)
- `grep -c 'CRON_SECRET=' .env` returns `1`

### On failure
- `cp: cannot stat 'deploy/cpanel/.env.production'` → upload was incomplete; re-extract the ZIP
- `chmod: cannot access '.env'` → the `cp` failed; check the path
- `nano: command not found` → use `vi .env` instead

---

## Step 10 — Select Node.js version in cPanel

### Command (cPanel UI)
1. cPanel → **Software → Setup Node.js App**
2. Click **Create Application**
3. **Node.js version** dropdown → select `22.x` (preferred) or `20.x` (minimum)

### Why
Node 22 is the current LTS as of 2026 and matches the local build environment. Node 20 is the minimum supported by Next.js 16. Avoid Node 18 (EOL) — it will fail on the standalone server's use of `node:crypto` webcrypto APIs.

### Success
- Dropdown shows "22.x" with a green checkmark
- Application mode field is enabled

### On failure
- "Node 22 not available" → ask hosting provider to upgrade, OR fall back to Node 20 (acceptable, not preferred)
- "CloudLinux Alt-node not installed" → host must install the `alt-nodejs22` package; submit a support ticket

---

## Step 11 — Configure application root

### Command (cPanel UI)
In the same "Create Application" form:

| Field | Value |
|---|---|
| **Application root** | `alaminn.info` (maps to `/home/aloeduca/alaminn.info`) |
| **Application URL** | `alaminn.info` (your domain) |
| **Application mode** | `Production` |

### Why
The application root must match the folder you extracted in Step 3. cPanel resolves it relative to `/home/<cpanel_user>/`. Production mode disables Next.js dev warnings and enables caching middlewares.

### Success
- The form does not show a red "Application root does not exist" error
- The "Application URL" field accepts `alaminn.info`

### On failure
- "Application root already in use by another app" → edit the existing app instead of creating a new one
- "Application root does not exist" → verify `/home/aloeduca/alaminn.info` exists; re-extract the ZIP if missing

---

## Step 12 — Configure server.js startup file

### Command (cPanel UI)
In the same form:

| Field | Value |
|---|---|
| **Application startup file** | `server.js` |
| **Passenger log file** | `logs/alaminn.log` (default) |

Click **Create**.

### Why
- `server.js` is the project-root entry point that (a) loads `.env` from the app root, (b) sets `NODE_ENV=production`, (c) requires `.next/standalone/server.js`. Without it, Passenger can't bootstrap the app.
- The Passenger log is where all `console.log` / `console.error` from the Node process go — this is the primary debug surface.

### Success
- cPanel shows the application in "Setup Node.js App" with status "Stopped" (not yet started — expected, the build hasn't run)
- `~/logs/alaminn.log` exists (may be empty)

### On failure
- "Failed to create application: passenger-config error" → check `/home/aloeduca/alaminn.info/server.js` is readable (644)
- "Startup file not found" → verify the path; the field is RELATIVE to the application root, so just `server.js`

---

## Step 13 — Install dependencies (`npm ci`)

### Command (Terminal)
```bash
cd ~/alaminn.info
# Use the cPanel Node binary path explicitly
source /opt/alt/alt-nodejs22/default 2>/dev/null || source /opt/alt/alt-nodejs20/default 2>/dev/null

# Install exact locked versions
npm ci
```

### Why
`npm ci` installs from `package-lock.json` deterministically (faster + reproducible). `npm install` would resolve the lockfile each time, risking a different dependency tree on different deploys.

### Success
- Output ends with `added N packages in Xs` (no vulnerabilities warnings blocking)
- `node_modules/` exists with `@prisma/client`, `next`, `react`, `vitest` etc.
- `postinstall` hook runs `prisma generate` automatically

### On failure
- `npm ci` fails with "ERESOLVE unable to resolve dependency tree" → `package-lock.json` is out of sync; run `npm install` once to refresh the lock, then `npm ci` on subsequent deploys
- Memory error (137 SIGKILL) → cPanel shared hosting limits memory to ~512 MB–1 GB; ask host to raise `MEMORY` limit OR build locally and upload `.next/standalone/`
- `prisma generate` fails → run `npx prisma generate` manually; check `prisma/schema.prisma` syntax

---

## Step 14 — Swap schema.prisma to MySQL + generate Prisma client

### Command (Terminal)
```bash
cd ~/alaminn.info

# The schema is shipped as SQLite for dev. Swap to MySQL for production.
# deploy/cpanel/setup-cpanel.sh does this automatically; if running manually:

# Backup the SQLite schema
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak

# Swap the provider line
sed -i 's|provider = "sqlite"|provider = "mysql"|' prisma/schema.prisma

# Verify
grep "provider =" prisma/schema.prisma
# Expect: provider = "mysql"

# Regenerate the Prisma client with the MySQL adapter
npx prisma generate
```

### Why
The dev database is SQLite (`file:./dev.db`); production is MySQL 8. The Prisma client is generated against the active provider — if you skip the swap, runtime queries will use the SQLite adapter and fail with `Unknown database` errors.

### Success
- `prisma/schema.prisma` shows `provider = "mysql"`
- `npx prisma generate` outputs `Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client in Xs`
- `node_modules/@prisma/client` mtime updated

### On failure
- `sed: can't read prisma/schema.prisma` → wrong working directory; `cd ~/alaminn.info`
- `Error: Schema validation error: provider "mysql" not found in datasource` → Prisma CLI is too old; `npm i -D prisma@latest`
- `Environment variable not found: DATABASE_URL` → `.env` is missing or `DATABASE_URL` line is malformed

---

## Step 15 — Deploy migrations (`prisma migrate deploy`)

### Command (Terminal)
```bash
cd ~/alaminn.info
npx prisma migrate deploy
```

> If no `prisma/migrations/` folder exists (this project uses `prisma db push`), use this instead:
> ```bash
> npx prisma db push
> ```

### Why
`migrate deploy` applies the migration history in order against the production DB — safe for production (never prompts, never resets). `db push` is the schema-sync alternative used when there's no migration history; it compares `schema.prisma` to the DB and applies the diff.

### Success
- Output: `Applied N migrations` or `No pending migrations to apply`
- Verify table count:
  ```bash
  mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "SHOW TABLES;" | wc -l
  ```
  Expect: **56** (55 model tables + 1 header row)

### On failure
- `P1003: Database does not exist` → Step 6 was not completed; create the database first
- `P1045: Access denied` → wrong credentials in `.env`; verify `DATABASE_URL` matches Step 7
- `Migration failed to apply cleanly` → restore the pre-deploy backup from Step 1, fix the migration SQL, re-deploy

---

## Step 16 — Seed the database (if needed)

### Command (Terminal)
```bash
cd ~/alaminn.info
npm run db:seed
```

### Why
The seed (`prisma/seed.ts`) inserts:
- Admin user (read from `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` env vars)
- 274 rows of demo data across universities, scholarships, courses, English-learning courses, tutors, etc.

Run **only** on a fresh database — re-running is idempotent (upserts) but unnecessary.

### Success
- Output: `Seeded 274 records` (approximate)
- `npm run db:verify` reports all 55 tables non-empty (except audit logs which start empty)

### On failure
- `Unique constraint failed on the fields: ("email")` → admin user already exists; the seeder should upsert — if it doesn't, drop and re-create the DB
- `Cannot find module 'tsx'` → run `npm install -D tsx` (should already be in devDependencies)
- `ADMIN_PASSWORD not set` → `.env` is missing required vars; re-check Step 9

---

## Step 17 — Build the Next.js standalone bundle

### Command (Terminal)
```bash
cd ~/alaminn.info
npm run build
```

### Why
The build command (`next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/`) produces a self-contained Next.js server at `.next/standalone/server.js`. cPanel's Passenger entry point (`server.js`) loads it directly — no `next start` needed.

### Success
- Output ends with `✓ Compiled successfully` and `✓ Build complete`
- `.next/standalone/server.js` exists
- `.next/standalone/.next/static/` is populated (JS/CSS chunks)
- `.next/standalone/public/` contains images, favicons, robots.txt
- `du -sh .next/standalone/` shows 50–150 MB

### On failure
- Memory error during build → set `NODE_OPTIONS=--max-old-space-size=4096` and retry; or build locally and upload `.next/standalone/`
- `Type error: Cannot find module '@/lib/...'` → run `npx tsc --noEmit` to find the broken import; fix and rebuild
- ESLint errors block the build → `npm run lint -- --fix` then retry
- `Cannot find module '.prisma/client/default'` → run `npx prisma generate` (Step 14) again

---

## Step 18 — Restart the Passenger app

### Command (cPanel UI)
1. cPanel → **Software → Setup Node.js App**
2. Click **Edit** (pencil) next to `alaminn.info`
3. Click **Restart** (or **Start App** if it was stopped)

### Command (Terminal — fallback if UI is unresponsive)
```bash
# Try via Passenger CLI
which passenger-config && passenger-config restart-app ~/alaminn.info || \
  echo "Passenger CLI not in PATH — restart from cPanel UI"
```

### Why
Passenger caches the Node process. A code/build change is NOT picked up until the process is restarted. Restarting also re-reads `.env`.

### Success
- Status changes from "Stopped" to "Running" in cPanel UI
- `tail -f ~/logs/alaminn.log` shows `[alaminn.info] Listening on PORT...` or similar startup banner
- No error stack traces in the log

### On failure
- "App won't start — check log" → `tail -50 ~/logs/alaminn.log`
  - `Cannot find module '.prisma/client'` → run `npx prisma generate` again
  - `ECONNREFUSED localhost:3306` → MySQL is down or `DATABASE_URL` is wrong
  - `Error: .next/standalone/server.js not found` → Step 17 didn't complete; rebuild
  - `FATAL: AUTH_SECRET is missing` → `.env` doesn't have `AUTH_SECRET`; verify Step 9
- 502 Bad Gateway → Passenger couldn't reach the Node process; check if a port conflict exists with another cPanel app

---

## Step 19 — Test the production domain

### Command
```bash
# Homepage HTTP status
curl -sI https://alaminn.info | head -1
# Expect: HTTP/2 200

# Real content check
curl -s https://alaminn.info | grep -o '<title>[^<]*</title>'
# Expect: <title>Al Aminn — ...</title>

# Health endpoint (used by uptime monitors)
curl -s https://alaminn.info/api/health | head -c 200
# Expect: {"status":"ok","timestamp":"..."}

# HTTP → HTTPS redirect
curl -sI http://alaminn.info | head -1
# Expect: HTTP/1.1 301 Moved Permanently (with Location: https://...)
```

### Why
These four checks confirm the app responds, the database is reachable (via `/api/health` which queries the DB), and HTTPS is enforced.

### Success
- All four commands return the expected output above
- Browser visit to `https://alaminn.info` shows the homepage with hero, navbar, footer

### On failure
- 502 / 503 → Step 18 didn't fully start; check `~/logs/alaminn.log`
- 404 → URL routing is broken; verify `.next/standalone/.next/static/` exists (Step 17 build copy step)
- HTTPS redirect not working → enable cPanel → **Domains → Force HTTPS Redirect**
- `/api/health` returns 500 → check DB connection (Step 8); `tail ~/logs/alaminn.log` for the Prisma error

---

## Step 20 — Test HTTPS (SSL)

### Command
```bash
# Verify the SSL cert is valid and not expired
echo | openssl s_client -connect alaminn.info:443 -servername alaminn.info 2>/dev/null \
  | openssl x509 -noout -dates -issuer

# Verify HSTS header is sent
curl -sI https://alaminn.info | grep -i strict-transport-security
# Expect: strict-transport-security: max-age=63072000; includeSubDomains; preload
```

### Why
- The SSL cert must be valid (Let's Encrypt via AutoSSL or paid cert) for browsers to trust the site.
- HSTS (set by `src/proxy.ts` in production) forces browsers to use HTTPS for all future requests for the next 2 years.

### Success
- `openssl s_client` shows `notBefore` in the past and `notAfter` in the future
- Issuer is `Let's Encrypt` (or your paid CA)
- HSTS header present in curl output

### On failure
- `ssl_cert_date_invalid` → re-run cPanel → **Security → SSL/TLS Status → Run AutoSSL**
- No HSTS header → `src/proxy.ts` may not be loaded; verify `app/proxy.ts` exists (Next.js 16 renamed middleware to proxy)
- HSTS shows but cert is self-signed → cPanel AutoSSL hasn't issued yet; wait 5–10 minutes

---

## Step 21 — Test Higher Study routes

### Command
```bash
# Hub page
curl -sI https://alaminn.info/higher-study | head -1
# Expect: HTTP/2 200

# Universities listing
curl -sI https://alaminn.info/higher-study/universities | head -1
# Expect: HTTP/2 200

# Single university (DB-backed — verifies Prisma + MySQL)
curl -sI https://alaminn.info/higher-study/universities/university-of-oxford | head -1
# Expect: HTTP/2 200

# UK universities landing
curl -sI https://alaminn.info/higher-study/uk-universities | head -1
# Expect: HTTP/2 200

# Global universities landing
curl -sI https://alaminn.info/higher-study/global-universities | head -1
# Expect: HTTP/2 200

# Scholarships
curl -sI https://alaminn.info/higher-study/scholarships/chevening-scholarship | head -1
# Expect: HTTP/2 200

# Subjects, Intakes, Destinations
curl -sI https://alaminn.info/higher-study/subjects | head -1
curl -sI https://alaminn.info/higher-study/intakes | head -1
curl -sI https://alaminn.info/higher-study/destinations | head -1

# PhD / Research
curl -sI https://alaminn.info/higher-study/phd-research | head -1

# Supervisors, Study resources, Saved, Compare, Eligibility check
curl -sI https://alaminn.info/higher-study/supervisors | head -1
curl -sI https://alaminn.info/higher-study/study-resources | head -1
curl -sI https://alaminn.info/higher-study/saved | head -1
curl -sI https://alaminn.info/higher-study/compare | head -1
curl -sI https://alaminn.info/higher-study/eligibility-check | head -1

# Application guide + consultation
curl -sI https://alaminn.info/higher-study/application-guide | head -1
curl -sI https://alaminn.info/higher-study/book-consultation | head -1

# Apply (ALO Education transfer)
curl -sI https://alaminn.info/higher-study/apply | head -1
```

### Why
The Higher Study platform is the largest DB-backed section (35+ routes covering universities, courses, scholarships, research, supervisors, study resources, saved items, comparisons, eligibility checks, application guides, consultation booking). A 200 on each route confirms (a) routing is intact, (b) Prisma queries succeed, (c) seed data is in place.

### Success
- Every URL above returns `HTTP/2 200`
- Spot-check one university page in a browser — verify the hero, overview, courses list, scholarships list, and sidebar all render with real data

### On failure
- 404 → seed didn't insert that slug; run `npm run db:seed` again
- 500 → server error; `tail ~/logs/alaminn.log` for the stack trace
- 200 but blank page → React render error; check the browser console (likely a missing field in the DB)

---

## Step 22 — Test ALO Education transfer

### Command (Terminal — referral creation)
```bash
# Create a referral via the public API (simulates "Apply Now" click)
curl -s -X POST https://alaminn.info/api/v1/higher-study/referral \
  -H "Content-Type: application/json" \
  -d '{
    "referralType": "course-application",
    "universitySlug": "university-of-oxford",
    "courseSlug": "msc-computer-science",
    "consentGiven": true,
    "consentVersion": "v1.0"
  }' | head -c 500
# Expect: {"success":true,"data":{"referralCode":"...","targetUrl":"https://...","referralId":"..."}}
```

### Command (Browser — full flow)
1. Visit `https://alaminn.info/higher-study/universities/university-of-oxford`
2. Click **Apply Now** on a course
3. Verify the transfer notice ("You will be redirected to ALO Education…") shows
4. Verify the consent checkbox is present and required
5. Click **Continue to ALO Education**
6. Verify the redirect lands on the ALO Education verified registration route with query params:
   - `source=ALAMINN_HIGHER_STUDY`
   - `referralType=course-application`
   - `referralCode=<12-char>`
   - `referralToken=<HMAC>`
   - `universitySlug=...`, `courseSlug=...`, `studyLevel=...` (NO PII)

### Why
This is the entire revenue path — without a working ALO Education handoff, the platform can't route leads to the application system. The signed token must be HMAC-verified by both sides.

### Success
- API returns 200 with `referralCode` and `targetUrl`
- Browser redirect lands on ALO Education's domain
- No PII (email, phone, name) appears in the URL query string
- The `HigherStudyReferral` table has a row with `status='transferred'` after the redirect

### On failure
- `400 Bad Request: "consentGiven must be true"` → ensure the body has `"consentGiven": true`
- `500 Internal Server Error` → check `.env` has `HIGHER_STUDY_REFERRAL_SECRET`; `tail ~/logs/alaminn.log`
- `targetUrl` is missing `referralToken` → check `src/lib/higher-study/api-helpers.ts` `signReferralToken` returns non-empty
- ALO Education shows "Invalid token" → secret mismatch between Alaminn.info `.env` and ALO Education config; share `HIGHER_STUDY_REFERRAL_SECRET` with ALO's ops team

---

## Step 23 — Test English Learning links

### Command
```bash
# English Learning hub
curl -sI https://alaminn.info/english-learning | head -1
# Expect: HTTP/2 200

# Courses listing + single course
curl -sI https://alaminn.info/english-learning/courses | head -1
curl -sI https://alaminn.info/english-learning/courses/ielts-preparation | head -1

# Practice tests, Tutors, Resources
curl -sI https://alaminn.info/english-learning/practice-tests | head -1
curl -sI https://alaminn.info/english-learning/tutors | head -1
curl -sI https://alaminn.info/english-learning/resources | head -1

# Eligibility check + Book consultation + Book tutor + Apply + Progress
curl -sI https://alaminn.info/english-learning/eligibility-check | head -1
curl -sI https://alaminn.info/english-learning/book-consultation | head -1
curl -sI https://alaminn.info/english-learning/book-tutor | head -1
curl -sI https://alaminn.info/english-learning/apply | head -1
curl -sI https://alaminn.info/english-learning/progress | head -1
```

### Command (Referral creation)
```bash
curl -s -X POST https://alaminn.info/api/v1/english-learning/referral \
  -H "Content-Type: application/json" \
  -d '{
    "referralType": "course-package",
    "courseSlug": "ielts-preparation",
    "consentGiven": true,
    "consentVersion": "v1.0"
  }' | head -c 400
# Expect: {"success":true,"data":{"referralCode":"...","targetUrl":"https://..."}}
```

### Why
The English Learning platform is a parallel referral surface. The same HMAC pattern is used with `ENGLISH_LEARNING_REFERRAL_SECRET` and a separate destination URL (`ENGLISH_PLATFORM_URL`).

### Success
- All page URLs return `HTTP/2 200`
- The referral POST returns 200 with a `targetUrl` pointing at the English Learning destination platform
- `EnglishLearningReferral` table has a new row with `status='created'`

### On failure
- 404 on `/english-learning/courses/ielts-preparation` → seed didn't run; `npm run db:seed`
- Referral POST returns `500` → check `ENGLISH_LEARNING_REFERRAL_SECRET` and `ENGLISH_PLATFORM_URL` in `.env`
- `targetUrl` points to `localhost` → `ENGLISH_PLATFORM_URL` is not set or wrong

---

## Step 24 — Configure cron jobs

### Command (cPanel UI)
1. cPanel → **Advanced → Cron Jobs**
2. For each of the 11 cron endpoints, add a row using the schedule + command below.
3. Replace `YOUR_CRON_SECRET` with the actual `CRON_SECRET` value from `.env`.

### Cron table (paste-ready)

| Schedule | Endpoint | Command |
|---|---|---|
| `0 9 * * *` | `scholarship-deadlines` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/scholarship-deadlines` |
| `0 9 * * *` | `phd-deadlines` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/phd-deadlines` |
| `0 6 * * 0` | `data-verification` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/data-verification` |
| `*/15 * * * *` | `referral-retry` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/referral-retry` |
| `*/5 * * * *` | `email-queue` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/email-queue` |
| `*/2 * * * *` | `notification-queue` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/notification-queue` |
| `0 3 * * *` | `temp-cleanup` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/temp-cleanup` |
| `0 2 * * *` | `backup` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/backup` |
| `*/5 * * * *` | `health-monitor` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/health-monitor` |
| `0 4 * * 0` | `sitemap-generate` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/sitemap-generate` |
| `0 5 * * 0` | `session-cleanup` | `curl -s -H "x-cron-secret: YOUR_CRON_SECRET" https://alaminn.info/api/cron/session-cleanup` |

> **Note**: `backup` (Step 25) is more robust if invoked via `bash scripts/backup.sh` (writes to `storage/backups/` with SHA-256 + retention). The cron endpoint is a fallback that triggers the same logic via HTTP. Pick ONE — using both creates duplicate backups.

### Why
The 11 cron endpoints handle scheduled maintenance: deadline alerts, retries, queue flushing, temp cleanup, backup, health, sitemap, sessions. Without crons, deadlines slip, queues back up, temp files accumulate, and backups never happen.

### Success
- cPanel → Cron Jobs page shows all 11 rows
- After 5 minutes, `tail ~/logs/alaminn.log | grep cron` shows entries for `notification-queue`, `email-queue`, `health-monitor`, `referral-retry`
- Each cron returns `{"status":"ok","job":"..."}` when called with the right secret

### On failure
- Cron returns `401 Unauthorized` → `CRON_SECRET` in the curl command doesn't match `.env`
- Cron returns `503 Service Unavailable` → `CRON_SECRET` is not set in `.env` at all; restart the app after adding it
- Cron never runs → cPanel disabled cron on shared hosting; ask provider, OR set up an external scheduler (UptimeRobot cron-monitor, GitHub Actions)

---

## Step 25 — Configure automated backups

### Command (cPanel Cron — preferred)
Add a single cron entry to invoke the local backup script (more robust than the HTTP endpoint):

| Schedule | Command |
|---|---|
| `0 2 * * *` | `/home/aloeduca/alaminn.info/scripts/backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1` |

### Command (Terminal — verify)
```bash
# Run once manually to confirm it works
cd ~/alaminn.info
bash scripts/backup.sh

# Verify the artefact
ls -lh storage/backups/
# Expect: alaminn_info_YYYYMMDD_HHMMSS.sql.gz (and .sha256 sibling)
```

### Why
`scripts/backup.sh` produces a gzipped `mysqldump` with:
- A SHA-256 checksum (tamper detection)
- 30-day retention (auto-prunes older)
- `flock` to prevent concurrent runs
- Credentials via `--defaults-extra-file` mode 0600 (never on argv)

### Success
- `storage/backups/` contains `alaminn_info_<timestamp>.sql.gz` (1–20 MB depending on data)
- `storage/backups/alaminn_info_<timestamp>.sha256` exists alongside
- `tail ~/storage/logs/backup.log` shows `Backup completed: <file>`

### On failure
- `mysqldump: Got error: 1045: Access denied` → `.env` `DATABASE_URL` is wrong
- `sha256sum: command not found` → extremely rare on cPanel; install coreutils
- Backup file is 0 bytes → MySQL was unreachable; check service status, retry
- `flock: command not found` → Linux kernel < 2.6.12 (impossible on modern cPanel); file a ticket

---

## Step 26 — Configure health monitoring

### Command (Terminal — local health check via cron)
```bash
# Add a 5-minute health check that writes to the log
crontab -l 2>/dev/null > /tmp/cron.bak
echo '*/5 * * * * curl -fsS -m 5 -o /dev/null https://alaminn.info/api/health || echo "[`date`] HEALTH CHECK FAILED" >> /home/aloeduca/alaminn.info/storage/logs/health.log' >> /tmp/cron.bak
crontab /tmp/cron.bak
```

### Command (External — UptimeRobot)
1. Sign up at https://uptimerobot.com (free tier: 50 monitors, 5-min interval)
2. Add a new monitor:
   - **Monitor type**: HTTP(s)
   - **Friendly name**: Alaminn.info — Health
   - **URL**: `https://alaminn.info/api/health`
   - **Monitoring interval**: 5 minutes
3. Add an alert contact (email / Slack / SMS)
4. Add a second monitor for the deep health endpoint (auth required — skip if you don't have an authenticated token):
   - **URL**: `https://alaminn.info/api/health/deep` (returns 401 without session — used as a "does the route exist" check)

### Why
- `/api/health` returns `{"status":"ok"}` only if the Node process is alive, Next.js routes resolve, and the DB is reachable. It's the single most important uptime indicator.
- UptimeRobot pings every 5 minutes from 6+ global locations and alerts you before users notice.
- Local cron writes to a log file you can grep during incident response.

### Success
- UptimeRobot shows monitor "Alaminn.info — Health" as "Up"
- Local `~/storage/logs/health.log` is empty (or contains only old failures)
- First alert email arrives within 5 min if you take the site down

### On failure
- UptimeRobot shows "Down" → run `curl -I https://alaminn.info/api/health` from your machine; if it works locally, UptimeRobot may be hitting a transient blip; check again in 2 cycles
- `curl: (28) Connection timed out` → app crashed; check `~/logs/alaminn.log`, restart from cPanel UI
- `/api/health` returns `{"status":"degraded"}` → DB is reachable but a dependent service (SMTP, ALO Education) is failing; check the `components` array in the response

---

## Step 27 — Verify rollback capability

### Command (Terminal — dry-run rollback test in maintenance window)
```bash
cd ~/alaminn.info

# 1. Confirm the pre-deploy backup from Step 1 exists
ls -lh ~/alaminn.info.predeploy.*.tgz 2>/dev/null
ls -lh storage/backups/*.sql.gz | tail -3

# 2. Verify the verify-backup.sh script can read the latest backup
bash scripts/verify-backup.sh

# 3. (Optional, in maintenance window) Practice a rollback:
#    a. Stop the app in cPanel
#    b. Restore the source: tar -xzf ~/alaminn.info.predeploy.<timestamp>.tgz -C ~/
#    c. Restore the DB:   bash scripts/restore.sh storage/backups/<latest>.sql.gz
#    d. Restart the app
#    e. Verify https://alaminn.info loads
#    f. If green: redeploy the new build. If red: keep the rollback.
```

### Why
A deploy is not "done" until you have confidence you can UNDO it. The pre-deploy tar + DB snapshot from Step 1 is your safety net. The verify-backup script confirms the snapshot is restorable BEFORE you need it. Practicing the rollback once (in a maintenance window) is mandatory before declaring production ready.

### Success
- `verify-backup.sh` exits 0 with all 5 checks passing:
  1. File exists and is non-empty
  2. SHA-256 matches
  3. `gunzip -t` passes
  4. Contains exactly 55 `CREATE TABLE` statements
  5. Key tables (`User`, `HigherStudyUniversity`, `HigherStudyScholarship`, `EnglishLearningCourse`) are present
- The pre-deploy tar is restorable (`tar -tzf <tar>` lists files without error)

### On failure
- `verify-backup.sh` fails on checksum → backup file was corrupted during write; rerun `scripts/backup.sh`
- Only 54 `CREATE TABLE` statements → a Prisma model was added after the backup; rerun backup AFTER the new deploy, not before
- Pre-deploy tar is missing → Step 1 was skipped; on next deploy, run it first

---

## Post-deployment verification summary

After all 27 steps, mark each item complete:

- [ ] `https://alaminn.info` returns 200
- [ ] `https://alaminn.info/api/health` returns `{"status":"ok"}`
- [ ] HTTPS forced (HTTP → 301 redirect)
- [ ] SSL cert valid, HSTS header present
- [ ] All Higher Study routes return 200
- [ ] ALO Education referral POST returns `referralCode` + `targetUrl`
- [ ] English Learning referral POST returns `referralCode` + `targetUrl`
- [ ] Admin login works at `/admin/login`
- [ ] 11 cron jobs configured in cPanel
- [ ] Daily backup script ran successfully at least once
- [ ] UptimeRobot monitor reports "Up"
- [ ] Pre-deploy backup verified (`scripts/verify-backup.sh` exits 0)

When all boxes are checked, Alaminn.info is **production-ready**.

---

## Quick command reference

```bash
# Navigate to app root
cd ~/alaminn.info

# First-time setup (runs Steps 13–17 in sequence)
bash deploy/cpanel/setup-cpanel.sh

# Redeploy after a code update
bash deploy/cpanel/redeploy.sh
bash deploy/cpanel/redeploy.sh --seed      # also re-seed
bash deploy/cpanel/redeploy.sh --no-build  # just restart

# Database
npx prisma generate
npx prisma db push
npx prisma migrate deploy
npm run db:seed
npm run db:verify

# Admin
npx tsx scripts/seed-admin.ts

# Logs
tail -f ~/logs/alaminn.log
tail -f ~/storage/logs/backup.log

# Backup / restore / verify
bash scripts/backup.sh
bash scripts/restore.sh storage/backups/<file>.sql.gz
bash scripts/verify-backup.sh
```

---

## Reference

- **Project root**: `/home/aloeduca/alaminn.info`
- **Production domain**: https://alaminn.info
- **MySQL database**: `aloeduca_alamin_crm` (MySQL 8.0.37, utf8mb4_unicode_ci)
- **Node version**: 22.x preferred, 20.x minimum
- **Entry point**: `server.js` → `.next/standalone/server.js`
- **Prisma models**: 55 (Identity, CRM, Higher Study, English Learning, Audit, Media)
- **Page routes**: 89 (68 public, 21 admin)
- **API routes**: 150 (11 cron, 55 public, 82 admin-rbac, 1 hmac-signature, 1 authenticated)
- **Tests**: 171 (164 passing, 7 skipped — 8 test files; 22 security tests via `npm run test:security`)
- **Custom auth**: HMAC-SHA256 session cookies (NOT NextAuth) — see `src/lib/auth.ts`
- **RBAC**: 11 roles, 100+ permissions — see `src/lib/rbac.ts`
- **Backup retention**: 30 days
- **Cron endpoints**: 11 (table in Step 24)
