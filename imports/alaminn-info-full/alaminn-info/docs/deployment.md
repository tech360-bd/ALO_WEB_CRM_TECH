# Deployment Guide — Alaminn.info V5

This document describes how to deploy Alaminn.info from a fresh clone of the
repository to a running production server. It covers prerequisites,
environment configuration, the build pipeline, database setup, AUTH_SECRET
generation, SMTP configuration, and a verification checklist.

For environment variable semantics see [environment.md](./environment.md). For
backup/restore operations see [disaster-recovery.md](./disaster-recovery.md)
and [backup-restore.md](./backup-restore.md).

---

## 1. Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| **Bun** | ≥ 1.3 | Used for dev, scripts, and the production standalone server |
| **Node.js** | ≥ 20 | Required by `next build` and the standalone server |
| **SQLite** | ≥ 3.38 | Must support `VACUUM INTO` (used by `backup-db.ts`) |
| **Prisma** | 6.x | Installed locally via `bun install` |
| **Operating system** | Linux (x86_64) | Tested on Ubuntu 22.04+ |
| **Reverse proxy / TLS** | Caddy (bundled) or Nginx | The bundled `Caddyfile` terminates TLS and routes to `:3000` |

The deployment target must allow outbound HTTPS to:

- `https://api.resend.com` (if using Resend for transactional email)
- Your SMTP host (if using SMTP instead)
- `https://fonts.googleapis.com` (Manrope / Inter / DM Serif Display via `next/font`)

---

## 2. Environment Variables

Production requires **5 mandatory variables** and **strongly recommends 6 more**
for email delivery. The full matrix is in [environment.md](./environment.md);
the quick reference:

### 2.1 Mandatory in production

| Variable | Example | Why |
| --- | --- | --- |
| `NODE_ENV` | `production` | Enables secure cookies, HSTS, JSON logs, strict env validation |
| `NEXT_PUBLIC_SITE_URL` | `https://alaminn.info` | Used in emails, OG tags, sitemap, redirects. **No trailing slash.** |
| `DATABASE_URL` | `file:/srv/alaminn/db/custom.db` | SQLite path. Absolute path recommended for production. |
| `AUTH_SECRET` | (32+ byte hex string) | HMAC secret for signing session cookies. **App refuses to start if missing or < 32 bytes.** |
| `EMAIL_FROM` | `Al Aminn <hello@alaminn.info>` | Default `From:` for outgoing email. **App refuses to start if missing.** |

### 2.2 Required for email delivery (one of two transports)

Pick **either** SMTP **or** Resend. If neither is configured, the app runs but
every email send is silently dropped (with an `email.not_configured` log line).

**SMTP (recommended for self-hosting):**

| Variable | Example |
| --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (TLS) |
| `SMTP_USER` | `hello@alaminn.info` |
| `SMTP_PASS` | (app-specific password) |

**Resend (recommended for managed delivery):**

| Variable | Example |
| --- | --- |
| `RESEND_API_KEY` | `re_abc123…` |

### 2.3 Optional

| Variable | Default | Notes |
| --- | --- | --- |
| `EMAIL_REPLY_TO` | same as `EMAIL_FROM` | Reply-To address |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | `debug` \| `info` \| `warn` \| `error` |
| `BACKUP_RETENTION_COUNT` | `30` | Number of backups to keep in `db/backups/` |

### 2.4 Generating AUTH_SECRET

```bash
openssl rand -hex 32
```

The output is a 64-character hex string (32 bytes). Paste it into your
environment verbatim:

```bash
AUTH_SECRET=<REPLACE_WITH_openssl_rand_hex_32>
```

**Rotation policy:** if you ever rotate `AUTH_SECRET`, all existing session
cookies become invalid immediately. Users will need to sign in again. The data
in the database is unaffected.

---

## 3. Build Steps

### 3.1 Install dependencies

```bash
bun install --frozen-lockfile
```

### 3.2 Build the standalone server

```bash
bun run build
```

The `build` script in `package.json` runs `next build` and then copies
`.next/static` and `public/` into the standalone server output. The result is
a self-contained server at `.next/standalone/server.js`.

### 3.3 Output: `.next/standalone/`

The standalone server bundle contains everything needed to run the app —
`node_modules` is bundled in. To deploy:

