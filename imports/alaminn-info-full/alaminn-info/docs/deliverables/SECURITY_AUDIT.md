# SECURITY_AUDIT.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Security Audit & Controls Reference |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Document every security control in place on Alaminn.info, the source file that implements it, known caveats, and how to verify each control is active in production. |

---

## Executive summary

Alaminn.info implements a **defense-in-depth** security posture across seven layers:

1. **Authentication** — custom HMAC-SHA256 session cookies (NOT NextAuth), scrypt password hashing, 8-hour session TTL.
2. **Authorization** — RBAC with 11 roles and 100+ permissions, enforced server-side on every privileged API route.
3. **Request-level protection** — CSRF (SameSite cookies), rate limiting, honeypot fields, security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy).
4. **Input validation** — Zod schemas on every API body, query, and param.
5. **Secure cookies** — HttpOnly, Secure in prod, SameSite=Lax.
6. **File & directory protection** — `.htaccess` deny rules for dotfiles, configs, source maps, internal directories; private upload storage outside `public_html`.
7. **Audit & observability** — AuditLog model records every privileged action; production errors are generic (no stack traces).

---

## 1. Authentication — custom HMAC-SHA256 session cookies

### Implementation

**File**: `src/lib/auth.ts`

Alaminn.info does **NOT** use NextAuth (despite the `NEXTAUTH_URL` env var name — that var is an alias for the site URL, kept for backward compat). Instead, a custom auth system implements:

| Component | Implementation |
|---|---|
| **Password hashing** | `scrypt` (Node `crypto.scryptSync`) with per-user random 16-byte salt, N=16384, r=8, p=1, maxmem=32MB. Output: 64-byte hash. Stored as `scrypt$<salt-hex>$<hash-hex>`. |
| **Password verification** | Re-derives the hash with the stored salt and compares with `crypto.timingSafeEqual` (constant-time, prevents timing attacks). |
| **Session cookie** | `<userId>.<role>.<expiresAtEpochSec>` signed with HMAC-SHA256 using `AUTH_SECRET` (env, ≥ 32 bytes). Cookie name: `alaminn_session`. |
| **Session TTL** | 8 hours (`SESSION_TTL_SEC = 60 * 60 * 8`). |
| **Cookie attributes** | `httpOnly: true` (no JS access), `secure: production` (HTTPS only in prod), `sameSite: "lax"` (CSRF defense), `path: "/"`, `maxAge: SESSION_TTL_SEC`. |
| **Signature verification** | Re-computes HMAC of the payload, compares with the provided signature via `timingSafeEqual`. Any tampering with userId / role / expiry invalidates the session. |
| **Login rate limiting** | Per-IP lockout after 5 failed attempts within 15 minutes (lockout for 15 min). |
| **Last-login tracking** | `User.lastLoginAt` updated on every successful login. |

### Verification

```bash
# Verify password hashing is scrypt (not bcrypt, not argon2)
grep -n "scryptSync\|scrypt\$" src/lib/auth.ts

# Verify session cookie attributes
grep -n "httpOnly\|secure\|sameSite" src/lib/auth.ts

# Verify AUTH_SECRET is set in production
grep AUTH_SECRET ~/alaminn.info/.env
# Expect: AUTH_SECRET=<64-hex-chars>
```

### Why NOT NextAuth?

- Custom auth gives full control over the session format, TTL, and cookie attributes.
- No dependency on NextAuth's database adapters (which would require a separate `next-auth` table).
- The 11-role RBAC fits naturally into the session payload (`<userId>.<role>.<expiresAt>`).
- HMAC-SHA256 is simpler to audit than NextAuth's JWT + JWE flow.

---

## 2. Authorization — RBAC with 11 roles + 100+ permissions

### Implementation

**File**: `src/lib/rbac.ts`

### The 11 roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full access. Can manage users, roles, settings. |
| `OWNER` | Al Aminn himself. Full access except user role management. |
| `EXECUTIVE_ASSISTANT` | Manages Al Aminn's calendar, inquiries, meetings. |
| `CRM_MANAGER` | Manages contacts, inquiries, opportunities, partnerships. |
| `PARTNERSHIP_MANAGER` | Manages organizations, partnerships. |
| `CONTENT_MANAGER` | Manages articles, resources, projects, case studies. |
| `MARKETING_MANAGER` | Manages newsletter, marketing campaigns. |
| `PROJECT_MANAGER` | Manages projects, tasks. |
| `AI_REVIEWER` | Reviews and approves/rejects AI task outputs. |
| `SECURITY_AUDITOR` | Read-only access to audit logs, security settings. |
| `VIEWER` | Read-only access to dashboard. |

