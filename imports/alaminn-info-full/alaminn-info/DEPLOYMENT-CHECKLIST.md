# Deployment Checklist — alaminn.info

Production deployment checklist for the alaminn.info Next.js 16 standalone
build. Work through every checkbox in order. Commands assume the project
root is `/home/USERNAME/alaminn.info` (cPanel) or the cloned repo root
(VPS) unless noted. Reference docs: `docs/deployment.md`,
`docs/environment.md`, `docs/backup-restore.md`, `docs/disaster-recovery.md`.

---

## 1. Pre-deployment (local verification)

Run locally before touching the server. Every item must pass.

- [ ] Lint passes (0 errors, 0 warnings): `npm run lint`
- [ ] TypeScript type check passes: `npm run typecheck`
- [ ] Test suite passes (169 tests, 7 files): `npm run test`
- [ ] Security test suite passes (22 categories, all green):
      `npm run security:test`
- [ ] Database verification reports 0 anomalies: `npm run db:verify`
- [ ] Production build succeeds and produces `.next/standalone/`:
      `npm run build && ls -la .next/standalone/server.js`
- [ ] `.env.example` exists and is tracked in git:
      `test -f .env.example && git ls-files --error-unmatch .env.example`
- [ ] No real secrets committed (`.env` is git-ignored, no API keys,
      SMTP passwords, or real `AUTH_SECRET` in history):
      `git check-ignore .env && git log --all --full-history -- .env`
      (second command must return nothing)

---

## 2. Hosting requirements

- [ ] Node.js >= 20.0.0 installed (Node 22 LTS recommended): `node --version`
- [ ] At least 512 MB RAM available to the Node process (1 GB+
      recommended for the build step).
- [ ] At least 1 GB free disk for repo, `node_modules`,
      `.next/standalone/`, and `db/backups/`.
- [ ] HTTPS termination available (TLS 1.2+). The app refuses to start
      in production without `NEXT_PUBLIC_SITE_URL=https://...`.
- [ ] Domain `alaminn.info` DNS A record configured to point at the
      server IP (see section 9).
- [ ] Outbound access permitted on 587/465 (SMTP) and 443 (Resend).
- [ ] Firewall allows inbound 80 (ACME / redirect) and 443 only. Do
      not expose the Node port (3000) to the internet.

---

## 3. cPanel Node.js App setup (if using cPanel)

For hosts exposing the cPanel "Setup Node.js App" UI.

- [ ] In cPanel > Software > Setup Node.js App, click Create Application.
- [ ] Node.js version selector set to `20.x` or `22.x` (prefer 22 LTS).
- [ ] Application root set to `/home/USERNAME/alaminn.info`.
- [ ] Application URL set to `alaminn.info` (configure `www.alaminn.info`
      alias under Domains > Aliases if needed).
- [ ] Application startup file set to `server.js` (resolves to
      `.next/standalone/server.js` via the wrapper, or copy it to the
      app root and reference it).
- [ ] Application mode set to `Production`.
- [ ] All env vars from `.env.example` entered in the cPanel UI (do NOT
      upload a real `.env`; use the UI): `NODE_ENV`,
      `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, `AUTH_SECRET`,
      `DATABASE_URL`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SMTP_HOST`,
      `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `RESEND_API_KEY`,
      `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `LOG_LEVEL`,
      `BACKUP_RETENTION_COUNT`.
- [ ] Upload or clone the project into the application root.
- [ ] Install production dependencies: `npm install --omit=dev`
- [ ] Generate the Prisma client: `npx prisma generate`
- [ ] Run the production build: `npm run build`
- [ ] Push the schema to the database: `npx prisma db push`
- [ ] Click Run in the cPanel UI, or: `NODE_ENV=production node .next/standalone/server.js`
- [ ] Confirm the app is reachable at `https://alaminn.info` after
      restarting (use Restart if needed).

---

## 4. Cloud / VPS setup (if using VPS)

For SSH access to a Linux server.

- [ ] SSH works as a non-root sudo user: `ssh USERNAME@SERVER_IP`
- [ ] Node.js 22 LTS installed (NodeSource or nvm): `node --version`
- [ ] Clone the repo: `git clone <REPO_URL> /srv/alaminn.info && cd /srv/alaminn.info`
- [ ] Install deps with a clean lockfile (not `npm install`): `npm ci`
- [ ] Build the standalone artifact: `npm run build`
- [ ] Generate the Prisma client: `npx prisma generate`
- [ ] Push the schema: `npx prisma db push`
- [ ] Create and populate `.env` from `.env.example` (see section 5).
- [ ] Install PM2 globally and start the app:
      `sudo npm install -g pm2`
      `pm2 start .next/standalone/server.js --name alaminn-info`
      `pm2 save && pm2 startup` (run the printed sudo command)