1. Copy `.next/standalone/` to the production host.
2. Copy `.next/static/` into `.next/standalone/.next/static/` (already done by
   the build script).
3. Copy `public/` into `.next/standalone/public/` (already done).
4. Copy `prisma/` and `db/` to the production host (the standalone server
   needs the schema file for `prisma generate` and the live DB).
5. Copy your `.env` file to the production host.

### 3.4 Build configuration

`next.config.ts` is set to:

- `output: 'standalone'` — produces the self-contained server bundle.
- `reactStrictMode: false` — set to false intentionally (the spec calls for it
  to avoid double-rendering in the Command Center data flow).
- `typescript.ignoreBuildErrors: false` — TypeScript errors fail the build.
- `images.formats: ['image/avif', 'image/webp']` — AVIF first, WebP fallback.
- `images.qualities: [75, 85]` — whitelisted `quality` prop values (75 for
  general images, 85 for the brand portraits).
- `images.remotePatterns: ['alaminn.info', 'www.alaminn.info']` — own-domain
  only; local `/public/` images are not subject to remotePatterns.
- `images.minimumCacheTTL: 3600` — 1 hour.

---

## 4. Database Setup

### 4.1 Push the schema

```bash
DATABASE_URL="file:/srv/alaminn/db/custom.db" bun run db:push
```

This creates all 18 tables in the SQLite file. The `db:push` command is
idempotent — it diffs the schema against the live DB and applies the delta.

### 4.2 Regenerate the Prisma client

```bash
bun run db:generate
```

The Prisma client is generated into `node_modules/.prisma/client/`. The
`SCHEMA_VERSION` constant in `src/lib/db.ts` (`v5-analytics-2026-07`) is used
to bust the in-process client cache when the schema changes — bump this
constant after a schema migration so dev servers pick up the new client.

### 4.3 Seed the initial OWNER account

The OWNER role is provisioned via a CLI script — it cannot be created through
the UI. Run it exactly once, on first deployment:

```bash
AUTH_SECRET="<your-32-byte-secret>" \
ADMIN_EMAIL="owner@alaminn.info" \
ADMIN_PASSWORD="a-strong-12+-char-password" \
bun run scripts/seed-admin.ts
```

Behavior:

- Creates the OWNER account if the email doesn't exist.
- Updates the password hash + role if the email already exists
  (idempotent — safe to re-run).
- Writes a `user.provisioned` audit-log entry with `ipHash: "seed-script"`.
- **Never prints the password**.
- Refuses to run if `ADMIN_PASSWORD` is missing or shorter than 12 characters.

After the OWNER signs in, they can create additional users (with roles from
`SUPER_ADMIN` down to `VIEWER`) from inside the Command Center.

### 4.4 (Optional) Seed demo content for staging

```bash
bun run prisma/seed.ts
```

Seeds `Project`, `Article`, `Resource`, `ImpactRecord`, `CaseStudy`,
`Inquiry`, `Opportunity`, `AiTask`, `AiApproval`, `AuditLog`,
`MeetingRequest`, `NewsletterSubscriber`, `Contact`, `Task`. Useful for
staging/QA environments; do not run on production.

---

## 5. SMTP Configuration

Email is delivered through a pluggable transport layer
(`src/lib/email/transport.ts`). The transport is selected at runtime based on
which environment variables are present:

1. **Resend** — if `RESEND_API_KEY` is set, all email goes through
   `https://api.resend.com/emails` via `fetch`.