### Permission matrix

Permissions are namespaced `<resource>.<action>` (e.g. `contacts.view`, `contacts.create`, `contacts.update`, `contacts.delete`, `contacts.export`). The full list includes 100+ permissions across:

- Dashboard (`dashboard.view`)
- CRM (contacts, inquiries, opportunities, meetings — view/create/update/delete/export)
- AI Workspace (ai_tasks, ai_approvals — view/create/update/delete/decide)
- Content (articles, resources, projects, case_studies, impact_records — view/create/update/publish/delete)
- Newsletter (subscribers — view/create/update/delete/export)
- Users (view/create/update/delete/role-assign)
- Settings (view/update)
- Audit logs (view)
- Higher Study admin (universities, courses, scholarships, research, supervisors, resources, intakes, subjects, cities, countries, events, import jobs, student stories, alerts, referrals, audit logs — view/create/update/delete/publish/verify/import)
- English Learning admin (courses, lessons, practice tests, questions, tutors, resources, referrals, audit logs — view/create/update/delete/publish)

### Server-side enforcement

Every privileged API route calls `requirePermission("<resource>.<action>")` or `requireRole([...roles])` BEFORE any business logic. The frontend role state is NEVER trusted.

### Verification

```bash
# Count permissions in the matrix
grep -c '"\.' src/lib/rbac.ts  # rough count of permission strings

# Verify a sample admin route enforces permission
grep -n "requirePermission\|requireRole" src/app/api/v1/admin/contacts/route.ts
# Expect: a call to requirePermission("contacts.view") or similar
```

---

## 3. Request-level protection

### CSRF protection

**Mechanism**: `SameSite=Lax` session cookies.

`SameSite=Lax` blocks cookies from being sent on cross-site POST requests (the primary CSRF vector). Form submissions from `alaminn.info` to `alaminn.info` work normally; cross-site form submissions (e.g. from `evil.com`) are blocked.

> The app does NOT use CSRF tokens. `SameSite=Lax` is the modern, simpler CSRF defense recommended by OWASP as of 2024.

### Rate limiting

**Implementation**: in-memory `Map<key, {count, reset}>` per route.

| Surface | Limit | Window |
|---|---|---|
| Inquiry form submission (`POST /api/v1/inquiries`) | 5 per IP | 60 seconds |
| Newsletter signup (`POST /api/v1/newsletter`) | 5 per IP | 60 seconds |
| Login (`POST /api/v1/auth/login`) | 5 per IP | 15 minutes (lockout for 15 min after 5 fails) |
| Higher Study referral (`POST /api/v1/higher-study/referral`) | 20 per IP | 60 seconds |
| English Learning referral (`POST /api/v1/english-learning/referral`) | 20 per IP | 60 seconds |
| Newsletter verify (`GET /api/v1/newsletter/verify`) | 30 per IP | 60 seconds |
| Meeting request (`POST /api/v1/meetings`) | 30 per IP | 60 seconds |

> **Caveat**: in-memory rate limiting is per-process. On cPanel with a single Passenger process, this is effective. On a multi-process deployment (PM2 cluster), use a shared store (Redis) instead.

### Honeypot fields

Inquiry forms include hidden honeypot fields (e.g. `website`, `company_url`) that are visually hidden via CSS. Bots fill them in; humans don't. If a honeypot field is non-empty, the submission is silently rejected with a 200 (to not alert the bot).

### Security headers (in `src/proxy.ts`)

**File**: `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`).

The proxy injects these headers on EVERY response:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing (browsers honoring Content-Type strictly). |
| `X-Frame-Options` | `DENY` | Prevents clickjacking — page cannot be embedded in an iframe. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full referrer only on same-origin; sends origin only on cross-origin HTTPS; sends nothing on HTTPS→HTTP. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()` | Disables browser features the app never uses. |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests` | Restricts resource loading to prevent XSS, data exfiltration, clickjacking. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (production only) | Forces HTTPS for 2 years. NOT sent in dev (would break localhost). |

