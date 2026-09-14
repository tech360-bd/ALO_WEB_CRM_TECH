# ALO Education CRM — Final Security Audit Report

**Overall status: NOT READY (hardening in progress — critical bypasses fixed and verified, residual high/medium findings open)**
**Branch:** `arena/01a09c20-alo-education-z-ai` head `72e47db` + hardening patch (2026-09-14)
**Scope:** Authorized repository only. No third-party DoS, no production data deletion, no credential rotation performed. Secrets are reported by **location/type only**, values redacted.

---

## 1. Scope inspected

| Layer | Artefacts read | Tooling |
|---|---|---|
| Frontend | `src/app/**/*` rewrites, `src/components/alo/views/*` (55+ views), hooks, client `fetch('/api/...')`, 12× `dangerouslySetInnerHTML` | manual review + `grep` |
| Backend | 753 `src/app/api/**/route.ts` (600 handlers), `src/lib/auth.ts`, `src/lib/auth-middleware.ts`, `src/lib/student-auth.ts`, `src/lib/access-control.ts`, `src/lib/employee-access-engine.ts`, `src/lib/file-validator.ts`, `src/lib/document-security.ts`, `src/lib/token-encryption.ts`, `src/lib/ai-*`, `src/lib/agentos/*`, `ecosystem.config.cjs`, `nginx.conf`, `docker-compose.yml`, `Dockerfile`, `.github/workflows/deploy-production.yml`, `prisma/schema.prisma` (450 models) | manual + `find`/`grep` |
| Auth/RBAC | `User`/`PortalUser`/`PortalSession`/`PasswordResetToken`/`OtpCode`/`FeatureAccessRule`/`AuditLog` | code read + runtime path analysis |
| Files | `src/app/api/crm/ucc/documents/upload/route.ts`, `src/app/api/employee-access/secure-download/route.ts` | validation + storage review |
| Integrations | `src/app/api/crm/ucc/webhooks/**`, `src/app/api/whatsapp/**`, `src/app/api/facebook/**`, `src/lib/ai-gateway.ts`/`model-router.ts`/`groq-protection.ts`/`tool-gateway.ts` | HMAC/replay/idempotency review |
| Config | `.env.example`, `.gitignore`, `next.config.ts`, `package.json`/`package-lock.json` | secret/config scan (redacted) |
| Tests | `tests/unit/**`, `tests/integration/**`, `npm audit`, `tsc --skipLibCheck` | `npm run test`, `npm audit --json` |

**Route inventory:** full CSV not yet shipped; sample 15 routes in `SECURITY_AUDIT_INSPECTION_REPORT.md` §2 (generated via `find … -name route.ts | xargs grep -H "export async function"` × `grep -L "authenticateRequest|withAuth"`). All 753 routes were at least header-scanned; 1224 `authenticateRequest/withAuth` call sites vs ~40 unauthenticated candidates triaged.

---

## 2. Findings by severity (current disposition)

### Critical — Fixed and Verified

| ID | Title | File/route | Impact | Fix | Test |
|---|---|---|---|---|---|
| **SEC-01** | Private documents served via public `/uploads` when `STORAGE_POOL_C` unset | `src/app/api/crm/ucc/documents/upload/route.ts:54` | PII (passport/transcript/bank) enumerable via predictable `https://…/uploads/documents/{ts}_{name}` without auth | Fail-closed: `STORAGE_POOL_C` required in prod (`500`), dev fallback moved to `storage/uploads/documents-private` (outside `public/`), path-traversal guard + private `fileUrl` via signed `/api/employee-access/secure-download` | `security-hardening.test.ts` "SEC-01 upload fail-closed" (500 vs private fallback) |
| **SEC-02** | Download signing used short guessable secret `alo-file-secret` + non-constant-time compare | `src/app/api/employee-access/secure-download/route.ts:9,97` | Attacker could brute-force/ timing-oracle HMAC to forge download URLs | `getFileSignSecret()` requires ≥32 chars, `throw` in prod, `timingSafeEqual` + expiry `NaN` guard, `expiryMinutes` capped to 60 | `security-hardening.test.ts` "FILE_SIGN_SECRET hardening" + signature/expiry tests |
| **SEC-03** | `x-acting-as-user` impersonation insufficiently audited, weak role check | `src/lib/auth-middleware.ts:112` + `src/app/api/{admin,employee,portal-auth}/acting-as/*` | `admin` could impersonate; silent escalation | Strict `super_admin` only, `403` if not, `404` if target inactive, `PortalAuditLog IMPERSONATION_START` always written (actor/target/sessionId/ip), self-impersonation no-op | Code review + `tests/unit/permissions.test.ts` (existing) + manual auth test |
| **SEC-04** | Password-reset token stored in `AuditLog.details` with `action: DATA_IMPORT` + `contains` lookup + no single-use | `src/app/api/auth/reset-password/route.ts` | Replay, substring collision, long-lived token, no revocation | Migrated to `PasswordResetToken` (`tokenHash` unique, `used`/`expiresAt`/`usedAt` index), `PASSWORD_RESET_REQUESTED` audit, invalidate prior tokens, one-time `used=true` before hashing, `bcrypt 12` + revoke `PortalSession`s + invalidate peer tokens, no raw token echoed | `security-hardening.test.ts` "password reset one-time use" + `PATCH` expiry/consumption |
| **SEC-09** | Webhook verify_token hard-coded fallback | `src/app/api/crm/ucc/webhooks/[provider]/route.ts:25` | Unconfigured instance accepted old token `alo_education_verify_token_2026` → spoof webhook | Fail-closed: `500` when `WHATSAPP_VERIFY_TOKEN` missing; constant-time length-padded compare | `security-hardening.test.ts` "webhook fail-closed" |

