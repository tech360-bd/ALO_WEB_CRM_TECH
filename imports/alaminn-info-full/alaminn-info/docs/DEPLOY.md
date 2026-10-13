<!--
  Title: Alaminn.info — Canonical Deployment (Ubuntu 24.04 LTS)
  Canonical Stack: Next.js 16 · PostgreSQL 17 · Redis 7 · BullMQ · Auth.js · Caddy 2 · systemd · Ubuntu 24.04 LTS
  Last Updated: 2025
  Audience: Operators, DevOps engineers
-->

# DEPLOY — Canonical Ubuntu 24.04 Deployment

This document is the **single source of truth** for deploying Alaminn.info to a production
Ubuntu 24.04 LTS server. It uses the canonical stack only — **PostgreSQL 17, Redis 7,
Caddy 2, and systemd**. It does **not** use PM2, Nginx, Apache, cPanel, SQLite, MySQL, or
XAMPP. If you find a legacy guide recommending any of those, ignore it and follow this
document.

---

## Table of Contents

1. [Server Prerequisites](#1-server-prerequisites)
2. [Install System Packages](#2-install-system-packages)
3. [Provision PostgreSQL 17](#3-provision-postgresql-17)
4. [Provision Redis 7](#4-provision-redis-7)
5. [Provision S3-Compatible Object Storage](#5-provision-s3-compatible-object-storage)
6. [Create the Application User & Directory](#6-create-the-application-user--directory)
7. [Clone, Install, Build](#7-clone-install-build)
8. [Environment Configuration](#8-environment-configuration)
9. [Database Migrate & Seed](#9-database-migrate--seed)
10. [Install systemd Units](#10-install-systemd-units)
11. [Install the Caddy Site Block](#11-install-the-caddy-site-block)
12. [Backup Timer (systemd)](#12-backup-timer-systemd)
13. [Start & Verify](#13-start--verify)
14. [Post-Deploy Hardening](#14-post-deploy-hardening)
15. [Rolling Update Procedure](#15-rolling-update-procedure)
16. [Rollback Procedure](#16-rollback-procedure)

---

## 1. Server Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS (latest HWE kernel) |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| Swap | 2 GB | 4 GB (prevents build OOM) |
| Network | Static public IP, open 80/443 | Same + IPv6 |
| DNS | A/AAAA record pointing to the server | Same + CAA record for Let's Encrypt |

Create a non-root sudo user before proceeding:

```bash
# As root, on a fresh server:
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
# Then: ssh deploy@your-domain.example
```

Update the system:

```bash
sudo apt update && sudo apt -y full-upgrade
sudo apt -y install curl ca-certificates gnupg lsb-release ufw fail2ban unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Configure the firewall (Caddy needs 80/443; SSH on 22; nothing else public):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

## 2. Install System Packages

### 2.1 Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
node -v   # v22.x.x
npm -v
```

### 2.2 Build tools & utilities

```bash
sudo apt -y install build-essential python3 git jq unzip rsync openssl
```

### 2.3 PostgreSQL 17

Use the official PostgreSQL APT repository (Ubuntu's default may lag):

```bash
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list'
sudo apt update
sudo apt -y install postgresql-17 postgresql-client-17
sudo systemctl enable --now postgresql
psql --version   # psql (PostgreSQL) 17.x
```

### 2.4 Redis 7

```bash
sudo apt -y install redis-server
sudo systemctl enable --now redis-server
redis-cli ping   # PONG
```

### 2.5 Caddy 2

```bash
sudo apt -y install debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt -y install caddy
caddy version   # v2.x.x
```

---

## 3. Provision PostgreSQL 17

### 3.1 Create the database role and database

```bash
sudo -u postgres psql <<SQL
-- Replace \${DB_PASSWORD} with a strong, randomly generated password.
CREATE ROLE alaminn_info WITH LOGIN PASSWORD '${DB_PASSWORD}' CREATEDB;
CREATE DATABASE alaminn_info OWNER alaminn_info;
-- Enforce UTF-8 + C collation (deterministic, index-friendly).
ALTER DATABASE alaminn_info SET timezone TO 'UTC';
\q
SQL
```

Generate the password:

```bash
openssl rand -base64 32
```

### 3.2 Authentication

Edit `/etc/postgresql/17/main/pg_hba.conf` so the app role connects over local socket and
localhost with `scram-sha-256`:

```
# TYPE  DATABASE      USER          ADDRESS          METHOD
local   all           postgres                       peer
local   all           all                            scram-sha-256
host    all           all           127.0.0.1/32     scram-sha-256
host    all           all           ::1/128          scram-sha-256
```

Reload:

```bash
sudo systemctl reload postgresql
```

### 3.3 Connection test

```bash
PGPASSWORD='${DB_PASSWORD}' psql -U alaminn_info -d alaminn_info -h 127.0.0.1 -c 'SELECT version();'
```

### 3.4 Tune PostgreSQL (optional, recommended)

Edit `/etc/postgresql/17/main/postgresql.conf`:

```conf
max_connections = 100
shared_buffers = 1GB              # 25% of RAM on an 8GB box
effective_cache_size = 4GB        # 50% of RAM
work_mem = 16MB
maintenance_work_mem = 256MB
random_page_cost = 1.1            # SSD
checkpoint_completion_target = 0.9
wal_buffers = 16MB
log_min_duration_statement = 500  # log slow queries (>500ms)
```

Restart:

```bash
sudo systemctl restart postgresql
```

---

## 4. Provision Redis 7

### 4.1 Set a password

Edit `/etc/redis/redis.conf`:

```conf
bind 127.0.0.1 ::1
protected-mode yes
port 6379
requirepass ${REDIS_PASSWORD}
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

Restart:

```bash
sudo systemctl restart redis-server
redis-cli -a '${REDIS_PASSWORD}' ping   # PONG
```

### 4.2 The connection URL

The app expects `REDIS_URL`:

```
redis://:${REDIS_PASSWORD}@127.0.0.1:6379/0
```

Use database index `0` for the app, `1` for BullMQ (or keep both in `0` — BullMQ prefixes
keys with `{bull}:`).

---

## 5. Provision S3-Compatible Object Storage

You need an S3-compatible bucket for:

- Media uploads (article images, resources, brand assets).
- Database backups (`pg_dump` output).
- Long-term archive of generated exports.

Acceptable providers: AWS S3, Cloudflare R2, MinIO (self-hosted), Backblaze B2, Wasabi.

Create:

1. A bucket, e.g. `alaminn-info-media`.
2. An IAM / API user with `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`,
   `s3:ListBucket` on that bucket.
3. Record the **endpoint URL**, **region**, **access key**, **secret key**, and
   **bucket name** — these become `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`,
   `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` in the app env.

For self-hosted MinIO on the same host:

```bash
docker run -d --name minio --restart unless-stopped \
  -p 127.0.0.1:9000:9000 -p 127.0.0.1:9001:9001 \
  -e MINIO_ROOT_USER=admin -e MINIO_ROOT_PASSWORD='${MINIO_ROOT_PASSWORD}' \
  -v /var/lib/minio:/data minio/minio server /data --console-address ":9001"
```

Then create a bucket and a restricted user via the MinIO console at `http://127.0.0.1:9001`.

---

## 6. Create the Application User & Directory

Run the app as a dedicated, unprivileged system user — never as `root` and never as your
`deploy` sudo user.

```bash
sudo useradd --system --home /opt/alaminn-info --shell /usr/sbin/nologin alaminn-info
sudo mkdir -p /opt/alaminn-info
sudo chown alaminn-info:alaminn-info /opt/alaminn-info
```

The `deploy` sudo user clones and builds; the `alaminn-info` system user runs the
services. Give `deploy` group write access during deploys:

```bash
sudo usermod -aG alaminn-info deploy
sudo chmod 750 /opt/alaminn-info
```

---

## 7. Clone, Install, Build

Run these as the `deploy` user:

```bash
cd /opt/alaminn-info
sudo -u deploy git clone <your-repo-url> /tmp/alaminn-info-src
sudo -u deploy rsync -a --delete /tmp/alaminn-info-src/ /opt/alaminn-info/
cd /opt/alaminn-info

# Install dependencies (postinstall runs `prisma generate`)
sudo -u deploy npm ci --omit=dev=false   # we need devDeps for the build

# Build the standalone bundle
sudo -u deploy npm run build

# Prune dev dependencies for a smaller runtime footprint
sudo -u deploy npm prune --omit=dev
```

After the build, `.next/standalone/server.js` exists and `.next/static/` has been copied
into the standalone tree (per the `build` script in `package.json`).

---

## 8. Environment Configuration

The app reads its environment from a single file loaded by systemd:
`/etc/alaminn-info/env`. This file is **root-readable only** (mode `0600`, owner `root`).
The systemd units reference it via `EnvironmentFile=`.

```bash
sudo mkdir -p /etc/alaminn-info
sudo tee /etc/alaminn-info/env >/dev/null <<'EOF'
# ─── App ──────────────────────────────────────────────────
NODE_ENV=production
PORT=3001
HOSTNAME=127.0.0.1
NEXT_PUBLIC_SITE_URL=https://your-domain.example
APP_URL=https://your-domain.example

# ─── Database (PostgreSQL 17) ─────────────────────────────
DATABASE_URL=postgresql://alaminn_info:${DB_PASSWORD}@127.0.0.1:5432/alaminn_info?schema=public&connection_limit=20
DIRECT_URL=postgresql://alaminn_info:${DB_PASSWORD}@127.0.0.1:5432/alaminn_info?schema=public

# ─── Redis ────────────────────────────────────────────────
REDIS_URL=redis://:${REDIS_PASSWORD}@127.0.0.1:6379/0

# ─── Auth (Auth.js) ───────────────────────────────────────
AUTH_SECRET=${AUTH_SECRET}
AUTH_TRUST_HOST=true
SESSION_TTL_SEC=28800

# ─── SMTP ─────────────────────────────────────────────────
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
SMTP_USER=alerts@your-domain.example
SMTP_PASS=${SMTP_PASSWORD}
EMAIL_FROM="Al Aminn <alerts@your-domain.example>"
EMAIL_REPLY_TO=alerts@your-domain.example

# ─── S3 ───────────────────────────────────────────────────
S3_ENDPOINT=https://s3.your-region.example
S3_REGION=your-region
S3_BUCKET=alaminn-info-media
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY}
S3_SECRET_ACCESS_KEY=${S3_SECRET_KEY}
S3_FORCE_PATH_STYLE=false

# ─── Rate limiting ────────────────────────────────────────
RATE_LIMIT_MAX=120
RATE_LIMIT_WINDOW_SEC=60

# ─── Feature flags ────────────────────────────────────────
FEATURE_HIGHER_STUDY=true
FEATURE_ENGLISH_LEARNING=true
FEATURE_NEWSLETTER=true

# ─── Logging ──────────────────────────────────────────────
LOG_LEVEL=info
EOF

sudo chown root:alaminn-info /etc/alaminn-info/env
sudo chmod 640 /etc/alaminn-info/env
```

Generate the secrets:

```bash
openssl rand -hex 32   # AUTH_SECRET — must be >= 32 bytes
openssl rand -hex 24   # CRON_SECRET
```

> The full variable reference with validation rules is in **[ENVIRONMENT.md](./ENVIRONMENT.md)**.

---

## 9. Database Migrate & Seed

Run migrations as the `alaminn-info` user so file ownership is correct:

```bash
cd /opt/alaminn-info
sudo -u alaminn-info env $(sudo cat /etc/alaminn-info/env | xargs) \
  npx prisma migrate deploy
```

Verify migrations are applied:

```bash
sudo -u alaminn-info env $(sudo cat /etc/alaminn-info/env | xargs) \
  npx prisma migrate status
```

Seed the base data (admin user, settings, sample content):

```bash
sudo -u alaminn-info env $(sudo cat /etc/alaminn-info/env | xargs) \
  npm run db:seed
```

> **Security:** rotate the default admin password immediately after the first login. The
> seeded password is in `prisma/seed.ts` and must not remain in use.

---

## 10. Install systemd Units

The repo ships two unit files in `deploy/systemd/`:

- `alaminn-info-web.service` — the Next.js standalone server.
- `alaminn-info-worker.service` — the BullMQ background worker.

### 10.1 The web unit

`deploy/systemd/alaminn-info-web.service`:

```ini
[Unit]
Description=Alaminn.info — Next.js web server
After=network-online.target postgresql.service redis-server.service
Wants=network-online.target

[Service]
Type=simple
User=alaminn-info
Group=alaminn-info
WorkingDirectory=/opt/alaminn-info
EnvironmentFile=/etc/alaminn-info/env
ExecStart=/usr/bin/node /opt/alaminn-info/.next/standalone/server.js
Restart=on-failure
RestartSec=5s
TimeoutStopSec=15s
KillSignal=SIGTERM

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/alaminn-info/storage
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=false
SystemCallFilter=@system-service

# Resource limits
LimitNOFILE=65536
MemoryMax=2G

# Logging → journald
StandardOutput=journal
StandardError=journal
SyslogIdentifier=alaminn-info-web

[Install]
WantedBy=multi-user.target
```

### 10.2 The worker unit

`deploy/systemd/alaminn-info-worker.service`:

```ini
[Unit]
Description=Alaminn.info — BullMQ background worker
After=network-online.target postgresql.service redis-server.service
Wants=network-online.target

[Service]
Type=simple
User=alaminn-info
Group=alaminn-info
WorkingDirectory=/opt/alaminn-info
EnvironmentFile=/etc/alaminn-info/env
ExecStart=/usr/bin/node /opt/alaminn-info/.next/standalone/worker.js
Restart=on-failure
RestartSec=5s
TimeoutStopSec=30s
KillSignal=SIGTERM

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/alaminn-info/storage
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
SystemCallFilter=@system-service
LimitNOFILE=65536
MemoryMax=1G

StandardOutput=journal
StandardError=journal
SyslogIdentifier=alaminn-info-worker

[Install]
WantedBy=multi-user.target
```

### 10.3 Install & enable

```bash
sudo cp deploy/systemd/alaminn-info-web.service /etc/systemd/system/
sudo cp deploy/systemd/alaminn-info-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable alaminn-info-web.service alaminn-info-worker.service
# Do NOT start yet — start Caddy first (§11), then start the app (§13).
```

---

## 11. Install the Caddy Site Block

Caddy terminates TLS (automatic Let's Encrypt) and reverse-proxies to the Next.js
standalone server on `127.0.0.1:${PORT}`.

### 11.1 Site block

`deploy/caddy/Caddyfile`:

```caddyfile
your-domain.example {
    encode zstd gzip

    # Security headers
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        -Server
    }

    # Static assets cache (Next.js /_next/static/*)
    @static path /_next/static/* /favicon.ico /robots.txt /sitemap.xml /manifest.webmanifest
    handle @static {
        header Cache-Control "public, max-age=31536000, immutable"
        reverse_proxy 127.0.0.1:${PORT}
    }

    # API + everything else → Next.js
    reverse_proxy 127.0.0.1:${PORT} {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Rate limit sensitive endpoints (optional, via Caddy's request_body + handle)
    @login path /api/v1/auth/login /admin/login
    handle @login {
        reverse_proxy 127.0.0.1:${PORT}
    }

    # Gzip/compress responses
    import compression
}
```

> Replace `your-domain.example` with your real domain and `${PORT}` with the port from
> `/etc/alaminn-info/env` (default `3001`). The DNS A/AAAA record must already point to
> this server or Caddy's ACME challenge will fail.

### 11.2 Install

```bash
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
# Validate the config (does not start/reload)
sudo caddy validate --config /etc/caddy/Caddyfile
# Reload Caddy (picks up the new site block + provisions the TLS cert)
sudo systemctl reload caddy
```

### 11.3 Verify TLS

```bash
curl -I https://your-domain.example
# Expect: HTTP/2 502 (app not started yet) — that's fine, TLS works.
```

If you see a certificate error, check `sudo journalctl -u caddy -n 50` for ACME details.

---

## 12. Backup Timer (systemd)

Install a systemd timer that runs the backup script nightly. The full strategy is in
**[BACKUP.md](./BACKUP.md)**; the install step is here.

```bash
sudo cp deploy/systemd/alaminn-info-backup.service /etc/systemd/system/
sudo cp deploy/systemd/alaminn-info-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now alaminn-info-backup.timer
systemctl list-timers alaminn-info-backup.timer
```

---

## 13. Start & Verify

### 13.1 Start the services

```bash
sudo systemctl start alaminn-info-web.service
sudo systemctl start alaminn-info-worker.service
sudo systemctl status alaminn-info-web.service
sudo systemctl status alaminn-info-worker.service
```

### 13.2 Verify checklist

Run each command and confirm the expected result.

| # | Command | Expected |
|---|---|---|
| 1 | `curl -fsS https://your-domain.example/api/health` | `{"status":"ok",...}` HTTP 200 |
| 2 | `curl -fsS https://your-domain.example/api/health/deep` | DB + Redis + S3 all `ok` |
| 3 | `curl -I https://your-domain.example` | HTTP 200, `server:` header absent |
| 4 | `curl -I https://your-domain.example/_next/static/...` | `cache-control: ...immutable` |
| 5 | `sudo systemctl is-active alaminn-info-web.service` | `active` |
| 6 | `sudo systemctl is-active alaminn-info-worker.service` | `active` |
| 7 | `sudo journalctl -u alaminn-info-web.service -n 50 --no-pager` | No ERROR lines |
| 8 | `sudo -u postgres psql -d alaminn_info -c "SELECT count(*) FROM \"User\";"` | > 0 (seeded) |
| 9 | `redis-cli -a '${REDIS_PASSWORD}' ping` | `PONG` |
| 10 | `sudo systemctl list-timers alaminn-info-backup.timer` | Next run scheduled |
| 11 | `sudo caddy version` | v2.x.x |
| 12 | Open `https://your-domain.example/admin/login` in a browser | Login page renders, no cert warning |
| 13 | Log in with seeded admin, change password | Password change succeeds |
| 14 | Submit the contact form | Inquiry row appears in admin CRM |
| 15 | Trigger an AI task | Job appears in BullMQ queue and completes |

### 13.3 If any check fails

See **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for diagnosis steps per symptom.

---

## 14. Post-Deploy Hardening

### 14.1 Rotate the seeded admin password

```bash
# After first login → Admin → Users → click your admin user → Set password
```

### 14.2 Disable the default SSH password login

Edit `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
PermitRootLogin no
```

```bash
sudo systemctl restart ssh
```

### 14.3 Enable fail2ban for SSH and Caddy

```bash
sudo tee /etc/fail2ban/jail.local >/dev/null <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
EOF
sudo systemctl enable --now fail2ban
```

### 14.4 Confirm unattended-upgrades

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
# Security updates install automatically; reboot if needed.
```

### 14.5 Lock down the env file

```bash
sudo chmod 640 /etc/alaminn-info/env
sudo chown root:alaminn-info /etc/alaminn-info/env
```

---

## 15. Rolling Update Procedure

A zero-downtime rolling update uses Caddy's health-aware proxying + systemd's
`Restart=on-failure`. The simplest correct sequence:

```bash
# 1. Pull the new code
cd /opt/alaminn-info
sudo -u deploy git fetch --all
sudo -u deploy git checkout --force <new-tag>

# 2. Install + build (app still serving the old version)
sudo -u deploy npm ci --omit=dev=false
sudo -u deploy npm run build
sudo -u deploy npm prune --omit=dev

# 3. Apply migrations (forward-only; migrations must be backward-compatible)
sudo -u alaminn-info env $(sudo cat /etc/alaminn-info/env | xargs) \
  npx prisma migrate deploy

# 4. Restart the worker first (drains in-flight jobs, then restarts)
sudo systemctl restart alaminn-info-worker.service

# 5. Restart the web server
sudo systemctl restart alaminn-info-web.service

# 6. Verify
curl -fsS https://your-domain.example/api/health/deep
sudo journalctl -u alaminn-info-web.service -n 50 --no-pager
```

For a true zero-downtime deploy, run a blue/green pair (two app instances on
`${PORT}` and `${PORT}+1`, Caddy load-balances between them, drain the old one). This is
described in **[OPERATIONS.md](./OPERATIONS.md)** §Rolling Updates.

---

## 16. Rollback Procedure

If the new version is broken:

```bash
# 1. Roll back the code
cd /opt/alaminn-info
sudo -u deploy git checkout --force <previous-tag>
sudo -u deploy npm ci --omit=dev=false
sudo -u deploy npm run build
sudo -u deploy npm prune --omit=dev

# 2. Restart services
sudo systemctl restart alaminn-info-worker.service
sudo systemctl restart alaminn-info-web.service

# 3. If a migration broke the schema, restore from the latest pre-deploy backup.
#    See RESTORE.md.
```

> **Migration safety rule:** every migration in `prisma/migrations/` must be
> forward-compatible (additive). Destructive changes (drop column, rename table) require a
> two-phase deploy: (1) deploy code that stops using the column, (2) deploy the migration
> that drops it. See **[DATABASE.md](./DATABASE.md)** §Migration Safety.

---

## Appendix A — Cheat Sheet

```bash
# Services
sudo systemctl {start|stop|restart|status} alaminn-info-web.service
sudo systemctl {start|stop|restart|status} alaminn-info-worker.service
sudo systemctl reload caddy

# Logs
sudo journalctl -u alaminn-info-web.service -f
sudo journalctl -u alaminn-info-worker.service -f
sudo journalctl -u caddy -f

# Database
sudo -u postgres psql -d alaminn_info
PGPASSWORD='${DB_PASSWORD}' psql -U alaminn_info -d alaminn_info -h 127.0.0.1

# Redis
redis-cli -a '${REDIS_PASSWORD}'

# Backup (manual)
sudo systemctl start alaminn-info-backup.service

# Env
sudo cat /etc/alaminn-info/env
```

---

## Appendix B — What NOT to use

The following are explicitly **not** part of the canonical stack and must not appear in a
production deployment:

| Do NOT use | Use instead |
|---|---|
| PM2 | systemd |
| Nginx | Caddy 2 |
| Apache | Caddy 2 |
| cPanel | Plain Ubuntu 24.04 + systemd |
| SQLite | PostgreSQL 17 |
| MySQL / MariaDB | PostgreSQL 17 |
| XAMPP | PostgreSQL 17 + Node.js 22 |
| `forever` | systemd |
| `nohup` + `&` | systemd |

If a legacy guide (in `worklog.md` or older docs) references any of the above, that guide
describes the **pre-v6** state and has been superseded by this document.