### Verification

```bash
# Verify security headers in production
curl -sI https://alaminn.info | grep -iE 'x-content-type|x-frame|referrer|permissions|content-security|strict-transport'

# Verify CSP is restrictive
curl -sI https://alaminn.info | grep -i content-security-policy
# Expect: default-src 'self'; ... frame-ancestors 'none' ...
```

---

## 4. Input validation — Zod schemas

**Library**: `zod` (via `@hookform/resolvers` for forms; direct import in API routes).

Every API route validates its input via Zod:

- **Body**: `BodySchema.parse(await req.json())` — throws `ZodError` on invalid input, returning 400 with structured errors.
- **Query params**: `QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))`.
- **Path params**: validated inline or via a `ParamsSchema`.

### Example (inquiry submission)

```typescript
const InquiryBodySchema = z.object({
  type: z.enum([
    "university-partnership", "business-consultation", "operations-review",
    "sales-strategy", "education-advisory", "ai-automation",
    "crm-digital", "tech-collaboration", "personal-branding",
    "speaking", "media", "student-referral", "other"
  ]),
  contact: z.object({
    fullName: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    // ...
  }),
  // ...
  privacyConsent: z.boolean().refine(v => v === true, "Privacy consent required"),
  commsConsent: z.boolean(),
  marketingConsent: z.boolean(),
});

const body = InquiryBodySchema.parse(await req.json());
```

### Why Zod?

- TypeScript-native (infers types from schemas).
- Rejects unknown keys by default (prevents mass assignment).
- Composable (nested objects, enums, refinements).
- Used in both client (react-hook-form) and server — single source of truth.

---

## 5. Secure cookies

| Attribute | Value | Why |
|---|---|---|
| `httpOnly` | `true` | JavaScript cannot read the cookie (prevents XSS-based session theft). |
| `secure` | `true` in production, `false` in dev | Cookie only sent over HTTPS in prod. |
| `sameSite` | `lax` | CSRF defense (see §3). |
| `path` | `/` | Cookie sent on all paths. |
| `maxAge` | `28800` (8 hours) | Matches session TTL. |

### Verification

```bash
# Inspect the session cookie in production
curl -sI -X POST https://alaminn.info/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alaminn.info","password":"..."}' \
  | grep -i set-cookie
# Expect: Set-Cookie: alaminn_session=<signed-token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800
```

---

## 6. Session expiration & brute-force protection

### Session expiration

- Session TTL: 8 hours (configurable via `SESSION_TTL_SEC` in `src/lib/auth.ts`).
- The session payload includes `expiresAt` (epoch sec).
- `getSession()` checks `expiresAt < now()` and returns `null` if expired.
- The cookie `maxAge` matches, so the browser deletes the cookie at expiry.

### Brute-force protection

- Per-IP login lockout: 5 failed attempts within 15 minutes → lockout for 15 minutes.
- Lockout is tracked in-memory (per-process).
- After lockout expires, the counter resets.
- Successful login resets the counter.

### Verification

```bash
# Trigger the lockout (run 6 times with wrong password)
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://alaminn.info/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@alaminn.info","password":"wrong"}'
done
# Expect: 401, 401, 401, 401, 401, 429 (Too Many Requests)
```

---

## 7. File & directory protection

### `.htaccess` deny rules

**Files**:
- `public/.htaccess` — file-type denylist + headers + caching
- `.htaccess` (project root) — config file + directory blocks
- `storage/.htaccess` — `Require all denied`
- `db/.htaccess` — `Require all denied`
- `docs/.htaccess` — `Require all denied`

### What's blocked