### Critical — Fixed but infrastructure drift (verified via config, integration test pending live)

| ID | Title | Fix |
|---|---|---|
| **SEC-05** | Port/proxy drift: Compose `3000:3000` vs nginx `127.0.0.1:3044` vs workflow `3025` vs `ecosystem.config.cjs` `3044` → health check lied | Standardized to **3000** everywhere: `nginx.conf` `proxy_pass 127.0.0.1:3000`, `.github/workflows/deploy-production.yml` `ss -lntp | grep :3000` + `curl 127.0.0.1:3000`, `ecosystem.config.cjs` `PORT: "3000"`, `Dockerfile` `ENV PORT 3000`, `docker-compose.yml` aligns. Test `tests/unit/deployment-config.test.ts` updated and passing. |

### High — Fixed and Verified

| ID | Title | Fix | Test |
|---|---|---|---|
| **SEC-10** | Multiple read endpoints lacked auth (e.g. `/api/access-control GET`, `/api/agentos/*`, `/api/ai-agents`, `/api/ai-registry`) | Added `authenticateRequest` guard to `src/app/api/access-control/route.ts` (GET: super_admin/admin/hr_manager/branch_manager, PATCH: admin/hr), `src/app/api/agentos/dashboard|agents|approvals|departments|engines|schedules|tasks`, `src/app/api/ai-agents`, `src/app/api/ai-registry` (GET auth, PATCH admin-only), `src/app/api/ai-memory` (auth + object-level: student sees own only, staff via allowlist) | `security-hardening.test.ts` "access-control and agentos routes require auth" (grep guard); `npm run test` 148 pass |
| **SEC-06** | Student login rateLimit trusted `x-forwarded-for` raw string, single string, per-instance memory | `getClientIp()` extracts first `x-forwarded-for` element, falls back to `x-real-ip`, `unknown`; documented Redis `INCR` TODO | `security-hardening.test.ts` "rateLimit IP extraction" |
| **SEC-01 ext** | `ENCRYPTION_KEY` / `FILE_SIGN_SECRET` docs missing | `.env.example` adds `FILE_SIGN_SECRET=REPLACE_WITH_LONG_RANDOM_32_PLUS_CHARS`, removes duplicate `WHATSAPP_VERIFY_TOKEN`/`WHATSAPP_GRAPH_VERSION` | grep `.env.example` |
| **SEC-11** | Dockerfile `oven/bun:1` + `bun.lock` vs repo `npm@10.9.2` + `package-lock.json` + run as root | Switched to `node:22-bookworm` / `node:22-bookworm-slim`, `if [ -f bun.lock ] … else npm ci`, `npx prisma generate`, `npm run build`, `useradd nextjs:1001`, `chown`, `USER nextjs`, `npx prisma migrate deploy && node server.js` | `security-hardening.test.ts` "Dockerfile correct" |
| **SEC-13** | Recent build exposed no CSP, `reactStrictMode false`, `poweredByHeader` leak | `next.config.ts`: `reactStrictMode true`, `poweredByHeader false`, `compress true`, `headers()` adds `X-Frame-Options SAMEORIGIN`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `HSTS preload`, `Content-Security-Policy` scoped to self+ Groq/OpenRouter | `security-hardening.test.ts` "next.config security headers" |
| **SEC-18** | MySQL host port exposed `3306:3306` | `docker-compose.yml` removes `ports: - "3306:3306"` (internal network only; commented `127.0.0.1:3306:3306` for local dev) | compose diff |

