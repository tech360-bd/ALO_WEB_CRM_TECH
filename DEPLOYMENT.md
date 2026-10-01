> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

> Deployment notice (2026-10-01): the instructions below are historical. The only production target is managed cPanel Node.js. See the root `CPANEL-DEPLOYMENT-GUIDE.md`; hosting configuration and live verification remain BLOCKED.

# ALO Education — Deployment Guide

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB (dev only) | 8+ GB (production) |
| Storage | 50 GB SSD | 120+ GB SSD |
| Node.js | 22 LTS | 22 LTS |
| npm | 10+ | 10+ |
| MySQL | 8.0+ | 8.0+ |
| PM2 | latest | latest |
| Caddy | 2.8+ | 2.8+ |

## Pre-Deployment Checklist

- [ ] Ubuntu 22.04+ server with Node.js 22 LTS and npm 10+
- [ ] MySQL 8 database created (`aloeduca_alo_education`)
- [ ] MySQL user created (`aloeduca_ALO_final_web_crm`) with full privileges
- [ ] Caddy installed and running (`sudo systemctl status caddy`)
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Ports 80 and 443 open for Let's Encrypt
- [ ] Domain DNS pointing to server IP
- [ ] Storage directory: `/home/aloeduca/alo-education/storage/uploads`

## Environment Variables

All required variables are documented in `.env.example`. Copy and configure:

```bash
cp .env.example .env
nano .env
```

**Critical variables:**

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE"
# Example shape only (never write a real username or password into docs):
#   mysql://<DB_USER>:<URL_ENCODED_DB_PASSWORD>@127.0.0.1:3306/<DB_NAME>
# Password must be URL-encoded if it contains special characters

NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_SECRET=same-or-different-random-secret
JWT_SECRET=same-or-different-random-secret
SESSION_SECRET=same-or-different-random-secret
ENCRYPTION_KEY=64-char-hex-for-AES-256

SEED_SUPER_ADMIN_EMAIL=admin@aloeducation.com
SEED_SUPER_ADMIN_PASSWORD=UniqueOneTimePassword123!

APP_URL=https://aloeducation.com
NEXTAUTH_URL=https://aloeducation.com
NEXT_PUBLIC_APP_URL=https://aloeducation.com

# Optional integrations
GROQ_API_KEY=
OPENROUTER_API_KEY=
ZAI_API_KEY=
MAIL_HOST=mail.aloeducation.com
MAIL_PORT=465
MAIL_USERNAME=noreply@aloeducation.com
MAIL_PASSWORD=
```

**Generate secrets:**

```bash
openssl rand -base64 32
# For ENCRYPTION_KEY (32 bytes hex):
openssl rand -hex 32
```

## Deployment Steps (Ubuntu 22.04 LTS)

### Step 1: Clone & Install

```bash
cd /root/alo-live
git fetch origin main
git reset --hard origin/main
npm ci
```

### Step 2: Configure Environment

```bash
cp .env.example .env
nano .env
# Fill DATABASE_URL, secrets, mail, AI keys
```

### Step 3: Database Setup

```bash
# Create database and user in MySQL:
mysql -u root -p
CREATE DATABASE IF NOT EXISTS aloeduca_alo_education CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'aloeduca_ALO_final_web_crm'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON aloeduca_alo_education.* TO 'aloeduca_ALO_final_web_crm'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Apply migrations and seed
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### Step 4: Build

```bash
npm run build
# Output: .next/standalone/server.js
```

### Step 5: Start with PM2 (Port 3025)

```bash
pm2 start ecosystem.config.cjs --env production
# Or directly:
# pm2 start .next/standalone/server.js --name alo-education --env PORT=3025,NODE_ENV=production
pm2 save
pm2 startup
```

### Step 6: Configure Caddy (HTTPS)

```caddyfile
aloeducation.com {
    encode gzip zstd
    log {
        output file /var/log/caddy/alo_education_access.log
    }
    reverse_proxy 127.0.0.1:3025 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }
}
```

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### Step 7: Verify

```bash
curl -fsS http://127.0.0.1:3025/api/health
pm2 logs alo-education
curl -fsS https://aloeducation.com/api/health
```

## Production Memory Settings

```bash
# Set in environment or PM2 config:
PRISMA_CLIENT_ENGINE_TYPE=binary
NODE_OPTIONS="--max-old-space-size=4096"
RAYON_NUM_THREADS=1
UV_THREADPOOL_SIZE=1
NEXT_PRIVATE_BUILD_WORKER=0
```

## Database Provider

- **Production:** MySQL 8 (`provider = "mysql"` in schema.prisma)
- **Connection:** via `DATABASE_URL` env var
- **Migrations:** `npx prisma migrate deploy` (never `db push` in prod)

## Backup Strategy

```bash
# Daily MySQL backup (cron)
0 2 * * * mysqldump -u aloeduca_ALO_final_web_crm -p'YOUR_PASSWORD' aloeduca_alo_education | gzip > /backup/db_$(date +\%Y\%m\%d).sql.gz

# Weekly storage backup
0 3 * * 0 rsync -av /home/aloeduca/alo-education/storage/ /backup/storage/

# Keep 30 days
0 4 * * * find /backup -name "*.sql.gz" -mtime +30 -delete

# Restore:
# gunzip < /backup/db_YYYYMMDD.sql.gz | mysql -u USER -p DATABASE
```

## Troubleshooting

### Server Won't Start
```bash
lsof -i :3025
ss -lntp | grep 3025
pm2 logs alo-education --lines 100
pm2 describe alo-education
```

### Database Connection Failed
```bash
mysql -u aloeduca_ALO_final_web_crm -p aloeduca_alo_education -e "SELECT 1"
# Check DATABASE_URL encoding — special chars must be URL-encoded
```

### Prisma Client Error
```bash
npx prisma generate
npx prisma validate
# Ensure DATABASE_URL is set
```

### OOM (Out of Memory)
- Ensure 8GB+ RAM in production
- Set `PRISMA_CLIENT_ENGINE_TYPE=binary`
- Build uses `NODE_OPTIONS='--max-old-space-size=4096'` (already in package.json)
- Runtime uses `['error']` log level only (fixed in src/lib/db.ts)

### Caddy / SSL
```bash
sudo systemctl status caddy
sudo journalctl -u caddy --since "5 minutes ago"
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```
