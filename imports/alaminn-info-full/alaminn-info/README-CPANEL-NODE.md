# cPanel Node.js Deployment Guide (alaminn.info)

This is an honest guide for deploying the alaminn.info Next.js 16 standalone
app to cPanel's "Setup Node.js App" interface. It is written under the
assumption that you have read `docs/deployment.md` first. cPanel is not the
recommended deployment target for this app (see Q14 and Known Limitations),
but it can work if your host permits long-running node processes. If you have
the choice, prefer a VPS or a managed platform like Vercel / Cloud Run /
Hetzner.

---

## Quick Start (cPanel)

These steps assume a cPanel account with the "Setup Node.js App" feature
enabled, SSH access (optional but strongly recommended), and a domain
already pointed at the account.

1. Build locally and package the app. Run `npm run build` on a machine with
   Node 20+ (or 22). The build script copies `.next/static` and `public`
   into `.next/standalone/` so the standalone folder is self-contained.
   Zip the contents of `.next/standalone/` plus your `.env`, `prisma/`,
   and an empty `db/` directory into `alaminn-deploy.zip`.

2. In cPanel, open "Setup Node.js App" and click "Create Application".

3. Pick Node version "22.x" (NOT 18 — Next.js 16 requires Node 20+, see Q2).
   Set "Application mode" to "Production". Set "Application root" to
   `alaminn.info` (this resolves to `/home/USERNAME/alaminn.info`, see Q4).
   Set "Application URL" to your domain, e.g. `alaminn.info` (see Q5).

4. Set "Application startup file" to `.next/standalone/server.js` (see Q6).
   Do NOT invent a custom `server.js` unless you have a reason — the
   standalone build already produces one.

5. Upload `alaminn-deploy.zip` via cPanel File Manager or `scp` to
   `/home/USERNAME/alaminn.info/` and unzip it in place. Verify
   `.next/standalone/server.js`, `.next/standalone/.next/static/`, and
   `.next/standalone/public/` are all present.

6. In "Environment variables" (see Q8), add at minimum: `NODE_ENV=production`,
   `NEXT_PUBLIC_SITE_URL=https://alaminn.info`, `NEXTAUTH_URL=https://alaminn.info`,
   `AUTH_SECRET=<32-char-secret>`,
   `DATABASE_URL=file:/home/USERNAME/alaminn.info/db/custom.db`,
   plus the SMTP_* and EMAIL_* variables. Do NOT set ADMIN_EMAIL /
   ADMIN_PASSWORD in production after the initial seed.

7. Open cPanel Terminal (or SSH in) and run:
   `cd /home/USERNAME/alaminn.info && npm install --omit=dev && npx prisma generate && mkdir -p db && npx prisma db push`
   This installs production deps, generates the Prisma client, creates the
   SQLite database file, and applies the schema. The `postinstall` hook
   already runs `prisma generate`, but re-running it explicitly is safe.

8. Back in "Setup Node.js App", click "Restart". Wait ~10 seconds, then
   visit `https://alaminn.info`. Check the app logs (see Q12) if the page
   returns 503. Run through the 503 checklist in Q13 if needed.

---

## 14 Questions, answered directly

### Q1. Can this run on cPanel "Setup Node.js App"?

Yes, BUT with caveats. cPanel's Node.js App runner uses Phusion Passenger
or a managed node process. It works for Next.js standalone IF the host
allows long-running node processes and custom startup files. Some shared
cPanel hosts kill long-running node processes or don't allow standalone
servers — verify with your host first. This app needs a persistent node
process (not serverless/CGI). If your host only allows CGI-style or
short-lived node invocations, this app will not work there.

### Q2. Which Node version is required?

Node.js >= 20.0.0. Recommended: Node 22 LTS. Select "22.x" in cPanel's Node
version selector. Node 18 is NOT supported — Next.js 16 requires Node 20+
and will fail to start on older runtimes. If your cPanel only offers Node 18
or below, stop and either ask the host to upgrade or move to a VPS.

### Q3. Does cPanel support Bun?