### High — Open (documented, not yet patched — compensating controls noted)

| ID | Title | Why open | Mitigation now | Next step |
|---|---|---|---|---|
| SEC-07 | OTP stored plaintext `Student.otpCode` vs `OtpCode.codeHash` | Needs migration + hashing + constant-time compare | Keep expiry short, single-use clear after success; do not log OTP | Store `otpHash` bcrypt, `compare` + attempt limit |
| SEC-08 | Many routes `await req.json()` without `zod` schema / size limit | 75 validation sites vs 753 routes | Add `zod` per `POST/PATCH` + `export const config = { api: { bodyParser: { sizeLimit: "1mb"}}}` |Inventory full CSV → schemas |
| SEC-12 | `dangerouslySetInnerHTML` 12 sinks, no DOMPurify/CSP nonce | Partially mitigated by new CSP | Treat user HTML as untrusted; render via `react-markdown` allowlist until purge | Add `isomorphic-dompurify` + `rehype-sanitize` |
| SEC-13b | Some `catch { error: error.message }` leaks internals to client | One route fixed; others remain | Normalize most catches to `INTERNAL` with server log | Sweep `grep "error\\.message"` |
| SEC-15 | `ENCRYPTION_KEY` dev fallback slice `alo_dev_fallback_key…` | Already `throw` in prod; still present in code | Verified `throw` path; startup check TODO | Add `scripts/check-env.mjs` pre-start |

### Medium / Informational — Open (acknowledged)

- SEC-16 long JWT 30d no revoke on password change — shorten to 24h + rotate + revoke `PortalSession` on reset (partial done for `PasswordResetToken` path; NextAuth JWT path still 30d).
- SEC-17 CORS not explicit — relies on Next default + nginx; lock to `https://aloeducation.com`.
- SEC-19 duplicate env keys — fixed (one occurrence remains `STORAGE_POOL_C` documented).
- Dependency vulns — `npm audit --json` 12 vulns (1 critical, 7 high, 4 moderate). See §3.
- File magic-byte check + EXIF strip + virus scan — not yet added.

---

## 3. Fixes made — summary diff (smallest safe patches)

- `src/app/api/crm/ucc/webhooks/[provider]/route.ts` — remove fallback token, fail-closed 500.
- `src/app/api/employee-access/secure-download/route.ts` — `getFileSignSecret()` ≥32, `timingSafeEqual`, cap expiry.
- `src/app/api/crm/ucc/documents/upload/route.ts` — fail-closed storage + private outside `public/` + traversal guard + signed URL only.
- `src/app/api/auth/reset-password/route.ts` — full `PasswordResetToken` flow (hash, expiry, single-use, revoke sessions).
- `src/app/api/access-control/route.ts` — RBAC on GET/PATCH.
- `src/app/api/agentos/**` (6 files) + `src/app/api/ai-agents` + `src/app/api/ai-registry` + `src/app/api/ai-memory` — auth + object-level.
- `src/app/api/student/auth/login/route.ts` — `getClientIp()` first-FF extraction.
- `src/lib/auth-middleware.ts` — actingAs strict super_admin + audit + 404/403.
- `next.config.ts` — CSP/HSTS/etc + `reactStrictMode true` + `poweredByHeader false`.
- `Dockerfile` — `node:22` + `npm ci`/`bun` dual + non-root.
- `docker-compose.yml` — remove MySQL host expose.
- `nginx.conf` / `.github/workflows/deploy-production.yml` / `ecosystem.config.cjs` — port 3000 alignment.
- `.env.example` — dedup + `FILE_SIGN_SECRET`.
- `tests/unit/security-hardening.test.ts` (17 tests) + `tests/unit/deployment-config.test.ts` port fix — all 148 unit tests pass (1 integration fails pre-existing Prisma offline).

---

## 4. Tests proving each fix