| Pattern | Rule | Why |
|---|---|---|
| Dotfiles (`.env`, `.git`, `.htaccess` itself) | `RedirectMatch 403 /\.(?!well-known/)` | Secrets and config never leak. |
| Source maps (`*.map`) | `RedirectMatch 403 \.map$` | Maps expose source code structure. |
| Backup files (`*.bak`, `*.old`, `*.swp`) | `RedirectMatch 403 /\.(bak|old|orig|swp|save|tmp)$` | Editors' backup files contain source. |
| SQL dumps (`*.sql`) | `RedirectMatch 403 \.sql$` | DB dumps contain data. |
| Archives (`*.zip`, `*.tar.gz`, `*.tgz`) | `RedirectMatch 403 /\.(zip|tar|gz|tgz|rar|7z)$` | Archives may contain source or data. |
| Log files (`*.log`) | `RedirectMatch 403 \.log$` | Logs may contain secrets/errors. |
| TS/JSX source | `RedirectMatch 403 \.(ts|tsx|jsx)$` | Server-side source never served. |
| Config files (`package.json`, `tsconfig.json`, etc.) | `<FilesMatch>` block | Project metadata never served. |
| `server.js` source | `<Files server.js>` block | Passenger reads it; browsers shouldn't. |
| Internal directories (`prisma/`, `src/`, `scripts/`, `tests/`, `docs/`, `mini-services/`, `deploy/`, `storage/`, `node_modules/`, `.next/`, `db/`) | `mod_rewrite 403` | Internal directories never served. |

### Options

- `Options -Indexes` — disables directory listing (no auto-generated file indexes).
- `ServerSignature Off` — hides Apache version on error pages.

### Private upload storage

Uploads (if any) are stored at `/home/aloeduca/alaminn.info/storage/uploads/` — OUTSIDE `public_html`. They are never directly web-accessible. Access is mediated via an authenticated API route that streams the file with the correct Content-Type.

### Verification

```bash
# Each of these should return 403 Forbidden:
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.env
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/package.json
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/server.js
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/prisma/schema.prisma
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/src/lib/auth.ts
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/scripts/backup.sh
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.git/config
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/storage/backups/

# Each of these should return 200:
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/api/health
```

---

## 8. File-signature validation (uploads)

If file uploads are enabled (e.g. admin media library at `/admin/media`), uploaded files are validated by:

1. **File extension** — must match an allowlist (`jpg`, `jpeg`, `png`, `webp`, `svg`, `pdf`, `docx`).
2. **MIME type** — must match the extension (no `image.php` disguised as `image.jpg`).
3. **File signature (magic bytes)** — the first few bytes are checked against known signatures:
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47 0D 0A 1A 0A`
   - PDF: `25 50 44 46`
   - WebP: `52 49 46 46 ... 57 45 42 50`
4. **File size** — must be under the per-type limit (e.g. 5 MB for images, 20 MB for PDFs).

### Safe filenames

Uploaded filenames are sanitized:
- Strip path components (no `../` or `/`).
- Replace non-alphanumeric chars with `-`.
- Append a random suffix (prevents overwriting and filename collisions).
- Final filename: `<sanitized-base>-<random>.<ext>`.

### Private storage

Files are stored at `/home/aloeduca/alaminn.info/storage/uploads/` (OUTSIDE `public_html`). They are accessed via `/api/v1/admin/media/[id]/download` (authenticated).

---

## 9. Audit logs

**Models**:
- `AuditLog` — global audit log (every privileged action across the platform).
- `HigherStudyAuditLog` — Higher-Study-specific audit log (create/update/publish/archive/verify/import/delete on Higher Study entities).
- `EnglishLearningAuditLog` — English-Learning-specific audit log (same actions on English Learning entities).

### What's logged

| Field | Purpose |
|---|---|
| `actorId` / `actorUserId` | Who performed the action (User ID). |
| `action` | What was done (`create`, `update`, `delete`, `publish`, `archive`, `verify`, `import`, `login`, `logout`, `cron.<name>`, etc.). |
| `resource` / `entityType` | What entity type was affected (`Contact`, `HigherStudyUniversity`, etc.). |
| `resourceId` / `entityId` | The ID of the affected entity. |
| `beforeData` / `afterData` | JSON snapshot of the entity before/after (for diff). |
| `ipHash` | sha256 hash of the actor's IP (truncated to 16 hex chars — never raw IP). |
| `userAgent` | The actor's browser user agent. |
| `createdAt` | When the action occurred. |

### Retention

Audit logs are NEVER auto-deleted. They grow indefinitely. For high-traffic deployments, consider archiving logs older than 1 year to cold storage.

### Verification

```bash
# Query the latest audit log entries
mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "
  SELECT action, resource, resourceId, ipHash, createdAt
  FROM AuditLog
  ORDER BY createdAt DESC
  LIMIT 10;