NO. cPanel's "Setup Node.js App" does NOT officially support Bun as a
runtime. Do NOT use `bun` for production on cPanel — use `node` + `npm`
only. The `start` script in `package.json` already uses
`node .next/standalone/server.js`, which is what cPanel will execute. Bun is
only used in the Z.AI sandbox for dev convenience (the `db:backup`,
`db:restore`, `db:verify`, `security:test`, and `images:*` npm scripts shell
out to `bun run scripts/*.ts`). On cPanel, replace those with `npx tsx
scripts/*.ts` or skip them — they are maintenance utilities, not runtime
requirements.

### Q4. Application root path

`/home/USERNAME/alaminn.info/` — where `USERNAME` is your cPanel username.
Upload the production build contents here. The directory must contain
`.next/standalone/server.js`, `.next/standalone/.next/static/`,
`.next/standalone/public/`, your `.env` file, `package.json`,
`package-lock.json`, the `prisma/` folder, and an empty `db/` directory.
The `node_modules/` folder should also be present (run `npm install
--omit=dev` on the server, or upload it from a Linux x64 machine that
matches the server's glibc version).

### Q5. Application URL

`https://alaminn.info` (after DNS resolves and SSL is issued via cPanel's
"SSL/TLS Status" → "Run AutoSSL"). During testing you can use the same URL
once DNS is live, or a temporary subdomain like `staging.alaminn.info` if
you add it as an addon domain. Always serve over HTTPS — `NEXTAUTH_URL` and
`NEXT_PUBLIC_SITE_URL` must use the `https://` scheme, and the auth cookies
are flagged `Secure`.

### Q6. Startup file

`server.js` — but specifically the one inside the standalone build. Point
cPanel's "Application startup file" field to
`.next/standalone/server.js` (relative to the application root). The
standalone build produces this file; it is a self-contained Next.js server
that does not need `next` installed at runtime. Do NOT create a custom root
`server.js` that re-exports the standalone one — it adds a failure mode for
no benefit. The only reason to write your own `server.js` is if you need
custom middleware in front of Next (rate limiting, additional health
endpoints, etc.), and even then prefer doing that at the reverse-proxy or
Cloudflare layer.

### Q7. Startup command

cPanel runs `node server.js` automatically based on the startup file you
configured in Q6 — you do not type a command. The equivalent of the
`npm run start` script (`NODE_ENV=production node .next/standalone/server.js`)
is achieved by (a) setting the startup file to `.next/standalone/server.js`
and (b) setting `NODE_ENV=production` in cPanel's "Environment variables"
UI. Do not try to put `NODE_ENV=production` inline in the startup file path
— it won't be parsed. Use the env UI.

### Q8. Environment variables

Set ALL of these in cPanel's "Environment variables" section. The app also
reads a `.env` file in the application root via `@/lib/env.ts`, but the
cPanel env UI takes precedence and is preferred because it keeps secrets
out of the filesystem.

- `NODE_ENV=production`
- `NEXT_PUBLIC_SITE_URL=https://alaminn.info`
- `NEXTAUTH_URL=https://alaminn.info`
- `AUTH_SECRET=<32-char-secret>` — generate with `openssl rand -hex 32`
- `DATABASE_URL=file:/home/USERNAME/alaminn.info/db/custom.db` (see Q10)
- `EMAIL_FROM="Al Aminn <noreply@alaminn.info>"`
- `EMAIL_REPLY_TO="Al Aminn <hello@alaminn.info>"`
- `SMTP_HOST=smtp.your-provider.com`
- `SMTP_PORT=587`
- `SMTP_USER=<your smtp user>`
- `SMTP_PASS=<your smtp password>`
- `LOG_LEVEL=info` (use `debug` only when diagnosing)
- `BACKUP_RETENTION_COUNT=30`

NEVER set `ADMIN_EMAIL` or `ADMIN_PASSWORD` in production after the initial
seed. The seeding step creates the admin account once; setting those env
vars again later does nothing useful and risks leaking credentials through
the environment. If you need to reset the admin password, use the
`scripts/` admin reset utility over SSH, or rotate via the authenticated
admin UI.

### Q9. How to run Prisma generate

In cPanel Terminal or via SSH:

```
cd /home/USERNAME/alaminn.info
npx prisma generate
```

This must run after `npm install` and before the first start. The
`postinstall` script in `package.json` runs it automatically on
`npm install`, so in practice if you ran `npm install --omit=dev` in step 7
of the Quick Start, the Prisma client is already generated. Re-running it
explicitly is harmless and is the right thing to do if you ever update
`prisma/schema.prisma`.

### Q10. How to set the SQLite DATABASE_URL

Use an absolute path so Prisma resolves the file regardless of the process
working directory:

```
DATABASE_URL=file:/home/USERNAME/alaminn.info/db/custom.db
```

Steps:
1. `mkdir -p /home/USERNAME/alaminn.info/db`
2. `chmod 755 /home/USERNAME/alaminn.info/db` (writable by the node process;
   `755` is fine if the node process runs as your cPanel user, which it
   normally does)
3. `npx prisma db push` (creates the file and applies the schema)

SQLite file-based DB works on cPanel. Be aware that under heavy concurrent
write load SQLite uses file locking and can return `SQLITE_BUSY` — for a
personal/portfolio site this is fine, but if you expect real concurrency
see Q14 and switch to MySQL.

Alternative (MySQL via cPanel's "MySQL Databases" wizard):
1. Create a database and user in cPanel, grant the user ALL PRIVILEGES.
2. Change `prisma/schema.prisma` datasource `provider` from `"sqlite"` to
   `"mysql"`.
3. Set `DATABASE_URL=mysql://USER:PASS@localhost:3306/alaminn` (URL-encode
   any special characters in the password).
4. `npx prisma generate && npx prisma db push`.

### Q11. How to restart the app

In cPanel: "Setup Node.js App" → find your app → click "Restart". This is
the safe, supported way. After any code change, env var change, or schema
change, restart. The restart is graceful — Passenger drains in-flight
requests before spawning a new worker.

If you have SSH and cPanel's restart button is broken (it happens):
`pkill -f "node.*server.js" && nohup node .next/standalone/server.js > server.log 2>&1 &`
But this bypasses Passenger — only do it as a last resort, and stop this
manual process before clicking "Restart" in cPanel again, or you will end
up with two processes fighting for port 3000.

### Q12. How to read logs

cPanel: "Setup Node.js App" → your app → click the "Logs" button. This
shows combined stdout/stderr from the node process, streamed. Next.js
standalone logs to stdout, so request logs, startup errors, and the
structured logger output (`src/lib/logger.ts`) all appear here.

Via SSH:
- If the host uses Phusion Passenger: `tail -f
  /home/USERNAME/logs/alaminn.info.log` (the exact path varies — check
  `/home/USERNAME/logs/`).
- If you started the app manually with `nohup` (see Q11): `tail -f
  /home/USERNAME/alaminn.info/server.log`.
- Application-level logs (inquiries, newsletter, auth events) are written
  to the SQLite DB via the audit log table, not to a file. Query them via
  the admin dashboard, or `sqlite3 db/custom.db "SELECT * FROM AuditLog
  ORDER BY createdAt DESC LIMIT 50;"`.

`LOG_LEVEL` controls verbosity: `error` (quietest), `warn`, `info`
(default), `debug` (noisiest — use only when diagnosing).

### Q13. What to do if the app shows 503

503 = service unavailable. It almost always means the node process crashed
or never started. Work through this list in order:

1. Open cPanel "Setup Node.js App" → your app → "Logs". The crash reason is
   usually on the last few lines.
2. Verify `.env` exists in the app root and `AUTH_SECRET` is set. The app
   refuses to boot in production without it (see `src/lib/env.ts`).
3. Verify `db/custom.db` exists and is writable by the node process. If
   missing, run `npx prisma db push`.
4. Verify `.next/standalone/server.js` exists. If missing, the upload was
   incomplete or `npm run build` was never run — rebuild locally and
   re-upload.
5. Verify `.next/standalone/.next/static/` and `.next/standalone/public/`
   exist. If missing, the build script's `cp -r` steps were skipped or
   failed — the page will 503 or 500 on the first request even if the
   server starts.
6. Click "Restart" in cPanel.
7. If still 503, SSH in and run `node .next/standalone/server.js` directly.
   This bypasses Passenger and prints the error to your terminal. Common
   causes: wrong Node version (must be 20+, see Q2), missing env var,
   corrupted `node_modules` (run `npm install --omit=dev` again), or a
   locked SQLite file (`lsof db/custom.db` to check).

### Q14. Is a Cloud / VPS recommended instead?

YES, for production. A cloud VM or managed PaaS (Vercel, Cloud Run,
DigitalOcean, Hetzner, Fly.io) is STRONGLY RECOMMENDED over shared cPanel,
for these reasons:

(a) Next.js 16 standalone needs a persistent node process. Shared cPanel
    hosts frequently kill long-running processes via cgroup limits or
    watchdogs that terminate anything consuming more than a few hundred MB
    of RAM for more than a few minutes.
(b) Full control over Node version, memory limits, and process management
    (pm2 / systemd). On cPanel you get whatever Node version the host
    compiled, and pm2 is often not available or not persistent across
    reboots.
(c) Better performance — no neighbor-noise, no resource throttling, no
    "CPU credits" exhaustion.
(d) Easier SSL and CDN. Vercel/Cloud Run give you managed TLS + edge CDN
    for free; on cPanel you manage AutoSSL and Cloudflare yourself.
(e) SQLite file locking under shared hosting can corrupt under concurrent
    load. On a VPS you control the filesystem and concurrency; on shared
    cPanel you do not.

Use cPanel ONLY if (a) your cPanel account is on a VPS you control, or
(b) your host explicitly documents support for long-running Node apps.
For true shared cPanel, migrate the DB to MySQL (see Q10) and seriously
consider a non-standalone deployment (e.g. static export + a separate API
host), because Next.js standalone on a host that kills processes is a
recipe for intermittent 503s.

---

## Known Limitations

- **Not the recommended deployment target.** cPanel is supported on a
  best-effort basis. The primary deployment target for this project is a
  Node 20+ VPS or a managed PaaS. See Q14.
- **Bun is not available.** All `bun run scripts/*.ts` maintenance commands
  in `package.json` (`db:backup`, `db:restore`, `db:verify`,
  `security:test`, `images:*`) will not work as-is on cPanel. Substitute
  `npx tsx scripts/<name>.ts`, or run them on a separate dev machine and
  transfer artifacts (e.g. backups, generated images) to the server.
- **SQLite concurrency.** SQLite is fine for a personal site but will
  return `SQLITE_BUSY` under concurrent writes. If you expect more than a
  handful of simultaneous admin users, switch to MySQL (see Q10).
- **Passenger process limits.** Phusion Passenger spawns a fixed number of
  workers; on cheap shared hosts this is often 1. A single worker means no
  concurrency — a slow API request blocks the whole site. Confirm the
  worker count with your host before relying on cPanel for production.
- **Memory limits.** Next.js 16 standalone + Prisma + the email queue
  comfortably needs ~256MB RSS at idle, more under load. If your cPanel
  account is capped at 256MB or below, expect OOM kills.
- **No websockets on shared cPanel.** The mini-services (notification,
  email-worker, audit, health-monitor) bind to ports 3001-3004 and will
  not be reachable from outside the server without a reverse proxy. They
  are optional for the main site; if you don't need them, ignore them.
  If you do need them, run them under pm2 on a VPS instead.
- **AutoSSL rate limits.** Let's Encrypt via cPanel AutoSSL has a rate
  limit of 50 certs per registered domain per week. If you reprovision the
  app repeatedly, you may hit it. Use a staging cert while testing.
- **Backups are local.** `scripts/backup-db.ts` writes to `db/backups/`
  on the same server. For real disaster recovery, sync these off-server
  (rsync to a second host, or push to S3-compatible storage). See
  `docs/disaster-recovery.md`.
- **Logs are not rotated by default.** cPanel rotates Passenger logs but
  the rotation policy varies by host. If you use the `nohup server.log`
  approach from Q11, set up logrotate yourself.
- **No horizontal scaling.** A single cPanel account = a single node
  process = a single SQLite file. If you outgrow this, the migration path
  is: MySQL + a VPS + pm2 in cluster mode, not "more cPanel accounts".

For the canonical deployment guide (VPS, Docker, PaaS), see
`docs/deployment.md`. For environment variable reference, see
`docs/environment.md`. For disaster recovery, see `docs/disaster-recovery.md`.
