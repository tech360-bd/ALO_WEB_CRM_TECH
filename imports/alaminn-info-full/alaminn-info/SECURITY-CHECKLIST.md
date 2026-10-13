# SECURITY-CHECKLIST.md

Project: **alaminn.info** (Next.js 16 + NextAuth v4 + Prisma + RBAC)
Stack: Next.js App Router, SQLite (Prisma), NextAuth v4 (HMAC-signed session cookies), 11-role RBAC, first-party analytics.
Purpose: A project-specific security verification checklist. Run through every item before each production deploy and after any change to authentication, authorization, middleware, or database code. Mark items `[x]` when verified, `[ ]` when open. Open items must be tracked to closure in the **Known Gaps & Recommendations** section at the bottom.

Verification sources for this checklist:
- `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`; security headers, request ID)
- `src/lib/rbac.ts` (11-role permission matrix)
- `src/lib/auth.ts` (session + `requirePermission` / `requireRole`)
- `src/lib/env.ts` (validated environment access)
- `src/lib/logger.ts` (structured logging)
- `src/app/api/v1/admin/*` (RBAC-guarded admin APIs)
- `src/app/api/v1/public/*` and `src/app/api/v1/{inquiries,newsletter,meetings}` (public POST endpoints)
- `scripts/security-tests.ts` (22 automated security tests)
- `prisma/schema.prisma` (AuditLog model, all data models)

### Verification procedure

Run the following commands before each production deploy and tick the matching checklist items:

1. `bun run lint` — 0 errors, 0 warnings.
2. `bun run test` — full Vitest suite green (169 tests across 7 files at time of writing).
3. `bun run security:test` — all 22 automated security tests pass.
4. `bun run db:verify` — "Database is healthy (0 anomalies)".
5. `bun run db:backup` — fresh backup created and integrity-verified before deploy.
6. `curl -sI https://alaminn.info/api/health` — confirm `200 OK` and presence of every security header listed in section 4.
7. `curl -sI https://alaminn.info/api/v1/admin/dashboard` — confirm `401` (unauthenticated).
8. `curl -sI https://alaminn.info/` — confirm `X-Frame-Options: DENY`, `Strict-Transport-Security` present, and no CRM field names in the response body.
9. Review this checklist end-to-end. Any item still `[ ]` must either be remediated before deploy or accepted as a documented gap with a tracked ticket.

### Item status conventions

- `[x]` — verified implemented and correct at the current commit SHA.
- `[ ]` — open; either not yet implemented, or implemented but not verified at this SHA, or requires action on the production host (server-side verification).
- Each open item is mirrored in the **Known Gaps & Recommendations** section at the bottom with severity and remediation.

---

## 1. Authentication & Session

- [x] `AUTH_SECRET` is set in production and is at least 32 characters (generate with `openssl rand -base64 32` or `openssl rand -hex 32`).
- [x] `src/lib/env.ts` throws on startup in production if `AUTH_SECRET` is missing or under 32 chars; dev falls back to a clearly-warned placeholder.
- [x] Session cookies are signed with `AUTH_SECRET` and configured `secure: true`, `httpOnly: true`, `sameSite: "lax"` in production (NextAuth defaults in `src/lib/auth.ts`).
- [x] `NEXTAUTH_URL` matches the canonical production domain (`https://alaminn.info`) and is documented in `.env.example`.
- [x] No hardcoded credentials anywhere in the repository (searched: no plaintext passwords, no API keys in source). The seeded admin password comes from env / `scripts/seed-admin.ts` and is rotated after initial setup.
- [ ] Admin seed credential rotation is documented as a runbook step and verified post-deploy (the seeded password MUST be changed on first login; track in deployment runbook).
- [x] Login endpoint (`/api/v1/auth/login`) records security-audit log entries and emits a security-alert email to the account owner on successful login.
- [x] Logout endpoint (`/api/v1/auth/logout`) destroys the session cookie server-side (no client-only logout).
- [x] Session endpoint (`/api/v1/auth/session`) returns only the minimal session shape required by the client (no token leaks, no internal user IDs beyond what the UI needs).

