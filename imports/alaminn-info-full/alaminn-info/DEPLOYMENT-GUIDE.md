# Alaminn.info — Complete Go-Live Deployment Guide

> **Stack**: Next.js 16 (App Router) · Bun · TypeScript · Tailwind 4 · shadcn/ui · Prisma ORM · MariaDB · Nginx · systemd
>
> **Target**: A fresh Ubuntu 22.04 LTS VPS (2 vCPU / 4 GB RAM minimum recommended)
>
> **Outcome**: `https://alaminn.info` serving a production Next.js app + 4 background mini-services, with HTTPS, automatic restarts, and daily database backups.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What's Inside the Project ZIP](#2-whats-inside-the-project-zip)
3. [Server Prerequisites](#3-server-prerequisites)
4. [Step 1 — Upload the Project](#step-1--upload-the-project)
5. [Step 2 — Run the One-Time Installer](#step-2--run-the-one-time-installer)
6. [Step 3 — Build & Seed the Database](#step-3--build--seed-the-database)
7. [Step 4 — Start the App Service](#step-4--start-the-app-service)
8. [Step 5 — Configure the Reverse Proxy](#step-5--configure-the-reverse-proxy)
9. [Step 6 — Provision SSL (Let's Encrypt)](#step-6--provision-ssl-lets-encrypt)
10. [Step 7 — Launch the Mini-Services Mesh](#step-7--launch-the-mini-services-mesh)
11. [Step 8 — Smoke Tests](#step-8--smoke-tests)
12. [Post-Deployment: Backups & Monitoring](#post-deployment-backups--monitoring)
13. [Redeploy / Update Workflow](#redeploy--update-workflow)
14. [Alternative Deployment Targets](#alternative-deployment-targets)
15. [Troubleshooting](#troubleshooting)
16. [Environment Variables Reference](#environment-variables-reference)

---

## 1. Architecture Overview

```
                    ┌──────────────────────────────────────────┐
                    │              Internet (HTTPS)            │
                    └──────────────────┬───────────────────────┘
                                       │ 443
                            ┌──────────▼──────────┐
                            │       Nginx         │  ← SSL termination,
                            │  (reverse proxy)    │    HTTP→HTTPS redirect,
                            └──────────┬──────────┘    security headers
                                       │ 127.0.0.1:3001
                            ┌──────────▼──────────┐
                            │   Next.js 16 app    │  ← Bun runtime,
                            │  (standalone build) │    Prisma ORM,
                            │   systemd:          │    HMAC auth,
                            │   alaminn-info      │    80+ pages,
                            └──────────┬──────────┘    138 API routes
                                       │
                       ┌───────────────┼───────────────┐
                       │               │               │
              ┌────────▼──────┐ ┌──────▼───────┐ ┌────▼─────────┐
              │   MariaDB     │ │  Mini-service│ │ Mini-service │
              │  alaminn_info │ │   mesh (4)   │ │   logs →     │
              │   (55 tables) │ │              │ │  journald    │
              └───────────────┘ └──────────────┘ └──────────────┘
```

**The 4 mini-services** (each is an independent Bun HTTP server):

| Service              | Port | Purpose                                                |
| -------------------- | ---- | ----------------------------------------------------- |
| `email-worker`       | 3002 | Retry queue for failed emails (SMTP / Resend)         |
| `audit-worker`       | 3003 | Async audit-log writer + report exporter              |
| `health-monitor`     | 3004 | Polls all services, emits alerts on degradation       |
| `notification-service` | 3005 | In-memory notification ingestion (toasts, badges)    |

---

## 2. What's Inside the Project ZIP

The deliverable ZIP **contains only source files** — no `node_modules`, no `.next` build output, no `.git`, no database, no logs, no sandbox artifacts.

```
alaminn-info-project/
├── src/                    ← Next.js app (App Router): 86 page routes, 138 API routes
│   ├── app/                ← routes: /, /higher-study/*, /english-learning/*, /admin/*, /api/*
│   ├── components/         ← React components (shadcn/ui + custom)
│   ├── lib/                ← auth.ts (HMAC), rbac.ts, db.ts, higher-study/, english-learning/
│   └── proxy.ts            ← Next.js 16 middleware (CSP, HSTS, rate-limit, honeypot)
├── prisma/
│   ├── schema.prisma       ← 55 models (SQLite provider — default for dev)
│   ├── schema.mysql.prisma ← Same 55 models (MySQL provider — for production)
│   └── seed.ts             ← Idempotent seeder (274 rows of curated demo data)
├── public/                 ← Static assets (images, favicons, robots.txt, sitemap.xml)
├── mini-services/          ← 4 independent Bun HTTP services (see table above)
├── scripts/                ← verify-db.ts, security-tests.ts, seed-admin.ts, backup-db.ts, etc.
├── tests/                  ← Vitest suite (171 tests, 8 files)
├── deploy/                 ← install.sh, deploy.sh, nginx conf, systemd unit, PM2 config, .env.example
├── docs/                   ← Architecture & API reference (internal)
├── examples/               ← WebSocket demo for reference
├── .env.example            ← Dev environment template
├── .gitignore
├── package.json
├── bun.lock
├── next.config.ts          ← Standalone output enabled
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json         ← shadcn/ui config
├── server.js               ← Custom production server (if not using standalone)
├── vitest.config.ts
├── Caddyfile               ← Alternative reverse-proxy config (for sandbox/dev)
├── README.md
└── DEPLOYMENT-GUIDE.md     ← This file
```

**Excluded by design** (regenerated on the server):
- `node_modules/` — run `bun install`
- `.next/` — run `bun run build`
- `db/*.db` — created by `prisma db push`
- `.env` — created from `.env.production.example`
- `tsconfig.tsbuildinfo`, `dev.log`, `.git/`

---

## 3. Server Prerequisites

| Requirement           | Version / Spec                                  |
| --------------------- | ----------------------------------------------- |
| **OS**                | Ubuntu 22.04 LTS (or 24.04)                     |
| **RAM**               | 4 GB minimum (8 GB recommended)                 |
| **Disk**              | 20 GB SSD                                       |
| **Node.js**           | ≥ 20 (Bun bundles its own, but Node helps tooling) |
| **Bun**               | ≥ 1.1 (installed by `install.sh`)               |
| **MariaDB**           | ≥ 10.6 (installed by `install.sh`)              |
| **Nginx**             | ≥ 1.18 (installed by `install.sh`)              |
| **Domain**            | `alaminn.info` (and `www.alaminn.info`) pointed at the server IP via A records |

**Before you start**, make sure:
1. You have SSH root (or sudo) access to the server.
2. Your domain's DNS A records (`alaminn.info` and `www`) point to the server's public IP. Verify with:
   ```bash
   dig +short alaminn.info
   dig +short www.alaminn.info
   ```
3. Ports **80** and **443** are open in your cloud provider's firewall/security group.

---

## Step 1 — Upload the Project

From your local machine, upload the extracted project folder to the server:

```bash
# Option A: scp the zip, then unzip on the server
scp alaminn-info-project.zip root@YOUR_SERVER_IP:/tmp/
ssh root@YOUR_SERVER_IP
cd /var/www   # create if missing: mkdir -p /var/www
unzip /tmp/alaminn-info-project.zip -d /var/www/alaminn-info
cd /var/www/alaminn-info
```

```bash
# Option B: rsync the extracted folder (preserves permissions)
rsync -avz --progress ./alaminn-info-project/ root@YOUR_SERVER_IP:/var/www/alaminn-info/
```

> **Note**: `install.sh` will create `/var/www/alaminn-info` and set ownership, so uploading there is fine — the installer is idempotent and won't overwrite your files.

---

## Step 2 — Run the One-Time Installer

The installer (`deploy/install.sh`) is idempotent and handles:
- Bun installation (for user `aloedu`)
- Nginx + MariaDB installation
- MariaDB database + user creation
- systemd service registration
- `.env` generation from `deploy/.env.production.example`
- Let's Encrypt SSL via certbot (interactive)

```bash
cd /var/www/alaminn-info
sudo bash deploy/install.sh
```

**You will be prompted for:**
- MariaDB app user password (choose a strong one — this becomes `DATABASE_URL`)
- Admin email + password (for the first admin login at `/admin/login`)
- Email confirmation when certbot requests the SSL certificate

When it finishes, you'll see a printed summary with next steps.

---

## Step 3 — Build & Seed the Database

Run as the app user (`aloedu`):

```bash
sudo -u aloedu bash -c 'cd /var/www/alaminn-info && \
  /home/aloedu/.bun/bin/bun install --frozen-lockfile && \
  /home/aloedu/.bun/bin/bun run db:generate && \
  /home/aloedu/.bun/bin/bun run db:push && \
  /home/aloedu/.bun/bin/bun run db:seed && \
  /home/aloedu/.bun/bin/bun run build'
```

**What each command does:**
| Command                | Effect                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| `bun install`          | Installs all dependencies from `bun.lock`                        |
| `bun run db:generate`  | Generates the Prisma Client (`node_modules/.prisma/client`)      |
| `bun run db:push`      | Creates all 55 tables in MariaDB (via `schema.mysql.prisma`)     |
| `bun run db:seed`      | Inserts 274 rows of curated demo data (universities, courses, …) |
| `bun run build`        | Produces `.next/standalone/` — a self-contained production server |

> **Verify the database is healthy:**
> ```bash
> sudo -u aloedu bash -c 'cd /var/www/alaminn-info && /home/aloedu/.bun/bin/bun run db:verify'
> # Expect: ✓ Database is healthy. (0 anomalies)
> ```

---

## Step 4 — Start the App Service

`install.sh` already registered the systemd unit, but it won't be "active" until the build exists. Now that the build is done:

```bash
sudo systemctl daemon-reload
sudo systemctl enable alaminn-info
sudo systemctl start alaminn-info
sudo systemctl status alaminn-info
```

**Expected output:**
```
● alaminn-info.service - Alaminn.info — Next.js 16 production app
   Active: active (running)
   Main PID: 12345 (bun)
   Listening: 127.0.0.1:3001
```

**Tail the logs:**
```bash
sudo journalctl -u alaminn-info -f
```

Press `Ctrl+C` to stop following. You should see `▲ Next.js 16` and `Ready in XXX ms`.

---

## Step 5 — Configure the Reverse Proxy

`install.sh` copies the Nginx config, but let's verify it's enabled:

```bash
sudo ls -la /etc/nginx/sites-enabled/alaminn-info
# Should be a symlink → ../sites-available/alaminn-info

sudo nginx -t          # syntax check
sudo systemctl reload nginx
```

**If you're NOT using Let's Encrypt yet** (e.g., testing before DNS resolves), temporarily comment out the `listen 443 ssl` block and the `return 301 https` redirect, then reload Nginx.

---

## Step 6 — Provision SSL (Let's Encrypt)

If `install.sh` didn't complete the SSL step (e.g., DNS wasn't ready), do it now:

```bash
sudo certbot --nginx -d alaminn.info -d www.alaminn.info \
  --non-interactive --agree-tos -m admin@alaminn.info --redirect
```

**Auto-renewal** is set up by certbot's systemd timer:
```bash
sudo systemctl list-timers | grep certbot
# Verify it's scheduled
```

Test a dry-run renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 7 — Launch the Mini-Services Mesh

The 4 background services are independent Bun processes. For production, run them under systemd (or PM2).

### Option A — systemd (recommended, matches the main app)

Create one unit per service. Example for `email-worker`:

```bash
sudo tee /etc/systemd/system/alaminn-email-worker.service > /dev/null <<'EOF'
[Unit]
Description=Alaminn.info — email-worker mini-service
After=network.target alaminn-info.service

[Service]
Type=simple
User=aloedu
Group=aloedu
WorkingDirectory=/var/www/alaminn-info/mini-services/email-worker
EnvironmentFile=/var/www/alaminn-info/.env
ExecStart=/home/aloedu/.bun/bin/bun run index.ts
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=alaminn-email-worker

[Install]
WantedBy=multi-user.target
EOF
```

Repeat for the other three (change `Description`, `WorkingDirectory`, `SyslogIdentifier`):

| Service file                              | WorkingDirectory                                         | Port |
| ----------------------------------------- | -------------------------------------------------------- | ---- |
| `alaminn-email-worker.service`            | `…/mini-services/email-worker`                           | 3002 |
| `alaminn-audit-worker.service`            | `…/mini-services/audit-worker`                           | 3003 |
| `alaminn-health-monitor.service`          | `…/mini-services/health-monitor`                         | 3004 |
| `alaminn-notification-service.service`    | `…/mini-services/notification-service`                   | 3005 |

Enable + start all four:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now alaminn-email-worker \
                          alaminn-audit-worker \
                          alaminn-health-monitor \
                          alaminn-notification-service
sudo systemctl status alaminn-email-worker alaminn-audit-worker \
                       alaminn-health-monitor alaminn-notification-service
```

### Option B — PM2 (alternative, if you prefer PM2)

A ready-made ecosystem file is included:

```bash
sudo -u aloedu bash -c 'cd /var/www/alaminn-info && \
  /home/aloedu/.bun/bin/bunx pm2 start deploy/ecosystem.pm2.cjs && \
  /home/aloedu/.bun/bin/bunx pm2 save'
```

PM2 will persist the process list and auto-restart on reboot (if `pm2 startup` was run once).

---

## Step 8 — Smoke Tests

Run these on the server (or from your local machine after DNS propagates):

```bash
# 1. App responds on the public URL
curl -I https://alaminn.info
# Expect: HTTP/2 200

# 2. Homepage renders real content
curl -s https://alaminn.info | grep -o '<title>[^<]*</title>'
# Expect: <title>Al Aminn — Executive Authority Platform</title>

# 3. Higher Study listing pages (previously 404, now fixed)
curl -sI https://alaminn.info/higher-study/subjects        | head -1   # 200
curl -sI https://alaminn.info/higher-study/intakes         | head -1   # 200
curl -sI https://alaminn.info/case-studies                 | head -1   # 200

# 4. Dynamic detail pages (DB-backed)
curl -sI https://alaminn.info/higher-study/universities/university-of-oxford     | head -1   # 200
curl -sI https://alaminn.info/higher-study/scholarships/chevening-scholarship    | head -1   # 200

# 5. English Learning platform
curl -sI https://alaminn.info/english-learning            | head -1   # 200
curl -sI https://alaminn.info/english-learning/courses    | head -1   # 200

# 6. API endpoints return JSON
curl -s https://alaminn.info/api/v1/higher-study/universities | head -c 80
# Expect: {"data":[{…}]}

# 7. Health endpoint (used by monitoring)
curl -s https://alaminn.info/api/health | head -c 120
# Expect: {"status":"ok",…}

# 8. Mini-services (internal — from the server only)
curl -s http://127.0.0.1:3002/health   # email-worker
curl -s http://127.0.0.1:3003/health   # audit-worker
curl -s http://127.0.0.1:3004/health   # health-monitor
curl -s http://127.0.0.1:3005/health   # notification-service

# 9. Admin login page loads
curl -sI https://alaminn.info/admin/login | head -1       # 200

# 10. HTTP → HTTPS redirect works
curl -sI http://alaminn.info | head -1
# Expect: HTTP/1.1 301 Moved Permanently
```

**Login to the admin panel:**
1. Visit `https://alaminn.info/admin/login`
2. Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`
3. You should land on `/admin` (the dashboard)

---

## Post-Deployment: Backups & Monitoring

### Database Backups (daily, automated)

Create a backup script + cron job:

```bash
sudo tee /usr/local/bin/alaminn-db-backup.sh > /dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="/var/backups/alaminn-db"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d-%H%M%S)
mysqldump --single-transaction alaminn_info | gzip > "$BACKUP_DIR/alaminn_info-$DATE.sql.gz"
# Keep 30 days
find "$BACKUP_DIR" -name "alaminn_info-*.sql.gz" -mtime +30 -delete
EOF
sudo chmod +x /usr/local/bin/alaminn-db-backup.sh

# Run daily at 03:00
echo "0 3 * * * root /usr/local/bin/alaminn-db-backup.sh" | sudo tee /etc/cron.d/alaminn-db-backup
```

### Log Monitoring

```bash
# App logs (real-time)
sudo journalctl -u alaminn-info -f

# Mini-service logs
sudo journalctl -u alaminn-email-worker -f
sudo journalctl -u alaminn-audit-worker -f

# Nginx access + error
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MariaDB slow queries (if enabled in /etc/mysql/mariadb.conf.d/50-server.cnf)
sudo tail -f /var/log/mysql/mariadb-slow.log
```

### Health-Check Endpoint

The app exposes `GET /api/health` returning JSON:
```json
{ "status": "ok", "timestamp": "2025-…", "db": "connected" }
```

Point UptimeRobot (or any uptime monitor) at `https://alaminn.info/api/health`.

---

## Redeploy / Update Workflow

After you push new code to the server (via `git pull`, `rsync`, or uploading a new ZIP), run:

```bash
cd /var/www/alaminn-info
sudo -u aloedu bash deploy/deploy.sh
# Or with a re-seed (idempotent — only adds missing rows):
sudo -u aloedu bash deploy/deploy.sh --seed
```

`deploy.sh` does:
1. `bun install --frozen-lockfile`
2. `prisma generate`
3. Swaps `schema.prisma` to MySQL if `DATABASE_URL` is `mysql://` (auto-detected)
4. `prisma db push` (applies schema changes)
5. `next build` (produces fresh `.next/standalone/`)
6. `systemctl restart alaminn-info`
7. (Optional) `prisma db seed` if `--seed` flag passed

**Zero-downtime option**: For true zero-downtime, run a second instance on port 3002, switch Nginx upstream, then reload the first. This is beyond the scope of the default `deploy.sh` but documented in `DEVELOPMENT-GUIDELINE.md`.

---

## Alternative Deployment Targets

### cPanel / CyberPanel (shared hosting with Node)

1. Upload the ZIP via the File Manager or FTP.
2. Extract to `~/alaminn-info` (or the document root the panel assigns).
3. In the panel's "Node.js App" or "Setup Node.js App" UI:
   - **Node version**: 20.x
   - **App root**: `/alaminn-info`
   - **Startup file**: `server.js`
   - **Run script**: `bun run start` (or `node .next/standalone/server.js` if Bun isn't available)
4. Set environment variables in the panel's "Environment" tab (copy from `deploy/.env.production.example`).
5. Run `npm install && npx prisma generate && npx prisma db push && npx prisma db seed` via the panel's terminal.
6. Restart the Node app from the panel.

> **Note**: Mini-services may not run on shared hosting (no background process support). The main app will still work; email-worker's retry queue will simply be inactive.

### Docker (advanced)

A `Dockerfile` is not included by default, but the standalone build is Docker-friendly:

```dockerfile
FROM oven/bun:1.1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.1
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3001
ENV PORT=3001
CMD ["bun", "run", "server.js"]
```

### Vercel (not recommended)

The app uses Prisma with MariaDB and a custom HMAC auth system with `HttpOnly` cookies — both work on Vercel, but the 4 mini-services (long-running Bun processes) **do not**. You'd lose email retries, audit logging, and health monitoring. Use the VPS deployment above instead.

---

## Troubleshooting

### `systemctl status alaminn-info` shows "failed"

1. Check the logs: `sudo journalctl -u alaminn-info -n 100 --no-pager`
2. Common causes:
   - **`Cannot find module '.prisma/client'`** → forgot `bun run db:generate`. Run it.
   - **`ECONNREFUSED 127.0.0.1:3306`** → MariaDB isn't running. `sudo systemctl start mariadb`
   - **`Access denied for user 'alaminn_app'`** → wrong password in `.env`. Fix `DATABASE_URL`, then `sudo systemctl restart alaminn-info`.
   - **`Port 3001 already in use`** → another process grabbed it. `sudo lsof -i :3001` to find and kill it.

### Nginx returns 502 Bad Gateway

The app isn't listening on `127.0.0.1:3001`. Verify:
```bash
curl -v http://127.0.0.1:3001/api/health
# If connection refused → app is down (see above)
# If it works from localhost but not via Nginx → check Nginx upstream config
```

### 404 on `/higher-study/universities/...` after deploy

The database is empty. Run the seeder:
```bash
sudo -u aloedu bash -c 'cd /var/www/alaminn-info && /home/aloedu/.bun/bin/bun run db:seed'
```

### `prisma db push` fails with `Unknown database 'alaminn_info'`

The database wasn't created. Either re-run `install.sh`, or create it manually:
```bash
sudo mysql -e "CREATE DATABASE alaminn_info CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'alaminn_app'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON alaminn_info.* TO 'alaminn_app'@'localhost'; FLUSH PRIVILEGES;"
```

### Mini-service crashes on startup

Each mini-service has its own `package.json`. Install its deps:
```bash
cd /var/www/alaminn-info/mini-services/email-worker
sudo -u aloedu /home/aloedu/.bun/bin/bun install
```

### `bun install` fails with lockfile mismatch

The `bun.lock` is committed and should match `package.json`. If you edited deps, regenerate:
```bash
rm bun.lock
bun install
```

### Cookies don't persist after HTTPS switch

Make sure `NEXTAUTH_URL` (used by the auth lib for cookie domain) matches your production URL exactly:
```env
NEXTAUTH_URL=https://alaminn.info
```

### Admin login says "Invalid credentials"

The admin user is seeded by `prisma/seed.ts` OR `scripts/seed-admin.ts`. Re-run:
```bash
sudo -u aloedu bash -c 'cd /var/www/alaminn-info && /home/aloedu/.bun/bin/bun run scripts/seed-admin.ts'
```
It reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` from `.env` and upserts the admin row.

---

## Environment Variables Reference

All variables are documented in `deploy/.env.production.example`. Critical ones:

| Variable                         | Required | Purpose                                         |
| -------------------------------- | -------- | ----------------------------------------------- |
| `NODE_ENV`                       | ✅       | Must be `production`                            |
| `DATABASE_URL`                   | ✅       | `mysql://user:pass@host:3306/db`                |
| `AUTH_SECRET`                    | ✅       | HMAC key for session cookies (64 hex chars)     |
| `NEXTAUTH_URL`                   | ✅       | Public URL (`https://alaminn.info`)             |
| `ADMIN_EMAIL`                    | ✅       | First admin login email                         |
| `ADMIN_PASSWORD`                 | ✅       | First admin login password (≥ 12 chars)         |
| `HIGHER_STUDY_REFERRAL_SECRET`   | ✅       | HMAC key for ALO Education referral tokens      |
| `ENGLISH_LEARNING_REFERRAL_SECRET` | ✅     | HMAC key for English Learning referral tokens   |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | ⚠️ | Needed for real email sending |
| `EMAIL_FROM` / `EMAIL_REPLY_TO`  | ⚠️      | Sender addresses for outbound email             |
| `RESEND_API_KEY`                 | ⚪       | Optional alternative to SMTP                    |
| `PORT`                           | ✅       | `3001` (must match Nginx upstream)              |

**Generate strong secrets:**
```bash
openssl rand -hex 32
```

---

## Quick-Reference Command Card

```bash
# ─── Daily operations ────────────────────────────────────────────
sudo systemctl status alaminn-info              # check app
sudo journalctl -u alaminn-info -f              # tail logs
sudo systemctl restart alaminn-info             # restart app

# ─── Deploys ─────────────────────────────────────────────────────
cd /var/www/alaminn-info
sudo -u aloedu bash deploy/deploy.sh            # standard redeploy
sudo -u aloedu bash deploy/deploy.sh --seed     # redeploy + re-seed

# ─── Database ────────────────────────────────────────────────────
sudo -u aloedu bash -c 'cd /var/www/alaminn-info && \
  /home/aloedu/.bun/bin/bun run db:verify'      # health check
sudo -u aloedu bash -c 'cd /var/www/alaminn-info && \
  /home/aloedu/.bun/bin/bun run db:backup'      # manual backup
/usr/local/bin/alaminn-db-backup.sh             # manual cron backup

# ─── Mini-services ───────────────────────────────────────────────
sudo systemctl restart alaminn-email-worker alaminn-audit-worker \
                          alaminn-health-monitor alaminn-notification-service
curl -s http://127.0.0.1:3002/health            # email-worker
curl -s http://127.0.0.1:3003/health            # audit-worker
curl -s http://127.0.0.1:3004/health            # health-monitor
curl -s http://127.0.0.1:3005/health            # notification-service

# ─── Nginx ───────────────────────────────────────────────────────
sudo nginx -t                                   # config test
sudo systemctl reload nginx                     # apply changes
sudo tail -f /var/log/nginx/error.log           # error log

# ─── SSL ─────────────────────────────────────────────────────────
sudo certbot certificates                       # list certs
sudo certbot renew --dry-run                    # test renewal
```

---

## Final Checklist

Before you declare "live":

- [ ] DNS A records point to server IP (`dig +short alaminn.info`)
- [ ] `https://alaminn.info` returns HTTP 200
- [ ] `http://alaminn.info` redirects to `https://` (301)
- [ ] `curl https://alaminn.info/api/health` returns `{"status":"ok"}`
- [ ] Admin login works at `/admin/login`
- [ ] `/higher-study`, `/english-learning`, and their sub-pages all return 200
- [ ] `/higher-study/universities/university-of-oxford` returns 200 (DB-backed)
- [ ] `bun run db:verify` reports 0 anomalies
- [ ] All 4 mini-services report `{"status":"ok"}` on their `/health` endpoints
- [ ] SSL certificate valid (check browser padlock)
- [ ] Daily DB backup cron job installed (`/etc/cron.d/alaminn-db-backup`)
- [ ] Uptime monitor pointed at `/api/health`
- [ ] `.env` file has strong, unique secrets (not the placeholders)
- [ ] `ADMIN_PASSWORD` changed from the installer default
- [ ] `sudo unattended-upgrade` enabled for OS security patches

Once all boxes are checked: **you're live.** 🎉

---

*This guide is the single source of truth for going live. If anything here conflicts with `MASTER-SPECIFICATION.md`, this guide wins for deployment procedures; the spec wins for feature/behavior definitions.*