"
```

---

## 10. Generic production errors (no stack traces)

In production (`NODE_ENV=production`):

- API errors return a generic message (`Internal Server Error`) with HTTP 500.
- Stack traces are NEVER sent to the client.
- The full error is logged server-side in `~/logs/alaminn.log` (with the request ID for correlation).
- Next.js's default error page (`error.tsx`) is overridden to show a branded "Something went wrong" page with a request ID.

### Verification

```bash
# Trigger a 500 error
curl -s -X POST https://alaminn.info/api/v1/inquiries \
  -H "Content-Type: application/json" \
  -d '{"malformed": true}' | head -c 200
# Expect: {"success":false,"message":"Bad Request","errors":[...]}
# NO stack trace, NO file paths, NO source code snippets.
```

---

## 11. No public source maps

- Next.js builds produce `.next/static/**/*.map` files for debugging.
- These are NOT copied to `.next/standalone/` (the production server).
- The `.htaccess` rule `RedirectMatch 403 \.map$` blocks any `.map` file that might leak.
- Browsers cannot reconstruct the original TypeScript source from production bundles.

### Verification

```bash
# Source maps should not be accessible
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/_next/static/chunks/main.js.map
# Expect: 403 or 404
```

---

## 12. No directory listing

`Options -Indexes` is set in `public/.htaccess` and the root `.htaccess`. Browsers cannot list the contents of any directory.

### Verification

```bash
# Directory listing should be disabled
curl -s https://alaminn.info/_next/static/ | head -5
# Expect: 403 Forbidden or 404 Not Found
# NOT: a list of files
```

---

## 13. No dotfile access

`.htaccess` rule `RedirectMatch 403 /\.(?!well-known/)` blocks all dotfiles EXCEPT `.well-known/` (used for ACME challenges, security.txt, etc.).

### Verification

```bash
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.env           # 403
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.git/HEAD      # 403
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.htaccess      # 403
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.well-known/   # may be 200 or 404 (allowed)
```

---

## 14. No backup-file access

`.htaccess` rule blocks `*.bak`, `*.old`, `*.orig`, `*.swp`, `*.save`, `*.tmp`.

### Verification

```bash
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/index.html.bak  # 403
curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.env.swp        # 403
```

---

## Known caveats

### 1. In-memory rate limiting (not Redis-backed)

**Risk**: On multi-process deployments (PM2 cluster, Kubernetes), each process has its own rate-limit counter. An attacker can bypass limits by hitting different processes.

**Mitigation**: On cPanel with a single Passenger process, this is fine. On multi-process, replace the in-memory `Map` with Redis (`@upstash/ratelimit` or `ioredis`).

### 2. CSP allows `'unsafe-inline'` for scripts and styles

**Risk**: Inline scripts and styles can be exploited for XSS.

**Mitigation**: Next.js requires `unsafe-inline` for its RSC payloads and styled-jsx. Migrating to nonce-based CSP is the strict fix (future work). For now, the rest of the CSP (`default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`) provides strong protection against data exfiltration and clickjacking.

### 3. No file uploads to public directory (currently)

**Risk**: If a future feature adds public uploads (e.g. user avatars at `/uploads/avatars/`), they could be served directly by Apache without security checks.

**Mitigation**: All uploads go to `storage/uploads/` (outside `public_html`). If public uploads are added later, ensure:
- Files are validated by signature, not just extension.
- Filenames are sanitized and randomized.
- The upload directory has `Options -ExecCGI` to prevent PHP/CGI execution.

### 4. Session cookie `SameSite=Lax` (not `Strict`)

**Risk**: `Lax` allows the cookie to be sent on top-level navigations from external sites (e.g. clicking a link to `alaminn.info` from a search engine). A `Strict` policy would block this.

**Mitigation**: `Lax` is the right tradeoff — `Strict` breaks login flows (user clicks a link to Alaminn.info from Google, but appears logged out because the cookie wasn't sent). CSRF protection from `Lax` is sufficient because state-changing requests use POST (which `Lax` blocks cross-site).

### 5. AUTH_SECRET rotation invalidates all sessions

**Risk**: If `AUTH_SECRET` is rotated, every existing session cookie becomes invalid. All users are logged out.

**Mitigation**: Schedule rotation during low-traffic hours. Notify users in advance. The impact is mild (users re-login).

### 6. No MFA / 2FA

**Risk**: Password-only authentication is vulnerable to phishing.

**Mitigation**: Future work — add TOTP-based MFA for admin roles. The `User` model has a `passwordHash` field; add a `mfaSecret` field (encrypted) and a `mfaEnabled` flag.

### 7. Audit logs grow indefinitely

**Risk**: Audit log tables (`AuditLog`, `HigherStudyAuditLog`, `EnglishLearningAuditLog`) can grow large over years, slowing queries.

**Mitigation**: For high-traffic deployments, archive logs older than 1 year to cold storage (S3 Glacier). Add a quarterly cron to export and prune.

### 8. CSP `connect-src 'self'` blocks external API calls

**Risk**: If the app needs to call external APIs (e.g. ALO Education from the browser, Google Analytics), the CSP blocks them.

**Mitigation**: All external API calls are server-side (via the ALO Education integration). The browser only talks to `alaminn.info`. If you add client-side analytics (Google Analytics), update the CSP to `connect-src 'self' https://www.google-analytics.com`.

