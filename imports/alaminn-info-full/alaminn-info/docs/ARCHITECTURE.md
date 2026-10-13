<!--
  Title: Alaminn.info — System Architecture
  Canonical Stack: Next.js 16 · PostgreSQL 17 · Redis 7 · BullMQ · Auth.js · Caddy 2 · systemd · Ubuntu 24.04 LTS
  Last Updated: 2025
  Audience: Engineers, architects, operators
-->

# ARCHITECTURE — System Architecture & Request Flow

This document describes the runtime architecture of Alaminn.info: the physical topology,
the logical service boundaries, the request lifecycle from the public Internet through
Caddy and the Next.js standalone server to PostgreSQL / Redis / S3, the BullMQ worker
design, and the authentication flow.

---

## Table of Contents

1. [Architecture at a Glance](#1-architecture-at-a-glance)
2. [Physical Topology](#2-physical-topology)
3. [Logical Service Boundaries](#3-logical-service-boundaries)
4. [Request Flow](#4-request-flow)
5. [BullMQ Worker Design](#5-bullmq-worker-design)
6. [Authentication Flow](#6-authentication-flow)
7. [Data Flow](#7-data-flow)
8. [Caching Strategy](#8-caching-strategy)
9. [Observability Surface](#9-observability-surface)
10. [Failure Modes & Graceful Degradation](#10-failure-modes--graceful-degradation)

---

## 1. Architecture at a Glance

```
                         ┌─────────────────────────────────────────────┐
                         │              Internet (HTTPS)               │
                         └────────────────────┬────────────────────────┘
                                              │
                                              ▼
                         ┌─────────────────────────────────────────────┐
                         │  Caddy 2 (reverse proxy + auto-TLS)         │
                         │  • terminates TLS (Let's Encrypt)           │
                         │  • injects security headers                 │
                         │  • reverse_proxies to 127.0.0.1:${PORT}     │
                         └────────────────────┬────────────────────────┘
                                              │ (HTTP, loopback only)
                                              ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │  Ubuntu 24.04 LTS host (systemd)                                     │
        │                                                                      │
        │  ┌──────────────────────────┐         ┌──────────────────────────┐  │
        │  │ alaminn-info-web.service │         │ alaminn-info-worker.svc  │  │
        │  │  Next.js 16 standalone   │         │  BullMQ worker process   │  │
        │  │  (node server.js)        │         │  (node worker.js)        │  │
        │  │  127.0.0.1:${PORT}       │         │  consumes Redis queues   │  │
        │  └───────────┬──────────────┘         └───────────┬──────────────┘  │
        │              │                                    │                 │
        │              │  (Prisma)                          │ (Prisma)        │
        │              ▼                                    ▼                 │
        │  ┌──────────────────────┐         ┌──────────────────────────┐      │
        │  │  PostgreSQL 17       │◄────────│     Redis 7              │      │
        │  │  (canonical DB)      │  query  │  (queues, cache, rate    │      │
        │  │                      │         │   limit, sessions)       │      │
        │  └──────────────────────┘         └──────────────────────────┘      │
        │              │                                    │                 │
        │              │  (S3 SDK)                          │                 │
        │              ▼                                    ▼                 │
        │  ┌──────────────────────────────────────────────────────────────┐   │
        │  │  S3-compatible object storage (uploads + backups)            │   │
        │  └──────────────────────────────────────────────────────────────┘   │
        │                                                                      │
        │  ┌──────────────────────────────────────────────────────────────┐   │
        │  │  SMTP / Resend (transactional email)                          │   │
        │  └──────────────────────────────────────────────────────────────┘   │
        └──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Physical Topology

A single Ubuntu 24.04 LTS host runs every component. The topology is intentionally
co-located for simplicity and cost; it scales vertically first and horizontally second
(see §Scaling in **[OPERATIONS.md](./OPERATIONS.md)**).

| Component | Process | Listens on | Managed by |
|---|---|---|---|
| Caddy 2 | `caddy` | `:80`, `:443` (public) | `caddy.service` (vendor unit) |
| Next.js web | `node .next/standalone/server.js` | `127.0.0.1:${PORT}` (default 3001) | `alaminn-info-web.service` |
| BullMQ worker | `node .next/standalone/worker.js` | (none — pulls from Redis) | `alaminn-info-worker.service` |
| PostgreSQL 17 | `postgres` | `127.0.0.1:5432` | `postgresql.service` |
| Redis 7 | `redis-server` | `127.0.0.1:6379` | `redis-server.service` |
| S3 (MinIO) | `minio` (optional, self-hosted) | `127.0.0.1:9000` | `minio.service` (or external) |

All inter-service traffic is loopback-only. The firewall (`ufw`) permits inbound `22/tcp`
(SSH), `80/tcp`, and `443/tcp` only. PostgreSQL, Redis, and the Next.js server are never
reachable from the public Internet.

---

## 3. Logical Service Boundaries

### 3.1 Web service (`alaminn-info-web.service`)

**Responsibility:** serve HTTP requests — render pages (RSC), handle API routes, validate
sessions, authorize via RBAC, read/write the canonical database.

**Does NOT:**

- Send email (enqueues a job instead).
- Run long-running AI tasks synchronously (enqueues a job instead).
- Generate exports synchronously if they take > 2s (enqueues a job and emails the result).
- Run scheduled maintenance (that's the worker + cron-bridge, see §5).

**Process model:** single Node.js process (Next.js standalone). Concurrency is
event-loop-based. Each request gets a fiber; long-running DB queries are awaited, not
threaded.

**Lifecycle:** `Restart=on-failure`, `KillSignal=SIGTERM`, `TimeoutStopSec=15s`. On
`SIGTERM`, the server stops accepting new connections, drains in-flight requests for up to
10s (see `server.js`), then exits.

### 3.2 Worker service (`alaminn-info-worker.service`)

**Responsibility:** consume BullMQ queues from Redis and perform background work.

**Queues (logical):**

| Queue | Producer | Consumer behavior |
|---|---|---|
| `email` | Web (contact form, newsletter, AI approvals) | Renders template, sends via SMTP/Resend, retries 5× with exponential backoff. |
| `notification` | Web (in-app notifications) | Writes a `Notification` row + optional email. |
| `audit` | Web (every privileged mutation) | Writes an `AuditLog` row asynchronously. |
| `ai-task` | Web (Command Center AI Workspace) | Calls `z-ai-web-dev-sdk`, persists result, emits `ai-task.completed` event. |
| `scheduled` | Cron bridge (see §5.2) | Runs `session-cleanup`, `scholarship-deadlines`, `phd-deadlines`, `backup`, `temp-cleanup`, `sitemap-generate`, `data-verification`, `referral-retry`. |

**Process model:** single Node.js process running `worker.js`, which instantiates one
`Worker` per queue with a configurable concurrency (default 8 for email/notification/audit,
2 for ai-task). Each worker pulls jobs from Redis, executes the handler, and acks on
success or moves to the dead-letter set after `attempts` retries.

**Lifecycle:** `Restart=on-failure`, `KillSignal=SIGTERM`, `TimeoutStopSec=30s`. On
`SIGTERM`, the worker calls `worker.close(false)` (wait for in-flight jobs to finish, up
to 30s), then exits.

### 3.3 Database (PostgreSQL 17)

**Single canonical database** named `alaminn_info`. Owned by role `alaminn_info`. All
schema lives in the `public` namespace (one `schema.prisma`, no multi-tenancy).

**Connection model:** Prisma opens a pool of connections (default `connection_limit=20`).
The web service and the worker service each maintain their own pool; the worker pool is
smaller (default 5) because it processes jobs serially per queue.

### 3.4 Redis

Redis serves four logical purposes, distinguished by key prefix:

| Purpose | Key prefix | TTL |
|---|---|---|
| BullMQ queues | `bull:{queueName}:*` | per-job |
| Rate limiting | `rl:{route}:{ipHash}` | window (60s default) |
| Session cache | `sess:{sessionId}` | `SESSION_TTL_SEC` |
| Hot data cache | `cache:{domain}:{key}` | 60–600s |

### 3.5 S3-compatible storage

Two logical buckets (or one bucket with two prefixes):

| Purpose | Path pattern | Lifecycle |
|---|---|---|
| Media uploads | `media/{year}/{month}/{cuid}` | Indefinite (or glacier after 1y) |
| Database backups | `backups/db/{YYYY-MM-DD-HHMM}.dump` | Retention per BACKUP.md |
| Exports archive | `exports/{userId}/{cuid}.{ext}` | 7-day expiry |

---

## 4. Request Flow

### 4.1 Public page request (e.g. `GET /higher-study/universities`)

```
Browser
  │  HTTPS GET https://${APP_URL}/higher-study/universities
  ▼
Caddy
  │  • terminates TLS
  │  • matches site block ${APP_URL}
  │  • applies security headers
  │  • reverse_proxy → 127.0.0.1:${PORT}
  ▼
Next.js standalone (server.js)
  │  • Next.js router matches /higher-study/universities/page.tsx
  │  • Server Component renders
  │    │
  │    ▼  Prisma query (db.ts → connection pool)
  │    │  SELECT * FROM "HigherStudyUniversity" WHERE status='published' ...
  │    │
  │    ▼  Redis cache lookup (cache:hs:universities:list)
  │    │  HIT → return cached payload (skip DB)
  │    │  MISS → query DB, write cache (TTL 300s)
  │    │
  │    ▼  Render RSC tree → HTML stream
  │  • Returns HTML to Caddy → browser
```

### 4.2 Authenticated API request (e.g. `POST /api/v1/admin/articles`)

```
Browser
  │  POST https://${APP_URL}/api/v1/admin/articles
  │  Cookie: alaminn_session=<signed-token>
  │  Body: { title, slug, body, ... }
  ▼
Caddy → 127.0.0.1:${PORT}
  ▼
Next.js API route handler (src/app/api/v1/admin/articles/route.ts)
  │
  │ 1. Rate limit check (Redis rl:api:v1:admin:articles:{ipHash})
  │    429 Too Many Requests if exceeded
  │
  │ 2. Session verification (src/lib/auth.ts getSession())
  │    • read alaminn_session cookie
  │    • HMAC-SHA256 verify with AUTH_SECRET (constant-time compare)
  │    • parse payload: <userId>.<role>.<expiresAt>
  │    • check expiry
  │    401 Unauthorized if invalid/expired
  │
  │ 3. RBAC check (src/lib/rbac.ts hasPermission(role, 'articles.create'))
  │    403 Forbidden if denied
  │
  │ 4. Input validation (zod schema)
  │    422 Unprocessable Entity if invalid
  │
  │ 5. Persist (Prisma): INSERT INTO "Article" ...
  │
  │ 6. Audit (enqueue, non-blocking):
  │    queue.add('audit', { action:'articles.create', actor:userId, target:newId })
  │
  │ 7. Response: 201 Created, JSON body { data: { id, slug, ... } }
  ▼
Caddy → browser
```

### 4.3 Background work (e.g. contact form submission)

```
Browser → POST /api/v1/inquiries
  │
  ▼  (web service)
  │ 1. Validate
  │ 2. Prisma: INSERT INTO "Inquiry" ...
  │ 3. Enqueue (BullMQ):
  │    emailQueue.add('inquiry-received', { inquiryId })
  │    notificationQueue.add('admin-notify', { inquiryId })
  │ 4. Response: 201 Created (does NOT wait for email to send)
  │
  ▼  (worker service, async)
  │ emailQueue worker picks up 'inquiry-received'
  │   • load Inquiry from DB
  │   • render template (src/lib/email/templates.ts)
  │   • send via nodemailer (SMTP) or Resend
  │   • on success: ack
  │   • on failure: retry with exponential backoff (5 attempts)
  │
  ▼  notificationQueue worker picks up 'admin-notify'
  │   • INSERT INTO "Notification" (admin inbox)
  │   • optionally email admins
```

---

## 5. BullMQ Worker Design

The worker replaces the legacy standalone mini-services (`mini-services/email-worker/`,
`mini-services/audit-worker/`, `mini-services/notification-service/`,
`mini-services/health-monitor/`). All background work is now consolidated into a single
BullMQ process.

### 5.1 Queue topology

```
                          Redis
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   email queue      notification queue     audit queue
   (concurrency 8)  (concurrency 8)       (concurrency 16)
        │                   │                   │
        ▼                   ▼                   ▼
   SMTP/Resend        DB (Notification)     DB (AuditLog)

                            │
                            ▼
                     ai-task queue (concurrency 2)
                            │
                            ▼
                   z-ai-web-dev-sdk + DB

                            │
                            ▼
                     scheduled queue (cron-driven)
                            │
                            ▼
                   session-cleanup, backup, sitemap, ...
```

### 5.2 Scheduled jobs (cron bridge)

A single BullMQ `QueueScheduler` + `RepeatableJob` pattern drives the scheduled tasks.
The cron bridge lives in the worker process and registers repeatable jobs at boot:

```ts
// src/worker/scheduler.ts (illustrative)
await scheduledQueue.add(
  'session-cleanup',
  {},
  { repeat: { pattern: '*/15 * * * *' } }
);
await scheduledQueue.add(
  'backup',
  {},
  { repeat: { pattern: '0 3 * * *' } }
);
// ... (scholarship-deadlines, phd-deadlines, temp-cleanup, sitemap-generate,
//      data-verification, referral-retry, health-monitor, email-queue-drain)
```

The existing `/api/cron/*` route handlers are retained as a fallback (HTTP-triggered, gated
by `CRON_SECRET`) so an external scheduler can poke a job if Redis scheduling fails. The
primary path is the in-worker scheduler.

### 5.3 Failure handling

- **Retry policy:** exponential backoff, `attempts: 5`, `backoff: { type: 'exponential',
  delay: 2000 }`.
- **Dead-letter:** after max attempts, the job moves to the `failed` set. A
  `failed`-event listener writes an `AuditLog` row and notifies admins.
- **Idempotency:** every job handler must be idempotent. Email sends dedupe on
  `inquiryId`; audit writes dedupe on `(action, target, actor, ts-bucket)`.
- **Visibility:** BullMQ exposes queue metrics via `queue.getJobCounts()`; the
  `/api/health/deep` endpoint reports them (gated by RBAC).

### 5.4 Worker source layout

```
src/worker/
├── index.ts                 # boot: instantiate Workers, register scheduler
├── queues.ts                # Queue singletons (email, notification, audit, ai-task, scheduled)
├── scheduler.ts             # repeatable job registration
├── handlers/
│   ├── email.ts
│   ├── notification.ts
│   ├── audit.ts
│   ├── ai-task.ts
│   ├── session-cleanup.ts
│   ├── backup.ts
│   ├── sitemap-generate.ts
│   ├── scholarship-deadlines.ts
│   ├── phd-deadlines.ts
│   ├── temp-cleanup.ts
│   ├── data-verification.ts
│   ├── referral-retry.ts
│   └── health-monitor.ts
└── shutdown.ts              # graceful drain on SIGTERM
```

---

## 6. Authentication Flow

### 6.1 Login

```
User → POST /api/v1/auth/login { email, password, role }
  │
  ▼  (web service)
  │ 1. Rate limit: rl:auth:login:{ipHash} (5 / 15min)
  │ 2. Load User by email
  │ 3. Lockout check: if failed_attempts >= 5 and last_failed_at < 15min ago → 423 Locked
  │ 4. scrypt verify password (constant-time)
  │    • on miss: increment failed_attempts, set last_failed_at, return 401
  │    • on hit:  reset failed_attempts, set last_login_at
  │ 5. Build session payload: `<userId>.<role>.<expiresAtEpochSec>`
  │ 6. HMAC-SHA256 sign with AUTH_SECRET → cookie value
  │ 7. Set-Cookie: alaminn_session=<signed>; HttpOnly; Secure; SameSite=Lax; Max-Age=28800
  │ 8. Audit: enqueue audit job (action: 'auth.login', actor: userId)
  │ 9. Response: 200 OK { user: { id, email, name, role } }
```

### 6.2 Subsequent request (session verification)

Every protected route handler calls `getSession()` from `src/lib/auth.ts`:

```ts
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const session = await getSession();      // reads + verifies cookie
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!hasPermission(session.role, "articles.create"))
    return Response.json({ error: "forbidden" }, { status: 403 });
  // ... proceed
}
```

### 6.3 Session revocation

Sessions are stateless JWTs by default. For revocation, a denylist is kept in Redis:
`sess:revoked:{userId}` (a sorted set of revoked session IDs). `getSession()` checks the
denylist on every request. The Admin → Users page exposes "Revoke sessions" which adds the
user's ID to the denylist with a TTL equal to `SESSION_TTL_SEC`.

### 6.4 Logout

```
POST /api/v1/auth/logout
  │ 1. Read session, add userId to Redis denylist (TTL = remaining session TTL)
  │ 2. Set-Cookie: alaminn_session=; Max-Age=0
  │ 3. Audit: enqueue audit job (action: 'auth.logout')
  │ 4. Response: 200 OK
```

### 6.5 MFA (ready, opt-in)

The schema includes `mfaEnabled`, `mfaSecret`, `mfaBackupCodes` on `User`. The flow is
TOTP-based (RFC 6238). After password verification, if `mfaEnabled` is true, the login
response is `200 OK { mfaRequired: true, challengeToken }` and the client must POST
`/api/v1/auth/mfa/verify` with the TOTP code. This is wired in the data model and the API
contract; the UI toggle is feature-flagged behind `FEATURE_MFA`.

---

## 7. Data Flow

### 7.1 Write path (e.g. creating an article)

```
Admin UI (react-hook-form + zod)
  │ POST /api/v1/admin/articles
  ▼
API route
  │ 1. getSession() → RBAC check
  │ 2. zod validate
  │ 3. Prisma: BEGIN; INSERT Article; INSERT AuditLog; COMMIT
  │    (AuditLog written synchronously for create/delete; async for update/list)
  │ 4. Invalidate cache: redis.del('cache:articles:list', 'cache:articles:slug:'+slug)
  │ 5. Enqueue: notificationQueue.add('article-published', { articleId })
  │ 6. Response: 201 Created
```

### 7.2 Read path (e.g. listing universities)

```
Public page /higher-study/universities
  │
  ▼  Server Component
  │ 1. Compute cache key: cache:hs:universities:list:filters-hash
  │ 2. Redis GET → HIT? return cached JSON, skip DB
  │ 3. MISS → Prisma query (with indexes on status, countryId, publishedAt)
  │ 4. Redis SETEX(key, 300, json) — 5 min TTL
  │ 5. Render RSC
```

### 7.3 Export path (e.g. exporting inquiries to CSV)

```
Admin → POST /api/v1/admin/contacts/export
  │ 1. RBAC check (contacts.export)
  │ 2. Enqueue: exportQueue.add('contacts-csv', { userId, filters })
  │ 3. Response: 202 Accepted { jobId }
  │
  ▼  (worker, async)
  │ 1. Stream rows from PostgreSQL via Prisma cursor
  │ 2. Pipe through csv-stringify
  │ 3. Stream upload to S3: exports/{userId}/{jobId}.csv
  │ 4. INSERT Notification (with S3 URL, 7-day expiry)
  │ 5. Enqueue email: 'export-ready', { userId, url }
```

---

## 8. Caching Strategy

| Cache | Layer | TTL | Invalidation |
|---|---|---|---|
| Static assets (`/_next/static/*`) | Caddy + browser | 1 year immutable | Content-hashed filenames |
| Public page HTML | None (always fresh) | — | — |
| Public list endpoints (universities, courses, scholarships) | Redis | 300s | On write: `redis.del(prefix + '*')` |
| Admin list endpoints | None | — | Always fresh (authoritative) |
| Session data | Redis denylist | `SESSION_TTL_SEC` | On logout / revoke |
| Rate limit counters | Redis | window (60s) | Self-expiring |
| Prisma client | In-process singleton | process lifetime | — |
| Pino logger | In-process singleton | process lifetime | — |

> **Cache discipline:** caches are an optimization, not a source of truth. The app must
> remain correct with caches fully disabled. The `/api/health/deep` endpoint exposes cache
> hit/miss ratios for observability.

---

## 9. Observability Surface

| Signal | Source | Consumer |
|---|---|---|
| Structured logs | Pino (`src/lib/logger.ts`) → `stdout`/`stderr` | journald → `journalctl -u alaminn-info-web` |
| Health probes | `/api/health`, `/api/health/deep` | Caddy, external uptime monitors |
| Queue metrics | BullMQ `queue.getJobCounts()` | `/api/health/deep` (admin-gated) |
| DB metrics | PostgreSQL `pg_stat_*` views | `pg_stat_statements` (enable extension) |
| Redis metrics | `redis-cli INFO` | `/api/health/deep` (admin-gated) |
| Audit trail | `AuditLog` table | Admin → Audit Logs page |
| Analytics events | `AnalyticsEvent` table | Admin → Analytics page |

All logs are JSON with: `time`, `level`, `msg`, `reqId`, `userId` (if authed),
`route`, `method`, `status`, `durationMs`, `error` (if any). See
**[OPERATIONS.md](./OPERATIONS.md)** for the log query cookbook.

---

## 10. Failure Modes & Graceful Degradation

| Failure | Detection | App behavior |
|---|---|---|
| PostgreSQL unreachable | Prisma throws `PrismaClientInitializationError` | `/api/health/deep` returns `db: "down"`; web returns 503 on DB-dependent routes; static pages with cached HTML may still serve. |
| Redis unreachable | BullMQ / rate-limit throws | Rate limiting degrades to "allow" (fail-open) with a logged warning; queue writes fail loudly (500 to the producer); session verification falls back to JWT-only (denylist skipped). |
| S3 unreachable | S3 SDK throws | Uploads return 503; reads of cached media still work via Caddy's cached responses; new media 404s. |
| SMTP unreachable | nodemailer throws | Email job retries (5× exponential); after max attempts, job moves to failed set and admin is notified. |
| Worker process crash | systemd `Restart=on-failure` | systemd restarts within 5s; in-flight jobs return to the queue (BullMQ visibility timeout); no data loss. |
| Disk full | journald stops logging, PostgreSQL stops accepting writes | All writes fail; `/api/health/deep` reports `disk: "critical"`; alerting via the `health-monitor` scheduled job. |
| Auth secret rotated | All existing sessions fail HMAC verification | Every user is logged out; expected behavior after a secret rotation — communicate to users first. |

### 10.1 Circuit breakers

- **AI task queue:** if the `z-ai-web-dev-sdk` returns 5 consecutive 5xx errors, the
  worker pauses the ai-task queue for 60s and emits an audit event. Admins see "AI
  degraded" in the Command Center.
- **Email queue:** if SMTP returns 5 consecutive 5xx errors, the worker switches to the
  Resend fallback (if configured) or pauses the queue.

---

## Appendix — Service Dependency Graph

```
caddy.service
   │ (depends on)
   ▼
alaminn-info-web.service
   │ (requires)
   ├──▶ postgresql.service
   ├──▶ redis-server.service
   └──▶ (network) s3 endpoint, smtp endpoint

alaminn-info-worker.service
   │ (requires)
   ├──▶ postgresql.service
   ├──▶ redis-server.service
   ├──▶ (network) s3 endpoint, smtp endpoint, z-ai-web-dev-sdk endpoint
   └──▶ (indirect) alaminn-info-web.service (for HTTP-triggered cron fallback)

alaminn-info-backup.timer
   │ (triggers)
   ▼
alaminn-info-backup.service
   │ (requires)
   ├──▶ postgresql.service
   └──▶ (network) s3 endpoint
```

systemd `After=` / `Wants=` directives encode these dependencies; see the unit files in
`deploy/systemd/` and **[DEPLOY.md](./DEPLOY.md)** §10.