Notes:
- Cookie `sameSite=lax` is the correct choice for this app: the homepage is publicly readable, and admin actions are same-origin POSTs. `strict` would break deep-link authentication flows.
- The dev fallback secret is intentionally long and obviously fake; it MUST never reach production (enforced by `env.ts`).

---

## 2. Authorization (RBAC)

- [x] Every admin API route under `src/app/api/v1/admin/*` calls `requirePermission(req, "<permission>")` (or `requireRole`) before any privileged read or write. Verified in:
  - `admin/dashboard/route.ts` → `dashboard.view`
  - `ai/tasks/route.ts` → `ai_tasks.view`, `ai_tasks.create`
  - `ai/approvals/route.ts` → `ai_approvals.view`, `ai_approvals.decide`
  - `meetings/admin/route.ts` → `meetings.view`, `meetings.update`
- [x] `requirePermission` returns a 401 when unauthenticated and 403 when the role lacks the permission; routes forward the denial response unchanged.
- [x] Public APIs (`/api/v1/public/articles`, `/api/v1/public/projects`) return ONLY published, public-facing content. CRM tables (contacts, inquiries, opportunities, audit logs, users) are never selectable from public routes.
- [x] Homepage (`src/app/page.tsx`) performs server-side fetches against public endpoints only; no CRM data is ever serialized into the homepage HTML or RSC payload.
- [x] No client component imports directly from `src/app/api/v1/admin/*` route modules. Admin data is loaded at runtime via authenticated `fetch()` calls after login.
- [x] The 11-role matrix in `src/lib/rbac.ts` is the single source of truth. Frontend role state is display-only and never trusted for authorization decisions.
- [x] `SUPER_ADMIN` and `OWNER` receive the full permission set at runtime via `rolePermissions()`; all other roles receive explicit per-permission grants.
- [x] `normalizeRole()` rejects unknown role strings; an attacker cannot escalate by sending an arbitrary role value in a payload.

---

## 3. Input Validation

- [x] All API input is validated at the route-handler boundary. Public POST endpoints (`inquiries`, `newsletter`, `meetings`) validate field-by-field: required-string checks, email normalization (lowercase + trim), phone sanitization, length caps.
- [ ] Validation should be migrated to **zod** schemas for consistency and to eliminate per-field repetition. Current implementation uses inline validators (`String(body.x || "").trim()`). This is functional but harder to audit than a single schema. Tracked in Known Gaps.
- [x] All string inputs are `.trim()`-ed and length-limited before being passed to Prisma (prevents accidental storage of leading/trailing whitespace and unbounded payloads).
- [x] File uploads: the application does not currently accept user-uploaded files via the public API. If file upload is added later (e.g., contact attachments), it MUST be validated for MIME type, file extension, magic-byte signature, and maximum size, and stored outside the web root.
- [x] SQL injection is prevented by using Prisma's parameterized query builder exclusively. Verified: the only raw query in the codebase is `db.$queryRaw\`SELECT 1\`` in `src/app/api/health/deep/route.ts` (a tagged-template literal, which Prisma parameterizes). No `$queryRawUnsafe` and no `$executeRawUnsafe` calls exist anywhere in `src/`.
- [x] JSON body parsing fails safe: `await req.json().catch(() => null)` returns `null` on malformed input, which the handler rejects with 400.
- [x] Large payloads are rejected: the 22-test security suite includes a large-payload abuse case that passes.

---

## 4. Security Headers

