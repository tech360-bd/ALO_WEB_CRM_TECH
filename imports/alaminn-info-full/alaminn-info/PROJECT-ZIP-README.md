# Alaminn.info — Full Project ZIP

This ZIP contains the COMPLETE project — source code, build output, seed database, and CI/CD workflows.

## What's included

| Path | Purpose | Required? |
|---|---|---|
| `src/` | All TypeScript/React source code | Yes |
| `.next/standalone/` | Pre-built production server (ready to deploy without rebuild) | Yes (for direct deploy) |
| `.next/static/` | Static assets (CSS, JS chunks, fonts, images) | Yes |
| `public/` | Brand assets, gallery, favicon, service worker | Yes |
| `prisma/` | Database schema + migrations + seed files | Yes |
| `db/custom.db` | Seeded SQLite dev database (admin password MUST be rotated) | Optional (regenerable via `bun run db:push && bun run db:seed`) |
| `.github/workflows/ci.yml` | GitHub Actions: auto typecheck + lint + test + build on every push | Yes (auto-deploys on push to main) |
| `.github/workflows/deploy.yml` | GitHub Actions: auto-deploy to VPS on push to main | Yes (requires GitHub secrets configured) |
| `.env.example` | Environment template (copy to `.env` and fill in) | Yes |
| `.gitignore` | Git ignore rules | Yes |
| `deploy/` | Nginx, Caddy, OLS, PM2, systemd, cPanel, CyberPanel configs | Yes |
| `mini-services/` | ai-worker, email-worker, audit-worker, notification-service, health-monitor | Yes |
| `scripts/` | DB verify/backup/restore, security tests, install/deploy helpers | Yes |
| `tests/` | Unit + integration tests | Yes |
| `docs/` | Architecture, deployment, security, database docs | Yes |
| `package.json` + `bun.lock` | Dependency manifests | Yes |
| `Dockerfile` + `docker-compose.yml` | Containerized deployment option | Optional |
| `Caddyfile` | Caddy reverse proxy config | Optional (pick one reverse proxy) |
| `server.js` + `start-prod.sh` | Production server wrapper | Yes |

## What's NOT included (regenerable)

- `node_modules/` — Run `bun install` or `npm install` to regenerate
- `.git/` — Git history (handled separately via GitHub)
- `.env` — Real env file with secrets (create from `.env.example`)

## How to deploy from this ZIP

### Option A: Direct deploy (uses pre-built .next/standalone)

```bash
unzip alaminn-info-FULL-project.zip
cd alaminn-info
cp .env.example .env  # Edit: set AUTH_SECRET, DATABASE_URL, NEXTAUTH_URL
bun install --production  # Or: npm install --production
# Database is already seeded in db/custom.db (SQLite dev)
# For production MariaDB: edit DATABASE_URL, then run `bun run db:migrate:deploy`
node .next/standalone/server.js  # Starts on port 3000
```

### Option B: Rebuild from source

```bash
unzip alaminn-info-FULL-project.zip
cd alaminn-info
cp .env.example .env  # Edit values
bun install
bun run db:push  # Sync schema
ADMIN_BOOTSTRAP_PASSWORD='<your-strong-password>' bun run db:seed  # Seed data
bun run build
node .next/standalone/server.js
```

### Option C: Push to GitHub for auto-deploy

1. Create a new GitHub repository (do NOT initialize with README)
2. Push this ZIP's contents to the repo:
   ```bash
   git init
   git add -A
   git commit -m "Initial commit: Alaminn.info full project"
   git branch -M main
   git remote add origin git@github.com:<your-username>/alaminn.info.git
   git push -u origin main
   ```
3. Configure GitHub Actions secrets in repo Settings → Secrets and variables → Actions:
   - `SSH_PRIVATE_KEY` — your VPS SSH private key
   - `SSH_HOST` — your VPS hostname or IP
   - `SSH_USER` — your SSH username
   - `DEPLOY_PATH` — deployment directory (e.g. `/var/www/alaminn.info`)
   - `AUTH_SECRET` — generate with `openssl rand -hex 32`
   - `DATABASE_URL` — production MariaDB URL
   - `NEXTAUTH_URL` — `https://alaminn.info`
4. Every push to `main` will now auto-build, test, and deploy to your VPS via GitHub Actions.

## Security notes

- **Rotate the admin password immediately after first deploy.** The committed `db/custom.db` contains a seed admin user (`admin@alaminn.info`) whose password is the bootstrap password you set during seeding. Change it from inside the admin Command Center.
- The committed `.env.example` contains only placeholder values — no real secrets.
- The committed `.env` is NOT in this ZIP. You must create it from `.env.example`.
- The GitHub Actions workflow uses GitHub Secrets — never hardcodes credentials.
