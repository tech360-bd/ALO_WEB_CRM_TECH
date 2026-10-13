# Environment Variables — Alaminn.info V5

All environment access is centralized in `src/lib/env.ts`. The build-time
invariant is: **never read `process.env` outside `src/lib/env.ts`**. Every
other module imports the typed `env()` accessor.

The `env()` function:

- Validates required secrets at first call.
- **Throws on first access** in production if `AUTH_SECRET` is missing or
  shorter than 32 bytes, or if `EMAIL_FROM` is missing.
- Falls back to safe dev values (with a `console.warn`) in development so
  local work isn't blocked.
- Caches the result after the first call (module-level singleton).

This means a misconfigured production deployment fails **fast and loud** at
startup (via `src/instrumentation.ts` → `env()` → throw), not silently at the
first request that needs the missing secret.

There are **11 environment variables**. This document covers each one in
detail.

---

## Quick Reference Matrix

| # | Variable | Required (prod) | Required (dev) | Public? | Default (dev) |
| --- | --- | --- | --- | --- | --- |
| 1 | `NODE_ENV` | ✅ | optional | no | `development` |
| 2 | `NEXT_PUBLIC_SITE_URL` | ✅ | optional | **yes** | `http://localhost:3000` |
| 3 | `DATABASE_URL` | ✅ | optional | no | `file:./dev.db` |
| 4 | `AUTH_SECRET` | ✅ (≥ 32 bytes) | optional (warn) | no | insecure dev fallback |
| 5 | `SMTP_HOST` | ⚠️ see §5 | optional | no | — |
| 6 | `SMTP_PORT` | ⚠️ see §5 | optional | no | `587` |
| 7 | `SMTP_USER` | ⚠️ see §5 | optional | no | — |
| 8 | `SMTP_PASS` | ⚠️ see §5 | optional | no | — |
| 9 | `EMAIL_FROM` | ✅ | optional | no | `Al Aminn <hello@alaminn.info>` |
| 10 | `EMAIL_REPLY_TO` | optional | optional | no | same as `EMAIL_FROM` |
| 11 | `RESEND_API_KEY` | ⚠️ see §11 | optional | no | — |

> ⚠️ "see §5/§11" — at least one email transport (SMTP set **or** Resend)
> must be configured in production. Otherwise the app runs but every email is
> silently dropped (with an `email.not_configured` log line).

Two additional variables are read outside `src/lib/env.ts`:

| Variable | Read by | Purpose |
| --- | --- | --- |
| `LOG_LEVEL` | `src/lib/logger.ts` | `debug` \| `info` \| `warn` \| `error`. Defaults to `info` (prod), `debug` (dev). |
| `BACKUP_RETENTION_COUNT` | `scripts/backup-db.ts` | Number of backups to keep in `db/backups/`. Default `30`. |

---

## 1. `NODE_ENV`

**Required in production.** Optional in development (defaults to `"development"`).

- Allowed values: `"development"` \| `"production"` \| `"test"`.
- Surfaced on the `AppEnv` type as `nodeEnv`, `isProd`, `isDev`.

### Effect on the app

| Concern | Development | Production |
| --- | --- | --- |
| Session cookies | `Secure: false` | `Secure: true` |
| HSTS header | Not emitted | `max-age=63072000; includeSubDomains; preload` |
| Logger format | Pretty-printed, colored | Single-line JSON (stdout for info/debug, stderr for errors) |
| Logger min level | `debug` | `info` |
| `AUTH_SECRET` | Falls back to insecure dev string with a warning | **App refuses to start** if missing or `< 32` bytes |
| `EMAIL_FROM` | Defaults to `Al Aminn <hello@alaminn.info>` | **App refuses to start** if missing |
| Email transport | Falls back to console (logs to stdout) | Real SMTP or Resend required (warned if missing) |
| Prisma client cache | Cached on `globalThis` (avoids hot-reload exhaustion) | One client per process |

### Setting it

```bash
# .env
NODE_ENV=production
```

Or inline:

```bash
NODE_ENV=production bun .next/standalone/server.js
```

---

## 2. `NEXT_PUBLIC_SITE_URL`

**Required in production.** Optional in development (defaults to `http://localhost:3000`).

- **Public** — the `NEXT_PUBLIC_` prefix exposes this to the client bundle.
- Must be a full URL with no trailing slash. The `env()` helper strips any
  trailing slash for you.
- Used for:
  - Email template links (newsletter verification, AI task review URL, etc.)
  - OpenGraph / Twitter card `url` and `image` fields
  - `sitemap.xml` `<loc>` entries
  - JSON-LD `@id` and `url` fields
  - Newsletter verification redirect target

### Setting it

