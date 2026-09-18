# Final Security Audit

> Mandate §57, §106. Status uses the §97 vocabulary. "VERIFIED" means an
> automated test in this repo exercises the control; live penetration testing is
> an OWNER action.

## Security controls — verification status

| Control | Status | Evidence |
|---|---|---|
| Authentication (session) | VERIFIED | `auth-middleware.ts`; regression tests reject anonymous callers |
| Authorization / RBAC | VERIFIED (audited routes) | `requireUserTypes`; `finance-authz-regression.test.ts` (5) |
| IDOR — student profile | VERIFIED (fixed) | `/api/student/profile` owner-scoped; `api-authz-regression.test.ts` |
| IDOR — employee documents | VERIFIED (fixed) | identity from session, `?viewerId=` ignored |
| Tenant isolation | IMPLEMENTED_BUT_UNVERIFIED | single-tenant deployment; no cross-tenant test |
| CSRF (OAuth state) | CODE_COMPLETE | OAuth start/callback use `state`; live flow unverified |
| XSS | IMPLEMENTED_BUT_UNVERIFIED | React escaping; CSP allows `unsafe-inline` (weakness) |
| SQL injection | CODE_COMPLETE | Prisma parameterized queries; no raw-string interpolation found in audited routes |
| SSRF | CODE_COMPLETE | research client blocks private ranges (169.254/10/192.168/172.16-31/127) |
| File upload abuse | IMPLEMENTED_BUT_UNVERIFIED | MIME/size checks present; upload-abuse test not run |
| Secret leakage | VERIFIED | CI secret-scan step passes on the committed tree |
| OAuth CSRF | CODE_COMPLETE | state validation; live unverified |
| Webhook spoofing | VERIFIED | signature verification fails closed; 24 unit tests |
| Replay attacks | CODE_COMPLETE | idempotency keying; X has no native replay protection (documented) |
| Token exposure | CODE_COMPLETE | AES-256-GCM at rest; masked display; **legacy `SocialIntegration.accessToken` plaintext = OWNER ACTION** |
| Privilege escalation | VERIFIED (audited routes) | finance/payroll gated; cron routes guarded |

## Fixed in this branch (regression-tested)
- `/api/commissions`, `/api/counselor/students/[id]`, `/api/crm/seed` — were
  unauthenticated/leaking; now gated (`api-authz-regression.test.ts`).
- `/api/hr/payroll`, `/api/finance` — zero auth → `withAuth` + role gate
  (`finance-authz-regression.test.ts`, 5 tests).
- `/api/student/profile` — IDOR + credential leak → owner-scoped, fields stripped.
- `/api/employee/documents/[id]/download` — spoofable `?viewerId=` → session identity.
- All 9 `/api/cron/*` — publicly triggerable → `cron-auth.ts` fail-closed guard
  (`cron-auth-regression.test.ts`, 11 tests).

## Known weaknesses (OWNER ACTIONS)
1. **No `src/middleware.ts`** — no edge-level auth or rate limiting; all
   authorization is per-route. A missed guard on any route = exposure. Recommend
   a lint rule for mutating routes without an auth helper + an owner allowlist.
2. **CSP allows `'unsafe-inline' 'unsafe-eval'`** — weakens XSS defence.
3. **`SocialIntegration.accessToken` plaintext column** — migrate to encrypted
   `ConnectedAccount` (backup-gated; not executed).
4. **Leaked DB password in git history** (two branches) — **must be rotated**.
5. **228 API routes with no detected auth** — many legitimately public (login,
   public lead capture, OAuth callbacks, health), but each must be triaged; see
   `docs/audit/COMPLETE-API-INVENTORY.md` and `AUDIT/ARENA-ROUTE-INVENTORY.csv`.
6. **`/api/health` leaks the raw DB error and returns 200 when degraded.**

## Verification status
- Server-side authz on the audited sensitive routes: **VERIFIED** (35 regression tests).
- Webhook signature + idempotency: **VERIFIED** (24 unit tests).
- Full penetration test (XSS/SSRF/upload/CSRF live): **IMPLEMENTED_BUT_UNVERIFIED** —
  requires a running instance; OWNER action.
