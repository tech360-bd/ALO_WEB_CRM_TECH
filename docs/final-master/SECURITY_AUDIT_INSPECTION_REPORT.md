# ALO Education CRM — Security Audit: Read-Only Inspection & Plan

**Status: SECURITY REVIEW — INSPECTION COMPLETE (not yet hardened)**
**Branch:** `arena/01a09c20-alo-education-z-ai` @ `72e47db`
**Date:** 2026-09-14 UTC (read-only inspection, no deploys, no credential rotations, no production mutations)
**Auditor context:** Senior AppSec engineer, authorized repository only. No third-party attack, no DoS, no destructive tests. Secrets redacted (location/type only).

---

## 1. Actual Architecture Identified

### 1.1 Runtime entrypoints (what actually runs)

| Layer | Active artefact | Evidence | Notes |
|---|---|---|---|
| App | Next.js 16.1.1 (standalone) | `package.json: next ^16.1.1`, `next.config.ts: output "standalone"` | `npm run build` → `prisma generate` → `next build --webpack` → `node scripts/prepare-standalone.mjs` → `node .next/standalone/server.js` (`HOSTNAME 0.0.0.0`, `PORT 3000` dev, `3044` nginx, `3025` workflow) |
| Language | Node ≥22, npm 10.9.2 | `package.json engines` | `tsx 4.23` for seeds |
| DB | MySQL 8.4 | `docker-compose.yml db: mysql:8.4`, `prisma/schema.prisma datasource db provider mysql` | 450 models (see 1.3) |
| ORM | Prisma 6.19.3 | `package.json`, `src/lib/db.ts` (global singleton) | `prisma migrate deploy` on boot; `prisma generate` at build |
| Auth | NextAuth 4.24.11 (Credentials, JWT) + custom PortalSession bearer + student-auth OTP | `src/lib/auth.ts`, `src/lib/auth-middleware.ts`, `src/lib/student-auth.ts`, `src/app/api/student/auth/login/route.ts` | JWT 30 days; bcryptjs 12 |
| Process | Docker Compose (app+db+nginx) vs GitHub Deploy over SSH to `/root/alo-live` + `pm2 restart alo-education` | `Dockerfile` (oven/bun:1), `docker-compose.yml`, `.github/workflows/deploy-production.yml` | **Drift:** Dockerfile expects `bun.lock` but repo holds `package-lock.json`; nginx proxies `127.0.0.1:3044`, Compose exposes `3000:3000`, workflow verifies `3025` |
| Reverse proxy | nginx:alpine `nginx.conf` (HTTP→HTTPS redirect, SSL, HSTS, X-Frame nosniff) | `nginx.conf` | `client_max_body_size 10M` |
| Jobs | Cron via `/api/cron/sla-monitor` (`CRON_SECRET`), `/api/automation/schedule` (`ALO_CRON_SECRET`), BullMQ-like via `src/lib/redis.ts` + MemoryRedis fallback | `src/app/api/cron/*`, env | |
| AI | Groq/OpenRouter/ZAI via `src/lib/ai.ts`; Workforce gateway/router/guard (this branch) plus `src/lib/ai-action-executor.ts` (risk+approval) | `src/lib/ai-gateway.ts`, `src/lib/model-router.ts`, `src/lib/groq-protection.ts` | Server-only `GROQ_API_KEY`; never to frontend |
| Storage | `STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads` (fallback `public/uploads/documents`) | `src/app/api/crm/ucc/documents/upload/route.ts:54` | Risk if fallback public |

**Determinant:** Production is the VPS at `DEPLOY_HOST` (secret) serving `/root/alo-live` on `127.0.0.1:3044` behind nginx. Docker Compose is a secondary/local target. The repo's `main` branch is the deployment source (`git reset --hard origin/main` in workflow). Any file on `main` that is imported or routed is considered active. Unimported sketches under `skills/` or `examples/` are not active runtime.

### 1.2 Frontend inventory (active)

- Pages: Next.js app router under `src/app` — public SPA at `/` with rewrites for `/book-consultation`, `/contact`, `/about`, `/language-prep/*`, `/destinations/:slug`, `/universities/:slug`, `/courses/:slug`, plus portals `/student/login`, `/partner/login`, `/employee/login`, `/admin/login` (all rewritten to `/?p=...` or dedicated `src/app` segment folders). No `middleware.ts` (global auth-guard missing — protection is per-route via `auth-middleware.ts` / `withAuth`).
- Components: `src/components/alo/views/*` (~55+), `src/components/ui/*` (Radix), `src/hooks/*`.
- Client API calls: `fetch('/api/...')` relative URLs, proxied through the Next server — correct for preview host allowlist. Direct `localhost:3000` calls absent outside dev scripts.
- Sensitive rendering: ~12 occurrences of `dangerouslySetInnerHTML` (grep count 12) — must be audited for stored XSS (see §5).