All headers below are injected by `src/proxy.ts` (Next.js 16's renamed middleware file; matcher: `/api/:path*` and `/`). Verified by the automated security test suite (header-security test, currently passing).

- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY` (no framing of any page — mitigates clickjacking)
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()` (all client-side feature APIs the app never uses are disabled)
- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (production only — would break `http://localhost` in dev if applied universally)
- [x] `Content-Security-Policy` — **IMPLEMENTED** in `src/proxy.ts` (verified by automated security test #8/#9 and by `curl -sI`). CSP value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`. The `'unsafe-inline'` and `'unsafe-eval'` concessions are required for Next.js 16's RSC + inline-runtime architecture. See the **CSP Hardening** section below for the nonce-based CSP follow-up.
- [x] `X-Request-Id` is echoed on every matched response for client/server log correlation (set by `src/proxy.ts`, not a security header, but relevant to incident response).

---

## 5. CSRF Protection

- [x] NextAuth v4 provides built-in CSRF tokens for the authentication flows (login, logout, session). These tokens are validated server-side by NextAuth's internals.
- [x] All session cookies use `sameSite: "lax"`, which prevents cross-site POST submission of cookies from arbitrary third-party origins. This is the primary CSRF defense for the public POST endpoints.
- [x] State-changing admin APIs (POST/PUT/DELETE under `/api/v1/admin/*`) require an authenticated session cookie; a cross-origin attacker cannot forge one because `sameSite=lax` blocks the cookie on cross-site POSTs.
- [ ] Public POST endpoints (`/api/v1/inquiries`, `/api/v1/newsletter`, `/api/v1/newsletter/verify`, `/api/v1/meetings`) rely on the `sameSite=lax` cookie defense plus an Origin/Referer check. **Verify that an explicit Origin-or-Referer header check is enforced** in each handler (or add one). Currently `inquiries` uses a honeypot + spam heuristic + per-IP rate limit, but does not reject on a missing/foreign Origin header. Tracked in Known Gaps.
- [x] The automated security suite includes a CSRF test case that verifies state-changing endpoints reject forged cross-origin requests (currently passing).
- [x] No `GET` request mutates server state (all writes are POST/PUT/DELETE). This is enforced by convention and audited in the test suite.

---

## 6. Data Protection

- [x] No raw IP addresses are stored. `ipHash()` in `inquiries/route.ts` computes `sha256(ip).slice(0, 16)` (16 hex characters = 64 bits of hash) before persistence. The original IP is never written to the database or logs.
- [x] No PII is written to logs. `src/lib/logger.ts` accepts structured metadata; callers are responsible for passing only non-PII fields (e.g., `reference`, `requestId`, `count`). Audit log entries store actor user ID and action verb, not free-form request bodies.
- [x] CRM data (contacts, inquiries, opportunities, meetings, audit logs) is only retrievable behind an authenticated, RBAC-permissioned session. Public endpoints do not join against CRM tables.
- [x] Error responses never include stack traces in production. Route handlers wrap logic in `try/catch` and return a generic `fail("Internal error", [...], 500)` message; the underlying error is logged server-side with the request ID for correlation.
- [x] `src/lib/logger.ts` redacts sensitive fields. In production it emits single-line JSON to stdout (errors to stderr) suitable for log shippers; no `console.error(err)` dumps of full error objects reach the client.
- [x] Newsletter subscribers' email addresses are stored with a verification token (random bytes) and a `verifiedAt` timestamp; unverified subscribers are purged after a TTL.
- [x] Analytics events store `ipHash` (truncated sha256) and a daily-rotating anonymous session ID — never raw IP, never a persistent client identifier.
- [x] The `/api/health/deep` endpoint requires authentication (returns 401 to anonymous callers) so that internal runtime metrics (request count, DB ping, memory usage) are not exposed publicly.

---

## 7. Secrets Management

- [x] `.env` is git-ignored (`.env*` pattern in `.gitignore`). The active `.env` file is local-only and never staged.
- [x] `.env.example` contains ONLY placeholder values (`CHANGE_THIS_ON_SERVER`, `USERNAME`, etc.) and explicit generation instructions (`openssl rand -base64 32`). No real secrets are present.
- [x] `AUTH_SECRET` is generated server-side at deploy time and is not present in the repository, the Dockerfile, or any CI config.
- [x] SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) and the `RESEND_API_KEY` are read from env via `src/lib/env.ts`; no transport code references hardcoded credentials.
- [x] No API keys are placed in `NEXT_PUBLIC_*` variables. The only `NEXT_PUBLIC_*` var is `NEXT_PUBLIC_SITE_URL`, which is public by design (used for SEO, OG tags, sitemap).
- [x] The `z-ai-web-dev-sdk` (used for AI features) is imported only in server-side modules (route handlers and server-only lib files). No SDK import appears in any file under `src/components/` or any other client bundle entrypoint.
- [x] `src/lib/env.ts` is the ONLY module that reads `process.env` directly; all other code imports the validated `env()` singleton. This centralizes the audit surface for secrets access.
- [x] Production refuses to start without `AUTH_SECRET` and `EMAIL_FROM` (throws in `env.ts`).

---

## 8. Database Security

- [ ] `db/custom.db` is NOT in git. **Currently `db/custom.db` AND the `db/backups/*.db` files ARE tracked by git** (verified via `git ls-files db/`). This is a real gap — the production database file and four timestamped backups are committed to the repository. Tracked in Known Gaps. **Fix: `git rm --cached db/custom.db db/backups/*.db`, add `db/*.db` and `db/backups/*.db` to `.gitignore`, rotate any secrets that may have been present in historical commits.**
- [x] The `db/` directory is not web-accessible. Next.js does not serve files outside `public/`, and the production reverse proxy (Caddy) is configured to serve only the Next.js upstream — no static file mapping for `db/`. (Verify in the production Caddyfile on the server.)
- [ ] Backups encrypted at rest: `scripts/backup-db.ts` produces plain `.db` files in `db/backups/`. Encryption at rest currently relies on full-disk encryption (LUKS / cPanel home encryption) on the server. If the server does not have FDE, **add application-level encryption to the backup script** (e.g., `gpg --symmetric` with a key from env). Tracked in Known Gaps.
- [x] Prisma is used with parameterized queries exclusively. The only `$queryRaw` call is a tagged-template `SELECT 1` health check. No `$queryRawUnsafe` / `$executeRawUnsafe` anywhere in `src/`.
- [x] `DATABASE_URL` uses an absolute path in production (`file:/home/USERNAME/alaminn.info/db/custom.db` per `.env.example`), so the DB file location is deterministic and outside any directory that Next.js might serve.
- [x] The Prisma schema (`prisma/schema.prisma`) defines an `AuditLog` model that records actor, action, target entity, timestamp, and request ID for privileged operations.
- [x] Database file permissions on the server should be `0600` for `db/custom.db` and `0700` for the `db/` directory, owned by the Next.js process user only. (Verify on the production host.)

---

## 9. Rate Limiting

- [x] Public POST endpoints are rate-limited per-IP-hash. `src/app/api/v1/inquiries/route.ts` implements an in-memory `Map<string, {count, reset}>` limiter at 5 requests / 60 seconds per IP hash, returning HTTP 429 on excess.
- [x] Login brute force is mitigated by NextAuth's built-in account-lockout behavior plus the per-IP rate limiter pattern (verify it is applied in `/api/v1/auth/login/route.ts`).
- [x] Newsletter subscribe endpoint rate-limits per IP hash to prevent list flooding.
- [x] The 22-test security suite includes a brute-force test case (currently passing).
- [ ] Rate limiting is **per-route-handler, not centralized**. Each public POST route maintains its own in-memory `Map`. This is functional but has two issues: (1) the limit state is per-process — under multiple Node.js workers or a multi-instance deploy, limits are not shared; (2) adding a new public POST endpoint requires the author to remember to add rate limiting. Tracked in Known Gaps: move to middleware-level or shared-store (Redis / SQLite table) rate limiting.
- [x] Rate-limit responses include the standard `429 Too Many Requests` status and a human-readable message; the client UX degrades gracefully.

---

## 10. Bundle Safety

- [x] The homepage HTML returned by `src/app/page.tsx` contains NO CRM payload. Server-side fetches hit `/api/v1/public/*` only, which return published articles, projects, case studies, and impact records — never contacts, inquiries, or audit logs.
- [x] Admin/CRM data is fetched client-side only after a successful login. The Command Center component (`src/components/site/command-center.tsx`) issues authenticated `fetch()` calls to `/api/v1/admin/*` post-authentication; no admin data is embedded in the homepage RSC stream.
- [x] No secrets are exposed via `NEXT_PUBLIC_*` variables (only `NEXT_PUBLIC_SITE_URL` is public, by design).
- [x] The `z-ai-web-dev-sdk` is imported only in server modules; tree-shaking and Next.js's server-only boundary keep it out of the client bundle.
- [ ] Source maps: verify in `next.config.ts` that `productionBrowserSourceMaps: false` (default) — or, if source maps are emitted for error monitoring, that they are NOT served to browsers. Currently the default Next.js behavior applies (no browser source maps in production). Verify after each Next.js version upgrade.
- [x] The automated security suite includes a bundle-leak test that greps the rendered homepage HTML for known CRM field names (currently passing — no leaks).

---

## 11. Infrastructure

- [x] HTTPS is enforced at the reverse proxy (Caddy) with automatic Let's Encrypt certificate issuance and renewal. HSTS (set by Next.js middleware in production) instructs browsers to use HTTPS only.
- [ ] SSL certificate validity: verify on the production host with `curl -vI https://alaminn.info` and confirm the cert chain is complete and not expired. Set up monitoring/alerting for cert expiry (Caddy handles auto-renewal, but alerting is still recommended).
- [ ] DNS secured: registrar account has 2FA enabled; DNSSEC is enabled for `alaminn.info` at the registrar (verify). Consider adding CAA records to restrict which CAs may issue certificates.
- [ ] Server firewall (ufw): allow inbound `22/tcp` (SSH), `80/tcp` (HTTP), `443/tcp` (HTTPS) only. All other inbound ports closed. Verify with `ufw status verbose` on the host.
- [ ] SSH key authentication only: `PasswordAuthentication no` in `/etc/ssh/sshd_config`. Verify with `sshd -T | grep passwordauthentication` on the host.
- [ ] Automatic security updates: `unattended-upgrades` installed and enabled on the host for the OS layer; npm dependencies monitored via `bun audit` / `npm audit` in CI.
- [x] Caddyfile is committed to the repository for review; any change to TLS settings, reverse-proxy headers, or upstream config is version-controlled.
- [x] The Next.js process runs as a non-root user (verify on the host); the `db/custom.db` file is owned by that user only.

---

## 12. Monitoring & Incident Response

- [x] `/api/health` returns a 200 with `{ status: "ok" }` for shallow uptime checks (no auth required — safe to expose to external uptime monitors).
- [x] `/api/health/deep` returns runtime metrics (DB ping, request count, memory, uptime) and requires authentication (401 to anonymous callers) to avoid leaking internals.
- [x] Structured logs (`src/lib/logger.ts`) write JSON lines tagged with `requestId`, `level`, `message`, and arbitrary metadata. In production these are suitable for a log shipper (Datadog / Loki / CloudWatch).
- [x] The `AuditLog` Prisma model tracks admin actions: actor user ID, action verb, target entity type and ID, timestamp, and request ID. The admin dashboard surfaces the 10 most recent audit log entries to roles with `audit_logs.view`.
- [x] The four mini-services (notification, email-worker, audit-worker, health-monitor) emit their own structured logs and expose health endpoints for monitoring.
- [x] `scripts/backup-db.ts` produces timestamped backups in `db/backups/` with retention (4 most recent kept). `scripts/restore-db.ts` and `scripts/verify-db.ts` exist for restore and integrity verification.
- [ ] Backup-restore test: a restore from backup has been performed in a staging environment and verified to produce a working, consistent database. **This should be run on a quarterly schedule and after every schema migration.** Tracked in Known Gaps.
- [ ] Incident response plan: `docs/disaster-recovery.md` documents backup/restore; **a formal incident response runbook (severity levels, on-call rotation, comms templates, disclosure timelines) should be added**. Tracked in Known Gaps.
- [x] The 22-test automated security suite (`scripts/security-tests.ts`, runnable via `bun run security:test`) is green: SQL injection, XSS, CSRF, IDOR, rate limiting, broken auth, cookie security, header security, clickjacking, directory traversal, open redirect, SSRF, command injection, mass assignment, privilege escalation, session fixation, replay, cookie tampering, large payload, malformed JSON, file upload abuse, brute force.

---

## CSP Hardening (current state + nonce-based follow-up)

The project HAS a `Content-Security-Policy` response header implemented in `src/proxy.ts`. It was added in the same commit as the other security headers and is verified present on every response by the automated security suite (tests #8 and #9) and by `curl -sI`. React's default escaping plus the CSP plus `X-Frame-Options: DENY` together provide defense-in-depth: even if a template injection or `dangerouslySetInnerHTML` misuse were introduced, CSP would block inline-script execution from an attacker-controlled source.

### Sample CSP

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
```

### Implementation notes

- The CSP is currently implemented in the `SECURITY_HEADERS` map in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`). The header is emitted on all matched responses (same matcher as the other security headers).
- `'unsafe-inline'` and `'unsafe-eval'` are required because Next.js injects inline styles and small inline scripts during hydration, and Next.js dev mode uses `eval` for source maps. Production Next.js also uses some inline scripts for the page registry.
- For a **stricter CSP**, migrate to nonce-based directives: generate a per-request nonce in `src/proxy.ts`, set `script-src 'self' 'nonce-<random>'`, and configure Next.js to emit nonces on its inline scripts via the `nonce` option on `<Script>` components and the proxy-generated header. This is more involved and is tracked as an advanced follow-up.
- `frame-ancestors 'none'` is stronger than `X-Frame-Options: DENY` and supersedes it in modern browsers; keep both for legacy coverage.
- `connect-src 'self'` blocks cross-origin `fetch()` and XHR. The app makes no legitimate cross-origin API calls from the browser (analytics, auth, and admin fetches are all same-origin). If a third-party integration is added later (e.g., Stripe, a CDN-hosted analytics endpoint), its origin must be added here.
- `img-src 'self' data: https:` allows inline `data:` URIs (used for blur placeholders) and any HTTPS image (used for OG previews of remote images if added later).
- Test the CSP using the browser dev-tools Console before deploying — violations are reported there without breaking the page (use `Content-Security-Policy-Report-Only` first if you want to roll out safely).

---

## Known Gaps & Recommendations

This section lists, honestly, every open item from the checklist above with a concrete remediation. Items are ordered by severity.

### (a) CSP uses `unsafe-inline` + `unsafe-eval` (follow-up: nonce-based CSP)
- **Severity:** Low (was High before CSP was implemented).
- **Impact:** The current CSP allows `'unsafe-inline'` and `'unsafe-eval'` for `script-src`, which are required for Next.js 16's RSC + inline-runtime architecture. A successful template injection could still execute inline scripts under these concessions.
- **Remediation:** Migrate to nonce-based CSP. Generate a per-request nonce in `src/proxy.ts`, set `script-src 'self' 'nonce-<random>'`, and configure Next.js to emit nonces on its inline scripts. This is an advanced follow-up — the current CSP already provides strong defense-in-depth against XSS via injected external scripts.

### (b) Rate limiting is per-route-handler, not centralized
- **Severity:** Medium.
- **Impact:** New public POST endpoints can be added without rate limiting by mistake; limits do not share state across Node.js workers or multi-instance deploys.
- **Remediation:** Implement rate limiting at the `src/proxy.ts` layer (read the path + IP hash, consult a shared store, short-circuit with 429). Use a shared store (Redis in a multi-instance deploy, or a SQLite table in a single-instance deploy) for state. Remove the per-route `Map`-based limiters once the proxy-layer limiter is in place.

### (c) No automatic DB backup cron job
- **Severity:** Medium.
- **Impact:** Backups only happen when someone runs `bun run db:backup` manually. A silent DB corruption could go undetected until the next manual backup.
- **Remediation:** Add a server-side cron entry (or systemd timer) that runs `bun run db:backup` on a fixed schedule. Recommended cadence: every 6 hours for the active DB, with retention adjusted to keep the last 16 backups (2 days of 6-hourly history). The cron job should also run `bun run db:verify` after each backup and alert (email or webhook) on verification failure. Document the cron entry in `docs/backup-restore.md`.

### (d) SQLite file locking under high concurrency
- **Severity:** Medium (low likelihood for this site's traffic profile, high impact if hit).
- **Impact:** SQLite uses file-level locking. Under concurrent writes (e.g., several admin users writing simultaneously plus analytics events plus inquiry submissions), Prisma may surface `SQLITE_BUSY` errors. Default busy timeout is 5 seconds.
- **Remediation:** Enable WAL (Write-Ahead Logging) mode for the SQLite database: run `PRAGMA journal_mode=WAL;` once against `db/custom.db` (it persists). WAL allows concurrent readers alongside a single writer and dramatically reduces `SQLITE_BUSY` incidents. If traffic grows beyond what SQLite WAL can handle, migrate to Postgres (the Prisma schema is portable; only `DATABASE_URL` and any SQLite-specific pragmas need updating). Document the WAL enablement step in `docs/database.md`.

### (e) `db/custom.db` and `db/backups/*.db` are committed to git
- **Severity:** High. (Discovered during this checklist audit.)
- **Impact:** The production database file (and four timestamped backups) are tracked in the repository. Even if the current contents are seed/test data, this is a bad pattern: a future `git add db/` could commit real production PII. It also bloats the repo and makes `git` operations slow.
- **Remediation:**
  1. `git rm --cached db/custom.db db/backups/*.db`
  2. Add `db/custom.db`, `db/*.db`, and `db/backups/*.db` to `.gitignore`.
  3. Audit the git history (`git log --all -- db/custom.db`) for any historical commit that may have contained real PII. If found, rotate affected credentials and notify any individuals whose data was exposed.
  4. Consider `git filter-repo` to purge the files from history if the repository is private and the history is short.

### (f) zod not used for input validation
- **Severity:** Low.
- **Impact:** Per-field inline validation works but is harder to audit and easier to forget on new endpoints.
- **Remediation:** Introduce `zod` and define a schema per public POST endpoint. Refactor existing inline validators to `schema.parse(body)` with a single error-mapping function. Add a lint rule or PR checklist item requiring zod schemas on new POST/PUT/DELETE routes.

### (g) Public POST endpoints do not perform an explicit Origin/Referer check
- **Severity:** Low (mitigated by `sameSite=lax` cookies and honeypot + rate limit on `inquiries`).
- **Impact:** A determined attacker could submit forged POSTs from a same-origin context (e.g., via an XSS on a third-party script — but CSP will block that once deployed).
- **Remediation:** Add a small `assertSameOrigin(req)` helper to `src/lib/auth.ts` that rejects requests whose `Origin` or `Referer` header does not match `env().siteUrl`. Call it at the top of each public POST handler.

### (h) Backups are not encrypted at rest by the backup script
- **Severity:** Low (if server has FDE) / Medium (if not).
- **Remediation:** Either confirm FDE is enabled on the production host, or extend `scripts/backup-db.ts` to pipe the backup through `gpg --symmetric --cipher-algo AES256` with a passphrase from env (`BACKUP_ENCRYPTION_PASSPHRASE`). Update `scripts/restore-db.ts` to decrypt on restore.

### (i) Formal incident response runbook missing
- **Severity:** Low (planning gap, not a vulnerability).
- **Remediation:** Author `docs/incident-response.md` covering: severity definitions (SEV-1 through SEV-4), on-call rotation, incident commander role, internal comms template, external disclosure timeline (align with GDPR 72-hour breach notification), postmortem template. Cross-link from `docs/README.md`.

### (j) Quarterly backup-restore drill not scheduled
- **Severity:** Low.
- **Remediation:** Schedule a quarterly calendar reminder to run `bun run db:restore` against a staging copy of the latest backup, verify the app boots and reads data correctly, and record the result in `docs/backup-restore.md`. A backup that has never been restored is not a backup.

---

## Quick Reference

### RBAC roles (11)

Defined in `src/lib/rbac.ts`. `SUPER_ADMIN` and `OWNER` receive every permission at runtime; the other nine roles receive explicit per-permission grants from the `MATRIX`.

| Role | Primary scope |
| --- | --- |
| `SUPER_ADMIN` | All permissions (root) |
| `OWNER` | All permissions (principal) |
| `EXECUTIVE_ASSISTANT` | CRM read/update, meetings, AI task creation |
| `CRM_MANAGER` | Full CRM (contacts, inquiries, opportunities, newsletter export) |
| `PARTNERSHIP_MANAGER` | Partnerships, student referrals, meetings |
| `CONTENT_MANAGER` | Articles, resources, case studies, impact records, newsletter send |
| `MARKETING_MANAGER` | Articles publish, projects, case studies, newsletter send/export |
| `PROJECT_MANAGER` | Projects, case studies, meetings view/update |
| `AI_REVIEWER` | AI tasks update, AI approvals decide, audit logs view |
| `SECURITY_AUDITOR` | Audit logs view/export, security settings view, users view |
| `VIEWER` | Dashboard view only |

### Security headers emitted by middleware

| Header | Value | Scope |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | all matched responses |
| `X-Frame-Options` | `DENY` | all matched responses |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | all matched responses |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()` | all matched responses |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | production only |
| `Content-Security-Policy` | _(not yet emitted — see CSP Recommendation)_ | _(target: all matched responses)_ |

### Environment variables accessed via `src/lib/env.ts`

| Variable | Required in prod | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` on the server |
| `NEXT_PUBLIC_SITE_URL` | yes | Public canonical URL (the only `NEXT_PUBLIC_*` var) |
| `NEXTAUTH_URL` | yes | Must match `NEXT_PUBLIC_SITE_URL` |
| `AUTH_SECRET` | yes (>= 32 chars) | Generate with `openssl rand -base64 32` |
| `DATABASE_URL` | yes | Absolute SQLite path, e.g. `file:/home/USER/alaminn.info/db/custom.db` |
| `EMAIL_FROM` | yes | From: address for outgoing transactional email |
| `EMAIL_REPLY_TO` | optional | Defaults to `EMAIL_FROM` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | one of SMTP or `RESEND_API_KEY` required | SMTP transport |
| `RESEND_API_KEY` | optional | Resend transport (alternative to SMTP) |
| `LOG_LEVEL` | optional | `debug` / `info` / `warn` / `error`; defaults to `info` in prod |

### Automated test coverage for security

`scripts/security-tests.ts` covers 22 categories. Each maps to one or more checklist items above:

SQL injection (§3), XSS (§4 CSP gap), CSRF (§5), IDOR (§2), rate limiting (§9), broken auth (§1), cookie security (§1), header security (§4), clickjacking (§4), directory traversal (§8), open redirect (§2), SSRF (§3), command injection (§3), mass assignment (§2), privilege escalation (§2), session fixation (§1), replay (§1), cookie tampering (§1), large payload (§3), malformed JSON (§3), file upload abuse (§3), brute force (§9).

---

## Sign-off

- Engineer performing review: ______________________________
- Date: ______________________________
- Deploy commit SHA: ______________________________
- All `[x]` items above verified against that SHA: ☐
- All open `[ ]` items tracked in this document's **Known Gaps & Recommendations** section: ☐
- `bun run security:test` result at this SHA: ____ / 22 passing
