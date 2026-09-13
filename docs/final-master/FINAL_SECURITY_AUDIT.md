# FINAL_SECURITY_AUDIT — ALO Education
**Date:** 2026-09-14 | **Scope:** code + `auth-middleware.ts`, `token-encryption.ts`, `file-validator.ts`, `webhook-validator.ts`, `rate-limiter.ts`, Caddy, env

| Check | Spec | Evidence | Result | Action |
|---|---|---|---|---|
| **Auth — login/logout/reset/expiry/rotation** | §6 | `lib/auth.ts` (NextAuth JWT), `auth-middleware.authenticateRequest` (Bearer+cookie, token+expiry+revokedAt checks) | NOT_TESTED | Run full lifecycle with real DB (signup → login → refresh rotation → logout invalidation) — BLOCKED without DB |
| **AuthZ — server-side on every protected page/API** | §6 | 397/748 routes contain `withAuth/authenticateRequest` (~53%) | FAIL | 351 routes lack explicit guard grep — audit each gap for public vs missing |
| **Role isolation** | marketing 3-limited | `MarketingUserAccess` + `requireUserTypes:MARKETING_MANAGER` | FAIL | Cap 3 not enforced, Official account 403 incomplete, counselor `assignedToId` scoping missing |
| **CSRF** | Next.js same-site cookies | NextAuth `csrfToken` default + Caddy HTTPS | PASS (framework) | Verify `SameSite=Lax` on session cookies in prod |
| **XSS — output encoding** | — | React escapes + `react-markdown` sanitized blocks | PASS | Confirm no `dangerouslySetInnerHTML` on user content (grep pending) |
| **SQL injection** | parameterized | Prisma `findMany/update` everywhere; rare raw SQL in `comprehensive-evidence-audit.ts` grep shows 1 raw → needs `prepared` justification | PASS w/ caveat | Audit that 1 raw is `DB::raw` with bindings |
| **IDOR / privilege escalation** | — | Some routes re-check `assignedToId==auth.userId` (UCC), many marketing routes do not | FAIL | Add ownership check middleware for `leadId/studentId` |
| **Rate limiting** | — | `src/lib/rate-limiter.ts` exists but not imported in WhatsApp/social APIs | FAIL | Wire `rateLimiter.consume(ip/channel)` on `/api/whatsapp/*`, `/api/marketing/*` |
| **File upload — MIME/signature/size/safe name/traversal/exec** | §7 | `file-validator.ts` + `document-security.ts` validate ext vs sig, max size, `uuid` filename, `StoragePool` path | PASS (code) | Need malware scan control documented or clamAV hook (currently explicit doc required) |
| **HTTPS + headers** | — | `Caddyfile` `encode gzip zstd` + `reverse_proxy` but `Strict-Transport-Security` / `CSP / X-Frame-Options` not in Caddy | FAIL | Add `header { Strict-Transport-Security ... }` |
| **Secrets in repo** | — | `.env.example` only placeholders, `.gitignore` excludes `.env`, no committed key in grep | PASS | Confirm prod `.env` not in `/public` |
| **Webhook verification** | Meta | `whatsapp webhook` HMAC `sha256=` `timingSafeEqual`, Facebook `x-hub-signature-256` | PASS (WA), FAIL (FB/IG not verified) | Add FB `X-Hub-Signature` check |
| **Audit logging** | — | `MarketingAuditLog`, `AuditLog`, `IntegrationAuditLog` + `lib/marketing/audit.createAuditLog` | FAIL | Not on every message (only approve/convert) — need `TIMELINE_APPEND` on each inbound/outbound |
| **Dependency vuln** | npm | `npm audit` not run in this env | BLOCKED | Run `npm audit` + `prisma` advisories before prod |
| **Error disclosure** | prod | `global-error.tsx` generic, API returns `{error: message}` may leak `error.message` with DB detail | FAIL | Sanitize prod error to `safeCode` not stack |

**Remaining risks:** authZ gaps 47%, no rate limit on social, FB webhook unverified, IDOR scoping, audit on every message, headers missing. **Not zero-risk — must fix before controlled prod.**