2. **SMTP** — if `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are all
   set, email goes through Nodemailer. Port `465` uses implicit TLS; any other
   port uses STARTTLS.
3. **Dev console** — in development with no transport configured, emails are
   pretty-printed to stdout (no message is sent).
4. **Production with no transport** — emails are dropped and an
   `email.not_configured` error is logged. The triggering API request still
   succeeds — email failure never crashes the request handler.

### 5.1 Common SMTP providers

| Provider | SMTP_HOST | SMTP_PORT | Notes |
| --- | --- | --- | --- |
| Gmail | `smtp.gmail.com` | 587 | Use an [App Password](https://myaccount.google.com/apppasswords), not your account password |
| Outlook / Office365 | `smtp.office365.com` | 587 | Use an app password |
| Amazon SES | `email-smtp.<region>.amazonaws.com` | 587 | Requires verified domain |
| Resend (SMTP) | `smtp.resend.com` | 465 | Use `resend` as the user and your API key as the password |
| Postmark | `smtp.postmarkapp.com` | 587 | Server API token as password |

### 5.2 Verifying SMTP

After deployment, sign in to the Command Center and submit a test inquiry
through the public contact form. You should receive:

1. A confirmation email at the inquirer's address (`inquiryConfirmation`
   template).
2. An internal notification at `hello@alaminn.info`
   (`inquiryReceivedInternal` template).

If neither arrives, check `dev.log` / `server.log` for
`email.send_failed` log lines — they include the provider name and the
error message.

### 5.3 Email retry queue

The in-app `sendTransactional()` helper (`src/lib/email/queue.ts`) retries
failed first-attempts up to 3 times with exponential backoff (1s → 4s → 16s)
in the background. For a more durable retry queue, the sidecar
`mini-services/email-worker` (port 3002) provides an HTTP queue API with
configurable backoff (2s → 4s → 8s → 16s → 32s, max 6 attempts).

---

## 6. Production Server Start

### 6.1 Direct (Bun)

```bash
NODE_ENV=production \
AUTH_SECRET="..." \
NEXT_PUBLIC_SITE_URL="https://alaminn.info" \
DATABASE_URL="file:/srv/alaminn/db/custom.db" \
SMTP_HOST="..." SMTP_PORT="587" SMTP_USER="..." SMTP_PASS="..." \
EMAIL_FROM="Al Aminn <hello@alaminn.info>" \
bun .next/standalone/server.js
```

This is what `bun run start` does, with output piped to `server.log`.

### 6.2 Behind the bundled Caddy gateway

The bundled `Caddyfile` listens on `:81` and:

1. Routes requests with `?XTransformPort=<port>` to `localhost:<port>` (used to
   reach the mini-services mesh from the browser via relative URLs).
2. Routes all other requests to `localhost:3000` (the Next.js app).

Caddy adds the standard `X-Forwarded-For`, `X-Forwarded-Proto`, and
`X-Real-IP` headers so the Next.js app can resolve the client IP for rate
limiting and audit logging.

To run Caddy:

```bash
caddy run --config Caddyfile
```

For production TLS, replace the `:81` listener with your domain
(`alaminn.info`) and Caddy will auto-provision Let's Encrypt certificates.

### 6.3 Process management (systemd)

Recommended systemd unit (`/etc/systemd/system/alaminn.service`):

```ini
[Unit]
Description=Alaminn.info Next.js production server
After=network.target

[Service]
Type=simple
User=alaminn
WorkingDirectory=/srv/alaminn
EnvironmentFile=/srv/alaminn/.env
ExecStart=/home/alaminn/.bun/bin/bun /srv/alaminn/.next/standalone/server.js
Restart=on-failure
RestartSec=5s
StandardOutput=append:/srv/alaminn/server.log
StandardError=append:/srv/alaminn/server.log

[Install]
WantedBy=multi-user.target
```

Enable + start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now alaminn
sudo systemctl status alaminn
```

---

## 7. Mini-Services Mesh (optional)

The four sidecar services under `mini-services/` provide observability and
resilience for the main app. They are not required for the app to function —
the main app degrades gracefully if any of them is down.

| Service | Port | Purpose | Required? |
| --- | --- | --- | --- |
| `notification-service` | 3001 | In-memory notification ingestion | Optional |
| `email-worker` | 3002 | Email retry queue with backoff | Optional (in-app queue is the fallback) |
| `audit-worker` | 3003 | Read-only audit log reports & export | Optional |
| `health-monitor` | 3004 | Pings main + 3001/3002/3003 every 30s | Optional (used for ops dashboards) |

Start each service with a true POSIX double-fork so it survives across shell
sessions (the sandbox reaps simple background processes):

```bash
( cd /srv/alaminn/mini-services/notification-service && bun --hot index.ts </dev/null >/tmp/notification-service.log 2>&1 & )
( cd /srv/alaminn/mini-services/email-worker         && bun --hot index.ts </dev/null >/tmp/email-worker.log 2>&1 & )
( cd /srv/alaminn/mini-services/audit-worker         && bun --hot index.ts </dev/null >/tmp/audit-worker.log 2>&1 & )
( cd /srv/alaminn/mini-services/health-monitor       && bun --hot index.ts </dev/null >/tmp/health-monitor.log 2>&1 & )
```

