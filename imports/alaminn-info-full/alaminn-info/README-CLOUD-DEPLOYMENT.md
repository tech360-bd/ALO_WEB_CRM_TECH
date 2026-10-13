# Alaminn.info — Cloud / VPS Deployment Guide

This is the **RECOMMENDED** deployment path for the Alaminn.info platform (Next.js 16
standalone build). It supersedes the shared-hosting/cPanel path. Cloud and VPS targets
give you full control of the Node.js runtime, a persistent filesystem for SQLite, the
ability to run `prisma` migrations, and proper process supervision.

The build artifact is `.next/standalone/server.js` — a self-contained Node.js HTTP
server. Any environment that can run Node.js 22 and expose a TCP port can host this
project. The four targets below are ranked by fit for this project.

---

## Table of Contents

1. [Recommended Deployment Targets](#1-recommended-deployment-targets)
2. [Vercel Option](#2-vercel-option)
3. [Cloud Run Option (GCP)](#3-cloud-run-option-gcp)
4. [VPS Option (Recommended)](#4-vps-option-recommended)
5. [Recommended Database](#5-recommended-database)
6. [Environment Variables](#6-environment-variables)
7. [Build & Start Commands](#7-build--start-commands)
8. [Domain Setup](#8-domain-setup)
9. [Rollback](#9-rollback)
10. [Appendix: Sample Configs](#10-appendix-sample-configs)

---

## 1. Recommended Deployment Targets

Ranked from best fit to worst fit for THIS project (Next.js 16 standalone + SQLite):

| Rank | Target            | SQLite persists? | Cost (entry) | Setup effort | Notes                                          |
|------|-------------------|------------------|--------------|--------------|------------------------------------------------|
| 1    | **VPS**           | Yes              | ~$4–$6/mo    | Medium       | Full control, cheapest persistent SQLite.      |
| 2    | **Fly.io**        | Yes (litestream) | ~$0–$5/mo    | Medium       | SQLite with automatic S3 replication.          |
| 3    | **Cloud Run**     | Yes (volume)     | ~$0–$10/mo   | High         | Scales to zero; needs persistent volume.       |
| 4    | **Vercel**        | **No**           | Free–$20/mo  | Low          | Requires migration from SQLite to Postgres.    |

### Vercel (best Next.js DX, but caveat)
Vercel is the best-in-class platform for Next.js: zero-config builds, edge CDN,
automatic SSL, preview deploys, instant rollbacks. The single caveat is that
Vercel's serverless functions run on an **ephemeral filesystem** — a SQLite file
written to `/tmp` or `/app/db/custom.db` will be **wiped between invocations**.
SQLite on Vercel only works if you mount an external volume (not officially
supported) or move the database to a managed Postgres provider. We recommend
migrating to Postgres (Neon) if you choose Vercel.

### Cloud Run (GCP)
Containerized, scales to zero (cost-saving for low-traffic sites), supports
persistent volumes (Filestore or GCS via gcsfuse). The container model fits
`node:22-alpine` + standalone output perfectly. More setup than Vercel.

### VPS (Hetzner, DigitalOcean, Linode)
Full root control. The filesystem is permanent, so SQLite just works. Cheapest
path for low-to-medium traffic. You can also run the mini-services (notification,
email-worker, audit-worker, health-monitor) on the same host via pm2. **This is
the recommended path for this project.**

### Fly.io
First-class SQLite support via `litestream`, which streams WAL changes to
S3-compatible storage and enables fast region failover. A good middle ground
between VPS (manual) and serverless (no persistent SQLite).

---

## 2. Vercel Option

**Pros:** Zero-config Next.js, global edge CDN, automatic SSL, preview deploys for every PR.

**Cons:** Serverless = ephemeral filesystem; SQLite will NOT persist across
invocations; cold starts on infrequently-hit routes; 100 GB-Hours compute on
the free Hobby tier.

**Requirement:** Migrate the database from SQLite to Postgres (Neon, Supabase)
or MySQL (PlanetScale) BEFORE deploying. Update the Prisma datasource provider
and run `prisma db push` (or `prisma migrate deploy`) against the new database.

### Steps

1. **Push the repository to GitHub** (if not already):
   ```bash
   git remote add origin git@github.com:your-user/alaminn-info.git
   git push -u origin main
   ```

2. **Import the project into Vercel**
   - Go to https://vercel.com/new
   - Select the GitHub repository
   - Vercel auto-detects Next.js — no framework preset to choose

3. **Set environment variables in the Vercel dashboard**
   - Project Settings → Environment Variables
   - Add every key from `.env.example` (see section 6 below)
   - The `DATABASE_URL` must now point at your Postgres instance, e.g.:
     `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/alaminn?sslmode=require`
   - Generate `AUTH_SECRET` locally with `openssl rand -base64 32` and paste it in

4. **Switch the Prisma datasource to `postgresql`**
   In `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   Commit the change and push. Vercel re-runs `prisma generate` automatically
   (it is in `postinstall`).

5. **Run the initial schema push via Vercel's build**
   Add a `vercel-build` script in `package.json`:
   ```json
   "vercel-build": "prisma generate && prisma db push && next build"
   ```
   Vercel runs this hook during the build step. The first deploy provisions the
   schema. Subsequent deploys run `prisma db push` to apply schema diffs.

6. **Deploy**
   Click "Deploy" in the Vercel dashboard. Build command: `next build` (Vercel
   handles the standalone output automatically — you do not need to copy static
   assets manually, Vercel reads `output: 'standalone'` from `next.config.ts`).
   Start command: automatic (Vercel wraps the Next.js server).

7. **Seed the admin user** (once, after the first successful deploy):
   ```bash
   vercel env pull .env.local
   npx prisma db seed   # or run scripts/seed-admin.ts against the Neon DB
   ```

---

## 3. Cloud Run Option (GCP)

**Pros:** Scales to zero (pay only for traffic); persistent volumes available;
automatic SSL via Google-managed certificates; container-based and reproducible.

**Cons:** More setup than Vercel; cold starts (mitigated by `--min-instances=1`);
persistent volume setup is non-trivial.

### Steps

1. **Create the Dockerfile** (sample below in section 10.1)

2. **Build the image**:
   ```bash
   gcloud auth configure-docker
   gcloud builds submit --tag gcr.io/PROJECT-ID/alaminn-info
   ```
   (Cloud Build runs the Dockerfile; you can also do `docker build` locally and
   `docker push`.)

3. **Deploy with a persistent volume** mounted at `/app/db/`:
   ```bash
   gcloud run deploy alaminn-info \
     --image gcr.io/PROJECT-ID/alaminn-info \
     --region us-central1 \
     --platform managed \
     --port 3000 \
     --memory 1Gi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10 \
     --add-volume name=sqlite-data,type=cloud-source-repositories \
     --add-volume-mount volume=sqlite-data,mount-path=/app/db \
     --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_SITE_URL=https://alaminn.info" \
     --set-secrets "AUTH_SECRET=auth-secret:latest,DATABASE_URL=db-url:latest"
   ```
   (For a real persistent volume you would use `--add-volume name=sqlite-data,
   source=...` backed by Filestore. See GCP docs for the exact `--add-volume`
   syntax for your volume type.)

4. **Set environment variables via `--set-env-vars`**
   (and secrets via `--set-secrets`, which pulls from Secret Manager)

5. **Map a custom domain**
   - Cloud Run → your service → "Custom Domains" → "Add Mapping"
   - Google provisions a managed SSL certificate automatically
   - Add the provided DNS records (A/AAAA or CNAME)

6. **SSL is automatic** via Google-managed certificates. No certbot needed.

---

## 4. VPS Option (Recommended)

**Pros:** Full root control of the OS; persistent filesystem (SQLite just works);
cheapest for low-to-medium traffic (~$4–$6/mo); can host all four mini-services
on the same box via pm2; no vendor lock-in.

**Cons:** You manage everything (OS patches, security updates, backups, SSL
renewal); no auto-scaling (single instance); manual deploy process (mitigated
with a deploy script).

### Steps

#### (a) Provision a VPS
- **Hetzner Cloud** CX22 (~€4/mo, 4 GB RAM, 40 GB disk) — best value
- **DigitalOcean** Basic Droplet ($6/mo, 1 GB RAM, 25 GB SSD)
- **Linode** Nanode ($5/mo, 1 GB RAM, 25 GB SSD) — for the absolute minimum
- Choose a region close to your audience (e.g., Falkenstein for EU, Ashburn for US East)
- Use Ubuntu 24.04 LTS as the OS
- Add your SSH key during provisioning; disable root password login

#### (b) SSH in and install Node 22
```bash
ssh root@YOUR_SERVER_IP
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version    # should print v22.x.x
```

#### (c) Install pm2 (process manager)
```bash
sudo npm install -g pm2
pm2 --version
```

#### (d) Install nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### (e) Clone the repository or upload a build zip
```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/your-user/alaminn-info.git
cd alaminn-info
```
(Alternatively: build locally, zip `.next/standalone/`, `public/`, `package.json`,
`prisma/`, `node_modules/@prisma`, then `scp` and unzip. This avoids needing the
full toolchain on the server.)

#### (f) Install, build, push schema
```bash
npm ci
npm run build          # produces .next/standalone/
npx prisma generate
npx prisma db push     # creates/migrates db/custom.db
```

#### (g) Create `.env`
```bash
cp .env.example .env
nano .env              # fill in real values (see section 6)
```

#### (h) Start with pm2
```bash
pm2 start .next/standalone/server.js --name alaminn-info --env production
pm2 logs alaminn-info  # verify it boots
```

#### (i) Persist pm2 across reboots
```bash
pm2 save
pm2 startup            # follow the printed one-line sudo command
```

#### (j) Configure nginx as a reverse proxy
See section 10.2 for the full sample config. Quick version:
```bash
sudo nano /etc/nginx/sites-available/alaminn.info
sudo ln -s /etc/nginx/sites-available/alaminn.info /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### (k) SSL with certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d alaminn.info -d www.alaminn.info
```
Certbot installs a systemd timer that auto-renews 30 days before expiry.

---

## 5. Recommended Database

| Target        | Recommended DB                       | Reason                                                  |
|---------------|--------------------------------------|---------------------------------------------------------|
| **VPS**       | SQLite (keep default)                | File-based, zero-config, perfect for low-med traffic.   |
| **Fly.io**    | SQLite + litestream                  | Native WAL replication to S3, region failover.          |
| **Cloud Run** | SQLite on persistent volume OR Cloud SQL Postgres | Volume keeps it simple; Cloud SQL for >1k concurrent. |
| **Vercel**    | Postgres (Neon, Supabase)            | Required — serverless filesystem is ephemeral.          |

This project currently uses SQLite (Prisma provider `sqlite`, file at
`db/custom.db`). With **WAL mode** enabled (which the schema applies at runtime
via `PRAGMA journal_mode=WAL`), SQLite handles up to approximately **1,000
concurrent readers** or **a few concurrent writers** comfortably. For an
executive-authority site of this scope (admin CRM, blog, contact form,
newsletter), SQLite is the right choice and you should not migrate away from it
unless you outgrow these numbers.

For Vercel/serverless targets where SQLite cannot persist, the migration path is:
1. Provision a Neon Postgres database (free tier: 0.5 GB, generous compute)
2. Change `prisma/schema.prisma` `provider` from `sqlite` to `postgresql`
3. Set `DATABASE_URL` to the Neon connection string
4. Run `npx prisma db push` to create the schema
5. Run the admin seed script against the new DB
6. (Optional) Use `prisma migrate` instead of `db push` if you want migration
   history

---

## 6. Environment Variables

The full list is in `.env.example`. Required keys for production:

| Key                     | Purpose                                          | Required?              |
|-------------------------|--------------------------------------------------|------------------------|
| `NODE_ENV`              | Always `production`                              | Yes                    |
| `NEXT_PUBLIC_SITE_URL`  | Canonical URL (e.g. `https://alaminn.info`)      | Yes                    |
| `NEXTAUTH_URL`          | Same as `NEXT_PUBLIC_SITE_URL`                   | Yes                    |
| `AUTH_SECRET`           | Session cookie signing key                        | **Yes (critical)**     |
| `DATABASE_URL`          | SQLite path or Postgres URL                      | Yes                    |
| `EMAIL_FROM`            | From-address for transactional email             | Yes                    |
| `SMTP_HOST/PORT/USER/PASS` | SMTP credentials                              | Yes (or use Resend)    |
| `RESEND_API_KEY`        | Alternative to SMTP                              | Optional               |
| `ADMIN_EMAIL/PASSWORD`  | One-time bootstrap; rotate after first login     | Only for seed          |
| `LOG_LEVEL`             | `error | warn | info | debug`                    | Optional (default info)|
| `BACKUP_RETENTION_COUNT`| How many `db/backups/` to keep                   | Optional (default 30)  |

### Where to set them

- **Vercel:** Project Settings → Environment Variables (mark sensitive keys as "Secret").
- **Cloud Run:** `gcloud run services update alaminn-info --set-env-vars
  KEY=VAL,...` or `--set-secrets` pulling from Secret Manager.
- **VPS:** A `.env` file in the project root, owned by the deploy user, mode `0600`.

### Always set AUTH_SECRET

`AUTH_SECRET` is the symmetric key NextAuth.js uses to sign and encrypt session
cookies. Without it (or with the dev fallback), session cookies are forgeable.
Generate with `openssl rand -base64 32`. Never commit it. Rotating it
invalidates all current sessions.

---

## 7. Build & Start Commands

### Build (produces the standalone server)
```bash
npm run build
```
The `build` script runs `next build && cp -r .next/static .next/standalone/.next/
&& cp -r public .next/standalone/`. The two `cp` steps are required because the
standalone trace does NOT include `static/` (JS/CSS chunks) or `public/`
(images, fonts, icons) by default. After build, the runnable server lives at
`.next/standalone/server.js`.

### Start (production)
```bash
NODE_ENV=production node .next/standalone/server.js
```
The server listens on `process.env.PORT` (default `3000`).

### Start with pm2 (recommended for VPS)
```bash
pm2 start .next/standalone/server.js --name alaminn-info
# or with an ecosystem config (see section 10.3):
pm2 start ecosystem.config.js --env production
```

### Useful pm2 commands
```bash
pm2 status                  # list processes
pm2 logs alaminn-info       # tail logs
pm2 restart alaminn-info    # graceful restart
pm2 reload alaminn-info     # zero-downtime reload (cluster mode only)
pm2 stop alaminn-info
pm2 delete alaminn-info
pm2 monit                   # CPU/memory dashboard
```

---

## 8. Domain Setup

1. **DNS records** at your registrar (Cloudflare, Namecheap, etc.):
   - `A`     `alaminn.info`        → `YOUR_SERVER_IP`
   - `CNAME` `www.alaminn.info`    → `alaminn.info` (or another A record)

2. **Wait for propagation.** Typically 5–60 minutes. Verify with:
   ```bash
   dig alaminn.info +short
   dig www.alaminn.info +short
   ```
   Both should return your server IP.

3. **Reverse proxy on the server.**
   - nginx on ports 80 (HTTP, redirects to 443) and 443 (HTTPS, terminates SSL,
     proxies to `127.0.0.1:3000`)
   - OR Caddy (auto-SSL via Let's Encrypt, simpler config). A sample `Caddyfile`
     is included in the project root if you prefer Caddy.

4. **SSL provisioning.** On a VPS run certbot (section 4k). On Cloud Run, Google
   issues a managed certificate when you map the domain. On Vercel, SSL is
   automatic.

5. **Verify.**
   ```bash
   curl -I https://alaminn.info
   # expect: HTTP/2 200, strict-transport-security header
   curl -I https://www.alaminn.info
   # expect: HTTP/2 301 -> https://alaminn.info/
   ```

---

## 9. Rollback

### Application rollback (VPS / pm2)

Before each deploy, snapshot the current standalone output:
```bash
pm2 stop alaminn-info
rm -rf .next/standalone.bak
mv .next/standalone .next/standalone.bak
# deploy new build:
npm run build
pm2 start alaminn-info
pm2 logs alaminn-info --lines 50    # verify
```

If the new build fails to boot or smoke-tests fail, roll back:
```bash
pm2 stop alaminn-info
rm -rf .next/standalone
mv .next/standalone.bak .next/standalone
pm2 start alaminn-info
pm2 logs alaminn-info --lines 50
```

### Database rollback

Daily backups are written to `db/backups/` (timestamped SQLite files with a
checksum sidecar). To restore the most recent backup:
```bash
bun run db:restore
```
To restore a specific backup, edit `scripts/restore-db.ts` (or pass the
filename via `BACKUP_FILE=` env var if the script supports it). The restore
script:
1. Verifies the backup checksum
2. Stops the pm2 process (or warns if running)
3. Copies the backup over `db/custom.db`
4. Re-applies WAL mode pragmas
5. Runs `db:verify` to confirm integrity

### Cloud Run rollback
```bash
gcloud run services update-traffic alaminn-info --to-revisions \
  alaminn-info-OLD-REVISION=100
```
Or roll back via the Cloud Run "Revisions" UI.

### Vercel rollback
- Dashboard → Deployments → previous deployment → "Instant Rollback"
- Vercel keeps every production deployment; rollback is one click

---

## 10. Appendix: Sample Configs

### 10.1 Sample Dockerfile (Cloud Run / any container host)

```dockerfile
# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install build deps for Prisma (Alpine needs openssl)
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build \
 && npx prisma generate

# ---- Runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck deps + openssl for Prisma + wget for /api/health
RUN apk add --no-cache openssl wget

# Copy standalone output (already includes static + public via the build script)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Persistent SQLite volume mount point
RUN mkdir -p /app/db
VOLUME ["/app/db"]

EXPOSE 3000

# Run migrations on boot, then start the server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
```

Build and push:
```bash
docker build -t alaminn-info .
docker tag alaminn-info gcr.io/PROJECT-ID/alaminn-info
docker push gcr.io/PROJECT-ID/alaminn-info
```

### 10.2 Sample nginx config

Save as `/etc/nginx/sites-available/alaminn.info`:

```nginx
# Redirect HTTP -> HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name alaminn.info www.alaminn.info;

    # certbot will rewrite this block to add the SSL redirect
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name alaminn.info www.alaminn.info;

    # certbot manages these lines
    ssl_certificate     /etc/letsencrypt/live/alaminn.info/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alaminn.info/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Reverse proxy to the Next.js standalone server
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";

        # Long-running requests (AI tool calls, file uploads)
        proxy_read_timeout  90s;
        proxy_send_timeout  90s;

        # Disable buffering for streaming responses
        proxy_buffering off;
    }

    # Static asset caching (Next.js serves these with long-lived Cache-Control)
    location /_next/static/ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_cache_valid  200 1y;
        add_header         Cache-Control "public, max-age=31536000, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript
               application/manifest+json image/svg+xml;

    # Body size limit (file uploads, AI approvals)
    client_max_body_size 10m;
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/alaminn.info /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 10.3 Sample pm2 ecosystem.config.js

Save in the project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'alaminn-info',
      script: '.next/standalone/server.js',
      cwd: '/var/www/alaminn.info',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
      // Restart policy
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      max_memory_restart: '512M',
      // Logging
      out_file: '/var/log/alaminn-info/out.log',
      error_file: '/var/log/alaminn-info/err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: false,
    },
  ],
};
```

Then:
```bash
sudo mkdir -p /var/log/alaminn-info
sudo chown -R $USER:$USER /var/log/alaminn-info
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

To also run the four mini-services under pm2, append additional `apps` entries
for `mini-services/notification-service/index.ts`,
`mini-services/email-worker/index.ts`, `mini-services/audit-worker/index.ts`,
and `mini-services/health-monitor/index.ts` (using `bun` or `tsx` as the
interpreter).

---

## See Also

- `docs/deployment.md` — full deployment reference
- `docs/environment.md` — environment variable reference
- `docs/disaster-recovery.md` — backup/restore procedures
- `docs/security.md` — security hardening checklist
- `README-CPANEL.md` (if present) — shared-hosting/cPanel alternative path
- `.env.example` — environment template

---

**End of cloud deployment guide.**
