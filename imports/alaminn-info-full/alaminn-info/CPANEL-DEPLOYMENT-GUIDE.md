# Alaminn.info — cPanel Deployment Guide (MySQL 8)

> **Hosting**: cPanel shared/VPS hosting with Terminal access
> **Database**: MySQL 8.0.37 · `aloeduca_alamin_crm` · utf8mb4_unicode_ci
> **App location**: `/home/aloeduca/alaminn.info` (OUTSIDE `public_html` — secure)
> **`.env` location**: `/home/aloeduca/alaminn.info/.env` (NOT web-accessible)
> **Entry point**: `server.js` (loads `.env` + boots Next.js standalone)

---

## Table of Contents

1. [Overview & Security Model](#1-overview--security-model)
2. [Prerequisites Checklist](#2-prerequisites-checklist)
3. [Step 1 — Upload the Project](#step-1--upload-the-project)
4. [Step 2 — Create the MySQL Database (cPanel UI)](#step-2--create-the-mysql-database-cpanel-ui)
5. [Step 3 — Create the Node.js App (cPanel UI)](#step-3--create-the-nodejs-app-cpanel-ui)
6. [Step 4 — Configure `.env` (Terminal)](#step-4--configure-env-terminal)
7. [Step 5 — Run the Setup Script (Terminal)](#step-5--run-the-setup-script-terminal)
8. [Step 6 — Start the App (cPanel UI)](#step-6--start-the-app-cpanel-ui)
9. [Step 7 — Configure SSL (cPanel UI)](#step-7--configure-ssl-cpanel-ui)
10. [Step 8 — Smoke Tests](#step-8--smoke-tests)
11. [Redeploy / Update Workflow](#redeploy--update-workflow)
12. [File Structure After Deployment](#file-structure-after-deployment)
13. [Mini-Services on cPanel](#mini-services-on-cpanel)
14. [Troubleshooting](#troubleshooting)
15. [Quick Command Reference](#quick-command-reference)

---

## 1. Overview & Security Model

```
/home/aloeduca/
├── alaminn.info/              ← App root (OUTSIDE public_html — secure)
│   ├── .env                   ← Secrets here (NOT web-accessible) ✅
│   ├── server.js              ← cPanel Node.js App entry point
│   ├── package.json
│   ├── .next/
│   │   └── standalone/        ← Built Next.js app (self-contained)
│   ├── public/                ← Static assets
│   ├── prisma/
│   ├── src/
│   ├── deploy/cpanel/         ← cPanel setup scripts + .env template
│   └── ...
│
├── public_html/               ← cPanel web root (Passenger proxies here)
│   └── .htaccess / .htpasswd  ← cPanel-managed (rewrites to app)
│
└── (MySQL 8 database: aloeduca_alamin_crm — created in cPanel UI)
```

**Why `.env` is outside `public_html`**: Files inside `public_html` are served directly by the web server. If someone navigates to `https://alaminn.info/.env`, they'd see your database password, auth secrets, and SMTP credentials. By placing `.env` at `/home/aloeduca/alaminn.info/.env`, it's **never** web-accessible. The `server.js` entry point loads it at startup via a minimal inline parser (no `dotenv` dependency).

**How Passenger routes requests**: cPanel's "Setup Node.js App" uses CloudLinux's Passenger (or LiteSpeed). When a request hits `https://alaminn.info/`, Passenger runs your `server.js` in a persistent Node.js process and proxies the HTTP request to it. Static files in `public/` are served directly by the web server (faster).

---

## 2. Prerequisites Checklist

Before you start, confirm:

- [ ] cPanel account with **Terminal** access (cPanel → Advanced → Terminal)
  - *If Terminal is disabled, ask your host to enable it, or use SSH (cPanel → Security → SSH Access).*
- [ ] **Node.js 20+** available (cPanel → Software → Setup Node.js App shows Node 20.x option)
- [ ] **MySQL 8** database wizard (cPanel → Databases → MySQL Database Wizard)
- [ ] Your domain `alaminn.info` is pointed at this cPanel server (DNS A record)
- [ ] The `alaminn-info-cpanel.zip` file uploaded to your server

**Your database details (pre-configured):**

| Field | Value |
|---|---|
| Database Type | MySQL 8 |
| Database Version | 8.0.37 |
| Database Host | localhost |
| Database Port | 3306 |
| Database Name | `aloeduca_alamin_crm` |
| Database User | `aloeduca_alamin_crm` |
| Password | `ALO2026a` |
| Character Set | utf8mb4 |
| Collation | utf8mb4_unicode_ci |

> ⚠️ **Verify the database user name**: cPanel DB users follow the format `{cpanel_username}_{db_user}`. If your cPanel username is `aloeduca`, the user is `aloeduca_alamin_crm`. Double-check in cPanel → MySQL Databases → Current Users.

---

## Step 1 — Upload the Project

### Option A: Upload via cPanel File Manager

1. Log in to cPanel.
2. Go to **Files → File Manager**.
3. Navigate to `/home/aloeduca/` (one level above `public_html`).
4. Click **Upload** and select `alaminn-info-cpanel.zip`.
5. After upload, right-click the ZIP → **Extract**.
6. Name the extracted folder `alaminn.info` (so the path is `/home/aloeduca/alaminn.info`).
7. Delete the ZIP file.

### Option B: Upload via Terminal / SSH

```bash
# From your local machine:
scp alaminn-info-cpanel.zip aloeduca@YOUR_SERVER_IP:~/

# Then on the server (via cPanel Terminal or SSH):
cd ~
unzip alaminn-info-cpanel.zip -d alaminn.info
rm alaminn-info-cpanel.zip
cd alaminn.info
ls -la   # verify package.json, server.js, deploy/cpanel/ exist
```

---

## Step 2 — Create the MySQL Database (cPanel UI)

> If you already created the database with the credentials above, **skip to Step 3**.

1. cPanel → **Databases → MySQL Database Wizard**.
2. **New Database**: enter `alamin_crm` → cPanel prefixes it to `aloeduca_alamin_crm`.
3. **Create User**: username `alamin_crm` → `aloeduca_alamin_crm`, password `ALO2026a` (or use the Password Generator for a stronger one).
4. **Privileges**: check **ALL PRIVILEGES** → Next Step.
5. Done.

**Verify**:
- cPanel → **MySQL Databases** → "Current Databases" shows `aloeduca_alamin_crm`.
- "Current Users" shows `aloeduca_alamin_crm`.

> The database must be **empty** — no tables. The setup script creates all 55 tables via `prisma db push`.

---

## Step 3 — Create the Node.js App (cPanel UI)

1. cPanel → **Software → Setup Node.js App**.
2. Click **Create Application**.
3. Fill in:
   | Field | Value |
   |---|---|
   | **Node.js version** | `20.x` (or highest available) |
   | **Application mode** | `Production` |
   | **Application root** | `alaminn.info` (this maps to `/home/aloeduca/alaminn.info`) |
   | **Application URL** | `alaminn.info` (your domain) |
   | **Application startup file** | `server.js` |
   | **Passenger log file** | `logs/alaminn.log` (default) |
4. Under **Environment variables**, you can add them now OR rely on the `.env` file (Step 4). Recommended: use the `.env` file — it's easier to manage.
5. Click **Create**.

> The app won't start yet — it needs the build (Step 5). That's expected.

---

## Step 4 — Configure `.env` (Terminal)

1. cPanel → **Advanced → Terminal** (or SSH in).
2. Navigate to the app root:
   ```bash
   cd ~/alaminn.info
   ```
3. Copy the pre-configured template:
   ```bash
   cp deploy/cpanel/.env.production .env
   chmod 600 .env   # only your user can read it
   ```
4. Edit `.env` — change these values before going live:
   ```bash
   nano .env
   # OR: vi .env
   ```
   **Must change:**
   - `ADMIN_PASSWORD=ChangeMeBeforeGoingLive2026!` → a strong password (≥ 12 chars)
   - `SMTP_PASSWORD=CHANGE_ME_TO_YOUR_CPANEL_EMAIL_PASSWORD` → your cPanel email account password
   - `SMTP_USER=noreply@alaminn.info` → your actual cPanel email address
   - `NEXTAUTH_URL=https://alaminn.info` → confirm this matches your domain

   **Already set (don't change unless you know why):**
   - `DATABASE_URL` — pre-filled with your MySQL credentials ✅
   - `AUTH_SECRET`, `HIGHER_STUDY_REFERRAL_SECRET`, `ENGLISH_LEARNING_REFERRAL_SECRET` — strong random hex ✅
   - `ADMIN_EMAIL`, `ADMIN_NAME` — adjust if needed

5. Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X` in nano).

**Verify the `.env` is secure:**
```bash
ls -la ~/alaminn.info/.env
# Should show: -rw------- 1 aloeduca aloeduca ... .env  (600 permissions)
```

---

## Step 5 — Run the Setup Script (Terminal)

This script installs deps, swaps to the MySQL Prisma schema, creates all 55 tables, seeds 274 rows, and builds the Next.js standalone bundle.

```bash
cd ~/alaminn.info
bash deploy/cpanel/setup-cpanel.sh
```

**What happens (2–5 minutes):**

| Step | Action | Time |
|---|---|---|
| 1 | Pre-flight checks (Node 20+, .env present) | 1s |
| 2 | `npm install` (or `bun install`) | 60–120s |
| 3 | Swap `schema.prisma` → MySQL provider | 1s |
| 4 | `prisma generate` | 5–10s |
| 5 | `prisma db push` (creates 55 tables in MySQL) | 10–30s |
| 6 | `prisma/seed.ts` (inserts 274 rows + admin user) | 10–20s |
| 7 | `db:verify` (health check) | 2s |
| 8 | `npm run build` (Next.js standalone) | 90–180s |
| 9 | Stage static assets | 1s |

**Expected final output:**
```
✓ Build complete
✓ Standalone tree ready at .next/standalone/

  ═══════════════════════════════════════════════════════════════════
  SETUP COMPLETE — the app is built and the database is seeded.
  ═══════════════════════════════════════════════════════════════════
```

> If the script fails at the `prisma db push` step with "Access denied", verify your `DATABASE_URL` in `.env` matches the cPanel database credentials exactly.

---

## Step 6 — Start the App (cPanel UI)

1. Go back to **cPanel → Software → Setup Node.js App**.
2. Click **Edit** (the pencil icon) next to your `alaminn.info` app.
3. Click **Run NPM Install** (if the button is active — usually already done by the setup script).
4. Click **Start App**.
5. You should see the status change to **Running**.
6. Click the **Open** button (or visit `https://alaminn.info` in a new tab).

**If the app doesn't start**, check the Passenger log:
- cPanel → Setup Node.js App → click **View Logs** next to your app
- OR via Terminal: `tail -f ~/logs/alaminn.log`

---

## Step 7 — Configure SSL (cPanel UI)

1. cPanel → **Security → SSL/TLS Status**.
2. If your domain shows "AutoSSL is running" or "Private SSL is installed", you're done.
3. If not, click **Run AutoSSL** (free Let's Encrypt via cPanel).
4. Wait 2–5 minutes for the certificate to provision.
5. Force HTTPS redirect:
   - cPanel → **Domains → Domains** → click **Manage** next to `alaminn.info`
   - Toggle **Force HTTPS Redirect** to **ON**.

**Verify**: visit `http://alaminn.info` — it should redirect to `https://alaminn.info` automatically.

---

## Step 8 — Smoke Tests

Run these from your browser or terminal:

```bash
# 1. Homepage loads
curl -I https://alaminn.info
# Expect: HTTP/2 200

# 2. Homepage has real content
curl -s https://alaminn.info | grep -o '<title>[^<]*</title>'
# Expect: <title>Al Aminn — Executive Authority Platform</title>

# 3. Health endpoint (used by monitoring)
curl -s https://alaminn.info/api/health
# Expect: {"status":"ok",...}

# 4. Higher Study platform (DB-backed)
curl -sI https://alaminn.info/higher-study                                  | head -1   # 200
curl -sI https://alaminn.info/higher-study/universities/university-of-oxford | head -1   # 200
curl -sI https://alaminn.info/higher-study/scholarships/chevening-scholarship | head -1  # 200
curl -sI https://alaminn.info/higher-study/subjects                          | head -1   # 200
curl -sI https://alaminn.info/higher-study/intakes                           | head -1   # 200

# 5. English Learning platform
curl -sI https://alaminn.info/english-learning        | head -1   # 200
curl -sI https://alaminn.info/english-learning/courses | head -1   # 200

# 6. API returns JSON
curl -s https://alaminn.info/api/v1/higher-study/universities | head -c 80
# Expect: {"data":[{...

# 7. Admin login page
curl -sI https://alaminn.info/admin/login | head -1   # 200

# 8. HTTP → HTTPS redirect
curl -sI http://alaminn.info | head -1
# Expect: HTTP/1.1 301 Moved Permanently
```

**Admin login:**
1. Visit `https://alaminn.info/admin/login`
2. Email: the `ADMIN_EMAIL` from your `.env`
3. Password: the `ADMIN_PASSWORD` from your `.env`
4. You should land on `/admin` (the dashboard)

---

## Redeploy / Update Workflow

After you upload new code (via git, rsync, FTP, or File Manager):

```bash
cd ~/alaminn.info
bash deploy/cpanel/redeploy.sh
```

**Flags:**
- `--no-seed` — skip the database seed (default — re-running seed is safe but unnecessary)
- `--seed` — force a re-seed (idempotent, only adds missing rows)
- `--no-build` — skip the Next.js build (just restart the app)

After the script finishes, restart the app from the cPanel UI:
- **Setup Node.js App → Restart** (button next to your app)

> The script attempts `passenger-config restart-app` automatically. If Passenger isn't in your PATH, it'll tell you to restart from the UI.

---

## File Structure After Deployment

```
/home/aloeduca/alaminn.info/
├── .env                          ← Your secrets (600 perms, NOT in public_html)
├── server.js                     ← cPanel entry point (loads .env + boots standalone)
├── package.json
├── package-lock.json             ← Generated by npm install
├── bun.lock
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json
├── node_modules/                 ← Installed by setup script
├── .next/
│   ├── standalone/               ← Self-contained Next.js server (production)
│   │   ├── server.js             ← Next.js standalone server
│   │   ├── .next/
│   │   │   └── static/           ← JS/CSS chunks
│   │   └── public/               ← Static assets (copied by build)
│   └── static/                   ← Original static output
├── public/                       ← Static assets (images, favicons, etc.)
├── prisma/
│   ├── schema.prisma             ← MySQL provider (swapped by setup script)
│   ├── schema.mysql.prisma       ← MySQL source (kept for reference)
│   └── seed.ts                   ← Database seeder
├── src/                          ← Next.js app source
├── scripts/                      ← DB verify, security tests, admin seeder
├── tests/                        ← Vitest suite
├── deploy/
│   └── cpanel/
│       ├── .env.production       ← Template (copy to .env)
│       ├── setup-cpanel.sh       ← One-time setup script
│       └── redeploy.sh           ← Redeploy script
└── logs/
    └── alaminn.log               ← Passenger log (cPanel-managed)
```

---

## Mini-Services on cPanel

The project includes 4 background Bun services:

| Service | Port | Purpose | Runs on cPanel? |
|---|---|---|---|
| `email-worker` | 3002 | Email retry queue | ⚠️ Maybe |
| `audit-worker` | 3003 | Async audit-log writer | ⚠️ Maybe |
| `health-monitor` | 3004 | Service health polling | ⚠️ Maybe |
| `notification-service` | 3005 | Notification ingestion | ⚠️ Maybe |

**On cPanel shared hosting**: Background processes are typically **not allowed** (CloudLinux limits). The main Next.js app works fine without them — you just lose:
- Email retry queue (emails send immediately or fail)
- Async audit logging (writes synchronously instead)
- Health monitoring (use an external uptime monitor like UptimeRobot)
- Notification service (in-app toasts still work client-side)

**On cPanel VPS / dedicated with Shell/SSH access**: You can run them via:
```bash
cd ~/alaminn.info/mini-services/email-worker
nohup bun run index.ts > ~/logs/email-worker.log 2>&1 &
```
But they won't survive a server reboot without a process manager (PM2 or systemd — not available on shared cPanel).

**Recommendation**: On shared cPanel, skip the mini-services. The app is fully functional without them. Use UptimeRobot for monitoring and configure SMTP in `.env` for direct email sending.

---

## Troubleshooting

### App shows "502 Bad Gateway" or "503 Service Unavailable"

1. Check the Passenger log: `tail -50 ~/logs/alaminn.log`
2. Common causes:
   - **`.next/standalone/server.js` not found** → you didn't run `bash deploy/cpanel/setup-cpanel.sh` (Step 5). Run it.
   - **`Cannot find module '.prisma/client'`** → run `npx prisma generate` in the app root.
   - **`ECONNREFUSED localhost:3306`** → MySQL isn't running or `DATABASE_URL` is wrong. Verify in cPanel → MySQL Databases.
   - **`Access denied for user 'aloeduca_alamin_crm'`** → wrong password in `.env`. Verify the password matches what you set in cPanel.

### App starts but database operations fail

1. Verify the database has tables:
   ```bash
   cd ~/alaminn.info
   npx prisma db pull --print | head -20   # should show table definitions
   ```
2. If no tables → run `npx prisma db push` manually.
3. If tables exist but no data → run `npx tsx prisma/seed.ts`.

### `npm install` fails with memory error

cPanel shared hosting limits memory (often 512 MB–1 GB). Next.js build needs more.

**Solutions:**
1. Ask your host to raise the `MEMORY` limit for your account.
2. Build locally and upload the `.next/standalone/` directory:
   ```bash
   # On your local machine (with Node 20+):
   npm install
   npm run build
   # Then upload the entire .next/standalone/ folder to the server
   ```
3. Use a VPS instead of shared hosting (recommended for production).

### `prisma db push` fails with "Unknown database"

The database wasn't created in cPanel. Go to cPanel → MySQL Databases → create `aloeduca_alamin_crm` and assign user `aloeduca_alamin_crm` with ALL PRIVILEGES.

### Admin login says "Invalid credentials"

Re-seed the admin user:
```bash
cd ~/alaminn.info
npx tsx scripts/seed-admin.ts
```
This reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from `.env` and upserts the admin row.

### `.env` changes don't take effect

You must restart the app after editing `.env`:
- cPanel → Setup Node.js App → **Restart**

### Static images return 404

The `public/` folder must be copied into `.next/standalone/`. The setup script does this, but if you ran `npm run build` manually:
```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

### Port 3000 already in use

cPanel's Passenger manages the port — you don't set it. If you see a port conflict, it's likely another app. Go to Setup Node.js App and check if you have multiple apps on the same URL.

---

## Quick Command Reference

```bash
# ─── Navigate to app ─────────────────────────────────────────────
cd ~/alaminn.info

# ─── First-time setup ────────────────────────────────────────────
bash deploy/cpanel/setup-cpanel.sh

# ─── Redeploy after code update ──────────────────────────────────
bash deploy/cpanel/redeploy.sh
bash deploy/cpanel/redeploy.sh --seed      # also re-seed DB
bash deploy/cpanel/redeploy.sh --no-build  # just restart

# ─── Database ────────────────────────────────────────────────────
npx prisma generate                         # regenerate Prisma client
npx prisma db push --accept-data-loss       # apply schema changes
npx tsx prisma/seed.ts                      # seed demo data
npm run db:verify                           # health check

# ─── Admin ───────────────────────────────────────────────────────
npx tsx scripts/seed-admin.ts               # create/reset admin user

# ─── Logs ────────────────────────────────────────────────────────
tail -f ~/logs/alaminn.log                  # Passenger/app log

# ─── .env management ─────────────────────────────────────────────
cp deploy/cpanel/.env.production .env       # create from template
chmod 600 .env                              # secure permissions
nano .env                                   # edit
```

---

## Final Go-Live Checklist

- [ ] Project uploaded to `/home/aloeduca/alaminn.info`
- [ ] MySQL database `aloeduca_alamin_crm` created with user `aloeduca_alamin_crm`
- [ ] `.env` created at `/home/aloeduca/alaminn.info/.env` with `chmod 600`
- [ ] `ADMIN_PASSWORD` changed from the default in `.env`
- [ ] `SMTP_PASSWORD` set to your cPanel email password in `.env`
- [ ] `bash deploy/cpanel/setup-cpanel.sh` completed successfully
- [ ] Node.js App created in cPanel (Application root: `alaminn.info`, startup: `server.js`)
- [ ] App status shows "Running" in cPanel
- [ ] `https://alaminn.info` returns HTTP 200
- [ ] `https://alaminn.info/api/health` returns `{"status":"ok"}`
- [ ] `http://alaminn.info` redirects to `https://` (Force HTTPS enabled)
- [ ] Admin login works at `/admin/login`
- [ ] `/higher-study/universities/university-of-oxford` returns 200 (DB-backed)
- [ ] SSL certificate active (browser shows padlock)
- [ ] Uptime monitor (UptimeRobot) pointed at `/api/health`

Once all boxes are checked: **you're live on cPanel.** 🎉

---

## What's Pre-Configured for You

The `deploy/cpanel/.env.production` template already contains:

✅ **MySQL connection** — `DATABASE_URL=mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm`
✅ **DB charset/collation** — `utf8mb4` / `utf8mb4_unicode_ci`
✅ **AUTH_SECRET** — 64-char random hex (HMAC cookie signing)
✅ **HIGHER_STUDY_REFERRAL_SECRET** — 64-char random hex (ALO Education integration)
✅ **ENGLISH_LEARNING_REFERRAL_SECRET** — 64-char random hex
✅ **NEXTAUTH_SECRET** — 64-char random hex
✅ **NEXTAUTH_URL** — `https://alaminn.info`
✅ **ADMIN_EMAIL / ADMIN_NAME** — `admin@alaminn.info` / `Al Aminn`
✅ **SMTP defaults** — `mail.alaminn.info:465` (adjust to your cPanel email)
✅ **Mini-service ports** — 3002–3005

❌ **You must change before going live:**
- `ADMIN_PASSWORD` — currently `ChangeMeBeforeGoingLive2026!`
- `SMTP_PASSWORD` — currently `CHANGE_ME_TO_YOUR_CPANEL_EMAIL_PASSWORD`
- `SMTP_USER` — currently `noreply@alaminn.info` (use your real cPanel email)

---

*This guide is the single source of truth for cPanel deployment. For VPS (Ubuntu + systemd + Nginx) deployment, see `DEPLOYMENT-GUIDE.md`.*