### 1.3 Backend entrypoints

- **753** `src/app/api/**/route.ts` files (counted `find . -name route.ts | wc -l = 753`). 600 declare `GET|POST|...` handlers. Full inventory spreadsheet required (separate artefact); by top-level prefix: `admin/*` (≈60), `agentos/*` (10), `ai-*` (10+), `crm/*` (≈80), `student/*`, `partner/*`, `auth/*`, `brains/*`, `ucc/*`, `whatsapp/facebook/cron/webhooks`, etc.
- Auth middleware: `src/lib/auth-middleware.ts` (`authenticateRequest`, `logAuditAction`, `withAuth`) — used in 1224 call sites; however ~40+ routes declare no auth import (initial unauthenticated-route scan listed e.g. `agentos/dashboard`, `ai-agents`, `ai-command/*`, `auth/register`, etc. — many are public by design but must be re-checked per-operation).
- RBAC: `src/lib/access-check-engine.ts`, `src/lib/access-control.ts`, `src/lib/employee-access-engine.ts`, feature flags `FeatureAccessRule`/`FeatureUsageLog`, `employee.designation` guards.
- Workers: `src/lib/redis.ts` (`ioredis` 6 + `MemoryRedis`), SLA monitor, import batches, university data scan, WhatsApp/Cap/Chatwoot integrations.

### 1.4 Database

- Provider `mysql`, 450 models (`grep -c "^model " prisma/schema.prisma`), 9593 lines. Critical models: `User`/`PortalUser`/`PortalSession`/`AuditLog`/`TimelineEvent`/`Student`/`StudentDocument` (legacy) + `UccAttachment`/`OcrJob`/`DocumentSecurityIncident`, `PasswordResetToken` (unused — code uses `AuditLog` instead), `OtpCode`/`OtpLog`, `FeatureAccessRule`, `ImportBatch`/`ImportStagingStudent`, `Application`/`VisaCase` families, marketing `Crm*` models.
- Migrations under `prisma/migrations` — not audited line-by-line this phase; deployment runs `migrate deploy` (safe, additive only if authored correctly — must verify no `db push` in requests).

### 1.5 Environment & secrets config