The browser reaches each service via a relative URL with `?XTransformPort=<port>`:

```ts
fetch("/notifications?XTransformPort=3001");
```

Never use absolute URLs like `http://localhost:3001/...` from the browser —
the sandbox's external port is fixed, and Caddy uses the query param to route.

---

## 8. Post-Deployment Verification Checklist

Run through this list after every deployment.

### 8.1 Process & health

- [ ] `systemctl status alaminn` shows `active (running)`.
- [ ] `curl -fsS https://alaminn.info/api/health` returns
      `{"success":true,"data":{"status":"ok",…}}`.
- [ ] `curl -fsS https://alaminn.info/api/health/deep` (unauthenticated)
      returns a `tier: "public"` payload with `status: "ok"` or
      `status: "degraded"`.
- [ ] Authenticated deep health (signed in as SECURITY_AUDITOR or SUPER_ADMIN)
      returns the full checks block with `status: "ok"` or `"partial"`.

### 8.2 Database

- [ ] `bun run scripts/verify-db.ts` reports `0 anomalies`.
- [ ] `ls -lh /srv/alaminn/db/custom.db` shows a non-zero file size.
- [ ] `bun run scripts/backup-db.ts` succeeds and writes a new file under
      `db/backups/`.

### 8.3 Public pages

- [ ] `GET /` returns 200 and the homepage renders.
- [ ] The Operating Constellation SVG animates in the hero.
- [ ] `/sitemap.xml` returns a valid sitemap.
- [ ] `/robots.txt` returns the expected robots file.
- [ ] `/favicon.svg`, `/logo.svg`, `/brand/portrait.{jpg,webp,avif}` all
      return 200.

### 8.4 Public Forms

- [ ] Submitting the contact form returns a `reference` like
      `ALM-2026-XXXXXXXX` and a confirmation email arrives at the inquirer's
      address.
- [ ] Submitting the newsletter form returns `Subscription received. Please
      confirm via email.` and a verification email arrives. Clicking the
      verify link redirects to `/#newsletter?verified=1`.
- [ ] Submitting a meeting request returns a `reference` like
      `MTG-2026-XXXXXXXX` and a confirmation email arrives.

### 8.5 Command Center

- [ ] Navigating to `/#staff` (or pressing `Ctrl/Cmd+Shift+C`) opens the login
      modal.
- [ ] The OWNER account can sign in. The floating launcher button appears in
      the bottom-right after authentication.
- [ ] The Command Center dashboard loads with inquiries, opportunities, AI
      tasks, meetings, and audit logs.
- [ ] An AI_REVIEWER can approve/reject an AI task and an audit log entry is
      written.
- [ ] Logging out clears the session cookie and the launcher button
      disappears.

### 8.6 Security headers

```bash
curl -sI https://alaminn.info/ | grep -E 'X-Content-Type-Options|X-Frame-Options|Referrer-Policy|Permissions-Policy|Strict-Transport-Security'
```

Expected:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

(The HSTS header is only emitted in production — see `src/middleware.ts`.)

### 8.7 Security tests

```bash
bun run security:test
```

All 22 tests should pass. The script writes the result table to stdout and a
detailed report to `docs/security-report.md`.

### 8.8 Backups

- [ ] `db/backups/backup.log` has at least one successful `── Backup OK ──`
      entry since deployment.
- [ ] The cron entry for hourly backups is installed and firing (check
      `backup.log` for new entries every hour).
- [ ] Off-host replication (rsync / S3 / Restic) is configured and a recent
      backup is present on the remote target.

---

## 9. Rollback

If a deployment is bad, the rollback procedure is:

1. Stop the production server: `systemctl stop alaminn`.
2. Restore the previous DB snapshot if the bad deployment wrote any data:
   ```bash
   bun run scripts/restore-db.ts alaminn-<pre-deploy-timestamp>.db --yes
   ```
3. Deploy the previous `.next/standalone/` bundle (keep the last known-good
   build archived on the production host).
4. Restart: `systemctl start alaminn`.
5. Re-run the verification checklist (§8).

See [disaster-recovery.md](./disaster-recovery.md) for the full matrix of
recovery scenarios.