- [ ] Configure nginx as reverse proxy to `http://127.0.0.1:3000`
      with gzip, security headers, and `try_files` for
      `.next/static` and `/public` assets served by nginx.
- [ ] Issue SSL with certbot (see section 10).
- [ ] Reload nginx and verify:
      `sudo nginx -t && sudo systemctl reload nginx && curl -I https://alaminn.info`

---

## 5. Environment setup

- [ ] Copy and lock down the env file: `cp .env.example .env && chmod 600 .env`
- [ ] Set `NODE_ENV=production`.
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://alaminn.info`.
- [ ] Set `NEXTAUTH_URL=https://alaminn.info`.
- [ ] Generate a fresh `AUTH_SECRET` on the server (never reuse a dev
      one): `openssl rand -base64 32` — paste output into `AUTH_SECRET=`.
- [ ] Set `DATABASE_URL` to an absolute path, never a relative one.
      cPanel: `file:/home/USERNAME/alaminn.info/db/custom.db`
      VPS (outside web root recommended): `file:/srv/alaminn.info/db/custom.db`
- [ ] Set `EMAIL_FROM` and `EMAIL_REPLY_TO` to branded `alaminn.info`
      addresses.
- [ ] Set `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS or 465 implicit TLS),
      `SMTP_USER`, `SMTP_PASS` with real provider credentials. Test
      SMTP delivery before going live.
- [ ] (Optional) Set `RESEND_API_KEY` if using Resend instead of SMTP.
- [ ] Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the initial seed
      (password >= 12 chars). Rotate from the Command Center after
      first login, then unset these.
- [ ] Set `LOG_LEVEL=info` (use `debug` only temporarily).
- [ ] Set `BACKUP_RETENTION_COUNT=30` (or per policy).
- [ ] Verify env validates at startup via the section 11 health check.
      The app refuses to start in production without `AUTH_SECRET`,
      `EMAIL_FROM`, or SMTP/Resend config.

---

## 6. Database setup

- [ ] Ensure `db/` exists and is writable by the Node process owner:
      `mkdir -p db && chown -R USERNAME:USERNAME db && chmod 750 db`
- [ ] Generate the Prisma client (also runs on `postinstall`, run
      explicitly to be safe): `npx prisma generate`
- [ ] Push the schema to create all 21 tables: `npx prisma db push`
- [ ] Seed the initial OWNER account:
      `AUTH_SECRET="..." ADMIN_EMAIL="owner@alaminn.info" ADMIN_PASSWORD="..." bun run scripts/seed-admin.ts`
      (On cPanel without bun: `npx tsx scripts/seed-admin.ts` after
      exporting the env vars.)
- [ ] Verify the admin user was created (open Prisma Studio or run a
      count query on the `User` table): `npx prisma studio`
- [ ] Run the database health check; expect 0 anomalies:
      `npm run db:verify`
- [ ] Take a baseline backup so rollback has a known-good snapshot:
      `npm run db:backup`

---

## 7. Build command

- [ ] Build the standalone production artifact: `npm run build`
- [ ] Confirm the standalone server and copied assets exist:
      `test -f .next/standalone/server.js && echo "server.js OK"`
      `test -d .next/standalone/.next/static && echo "static OK"`
      `test -d .next/standalone/public && echo "public OK"`

---

## 8. Start command

- [ ] cPanel: set start command in the Node.js App UI to
      `NODE_ENV=production node .next/standalone/server.js`
      (or `NODE_ENV=production node server.js` if you copied
      `server.js` to the app root).
- [ ] VPS with PM2:
      `pm2 start .next/standalone/server.js --name alaminn-info --env production -- --max-old-space-size=1024`
      `pm2 save`
- [ ] Confirm the process is up and listening:
      `pm2 status alaminn-info && curl -sS http://127.0.0.1:3000/api/health | head`

---

## 9. Domain and DNS

- [ ] Add an A record: `alaminn.info.   IN  A   SERVER_IP`
- [ ] Add a CNAME for the www variant:
      `www.alaminn.info.   IN  CNAME   alaminn.info.`
- [ ] Wait for propagation, then check multiple resolvers:
      `dig +short alaminn.info @1.1.1.1` and `dig +short alaminn.info @8.8.8.8`
- [ ] Confirm apex resolves to the server IP: `dig alaminn.info`
- [ ] Confirm `www.alaminn.info` resolves to the same IP.

---

## 10. SSL

- [ ] cPanel: enable AutoSSL for `alaminn.info` and `www.alaminn.info`
      from SSL/TLS Status. Wait for issuance, then verify the padlock.