---

## Verification checklist

Run all of these in production to confirm every control is active:

- [ ] `curl -sI https://alaminn.info | grep -i strict-transport` shows HSTS header
- [ ] `curl -sI https://alaminn.info | grep -i content-security` shows CSP header
- [ ] `curl -sI https://alaminn.info | grep -i x-frame` shows `DENY`
- [ ] `curl -sI https://alaminn.info | grep -i x-content-type` shows `nosniff`
- [ ] `curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/.env` returns `403`
- [ ] `curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/package.json` returns `403`
- [ ] `curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/server.js` returns `403`
- [ ] `curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/prisma/schema.prisma` returns `403`
- [ ] `curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/_next/static/` returns `403` or `404` (no listing)
- [ ] `curl -o /dev/null -s -w "%{http_code}\n" https://alaminn.info/_next/static/chunks/main.js.map` returns `403` or `404`
- [ ] Login as admin; inspect the `alaminn_session` cookie — has `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] Submit 6 wrong passwords; 6th returns `429`
- [ ] Submit inquiry with malformed body; returns `400` with no stack trace
- [ ] Visit `/admin` without login; redirects to `/admin/login`
- [ ] Visit `/admin/users` as `VIEWER`; returns `403`
- [ ] `mysql ... -e "SELECT COUNT(*) FROM AuditLog;"` returns a non-zero number after exercising the app

---

## Reference

- **Auth source**: `src/lib/auth.ts`
- **RBAC source**: `src/lib/rbac.ts`
- **Security headers**: `src/proxy.ts` (Next.js 16 proxy convention)
- **Cron auth**: `src/lib/cron-auth.ts` (timingSafeEqual, fail-closed)
- **Env validation**: `src/lib/env.ts`
- **Observability**: `src/lib/observability.ts`, `src/lib/request-context.ts`
- **Audit log model**: `AuditLog` (Prisma)
- **`.htaccess` files**: `public/.htaccess`, `.htaccess`, `storage/.htaccess`, `db/.htaccess`, `docs/.htaccess`
- **`.htaccess` explainer**: `docs/HTACCESS_EXPLAINER.md`
- **Security tests**: `scripts/security-tests.ts` (22 tests; run via `npm run test:security`)
- **Test count**: 171 tests across 8 files (164 pass, 7 skipped) + 22 security tests
- **Roles**: 11 (SUPER_ADMIN, OWNER, EXECUTIVE_ASSISTANT, CRM_MANAGER, PARTNERSHIP_MANAGER, CONTENT_MANAGER, MARKETING_MANAGER, PROJECT_MANAGER, AI_REVIEWER, SECURITY_AUDITOR, VIEWER)
- **Permissions**: 100+ (namespaced `<resource>.<action>`)
- **Session TTL**: 8 hours
- **Cookie attributes**: HttpOnly, Secure (prod), SameSite=Lax, Path=/, Max-Age=28800
- **Password hashing**: scrypt (N=16384, r=8, p=1, 64-byte hash, 16-byte salt)
- **HMAC algorithm**: SHA-256 (timingSafeEqual)
- **Login lockout**: 5 fails / 15 min → 15 min lockout