```bash
# .env
NEXT_PUBLIC_SITE_URL=https://alaminn.info
```

### Gotchas

- If you change this after deployment, you must redeploy so the client bundle
  picks up the new value (it's baked in at build time).
- The value is used as-is — do not include a path. `https://alaminn.info/` is
  wrong; `https://alaminn.info` is right.

---

## 3. `DATABASE_URL`

**Required in production.** Optional in development (defaults to `file:./dev.db`).

- Prisma connection string. This project uses SQLite exclusively.
- Format: `file:<path>`. The path may be relative (resolved against the
  project root) or absolute.

### Setting it

```bash
# .env (dev — relative path)
DATABASE_URL=file:./db/custom.db

# .env (prod — absolute path)
DATABASE_URL=file:/srv/alaminn/db/custom.db
```

### How the app uses it

- `src/lib/db.ts` creates a single `PrismaClient` per process (cached on
  `globalThis` in dev to survive hot-reloads).
- `prisma/schema.prisma` declares `datasource db { provider = "sqlite"; url = env("DATABASE_URL") }`.
- `scripts/backup-db.ts` and `scripts/restore-db.ts` read `DATABASE_URL` to
  resolve the DB path. They fall back to `db/custom.db` if unset.

### Gotchas

- The directory containing the SQLite file must be writable by the Next.js
  process. SQLite also creates `-wal` and `-shm` files next to the main DB.
- The backup scripts open the source DB read-only — they will not mutate
  production data even if the path points at the live DB.

---

## 4. `AUTH_SECRET`

**Required in production.** Optional in development (falls back to an insecure
dev string with a `console.warn`).

- HMAC-SHA256 secret used to sign session cookies.
- **Must be at least 32 bytes** in production. The app refuses to start if it
  is shorter.
- Used by `src/lib/auth.ts` to sign and verify session tokens of the form
  `<userId>.<role>.<expiresAtEpochSec>.<hmac>`.

### Generating it

```bash
openssl rand -hex 32
```

Produces a 64-character hex string (32 bytes of entropy).

### Setting it

```bash
# .env
AUTH_SECRET=<REPLACE_WITH_output_of_openssl_rand_hex_32>
```

### Validation

`src/lib/env.ts` enforces:

```ts
if (!authSecret) {
  if (isProd) {
    throw new Error("[env] FATAL: AUTH_SECRET is missing in production. …");
  }
  console.warn("[env] WARNING: AUTH_SECRET not set. Using insecure dev fallback. …");
}
if (authSecret && authSecret.length < 32 && isProd) {
  throw new Error("[env] FATAL: AUTH_SECRET must be at least 32 bytes in production.");
}
```

### Rotation

If `AUTH_SECRET` is rotated:

- All existing session cookies become invalid immediately (the HMAC
  verification fails). Users will be signed out and need to log in again.
- The database is unaffected. No data is lost.
- Passwords are not affected (they're hashed with scrypt + per-user salt, not
  with `AUTH_SECRET`).

### Security

- **Never commit `AUTH_SECRET` to version control.**
- **Never share it between environments** (dev, staging, and prod should each
  have their own).
- Treat it like a private key — anyone who has it can forge any session cookie
  for any user.

---

## 5–8. SMTP Configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)

**All four must be set together** for SMTP to be considered "configured". If
any one is missing, the app treats SMTP as not configured and falls through to
Resend (`RESEND_API_KEY`) or the dev console.

| Variable | Required | Type | Default |
| --- | --- | --- | --- |
| `SMTP_HOST` | With the other 3 | string | — |
| `SMTP_PORT` | With the other 3 | integer 1–65535 | `587` (when host is set) |
| `SMTP_USER` | With the other 3 | string | — |
| `SMTP_PASS` | With the other 3 | string | — |

### How SMTP is used

`src/lib/email/transport.ts` creates a single Nodemailer `Transporter` lazily
on first use. The transporter is cached for the lifetime of the process.

- Port `465` → implicit TLS (`secure: true`).
- Any other port → STARTTLS (`secure: false`). Nodemailer auto-upgrades to
  TLS if the server advertises it.

### Setting them

```bash
# .env (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@alaminn.info
SMTP_PASS=xxxx-xxxx-xxxx-xxxx   # App Password, not your account password
```

### Validation

`src/lib/env.ts` parses `SMTP_PORT` defensively — invalid values fall back to
`587` rather than crashing the app:

```ts
function parsePort(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : def;
}
```

The "is SMTP configured?" check is:

```ts
const smtpConfigured = !!(smtpHost && smtpPort && smtpUser && smtpPass);
```

### Common providers

See [deployment.md §5.1](./deployment.md#51-common-smtp-providers) for a
provider cheat-sheet.

---

## 9. `EMAIL_FROM`

**Required in production.** Optional in development (defaults to
`Al Aminn <hello@alaminn.info>`).

- Default `From:` address for every outgoing email.
- Format: either a bare email (`hello@alaminn.info`) or a name+email pair
  (`Al Aminn <hello@alaminn.info>`). The latter is preferred for deliverability.
- Used by `src/lib/email/transport.ts` when the caller doesn't override the
  `from` field on a specific message.

### Setting it

```bash
# .env
EMAIL_FROM="Al Aminn <hello@alaminn.info>"
```

### Validation

```ts
if (isProd && !emailFrom) {
  throw new Error("[env] FATAL: EMAIL_FROM is missing in production.");
}
```

### Gotchas

- If you use Resend, the `from` address must be on a verified domain. Resend
  rejects unverified senders with a 4xx.
- If you use Gmail SMTP, the `from` address must be your account address (or
  an alias you've configured in Gmail settings).

---

## 10. `EMAIL_REPLY_TO`

**Optional in all environments.** Defaults to the value of `EMAIL_FROM`.

- `Reply-To:` header for outgoing email.
- Set this when the `From:` address is a no-send address (e.g.
  `noreply@alaminn.info`) and you want replies to go somewhere humans read.

### Setting it

```bash
# .env
EMAIL_REPLY_TO="hello@alaminn.info"
```

---

## 11. `RESEND_API_KEY`

**Optional.** Alternative to SMTP for transactional email delivery.

- If set, `src/lib/email/transport.ts` prefers Resend over SMTP.
- The Resend client is a thin wrapper around `fetch` to
  `https://api.resend.com/emails` with `Authorization: Bearer <key>`.

### Setting it

```bash
# .env
RESEND_API_KEY=re_abc123…
```

### Validation

None at startup — the key is only checked when the first email is sent. If
the key is invalid, `sendEmail()` returns a result with `success: false`,
`provider: "resend"`, and the error message from Resend's API response. The
caller logs it but never throws.

### Gotchas

- Resend requires the `from` address to be on a verified domain. Verify your
  domain in the Resend dashboard before deploying.
- Resend's free tier is limited to 100 emails/day. For higher volume, upgrade
  or use SMTP.

---

## Email Configuration Summary

`src/lib/env.ts` exposes a derived boolean, `emailConfigured`, that the rest
of the app uses to decide whether to attempt a real send:

```ts
const smtpConfigured = !!(smtpHost && smtpPort && smtpUser && smtpPass);
const emailConfigured = smtpConfigured || !!resendApiKey;
```

| Scenario | Behavior |
| --- | --- |
| Both SMTP and Resend configured | Resend wins (checked first). |
| Only SMTP configured | SMTP used. |
| Only Resend configured | Resend used. |
| Neither configured (dev) | Dev console transport — emails pretty-printed to stdout. |
| Neither configured (prod) | `email.not_configured` error logged; email dropped; triggering request still succeeds. |

The in-app `sendTransactional()` helper retries failed first-attempts up to 3
times with exponential backoff (1s → 4s → 16s) in the background. See
`src/lib/email/queue.ts`.

---

## Example `.env` Files

### Development (`.env`)

```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=file:./db/custom.db
# AUTH_SECRET — optional in dev (insecure fallback used with a warning)
# AUTH_SECRET=dev-only-not-secret-please-set-in-prod-32-bytes-min
# SMTP_* / RESEND_API_KEY — optional in dev (console transport used)
# EMAIL_FROM — optional in dev (defaults to "Al Aminn <hello@alaminn.info>")
```

### Production (`.env`)

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://alaminn.info
DATABASE_URL=file:/srv/alaminn/db/custom.db
AUTH_SECRET=<REPLACE_WITH_openssl_rand_hex_32>
EMAIL_FROM="Al Aminn <hello@alaminn.info>"
EMAIL_REPLY_TO="hello@alaminn.info"

# Choose ONE transport:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@alaminn.info
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
# OR:
# RESEND_API_KEY=re_abc123…

# Optional:
LOG_LEVEL=info
BACKUP_RETENTION_COUNT=30
```

---

## Validation at Startup

`src/instrumentation.ts` runs once on server startup (before any request is
served) and calls `env()`. If production validation fails, the server crashes
with a clear error message:

```
[env] FATAL: AUTH_SECRET is missing in production. Generate one with
`openssl rand -hex 32` and set it in your environment.
```

In development, missing secrets produce a `console.warn` and the app continues
with safe dev values. This means **a misconfigured production deployment fails
fast at startup, not silently at the first request**.

The `env()` result is cached after the first call (module-level singleton),
so subsequent reads are free.
