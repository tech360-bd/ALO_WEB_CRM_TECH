<!--
  Title: Alaminn.info — Security
  Canonical Stack: Next.js 16 · PostgreSQL 17 · Redis 7 · BullMQ · Auth.js · Caddy 2 · systemd · Ubuntu 24.04 LTS
  Last Updated: 2025
  Audience: Security engineers, operators, developers
-->

# SECURITY — Threat Model, Auth, Hardening

This document defines the security posture of Alaminn.info: the threat model, the
authentication and authorization design, the transport and header hardening, the input
validation strategy, secrets management, file upload security, and the audit logging
discipline. It is the reference for every security-sensitive decision in the codebase.

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Authentication](#2-authentication)
3. [Authorization (RBAC + Permissions)](#3-authorization-rbac--permissions)
4. [Session Management & Revocation](#4-session-management--revocation)
5. [Account Lockout & Brute Force](#5-account-lockout--brute-force)
6. [MFA](#6-mfa)
7. [CSRF Protection](#7-csrf-protection)
8. [Rate Limiting](#8-rate-limiting)
9. [Input Validation](#9-input-validation)
10. [Content Security Policy & Headers](#10-content-security-policy--headers)
11. [Secrets Management](#11-secrets-management)
12. [File Upload Security](#12-file-upload-security)
13. [Audit Logging](#13-audit-logging)
14. [Transport & Network Security](#14-transport--network-security)
15. [Vulnerability Disclosure](#15-vulnerability-disclosure)

---

## 1. Threat Model

### 1.1 Assets

| Asset | Sensitivity | Location |
|---|---|---|
| User credentials (password hashes) | Critical | `User.passwordHash` (PostgreSQL) |
| Auth secret (`AUTH_SECRET`) | Critical | `/etc/alaminn-info/env` (root-readable) |
| Session tokens | High | Cookie (HttpOnly, Secure) + Redis denylist |
| Personally identifiable information (contacts, inquiries) | High | PostgreSQL |
| Student referral data | High | PostgreSQL |
| Admin audit logs | High | PostgreSQL + append-only WORM intent |
| Media uploads | Medium | S3 |
| Database backups | Critical | S3 (encrypted at rest) |
| SMTP / S3 credentials | Critical | `/etc/alaminn-info/env` |

### 1.2 Adversaries & attack surfaces

| Adversary | Capability | Primary surface |
|---|---|---|
| Anonymous Internet user | Send arbitrary HTTP requests to `:80`/`:443` | Public pages, public API (`/api/v1/inquiries`, `/api/v1/newsletter`), login |
| Authenticated low-privilege user (STUDENT/GUEST) | Hold a valid session, attempt privilege escalation | Auth-gated API routes, RBAC bypass attempts |
| Authenticated admin (EDITOR/ADMIN/SUPER_ADMIN) | Perform privileged mutations, possibly coerce victim into visiting a link | Admin API, file upload, audit log tampering |
| Insider with DB access | Read raw tables | PostgreSQL (`pg_dump`), replicas |
| Insider with shell access | Read env files, journald | The host |
| Compromised dependency (supply chain) | Execute code at build/runtime | `npm install`, build pipeline |

### 1.3 Security goals

1. **Confidentiality:** PII and credentials are never exposed to unauthorized parties.
2. **Integrity:** every privileged mutation is authorized, audited, and tamper-evident.
3. **Availability:** the platform degrades gracefully under load; no single request can
   exhaust a shared resource (rate limiting, queue backpressure).
4. **Non-repudiation:** audit logs bind every privileged action to an actor, a timestamp,
   and a target, with a monotonic sequence.

### 1.4 Out of scope

- Physical access to the host (mitigated by OS hardening, not application logic).
- Zero-day exploits in Node.js / PostgreSQL / Redis / Caddy themselves (mitigated by
  unattended-upgrades and prompt patching).
- Social engineering of operators (mitigated by runbooks and dual-control for destructive
  operations).

---

## 2. Authentication

### 2.1 Password storage

Passwords are hashed with **scrypt** (Node.js `crypto.scryptSync`) using parameters
`N=16384, r=8, p=1` and a 16-byte per-user random salt. The stored format is
`scrypt$<salt-hex>$<hash-hex>` (see `src/lib/auth.ts`).

- scrypt is memory-hard, defeating GPU/ASIC brute force.
- The salt is per-user, so rainbow tables are useless.
- Verification uses `timingSafeEqual` to prevent timing attacks.

**Why not bcrypt/argon2?** scrypt is in Node's stdlib — no native dependency, no build
fragility. argon2 is acceptable as a future upgrade; the storage format (`scrypt$...`) is
versioned so a migration is forward-compatible.

### 2.2 Session tokens

The session cookie value is `<userId>.<role>.<expiresAtEpochSec>.<hmac-sig>` where the HMAC
is SHA-256 over the first three dot-separated fields keyed by `AUTH_SECRET`. Verification:

1. Split on the last `.` to get payload + signature.
2. Recompute HMAC over payload with `AUTH_SECRET`.
3. Compare in constant time (`timingSafeEqual`).
4. Parse payload, check `expiresAtEpochSec > now`.

Cookie attributes:

| Attribute | Value | Rationale |
|---|---|---|
| `HttpOnly` | true | Prevents JS from reading the cookie (XSS defense) |
| `Secure` | true (production) | Never sent over HTTP |
| `SameSite` | `Lax` | Allows top-level navigations, blocks CSRF on POST |
| `Path` | `/` | Available to all routes |
| `Max-Age` | `28800` (8h) | Matches `SESSION_TTL_SEC` |

### 2.3 Auth.js (NextAuth) integration

The v6 rebuild standardizes on **Auth.js v5**. The session strategy is **JWT** (not
database sessions) so the worker process can verify sessions without a synchronous DB
lookup. The JWT is signed with `AUTH_SECRET` and contains `sub` (userId), `role`,
`expiresAt`. The cookie name remains `alaminn_session` for continuity.

`src/lib/auth.ts` exposes:

- `hashPassword(plain)`, `verifyPassword(plain, stored)` — scrypt.
- `getSession()` — reads + verifies the cookie, returns `{ userId, role, expiresAt }` or `null`.
- `createSession(userId, role)` — signs + sets the cookie.
- `destroySession()` — clears the cookie + adds to Redis denylist.
- `requirePermission(perm)` — throws `401`/`403` if not authorized.

---

## 3. Authorization (RBAC + Permissions)

### 3.1 Model

Authorization is **role-based** with **permission strings** of the form
`<resource>.<action>` (e.g. `articles.create`, `higher-study.universities.verify`).
A role either grants a permission or it does not — there are no conditional grants.

The 11 canonical roles are defined in `src/lib/rbac.ts`:

```
SUPER_ADMIN, ADMIN, EDITOR, AUTHOR, ANALYST, COUNSELLOR,
STUDENT, TUTOR, MODERATOR, VIEWER, GUEST
```

> The v6 rebuild consolidates the legacy 11 roles (OWNER, EXECUTIVE_ASSISTANT,
> CRM_MANAGER, etc.) into the canonical set above. The migration mapping is documented in
> **[MIGRATION-TO-POSTGRESQL.md](./MIGRATION-TO-POSTGRESQL.md)** §Role Mapping.

### 3.2 Enforcement

Every privileged API route calls `requirePermission(perm)`:

```ts
import { requirePermission } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await requirePermission("articles.create"); // throws 401/403
  // ... route logic
}
```

**Server-only enforcement:** the RBAC matrix lives in `src/lib/rbac.ts` and is never
imported by client components. The client may render/hide UI based on the role in the
session, but **the server never trusts the client's claim** — it re-checks on every
request.

### 3.3 Permission matrix

The full role × resource × action matrix is in
**[ROLE-PERMISSION-MATRIX.md](./ROLE-PERMISSION-MATRIX.md)**. The runtime source of truth
is `src/lib/rbac.ts` (`rolePermissions(role)` returns a `Set<Permission>`).

### 3.4 Principle of least privilege

- New admin users default to `VIEWER`. A `SUPER_ADMIN` must explicitly elevate.
- Role assignment requires `users.role_assign` permission (only `SUPER_ADMIN` + `ADMIN`).
- Destructive actions (delete user, drop audit log, restore backup) require
  `SUPER_ADMIN` and produce a high-severity audit event.

---

## 4. Session Management & Revocation

### 4.1 Lifetime

- `SESSION_TTL_SEC = 28800` (8 hours), configurable via env.
- Sessions are not sliding — they expire at the absolute timestamp set at login.
- Long-running admin sessions are not auto-extended; the user must re-authenticate.

### 4.2 Revocation

Because sessions are stateless JWTs, revocation uses a Redis denylist:

- **Per-session revoke:** `SADD sess:revoked:{userId} {sessionId} EX {remainingTtl}`.
- **Per-user revoke (all sessions):** `SET sess:revoked:user:{userId} 1 EX {SESSION_TTL_SEC}`.
- `getSession()` checks both keys after JWT verification.

The Admin → Users page exposes "Revoke all sessions" which sets the per-user key.

### 4.3 Secret rotation

If `AUTH_SECRET` is rotated:

- All existing sessions fail HMAC verification → every user is logged out.
- The Redis denylist becomes irrelevant (new secret, new signature space).
- Communicate the rotation to users beforehand.

Rotate with:

```bash
NEW_SECRET=$(openssl rand -hex 32)
# Edit /etc/alaminn-info/env: AUTH_SECRET=$NEW_SECRET
sudo systemctl restart alaminn-info-web.service alaminn-info-worker.service
```

---

## 5. Account Lockout & Brute Force

| Trigger | Counter | Lockout |
|---|---|---|
| Failed login (wrong password) | `auth:fail:{email}` INCR, EXPIRE 15min | At 5 fails: `auth:lock:{email}` SET EX 15min → 423 Locked |
| Failed login by IP | `auth:fail:ip:{ipHash}` INCR, EXPIRE 15min | At 20 fails from one IP: block IP for 15min |
| MFA failure | `mfa:fail:{userId}` INCR, EXPIRE 5min | At 5 fails: force re-login |

Lockouts clear on a successful login (counter reset). The `SECURITY_AUDITOR` role can view
the lockout state in Admin → Security.

---

## 6. MFA

MFA is **TOTP** (RFC 6238), opt-in per user. The schema fields `mfaEnabled`,
`mfaSecret` (encrypted), `mfaBackupCodes` (hashed) are on `User`.

### 6.1 Enrollment flow

1. User toggles MFA in Admin → My Account.
2. Server generates a random base32 secret, returns it as an `otpauth://` URL.
3. User scans with an authenticator app (Google Authenticator, Authy, 1Password).
4. User enters a 6-digit code to confirm enrollment.
5. Server stores the secret (encrypted at rest with `AUTH_SECRET`-derived key) and 10
   one-time backup codes (hashed with scrypt).

### 6.2 Login with MFA

1. User submits email + password.
2. Password verifies → server checks `mfaEnabled`.
3. If true: respond `200 { mfaRequired: true, challengeToken: <short-lived JWT> }`. Do NOT
   set the session cookie yet.
4. Client submits the TOTP code with `challengeToken` to `/api/v1/auth/mfa/verify`.
5. Server verifies TOTP (±1 time step), sets the session cookie, clears the challenge token.

### 6.3 Backup codes

Each backup code is single-use. On use, it is removed from the stored set. If all 10 are
exhausted, MFA must be re-enrolled (requires current password + admin confirmation if the
user is locked out).

---

## 7. CSRF Protection

### 7.1 SameSite cookies

The session cookie is `SameSite=Lax`, which blocks cross-site POST submissions. This is
the primary CSRF defense for browser-driven form submissions.

### 7.2 Origin/Referer check

Every state-changing API route (`POST`, `PUT`, `PATCH`, `DELETE`) checks the `Origin` (or
`Referer` fallback) header against `APP_URL`:

```ts
function checkOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return u.origin === env().siteUrl;
  } catch {
    return false;
  }
}
```

Failures return `403 Forbidden`.

### 7.3 Cron endpoints

`/api/cron/*` routes are not browser-accessible. They require a `CRON_SECRET` header
matching the env value. The in-worker scheduler calls these via `localhost` with the
secret; external schedulers must supply it. Without the secret, the route returns `401`.

---

## 8. Rate Limiting

Rate limiting is enforced in Redis with a sliding-window counter per route + IP hash.

### 8.1 Limits

| Route class | Limit | Window | Key |
|---|---|---|---|
| Public API (`/api/v1/inquiries`, `/api/v1/newsletter`) | 10 | 60s | `rl:pub:{route}:{ipHash}` |
| Auth (`/api/v1/auth/login`, `/api/v1/auth/mfa/verify`) | 5 | 15min | `rl:auth:{ipHash}` |
| Authenticated API | 120 | 60s | `rl:api:{userId}` + `rl:api:{ipHash}` |
| AI task creation (`/api/v1/ai/tasks`) | 10 | 60s | `rl:ai:{userId}` |
| Export endpoints | 3 | 60s | `rl:export:{userId}` |
| Static assets | None (Caddy caches) | — | — |

### 8.2 Implementation

```ts
import { rateLimit } from "@/lib/rate-limit";  // wraps Redis

const ok = await rateLimit(`rl:auth:${ipHash}`, { max: 5, windowSec: 900 });
if (!ok) return Response.json({ error: "too_many_requests" }, { status: 429 });
```

### 8.3 Fail-open policy

If Redis is unreachable, rate limiting **fails open** (allows the request) but logs a
`WARN`. This is a deliberate trade-off: a hard fail-closed would let an attacker DoS the
auth system by killing Redis. The `health-monitor` scheduled job alerts admins if Redis is
down.

---

## 9. Input Validation

### 9.1 Zod at the boundary

Every API route validates its input with a **zod 4** schema before any business logic:

```ts
const CreateArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(200),
  body: z.string().max(200_000),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  // ...
});

const parsed = CreateArticleSchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json(
    { error: "validation_failed", issues: parsed.error.issues },
    { status: 422 }
  );
}
```

### 9.2 SQL injection

All database access goes through Prisma's parameterized queries. **No string-concatenated
SQL** exists in application code. Raw SQL is permitted only in:

- Prisma migrations (reviewed and committed).
- The `pg_dump`/`psql` scripts in `scripts/` (operator-run, not user-input-driven).

### 9.3 XSS

- React auto-escapes by default. `dangerouslySetInnerHTML` is used only for rendered
  markdown from trusted authors (article body) and is sanitized with an allowlist.
- The CSP header (§10) blocks inline scripts except for the nonce-allowed Next.js runtime.

### 9.4 SSRF

- Outbound HTTP (webhooks, AI calls) only goes to URLs in an allowlist (`AI_ENDPOINT`,
  `SMTP_HOST`, `S3_ENDPOINT`). User-supplied URLs are never fetched server-side.
- Image proxying (if added) must validate the target URL against an allowlist of hosts.

### 9.5 File paths

- User-supplied filenames are never used as filesystem paths. Uploads are stored in S3
  with a server-generated `cuid` key; the original filename is stored as metadata only.

---

## 10. Content Security Policy & Headers

Caddy injects the security headers (see `deploy/caddy/Caddyfile`):

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years |
| `X-Content-Type-Options` | `nosniff` | Block MIME sniffing |
| `X-Frame-Options` | `DENY` | Block clickjacking (no framing) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disable unused browser APIs |
| `Content-Security-Policy` | see below | Defense-in-depth against XSS |
| `Server` | (removed) | Don't leak server version |

### 10.1 CSP

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

> `'unsafe-inline'` and `'unsafe-eval'` are required for Next.js's runtime inline scripts
> and dev tools. A stricter policy with per-request nonces is planned for a future hardening
> pass (tracked in CHANGELOG.md).

### 10.2 Cookie attributes

Set by the application (`src/lib/auth.ts`), not Caddy:

- `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`.

---

## 11. Secrets Management

### 11.1 Where secrets live

- **Production:** `/etc/alaminn-info/env` (mode `0640`, owner `root:alaminn-info`).
  Loaded by systemd `EnvironmentFile=`. Never committed to git.
- **Local dev:** `.env` (gitignored). `.env.example` is committed with placeholder values.
- **CI:** injected via the CI provider's secret store; never written to logs.

### 11.2 Validation at boot

`src/lib/env.ts` validates every secret at startup. In production, the app **refuses to
start** if:

- `AUTH_SECRET` is missing or shorter than 32 bytes.
- `DATABASE_URL` is missing.
- `REDIS_URL` is missing.
- `EMAIL_FROM` is missing.
- `NEXT_PUBLIC_SITE_URL` is missing.

In development, missing secrets fall back to safe dev values with a `WARN` log.

### 11.3 Rotation

| Secret | Rotation frequency | Rotation procedure |
|---|---|---|
| `AUTH_SECRET` | On compromise or annually | Generate new, update env, restart services (logs out all users). |
| `CRON_SECRET` | On compromise | Generate new, update env + scheduler config, restart worker. |
| Database password | On compromise | `ALTER ROLE ... PASSWORD ...`, update env, restart services. |
| Redis password | On compromise | Edit `redis.conf`, update env, restart Redis + services. |
| S3 keys | On compromise or quarterly | Rotate via provider, update env, restart services. |
| SMTP password | On compromise | Rotate via provider, update env, restart services. |

### 11.4 Audit of secret access

`/etc/alaminn-info/env` is root-readable. Use `sudo` to read it; every `sudo` invocation
is logged by `sudo` itself and by `auditd` (if configured). Operators should review
`/var/log/auth.log` periodically.

---

## 12. File Upload Security

### 12.1 Allowlist

| Field | Allowed MIME | Max size | Storage |
|---|---|---|---|
| Article hero image | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | 5 MB | S3 |
| Resource attachment | `application/pdf` | 20 MB | S3 |
| Media library (admin) | images + pdf | 10 MB | S3 |
| Brand portrait | images only | 5 MB | S3 (fixed key) |

### 12.2 Validation pipeline

1. **MIME sniff** (not just the `Content-Type` header) using `file-type` or `sharp`'s
   metadata read. The declared MIME must match the sniffed magic bytes.
2. **Size check** before reading the body into memory (stream + abort on overflow).
3. **Filename sanitization:** the original filename is stored as metadata; the S3 key is
   `media/{YYYY}/{MM}/{cuid}` — no user-supplied path component.
4. **Image re-encoding:** uploaded images are re-encoded through `sharp` to strip EXIF,
   normalize orientation, and produce `webp` + `avif` derivatives. The original is not
   served publicly.
5. **Virus scan (optional):** if `CLAMAV_ENABLED=true`, the worker pipes the upload
   through `clamav` before making it publicly readable.

### 12.3 Serving

- Public media is served directly from S3 (or via a Caddy-signed-URL reverse proxy).
- Private media (user documents) requires a signed URL generated by the API after an RBAC
  check; signed URLs expire in 5 minutes.

---

## 13. Audit Logging

### 13.1 What is audited

Every privileged mutation writes an `AuditLog` row. Concretely:

- Auth: login, logout, failed login, MFA enable/disable, password change, session revoke.
- User management: create, update, delete, role assignment.
- Content: article/resource/project create, update, publish, delete.
- CRM: inquiry status change, opportunity stage change, contact delete.
- Higher Study / English Learning: create/update/delete on any entity, verify/publish
  actions, import jobs.
- Security: settings change, integration change, backup restore, secret rotation.
- AI: task create, approval decide (approve/reject/request-revision).

### 13.2 AuditLog shape

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  action     String   // e.g. "articles.create"
  actorId    String?  // userId, null for system/cron actions
  actorRole  String?
  targetType String?  // e.g. "Article"
  targetId   String?  // e.g. the article's cuid
  metadata   String?  // JSON string: { before, after, ipHash, userAgent }
  ipHash     String?  // SHA-256 of the actor's IP (truncated)
  severity   String   @default("info") // info | warning | critical
  createdAt  DateTime @default(now())
  @@index([actorId, createdAt])
  @@index([targetType, targetId])
  @@index([action, createdAt])
}
```

### 13.3 Tamper-evidence

- `AuditLog` rows are **append-only**. The API never exposes a `DELETE` or `PATCH` on
  audit logs. Direct DB deletes require `SUPER_ADMIN` shell access and are detectable via
  a daily `count(*)` integrity check (run by the `data-verification` scheduled job).
- `metadata` includes a `before`/`after` diff for mutations so reviewers can reconstruct
  the change.
- The `SECURITY_AUDITOR` role can export audit logs (read-only) for external analysis.

### 13.4 Retention

- Audit logs are retained **indefinitely** in the operational database.
- After 24 months, they are exported to S3 (parquet) and archived (cold storage). The
  rows remain in the DB for the foreseeable future; the archive is a backup, not a
  replacement.

---

## 14. Transport & Network Security

### 14.1 TLS

- Caddy terminates TLS with automatic Let's Encrypt certificates.
- TLS 1.2 and 1.3 only (Caddy default). TLS 1.0/1.1 disabled.
- HSTS preload (2-year max-age, includeSubDomains).
- Internal traffic (Caddy → Next.js, Next.js → PostgreSQL, Next.js → Redis) is over
  loopback (`127.0.0.1`) and is not TLS-encrypted. This is acceptable because the loopback
  interface is not network-accessible. If the deployment splits across hosts, enable TLS
  on PostgreSQL (`sslmode=require`) and Redis (TLS mode) and use HTTPS for the S3 endpoint.

### 14.2 Firewall

`ufw` rules (see **[DEPLOY.md](./DEPLOY.md)** §1):

- Allow inbound: `22/tcp` (SSH), `80/tcp`, `443/tcp`.
- Deny everything else by default.

### 14.3 SSH

- Password authentication disabled (`PasswordAuthentication no`).
- Root login disabled (`PermitRootLogin no`).
- Key-only authentication.
- `fail2ban` on SSH (5 failures → 1h ban).

### 14.4 Database

- PostgreSQL listens on `127.0.0.1` only (`listen_addresses = 'localhost'`).
- `pg_hba.conf` uses `scram-sha-256` for all non-local-socket connections.
- The `alaminn_info` role has minimal privileges: full CRUD on the `alaminn_info`
  database, no superuser, no `CREATEDB` (except for the initial setup), no replication.

### 14.5 Redis

- Redis listens on `127.0.0.1` only.
- `requirepass` set; the app authenticates with the password.
- `protected-mode yes`.

---

## 15. Vulnerability Disclosure

### 15.1 Reporting

Report security vulnerabilities to `security@your-domain.example`. Do **not** open a
public GitHub issue. Acknowledgement within 48 hours; fix or mitigation within 7 days
(severity-dependent).

### 15.2 Disclosure

Once a fix is released, a security advisory is published in `docs/CHANGELOG.md` and (for
high-severity issues) emailed to all admin users. The advisory includes: affected
versions, impact, mitigation, and upgrade path.

### 15.3 Dependency scanning

- `npm audit --omit=dev` runs in CI on every PR.
- High/critical vulnerabilities block the merge.
- Dependabot (or equivalent) opens PRs for outdated dependencies.
- `prisma` and `next` are kept on the latest minor within 7 days of release.

---

## Appendix A — Security Checklist (pre-launch)

- [ ] `AUTH_SECRET` is at least 32 bytes, generated with `openssl rand -hex 32`.
- [ ] `CRON_SECRET` is set and the scheduler uses it.
- [ ] `/etc/alaminn-info/env` is mode `0640`, owner `root:alaminn-info`.
- [ ] Default seeded admin password has been rotated.
- [ ] `ufw` enabled, only 22/80/443 open.
- [ ] SSH password auth disabled.
- [ ] `fail2ban` running.
- [ ] Caddy TLS certificate provisioned (HSTS header present).
- [ ] PostgreSQL `listen_addresses = 'localhost'`, `scram-sha-256` auth.
- [ ] Redis `requirepass` set, `protected-mode yes`.
- [ ] Backup timer running and a restore has been tested in staging.
- [ ] `npm audit` has no high/critical findings.
- [ ] CSP header present on a `curl -I` response.
- [ ] Rate limiting verified (10 rapid login attempts → 429).
- [ ] Audit log verified (login produces an `AuditLog` row).

---

## Appendix B — References

- **[ROLE-PERMISSION-MATRIX.md](./ROLE-PERMISSION-MATRIX.md)** — full RBAC matrix.
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** — secret variable reference.
- **[DEPLOY.md](./DEPLOY.md)** §8 — env file provisioning.
- **[OPERATIONS.md](./OPERATIONS.md)** §Logs — audit log queries.
- OWASP Top 10 (2021) — `https://owasp.org/Top10/`
- OWASP ASVS 4.0 — application security verification standard.
- NIST SP 800-63B — digital identity guidelines (passwords, MFA).
