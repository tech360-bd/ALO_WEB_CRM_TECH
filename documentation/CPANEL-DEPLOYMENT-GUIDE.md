# ALO Education — Production Deployment Guide

## Server Details
| Item | Value |
|------|-------|
| Server IP | 103.231.239.79 |
| SSH User | aloedu |
| App Path | /home/aloedu/apps/site-edu |
| Port | 3015 |
| PM2 Name | site-edu |
| Domain | aloeducation.com |
| Database | MySQL 8 (db_education) |
| DB User | user_edu |
| Reverse Proxy | Caddy |

## Prerequisites
- Node.js 22.x or Bun 1.x installed
- MySQL 8 running on 127.0.0.1:3306
- PM2 installed (`npm install -g pm2`)
- Caddy installed and configured
- Redis running on 127.0.0.1:6379

## Step 1: Upload Source Code
```bash
# SCP the source archive to server
scp ALO_EDUCATION_COMPLETE_SOURCE.zip aloedu@103.231.239.79:/home/aloedu/apps/

# SSH into server
ssh aloedu@103.231.239.79

# Extract
cd /home/aloedu/apps
mkdir site-edu
cd site-edu
unzip ../ALO_EDUCATION_COMPLETE_SOURCE.zip
```

## Step 2: Configure Environment
```bash
cd /home/aloedu/apps/site-edu
cp .env.example .env
nano .env
```

Set these critical values (all placeholders — real values live only in the server `.env`):

> **SECURITY (2026-09-18):** a real production database password was previously committed in this file. It has been removed and **must be treated as compromised — rotate it**. Never put credentials in documentation; read them from the server's `.env` / secret store at runtime.
```
DATABASE_URL="mysql://<DB_USER>:<DB_PASSWORD>@127.0.0.1:3306/<DB_NAME>"
NEXTAUTH_SECRET="<generate: openssl rand -hex 32>"
JWT_SECRET="<generate: openssl rand -hex 32>"
NEXTAUTH_URL="https://aloeducation.com"
PORT=3015
UPLOAD_DIR=/home/aloedu/storage/uploads
```

## Step 3: Install Dependencies
```bash
cd /home/aloedu/apps/site-edu
bun install
```

## Step 4: Setup Database
```bash
# Create storage directory
mkdir -p /home/aloedu/storage/uploads

# Generate Prisma Client
bunx prisma generate

# Push schema to MySQL (creates all 113 tables)
bunx prisma db push

# Run all seeds
bun run db:seed
```

## Step 5: Build Production
```bash
bun run build
```

## Step 6: Configure PM2
```bash
# Start with PM2
pm2 start "bun run start" --name site-edu --update-env

# Save PM2 config
pm2 save

# Enable PM2 startup (auto-restart on reboot)
pm2 startup
```

## Step 7: Configure Caddy
```bash
# Copy Caddyfile
sudo cp Caddyfile /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

The Caddyfile configures:
- `aloeducation.com` → port 3015 (main site)
- `english.aloeducation.com` → port 3016 (English portal)
- `learn.aloeducation.com` → port 3017 (LMS)

Caddy automatically provisions SSL certificates via Let's Encrypt.

## Step 8: Verify Deployment
```bash
# Health check
curl http://127.0.0.1:3015/api/stats

# Or use the health check script
./scripts/health-check.sh

# Check PM2 status
pm2 status site-edu

# Check logs
pm2 logs site-edu --lines 50
```

## Step 9: Verify Public Access
```bash
curl -I https://aloeducation.com
curl -I https://aloeducation.com/logo.svg
curl https://aloeducation.com/api/stats
```

## Caddy Configuration
The Caddyfile is at `/etc/caddy/Caddyfile`:
```
aloeducation.com, www.aloeducation.com {
    encode gzip
    reverse_proxy 127.0.0.1:3015
    log {
        output file /var/log/caddy/edu.log
    }
}
```

## PM2 Commands
```bash
pm2 start "bun run start" --name site-edu  # Start
pm2 restart site-edu                        # Restart
pm2 stop site-edu                           # Stop
pm2 logs site-edu                           # View logs
pm2 monit                                   # Monitor
pm2 status                                  # Status
```

## Deployment Scripts
Located in `scripts/`:
- `deploy.sh` — Full deployment (pull, install, build, restart)
- `restart.sh` — Restart PM2 process
- `health-check.sh` — Verify all services
- `rollback.sh` — Rollback to previous version

## Firewall (UFW)
```bash
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 80/tcp       # HTTP (Caddy)
sudo ufw allow 443/tcp      # HTTPS (Caddy)
sudo ufw deny 3015/tcp      # Block direct port access (Caddy proxies)
sudo ufw enable
```

## MySQL Backup
```bash
mysqldump --no-tablespaces -u user_edu -p db_education > /home/aloedu/backups/db_education_$(date +%Y%m%d).sql
```

## Update Deployment
```bash
cd /home/aloedu/apps/site-edu
./scripts/deploy.sh
```

## Rollback
```bash
# Keep backup before each deploy
cp -r /home/aloedu/apps/site-edu /home/aloedu/apps/site-edu-backup

# To rollback:
./scripts/rollback.sh
```