- `.env.example` is well-scoped: placeholder values `REPLACE_WITH_*`, no real secrets. Lists: DB (`MYSQL_*`, `DATABASE_URL`), auth (`NEXTAUTH_SECRET`, `AUTH_SECRET`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY` 64-hex), mail/IMAP, Firebase private key placeholder, storage `STORAGE_POOL_C`, Groq/OpenRouter/ZAI, Meta/WhatsApp, OAuth, cron secrets, `REDIS_URL`. Duplicates noted: `WHATSAPP_VERIFY_TOKEN` and `WHATSAPP_GRAPH_VERSION` appear twice (harmless but confusing).
- `.gitignore` properly ignores `.env*` except `!.env.example`, plus `node_modules`, `.next`, `build`, `*.pem`, `*.log`.
- No `.env` present in repo (checked `ls .env*` → only `.env.example`).

---

## 2. Route / API Inventory (sample, full CSV to follow)

> **Rule:** every protected operation must re-check auth on the server even if the UI hides it. The table below is a 30-row sample from the 753-route corpus; the complete `route_inventory.csv` will be produced in phase 2 (scripted scan of exports + `authenticateRequest`/`withAuth` presence).

| # | Method | Path (prefix `/api`) | Auth required? (observed) | Permission (observed) | Input validation | Data accessed | Tests (observed) | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | POST | `/auth/register` | No (public) | `STUDENT`/`PARTNER` allowlist | `name,email,password` required, role allowlist | `User`, `Student` (atomic), `AuditLog` | `tests/integration/consultation-workflow` | Public by design; enforces role allowlist — verify rateLimit+captcha |
| 2 | POST | `/auth/reset-password` | No (public; email→token) | none | `email` | `User`, `AuditLog` (stores `resetTokenHash`) | none | **Suspect** — see finding SEC-04 |
| 3 | PATCH | `/auth/reset-password` | No (token) | token | `token,newPassword` | `User.passwordHash`, `AuditLog` | none | **Suspect** |
| 4 | POST | `/student/auth/login` | No (public) | ip rateLimit 5/15m | `email/phone,password/otpCode` | `Student`, `StudentLoginAttempt` | `tests/unit/password-hashing` | in-memory rateLimit — fragile |
| 5 | POST | `/crm/ucc/documents/upload` | Yes (`authenticateRequest`) | any authed user | `formData.file` via `validateFile` (MIME+ext, 20 MB) | `UccAttachment`, `OcrJob`, disk write | none | **Suspect path fallback public** |
| 6 | GET | `/crm/ucc/documents/upload` | Yes | — | `conversationId,studentId` query | `UccAttachment` | none | Ownership check missing |
| 7 | GET | `/access-control` | No (checked) | none | — | `Employee`, `FeatureAccessRule`, `PartnerPackage` | none | Likely over-exposed — see SEC-12 |
| 8 | GET | `/agentos/dashboard` | No import found | none | — | `aiAgent` stats | none | Should be `withAuth`+role |
| 9 | POST | `/admin/employees/create` | Yes (admin) | `ADMIN` | `email,name,role` | `User`, `Employee` | none | Check RBAC |
|10 | GET | `/crm/ucc/webhooks/whatsapp` | No (Meta verify) | `WHATSAPP_VERIFY_TOKEN` query check | `hub.*` query | — | none | Token compare |
|11 | POST | `/crm/ucc/webhooks/whatsapp` | No (AppSecret HMAC) | `X-Hub-Signature-256` | JSON body | `SocialWebhookEvent` | none | Must verify HMAC+replay |
|12 | POST | `/crm/ucc/webhooks/[provider]` | No (token compare) | `expectedToken = WHATSAPP_VERIFY_TOKEN \|\| fallback` | query `hub.*` | — | none | **Weak fallback** see SEC-09 |
|13 | POST | `/ai-command/execute` | Partial | `assessRisk`+approval | `payload+idempotencyKey` | `AiCommandAction`, `AuditLog` | none | Must enforce `isGlobalAiPaused` |
|14 | POST | `/workforce/orchestrate` | Yes (`withAuth`) | any authed (check needed) | `workflow,actionType,payload` | `AutomationEvent`, `AgentTask`, `AgentApprovalQueue`, `AiEmployee` | none | New — audit `ToolGateway` allowlist |
|15 | GET | `/workforce/metrics` | Yes | any authed | `periodDays` query | `AiEmployee`, `AgentApprovalQueue`, `AutomationEvent` | none | Safe if no row-level bypass |
| … | … | … | … | … | … | … | … | … |

**Methodology for full inventory (phase 2 script):** `find src/app/api -name route.ts | xargs grep -H "export async function \(GET\|POST\|PUT\|PATCH\|DELETE\)"` × cross with `grep -L "authenticateRequest\|withAuth\|getServerSession"` to flag unauthenticated routes → manual triage (public vs. forgotten guard) → fill `permission/validation/data/tests` by reading handler body + `src/lib/access-check-engine.ts` calls.

---

## 3. Secrets & Configuration — observations (redacted)

### 3.1 Scan results (file + key name only, values **not** reproduced)

No secret **values** are printed in this report, in logs, or in any committed artefact. The scan below used `grep -rn` over text files only (binary excluded), case-sensitive key names:

- `.env.example` — placeholder keys only (no values) — **clean**: `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `DB_PASSWORD`, `DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY` (with comment `64-char hex`), `MAIL_PASSWORD`, `IMAP_PASSWORD`, `POP3_PASSWORD`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `ZAI_API_KEY`, `FIREBASE_PRIVATE_KEY`, `WHATSAPP_TOKEN`/`WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_APP_SECRET`/`WHATSAPP_VERIFY_TOKEN`, `FACEBOOK_APP_SECRET`, `FILE_SIGN_SECRET` indirect.
- Source references (key names, not values): `process.env.GROQ_API_KEY` in `src/lib/ai.ts` (1), `process.env.ZAI_API_KEY` (1), `process.env.NEXTAUTH_SECRET` indirect via `authOptions`, `process.env.ENCRYPTION_KEY` in `src/lib/token-encryption.ts`, `process.env.FILE_SIGN_SECRET` in `src/app/api/employee-access/secure-download/route.ts` with **insecure fallback** `'alo-file-secret'` — see finding.
- Git history (shallow check `git log --oneline -5`): no committed secret values visible in messages; deeper `git grep` + `truffleHog`/`gitleaks` run is planned (phase 2) to confirm.
- Workflow files `.github/workflows/deploy-production.yml`: consumes GitHub Secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PORT` — **not** committing values. Safe.

### 3.2 Configuration risks noted (no values)

| Area | Finding (redacted) | Location |
|---|---|---|
| Insecure default | `WHATSAPP_VERIFY_TOKEN` fallback `'alo_education_verify_token_2026'` when env missing | `src/app/api/crm/ucc/webhooks/[provider]/route.ts:25` |
| Insecure default | `FILE_SIGN_SECRET` fallback `'alo-file-secret'` (short, guessable) | `src/app/api/employee-access/secure-download/route.ts:9,97` |
| File handling | `uploadDir = STORAGE_POOL_C \|\| join(cwd,'public','uploads','documents')` — fallback makes documents publicly fetchable under `/uploads` | `src/app/api/crm/ucc/documents/upload/route.ts:54` |
| Cookie/Session | NextAuth JWT `maxAge 30 days`, `strategy: jwt` — long-lived, no rotation on password change checked | `src/lib/auth.ts:8` |
| CORS | No explicit `cors` middleware found; relies on Next.js default (same-origin) — verify deployed headers | `nginx.conf` `sameorigin` present, but no `Access-Control-Allow-Origin` sweep |

**All** secret values remain in the authorized environment/secret-manager (`.env` on VPS + GitHub Secrets). No rotation performed in this read-only phase. `.env.example` placeholders and `.gitignore` are correct.

---

## 4. Authentication & Session — design observed

- **Password hashing:** `bcryptjs` with salt 12 (good). Legacy placeholder passwords explicitly rejected (`src/lib/auth.ts` comment). Student `password` nullable, separate OTP path.
- **Login:** Credentials provider lowercases email, checks `status === "ACTIVE"`, `bcrypt.compare`, updates `lastLoginAt`, writes `AuditLog LOGIN`. Good.
- **Logout:** `events.signOut` writes `AuditLog LOGOUT`. Session cookie cleared by NextAuth.
- **Session:** JWT, 30 days. `callbacks.jwt` + `callbacks.session` propagate `role/status/studentId`. No sliding expiry, no database revocation check on each request (JWT is stateless). `PortalSession` bearer path *does* check `revokedAt`/`expiresAt` + user `status !== 'active'` — stronger.
- **Rate limits:** `src/app/api/student/auth/login` uses `Map<string,{count,expiresAt}>` (5/15 min per IP via `x-forwarded-for`). **In-memory** — lost on restart, not shared across instances, trusts `x-forwarded-for` (spoofable if not behind `trust proxy`). Portal/NextAuth login has no visible brute-force guard.
- **OTP:** `Student.otpCode` compared as plaintext (not `otpHash`), expiry via `otpExpiresAt`. `OtpCode` model has `codeHash` but student route uses plain field — inconsistency. OTP cleared after success.
- **Password reset:** `PasswordResetToken` model exists but **not used**; the active route `src/app/api/auth/reset-password` stores `resetTokenHash` inside `AuditLog.details` with `action: "DATA_IMPORT"` (mislabelled) and `contains` search for token lookup. No `used` flag, no single-use enforcement, expiry checked manually (1 h). Reveals token in dev JSON. No session invalidation after reset.
- **Cookie flags:** NextAuth defaults to `HttpOnly`+`Secure` in prod when `NEXTAUTH_URL` is `https`; `SameSite: Lax` by default. Not overridden in code — acceptable if nginx enforces `Secure`. Must verify runtime `__Secure-next-auth.session-token`.
- **MFA:** Not present.
- **Account enumeration:** Login and reset both return generic messages (`"Invalid credentials"`, `"If account exists..."`) — good.

### Open questions for phase 2 (tests, not prod mutation)

- Confirm `ENCRYPTION_KEY` length 64 hex in prod (not dev fallback slice).
- Confirm session invalidation on password/role change.
- Exercise brute-force on `/login` (allow-listed test env).
- Inspect `PASSWORD_RESET` flow end-to-end (token replay, expiry).

---

## 5. Authorization, RBAC, Tenant Isolation — posture

- **Model:** Hybrid — `User.role` string + `PortalUser`/`Role`/`Permission` + `FeatureAccessRule` (ownerType/ownerId/featureKey) + `employee.designation` special cases (`Chairman`/`CEO`/`SUPER_ADMIN` bypass). The bypass is intentional for owners but must be scoped — see "acting as".
- **Per-route checks:** 1224 hits of `requireAuth/withAuth/authenticateRequest/checkPermission` — good coverage, but ~40 routes lack any token (sample includes `agentos/*`, `ai-agents`, `approval-center`, `brains/*` read endpoints). Each must be classified public vs. bug.
- **Impersonation ("acting as"):** Header `x-acting-as-user` honored when the authenticated caller has role `super_admin` (checked in `auth-middleware.ts:112`). The acting identity overwrites `userId/roles/permissions` while `actor*` retains the real super-admin for audit. Endpoints `src/app/api/{admin,employee,portal-auth}/acting-as/*` issue dedicated sessions and write `AuditLog`. **Critical to test:** ensure *only* `super_admin`, not any `ADMIN`, can act; ensure `revokedAt`/expiry still checked for actingAsUser; ensure logs cannot be bypassed.
- **Horizontal isolation:** Student scope helpers exist (`src/lib/data-scope.ts`, `src/lib/access-check-engine.ts: canViewEmployeePrivateProfile`, `document-security.ts: counselor assigned check + partner-only mode`). Not uniformly applied — e.g. `GET /api/crm/ucc/documents/upload?studentId=...` lists attachments without ownership check (`where: {studentId}` passed from query, not from session). Must fix with `WHERE studentId IN (allowedSet)`.
- **Vertical escalation:** Direct role checks like `role === "SUPER_ADMIN"` appear; however bulk endpoints (`data-import`, `import/batches`, `university-data/updates/[id]/approve`) must verify caller role each time — spot-check pending.
- **IDOR:** Many routes accept `/:id` path params and `targetId` bodies; ownership checks vary. No uniform `canAccessResource(auth, resourceId)` wrapper. Plan: centralize per-model ownership helpers and add negative tests.

---

## 6. Input / API / Browser security — first-pass notes

- **Validation:** `zod 4.0.2` installed, but only 75 files reference validation/schema. Many routes `await req.json()` without schema (e.g. `acting-as`, `auth/register`). Recommend `zod` schemas + `superjson` size limits everywhere.
- **SQL/ORM injection:** Prisma parameterized by default; no raw `$queryRaw` with string interpolation observed so far, but a systematic `grep -r "$queryRaw\|\$executeRaw"` is planned. One concern: `auditLog.findFirst({ where: { details: { contains: resetTokenHash } } })` — not injectable (parameterized) but semantically unsafe (substring match, index miss, collision).
- **XSS:** 12 `dangerouslySetInnerHTML` sinks; many render Markdown/HTML for CRM content, announcements, SOP previews. Stored XSS risk if user HTML is not sanitized server-side. `react-markdown` and editor (`@mdxeditor/editor`) need allowlist config + DOMPurify.
- **CSRF:** NextAuth uses `SameSite` + `csrfToken`; portal bearer is not cookie-based (header), so not CSRF-relevant. `/api/*` with cookie auth should still verify `Origin` where applicable.
- **SSRF:** User-supplied URLs are fetched in `src/lib/research/molx-firecrawl-client.ts` (`MOLX_URL`), `src/lib/research/structured-extractor.ts` (`webSearch/webScrape`), `src/lib/research/lead-enrichment-pipeline.ts` (Apify/BrightData). Must allowlist hosts and block `169.254.169.254`/metadata service, private ranges.
- **Path traversal:** File routes build paths via `path.join(uploadDir, storedFileName)` after `sanitizeFileName` (`[^a-zA-Z0-9._-]`→`_` + truncate). Good. Verify no `../` bypass through `fileUrl` query.
- **Open redirect:** `NEXTAUTH_URL` + `redirectUri` flows in `facebook/*`, `oauth/*` — validate against allowlist (`aloeducation.com`).
- **Mass assignment:** No explicit allowlist mapping in many `PATCH` handlers — e.g. `access-control PATCH` writes `isEnabled,limitValue,requiresApproval` from body without role guard. Add `zod` pick lists.
- **Headers:** `nginx.conf` adds `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `X-XSS-Protection`, `Referrer-Policy strict-origin-when-cross-origin`, `HSTS 1yr includeSubDomains` — good. Missing `Content-Security-Policy`, `Permissions-Policy`; no `X-Forwarded-Proto` spoof guard.
- **Errors:** Some catches `return NextResponse.json({ success:false, error: error.message }, {500})` — may leak stack/SQL fragments. Normalize to `INTERNAL` with server log.

---

## 7. Files & Sensitive Student Data

- **Validation:** `src/lib/file-validator.ts` — allowlist MIME→ext map (pdf, jpg/png/webp/gif, doc/docx/xls/xlsx), dangerous extensions deny, 20 MB cap, extension↔MIME match. Missing: magic-bytes (libmagic/`sharp` header check), virus scan, EXIF strip.
- **Storage:** `STORAGE_POOL_C` expected private path (`/home/.../storage/uploads`) — correct. Fallback to `public/uploads/documents` creates a public static route (Next `public/` is mounted at `/`). Predictable URL `/uploads/documents/{timestamp}_{sanitized}` → enumeration if guessable timestamp.
- **AuthZ on download:** Secure download signed-link flow exists (`src/app/api/employee-access/secure-download/route.ts`) with HMAC + expiry (5 min) — good. Plain file URLs bypass it. Need to enforce signed links for *all* PII documents (passport, transcript, bank statement).
- **Encryption:** `STORAGE_POOL_C` at rest — OS-level encryption assumed (not app-managed). `ENCRYPTION_KEY` used for token encryption (`src/lib/token-encryption.ts` AES-256-GCM, IV+authTag+ct). HTTPS enforced via nginx → `443` + HSTS.
- **Retention/logging:** `DocumentSecurityIncident`, `AloAuditLog`, `AuditLog`, `TimelineEvent` present. No automatic purge policy observed — must document retention.

---

## 8. Integrations, Webhooks, AI Agents

- **WhatsApp/Meta:** Verification `GET` checks `hub.verify_token` against `WHATSAPP_VERIFY_TOKEN` (or fallback). Webhook `POST` verifies `X-Hub-Signature-256 = HMAC-SHA256(APP_SECRET, rawBody)` — implemented in `src/app/api/crm/ucc/webhooks/whatsapp/route.ts` and `facebook/webhook/route.ts`. Replay protection via `SocialWebhookEvent` deduplication by `eventId` is planned (verify). Idempotency: `IdempotencyKey` on `AiCommandAction`. `WHATSAPP_GRAPH_VERSION` pinned (`v18`/`v20` drift noted — harmless).
- **Rate limits/retries:** `src/lib/whatsapp/whatsapp-queue.ts` (if present) + `groq-protection.ts` (rate limit/queue/circuit breaker) follow best practice. 3CX/SMS gateways may lack retry caps — verify.
- **SSRF via integrations:** Web search → scrape pipelines fetch arbitrary user-supplied URLs (see §6). Must gate through allowlist + no private IP.
- **AI agents:** `src/lib/ai-action-executor.ts` (risk LOW→auto, MEDIUM+→approval), `src/lib/agent-orchestrator.ts` (this branch, with `isGlobalAiPaused`, `maxSteps/maxRuntime/maxToolCalls/tokenBudget/approvalPolicy`), `src/lib/tool-gateway.ts` (allowlist). Agents read `Student`/`Application` rows — must reuse same RBAC as humans (not bypass). Human approval for campaign sends, exports, permission changes is enforced via `AgentApprovalQueue`/`AiCommandAction:PENDING`.
- **Mock vs real:** `src/lib/redis.ts` `MemoryRedis` fallback and `src/lib/ai.ts` `throw "No provider configured"` are correctly non-fabricating; the old `/api/crm/documents/dashboard` mock set (Arif/Sadia/Imtiaz sample rows) remains as dev sample — must be removed from prod.

---

## 9. Database, Infra, Deployment — surface observations

- **DB least privilege:** `MYSQL_USER` vs `MYSQL_ROOT_PASSWORD` separated, good. Compose `HEALTHCHECK mysqladmin ping`. Network `alo-network` bridge. No public exposure except `3306:3306` in Compose (should be removed or restricted to `127.0.0.1` in prod).
- **Migrations/backups:** `prisma migrate deploy` on boot (runner stage) is correct. Avoid `prisma db push` (workflow also correctly uses `deploy`). Backup/restore not observed in repo — assume VPS `mysqldump` externally (to be verified).
- **TLS/proxy:** `nginx.conf` correct (`ssl_certificate`, `proxy_set_header X-Forwarded-Proto $scheme`, `Upgrade`/`Connection`). `trust proxy` is implied via nginx; verify Next.js `trustHost` setting.
- **File/process isolation:** `Dockerfile` runner creates `/app/upload /app/download /app/db`, no extra privilege noted; `oven/bun:1` defaults to non-root? Verify `USER` directive (absent).
- **Dependencies:** `package-lock.json` 10.9.2, no `bun.lock`; Dockerfile `bun install --frozen-lockfile` will **fail** (pre-existing). `sharp 0.35.3`, `uuid`, `gaxios` flagged by audit previously (not re-checked here).
- **CI/CD:** `.github/workflows/deploy-production.yml` — uses GH Secrets, `ssh-action v1.2.2`, port check `ss -lntp | grep ':3025'` (mismatch with nginx `3044` and compose `3000`). Branch protection not visible from repo alone (verify GH settings). No dependency scan step (`npm audit`/`dependabot`) visible.
- **Monitoring:** `AuditLog`/`AloAuditLog`/`AgentAuditLog`/`DashboardAlarm`/`TimelineEvent`. Alerting not observed (no `webhook` for alarms).

---

## 10. Security Plan — prioritized, read-only next steps → fixes (no prod mutations until approved)

> **Engagement rule reminder:** the items below are *planned* — they will not be executed until this plan is approved. When approved, each finding follows §10 workflow: severity → impact → exact file/route → smallest safe fix → regression test → diff review → status.

### Phase A — Tooling & inventory (read-only, safe to run)

1. **Generate full route inventory CSV** — script `scripts/security-route-inventory.mjs` scanning `src/app/api/**/route.ts` for method×auth×RBAC×zod×data×tests. Output `docs/final-master/route_inventory.csv`.
2. **Secret scan (redacted)** — run `gitleaks detect --redacted --no-git` + `truffleHog filesystem --redacted .` + `grep` for `password|apiKey|secret` with `--redacted` output. Report locations/types only.
3. **Dependency scan** — `npm audit --json` + `npm outdated` + `license-checker` (or `osv-scanner`). Record versions; do not auto-fix without approval.
4. **SAST** — `eslint --ext .ts,.tsx` with `eslint-plugin-security` (additive), plus `semgrep --config=auto` (read-only).
5. **Config sweep** — check `next.config.ts`, `nginx.conf`, `docker-compose.yml`, `.github/workflows/*` for missing CSP/HSTS subDomain edge, open ports, fallback secrets.
6. **Prisma schema review** — confirm no destructive `@@index` drift, review `onDelete` cascades for data loss.

### Phase B — Hardening (smallest safe patches, behind feature flags where risk)

**Critical (do first):**

| ID | Severity | Component | Impact | Exact file | Smallest safe fix | Test |
|---|---|---|---|---|---|---|
| SEC-01 | Critical | File storage | PII docs publicly reachable if `STORAGE_POOL_C` unset | `src/app/api/crm/ucc/documents/upload/route.ts:54` + `nginx.conf` | Fail-closed: refuse upload if `STORAGE_POOL_C` missing (or create private dir outside `public/`), never fall back to `public/uploads`; 403 on direct `/uploads/*` | Integration: unauth GET `/uploads/documents/...` → 403 |
| SEC-02 | Critical | Confidential documents | Predictable public links | same + `src/app/api/employee-access/secure-download/route.ts` | Require HMAC-signed, short-lived links for all `passport/visa/bank` doc types; purge public URL pattern | Unit: signed link verify+expiry, replay fails |
| SEC-03 | Critical | Acting-as | Privilege escalation if role check weak | `src/lib/auth-middleware.ts:112`, `src/app/api/{admin,employee,portal-auth}/acting-as/*` | Enforce `role === "super_admin"` (not `includes("super_admin")` via permissions array where confused), audit `actor*`, 10 min expiry, rateLimit, notify | Neg test: `admin` acting-as → 403 |
| SEC-04 | Critical | Password reset | Token replay / mis-store | `src/app/api/auth/reset-password/route.ts` | Migrate to `PasswordResetToken` (unique `tokenHash`, `used`, `expiresAt`, index), `action: PASSWORD_RESET_REQUESTED`, one-time use, invalidate JWTs on success | Integration: replay token → 400 |
| SEC-05 | Critical | Deployment | Port/proxy drift → health check lies | `docker-compose.yml:3000:3000` vs `nginx.conf:3044` vs `workflow:3025` | Single `PORT` (env) + nginx `proxy_pass` templated + workflow `curl` the same | `tests/unit/deployment-config.test.ts` existing (expect 3044 vs 3025 fail) |

**High:**

| ID | Severity | | | | | |
|---|---|---|---|---|---|---|
| SEC-06 | High | Brute force | In-memory rateLimit ineffective multi-instance + `x-forwarded-for` spoof | `src/app/api/student/auth/login/route.ts:9` | Move to Redis `INCR` + `trust proxy` + key by `X-Real-IP`/`req.ip`, shared across instances | Load test: 6th attempt → 429 even across restarts |
| SEC-07 | High | OTP | Plaintext `student.otpCode` vs `OtpCode.codeHash` | `Student` model + login route | Store `otpHash` (bcrypt/sha256) + `expiresAt`, constant-time compare | Unit: hash compare |
| SEC-08 | High | Input validation | Many routes `req.json()` without schema | ~50+ `src/app/api` handlers | Add `zod` schema + `sizeLimit` per route (see full inventory) | Unit: oversized/invalid → 400 |
| SEC-09 | High | Webhook auth | Weak verify_token fallback | `src/app/api/crm/ucc/webhooks/[provider]/route.ts:25` | Remove fallback to literal; require env set or 500 (fail-closed) | Unit: missing env → 500 |
| SEC-10 | High | AuthZ gaps | Unauthenticated read endpoints | `src/app/api/agentos/*`, `access-control GET`, `approval-center` etc | Enforce `authenticateRequest`/`withAuth` + role check (see inventory) | Neg tests: unauth → 401, wrong role → 403 |
| SEC-11 | High | Build | Dockerfile+lockfile mismatch breaks prod build | `Dockerfile: bun.lock*` + `packageManager npm@10.9.2` | Pin to `npm ci` (or commit `bun.lock` & switch PM) | CI: `npm run build` passes |
| SEC-12 | High | XSS | `dangerouslySetInnerHTML` unsanitized | ~12 sinks `src/components/**/*` | DOMPurify + `react-markdown` allowlist; CSP upgrade | E2E: payload reflected → escaped |
| SEC-13 | High | Disclosure | Generic 500 leaks `error.message` | Many `catch (e) { error: e.message }` | Normalize to `INTERNAL` log, client sees id | Unit |

**Medium / Low / Informational** (selected):

- SEC-14 Medium — `ENCRYPTION_KEY` dev fallback slice `Buffer.from('alo_dev_fallback_key...')` (`src/lib/token-encryption.ts`) — fail-closed in prod (already throws), but verify `NODE_ENV=production` never hits fallback (add startup check).
- SEC-15 Medium — `FILE_SIGN_SECRET` fallback `'alo-file-secret'` too short — require 32-byte, fail-closed if missing.
- SEC-16 Medium — Long JWT 30 d with no revoke — shorten to 24 h + rotate on password change (invalidate `PortalSession`/`jwt`).
- SEC-17 Medium — `cors` not explicit — lock to `https://aloeducation.com` + staging allowlist, no `*`.
- SEC-18 Medium — `MySQL 3306` exposed host port in Compose — bind `127.0.0.1:3306` or remove mapping.
- SEC-19 Low — Duplicate env keys (`WHATSAPP_VERIFY_TOKEN`×2) — deduplicate.
- SEC-20 Info — `npm audit` sharp/uuid/gaxios vulns noted prior — re-audit.
- SEC-21 Info — Upload magic-byte check missing — add `file-type` sniff.

### Phase C — Regression tests (added per fix)

- AuthN: `tests/unit/password-hashing.test.ts` (keep), new `tests/integration/auth-brute-force.test.ts`, `tests/integration/password-reset-flow.test.ts`.
- AuthZ: `tests/integration/rbac-matrix.test.ts` (student cannot read another student's `StudentDocument`/`Application`; counselor cannot mutate `partner.only` student; `admin` cannot acting-as without super).
- Input: `tests/unit/zod-validation.test.ts` for every patched route.
- Files: `tests/integration/secure-download.test.ts` (signed link, expiry, wrong role).
- Webhooks: `tests/unit/webhook-signature.test.ts` (HMAC, replay, wrong token).
- Headers: `tests/unit/security-headers.test.ts` (HSTS/CSP/nosniff/frame).
- Infra: `tests/unit/deployment-config.test.ts` (already asserts health-port=3044 vs 3025 bug — will pass after fix).

### Phase D — Verification & reporting

- Re-run A-D checks, record tool versions (`prisma --version`, `node --version`, `eslint --version`, `semgrep --version`, `gitleaks --version`), commands, results (redacted), limitations (no prod DB load test, no networked DAST against live VPS unless separately authorized).
- Deliver final report §11: overall status (`SECURITY REVIEW COMPLETE` / `NOT READY` / `BLOCKED`), scope, findings by severity, fixes+tests, secrets rotation actions required (file/key only), not-tested routes (with reason), residual risks, deploy checklist + rollback.

---

## 11. What will **not** be done in this engagement (without separate authorization)

- No credential rotation / secret reset on the live VPS (`/root/alo-live/.env`).
- No destructive `prisma migrate reset` / `db push` / data deletion against production.
- No DoS / brute-force against third-party Meta/WhatsApp endpoints.
- No pen-test using production student PII (use anonymized staging DB).

---

## 12. Immediate readiness to proceed

- ✅ Read-only inspection complete. No files modified in this phase except this plan document (read-only artefact).
- ⏭️ Next: upon approval, run Phase A scans (produce `route_inventory.csv`, `audit_*.json` redacted) and open PR with Phase B patches iterated by severity (Critical→High), each with regression test and redacted evidence.
- 🔒 Residual disclosure: until Phase B lands, the fallback-public upload, impersonation scope, and reset-token store should be treated as known open exposure requiring compensating controls (ensure `STORAGE_POOL_C` is set in prod; restrict VPS `3306`/`3025` exposure).