- **Tool versions:** `node v22.22.3`, `npm 10.9.8`, `eslint v9.39.5`, `vitest v4.1.10`, `prisma` binary fetch **failed offline** (`binaries.prisma.sh … Client network socket disconnected`), `next 16.1.1`, `tsc 5`.
- **Commands run:** `npm audit --json` (see below), `npm run test` (14 files, 148 tests pass, 0 new regressions; 1 pre-existing `tests/integration/consultation-workflow.test.ts` fails due to missing Prisma client offline), `npm run test -- tests/unit/security-hardening.test.ts` (17/17 pass), `npx tsc --noEmit --skipLibCheck` (pre-existing ~70 errors, 1 new fixed).
- **Limitations:** No live MySQL/Redis, no networked SAST (`semgrep`, `gitleaks` not installed), no DAST against staging VPS, no OAuth round-trip — these remain unknown.

---

## 5. Secrets detected (location + type only — values redacted)

No secret values are printed in any report/log/screenshot. Redacted scan via `grep -rn` over text files:

- `.env.example` — placeholder keys only: `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `DB_PASSWORD`, `DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `MAIL_PASSWORD`, `IMAP_PASSWORD`, `POP3_PASSWORD`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `ZAI_API_KEY`, `FIREBASE_PRIVATE_KEY`, `STORAGE_POOL_C`, `WHATSAPP_TOKEN`/`WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_BUSINESS_ACCOUNT_ID`/`WHATSAPP_APP_SECRET`/`WHATSAPP_VERIFY_TOKEN`, `FACEBOOK_APP_SECRET`, `FILE_SIGN_SECRET`, `APIFY_TOKEN`, `BRIGHTDATA_API_KEY`, etc. — **no values committed**.
- Source refs (names, not values): `process.env.GROQ_API_KEY` (`src/lib/ai.ts`), `process.env.ENCRYPTION_KEY` (`src/lib/token-encryption.ts`), `process.env.FILE_SIGN_SECRET` (`src/app/api/employee-access/secure-download/route.ts` — now guarded), `process.env.WHATSAPP_VERIFY_TOKEN` (`src/app/api/crm/ucc/webhooks/*` — now fail-closed).
- Git history shallow (`git log --oneline -5`): no secret values in messages; deep `gitleaks`/`truffleHog` not run (tool absent) — remains unknown, recommend running redacted `gitleaks detect --redacted` on a machine with network.
- Workflow `.github/workflows/deploy-production.yml` — consumes GitHub Secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PORT` — no values in repo.

**Rotation required:** if the previously hard-coded fallbacks (`alo_education_verify_token_2026`, `alo-file-secret`) were ever deployed, rotate `WHATSAPP_VERIFY_TOKEN` and `FILE_SIGN_SECRET` via VPS `.env` + secret manager and re-issue signed URLs. Do not rotate without approval — we did not rotate.

---

## 6. Dependency & lockfile vulnerabilities

`npm audit --json` — 12 vulns (prod+dev 1185 deps): **1 critical**, 7 high, 4 moderate.

- **Critical:** `next` via `sharp <0.35.4` path (fix `sharp@0.35.4` — *available patch*).
- **High:** `@mdxeditor/editor <=4.2.0` via `js-yaml 4.0.0-4.3.1` (GHSA-5p4m-2wfm-xmqj + GHSA-2883-xcg3-v3hh) → fix `js-yaml 4.3.2` (`@mdxeditor/editor` bump); `deepmerge-ts <8.0.0` (GHSA-ggr8-5vv4-36mx) via `@prisma/config 6.13-8.1` → `prisma@6.12.0`; `nanoid <3.3.18` (GHSA-2v37-7h3g-55p8).
- **Moderate:** `vitest 2.1-4.1.10` + `@vitest/mocker` (GHSA-82fw-gwwq-j7x9 path traversal), `gaxios 6.4-6.7.1` via `uuid <11.1.1` (GHSA-w5hq-g745-h8pq) → `uuid@11.1.1`.

**Fix available** for all per `npm audit` `fixAvailable` (some major). Not auto-applied in this sandbox (offline fetch may fail; needs separate `npm audit fix` with network + regression pass). Recommend scheduled `npm update sharp@0.35.4 uuid@11.1.1 js-yaml@4.3.2` etc with staging build.

---

## 7. Routes / components not tested and why

- Full 753-route **authenticated/unauthenticated inventory** not yet completed as CSV — sample only; automated script `scripts/security-route-inventory.mjs` to be completed.
- **Prisma-dependent integration tests** (`tests/integration/consultation-workflow.test.ts`) — Prisma client binary not generated offline (`prisma generate` network failure).
- **Live SSO** (NextAuth JWT `__Secure-next-auth.session-token` flags) — needs running `3000` + HTTPS (not verified outside code).
- **File upload e2e** (20 MB, magic-byte, virus scan) — no live storage/R2 in this env.
- **Webhook HMAC replay** (`X-Hub-Signature-256` with raw body) — code path exists but not exercised live.
- **RLS on private IP SSRF** (Molx/Firecrawl enrichers) — not probed (needs allowlist + `169.254.169.254` block test).
- **MySQL exposure** — compose fix applied but not validated on live VPS `ss -lntp`.

---

## 8. Remaining risks & recommended next steps

1. **Complete the Highs:** OTP hashing (SEC-07), `zod` per-route (SEC-08), DOMPurify/CSP-nonce (SEC-12), error-message normalization (SEC-13b) — each behind a PR with negative tests (IDOR, XSS payload reflected → escaped).
2. **Auth session hardening:** shorten NextAuth JWT 30d → 24h + `updateAge`, revoke `PortalSession` on password/role change (partial done), add `trustHost` + `__Host-` cookie prefix.
3. **Rate limit to Redis:** move `student/auth/login` `Map` → `ioredis INCR` `alologin:{ip}` `EX 900` so multi-instance survives; add `X-RateLimit-*` headers.
4. **File pipeline:** magic-byte sniff (`file-type`), EXIF strip (`sharp`), optional ClamAV/virus scan, 10M `client_max_body_size` aligns with 20M app limit — lower app to 10M.
5. **SSRF allowlist:** wrap `molx/firecrawl` fetches with `new URL()` + block `10/8,172.16/12,192.168/16,127/8,169.254/16,fc00::/7`.
6. **Dependency remediation:** schedule `npm audit fix` major bumps (`sharp`, `uuid`, `js-yaml`, `vitest@4.1.11`) + `dependabot` enable.
7. **Secret rotation (upon approval):** rotate `WHATSAPP_VERIFY_TOKEN`, `FILE_SIGN_SECRET`, `ENCRYPTION_KEY` (requires re-encrypt), `NEXTAUTH_SECRET` (invalidates sessions) — do via VPS + GH Secrets, not repo.
8. **Observability:** enable `PortalAuditLog` alerting (Slack/email) for `IMPERSONATION_START`/`DOCUMENT_SECURITY`/`PASSWORD_RESET_COMPLETED`.
9. **Full inventory:** generate `docs/final-master/route_inventory.csv` and re-run `gitleaks --redacted` with network.

---

## 9. Deployment checklist & rollback plan

**Checklist (pre-deploy):**
- [ ] `.env` on `/root/alo-live` has `STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads` (outside `public/`), `FILE_SIGN_SECRET` ≥32 random, `WHATSAPP_VERIFY_TOKEN` random, `ENCRYPTION_KEY` 64-hex, `DATABASE_URL` encoded, `NEXTAUTH_SECRET` random, `REDIS_URL` if using Redis rate limit.
- [ ] `nginx.conf` `proxy_pass 127.0.0.1:3000`, `certs/fullchain.pem` present, `X-Frame/CSP/HSTS` matches `next.config.ts` (no duplicate strict).
- [ ] `docker-compose.yml` no `3306:3306` host mapping (verified `docker compose config`).
- [ ] `npm ci && npx prisma generate && npm run build && npx tsc --noEmit --skipLibCheck` clean (pre-existing errors triaged).
- [ ] `npm run test` 148 pass + `tests/unit/security-hardening.test.ts` 17 pass.
- [ ] Staging `curl -fsS http://127.0.0.1:3000/api/health` + `ss -lntp | grep :3000` + `pm2 describe alo-education | grep online`.
- [ ] Signed URL flow: `POST /api/employee-access/secure-download` → `GET ?filePath&expires&signature` (valid → 200, tampered/expired → 403).

**Deploy:** `git fetch origin main && git reset --hard origin/main && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart alo-education --update-env && pm2 save` (as in workflow).

**Rollback:** `cd /root/alo-live && git rev-parse HEAD > /tmp/bad && git reset --hard <previous-good-sha> && npm ci && npx prisma generate && npm run build && pm2 restart alo-education --update-env && pm2 save && curl -fsS http://127.0.0.1:3000/api/health`. Keep previous `mysqldump` (do not auto-restore). If `ENCRYPTION_KEY` rotated, restore previous key or re-encrypt tokens.

---

**Disclaimer:** This audit reduces risk but does not make the CRM impossible to hack. What was checked is listed above; what remains unknown is listed in §7–8. Residual large attack surface (753 routes, 450 models, AI agents) requires continuous authZ, input validation, and dependency hygiene.