- [ ] VPS: issue a certificate with certbot for nginx:
      `sudo certbot --nginx -d alaminn.info -d www.alaminn.info --redirect --agree-tos -m admin@alaminn.info`
- [ ] Verify HTTPS redirect works (HTTP should 301 to HTTPS):
      `curl -I http://alaminn.info` and `curl -I https://alaminn.info`
- [ ] Verify the certificate chain is complete and not expired:
      `echo | openssl s_client -connect alaminn.info:443 -servername alaminn.info 2>/dev/null | openssl x509 -noout -dates -issuer`
- [ ] Confirm HSTS is sent on HTTPS responses (middleware sets
      `Strict-Transport-Security`).

---

## 11. Route smoke tests

Run each against `https://alaminn.info`. Expected status listed.

- [ ] `GET /` returns 200 and the homepage renders:
      `curl -sS -o /dev/null -w "%{http_code}\n" https://alaminn.info/`
- [ ] `GET /api/health` returns 200:
      `curl -sS -o /dev/null -w "%{http_code}\n" https://alaminn.info/api/health`
- [ ] `GET /api/health/deep` returns 200 and reports healthy:
      `curl -sS -o /dev/null -w "%{http_code}\n" https://alaminn.info/api/health/deep`
- [ ] `GET /api/v1/public/projects` returns 200:
      `curl -sS -o /dev/null -w "%{http_code}\n" https://alaminn.info/api/v1/public/projects`
- [ ] `GET /api/v1/admin/dashboard` returns 401 without auth (auth
      enforcement working):
      `curl -sS -o /dev/null -w "%{http_code}\n" https://alaminn.info/api/v1/admin/dashboard`
- [ ] `GET /robots.txt` returns 200:
      `curl -sS -o /dev/null -w "%{http_code}\n" https://alaminn.info/robots.txt`
- [ ] `GET /sitemap.xml` returns 200 and is valid XML:
      `curl -sS -o /dev/null -w "%{http_code}\n" https://alaminn.info/sitemap.xml`

---

## 12. Post-deploy verification

- [ ] Visit `https://alaminn.info`; confirm hero, credibility signals,
      expertise grid, impact cards, ecosystem map, case studies,
      ALO Labs, insights, resources, verification and evidence
      section, profile, and footer all render.
- [ ] Submit the contact form; confirm a success toast and an inbound
      email at the configured inbox.
- [ ] Submit the newsletter signup; confirm the verification email is
      sent and that clicking the verify link flips the subscriber to
      `VERIFIED`.
- [ ] Log in to the Command Center at `https://alaminn.info/admin`
      using the seeded OWNER credentials.
- [ ] From the Command Center, rotate the OWNER password and unset
      `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment, then
      restart the app.
- [ ] Check `/api/health/deep` returns all subsystems healthy:
      `curl -sS https://alaminn.info/api/health/deep | jq`
- [ ] Tail the app logs for at least 5 minutes of normal traffic; no
      ERROR-level entries: `pm2 logs alaminn-info --lines 200`
- [ ] Run the security headers check; confirm
      `X-Content-Type-Options`, `X-Frame-Options: DENY`,
      `Referrer-Policy`, `Strict-Transport-Security`:
      `curl -sSI https://alaminn.info/ | grep -iE "x-content-type-options|x-frame-options|referrer-policy|strict-transport"`

---

## 13. Rollback procedure

Use if a deploy goes bad. Keep at least one previous-good build and a
recent DB backup on the server at all times.

- [ ] Identify the previous-good standalone build (retain the prior
      `.next/standalone/` as `.next/standalone.prev/` before each
      deploy).
- [ ] Take a fresh DB backup of the current (broken) state for
      forensics: `npm run db:backup`
- [ ] Stop the application (cPanel: click Stop in the Node.js App UI;
      VPS: `pm2 stop alaminn-info`).
- [ ] Restore the previous-good database backup:
      `bun run scripts/restore-db.ts db/backups/<previous-good-backup>.tar.gz`
      (On cPanel without bun: `npx tsx scripts/restore-db.ts
      db/backups/<previous-good-backup>.tar.gz`.)
- [ ] Swap the standalone build back:
      `mv .next/standalone .next/standalone.broken && mv .next/standalone.prev .next/standalone`
- [ ] Restart the application (cPanel: click Run in the Node.js App
      UI; VPS: `pm2 restart alaminn-info`).
- [ ] Re-run the route smoke tests (section 11) and post-deploy
      verification (section 12).
- [ ] Capture the broken build and logs for a post-mortem before
      deleting them.

---

End of checklist. Keep this file updated as the deployment topology
evolves. The authoritative deployment narrative lives in
`docs/deployment.md`; this checklist is the operational companion.
