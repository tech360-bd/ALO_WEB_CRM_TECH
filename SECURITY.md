# ALO EDUCATION — SECURITY

Spec s66, s67, s69, s99, s116.

> This file replaced the unfilled GitHub `SECURITY.md` template, which still contained its
> instructional placeholder prose ("Use this section to tell people…") and a supported-version table
> for `5.1.x` / `4.0.x` that does not correspond to this project. A stub security policy is worse than
> none, because it reads as though the topic had been addressed.

---

## 1. Reporting a vulnerability

Report privately — **never** as a public GitHub issue.

- Email the ALO Education engineering contact, or use GitHub's private vulnerability reporting if
  enabled on the repository.
- Include reproduction steps, affected routes or models, and whether real student data was exposed.
- Expect acknowledgement within 3 business days and a substantive response within 10.
- If accepted, you will be told the fix release and credited unless you ask to remain anonymous. If
  declined, you will be told why.

Please do not access, exfiltrate or retain real student, parent, partner or financial data while
testing. Use a throwaway tenant.

---

## 2. Defence in depth

| Layer | Implementation |
|---|---|
| Edge / proxy | `src/proxy.ts` — adds `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff` |
| Security headers | `next.config.ts` — see §3 |
| Rate limiting | `src/lib/rate-limiter.ts` — `checkRateLimit(key, type)`, `rateLimitMiddleware(req, type)`, `DEFAULT_LIMITS` |
| Authentication | `authenticateRequest` in `src/lib/auth-middleware.ts`; `withAuth` route wrapper |
| Authorisation | `requireUserTypes` / `requireRoles` / `requirePermissions`; `checkOwnership`; `src/lib/rbac/`, `src/lib/access-control/` |
| Tenant isolation | `src/lib/partner-tenant-guard.ts`; session-derived `partnerId`; stored-row-bound `universityId` |
| Domain guards | Service-layer capability re-checks, so a new route cannot bypass them |
| Secrets | `src/lib/token-encryption.ts` — AES-256-GCM, requires `ENCRYPTION_KEY` |
| Passwords | `src/lib/auth.ts`, `src/lib/employees/activation.ts`, `src/lib/student/canonical-student.ts` |
| Audit | `logAuditAction`; append-only audit tables (s65) |
| Sessions | `expired-session-cleanup` cron revokes expired sessions |

---

## 3. Security headers (as configured)

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:;
  connect-src 'self' https://api.groq.com https://openrouter.ai; worker-src 'self' blob:;
  manifest-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'
```

### Known weakness — recorded, not hidden

The CSP permits `script-src 'unsafe-inline' 'unsafe-eval'`. That materially weakens XSS protection:
an injected inline script would execute. `object-src 'none'`, `frame-ancestors 'self'` and
`base-uri 'self'` are correctly restrictive, and `connect-src` is allowlisted to two AI providers, but
the script directive is the weak point.

Remediation requires nonces or hashes for every inline script and removing `eval` usage, which is a
build-wide change (Next.js itself needs `unsafe-eval` in development). It is listed here as an open
item rather than being described as solved.

`connect-src` naming specific AI vendors also means a browser-side call to any other provider would be
blocked — intentional, but it must be updated when providers change.

---

## 4. Data that must never be exposed (s66)

Passwords, API secrets, tokens, payment credentials and private documents.

Enforcement found in the codebase:

- **Webhook secrets** are encrypted at rest and returned in plaintext **exactly once**, at creation or
  rotation. `redactSubscription` replaces the secret with a `secretConfigured` boolean in every list and
  read response, so no endpoint can return it afterwards.
- **The channel registry exposes only environment variable NAMES**, never values, so a status endpoint
  cannot leak a credential.
- **The parent portal** selects only display fields; a test asserts `password` is not in the select
  list. `PARENT_FORBIDDEN_FIELDS` includes `internalNotes`, `commissionAmount` and
  `isB2bConfidential`, and no access level grants internal, commission, B2B, audit or risk
  capabilities.
- **The university portal** uses an explicit field allowlist — never `select: true` — and excludes
  `reviewerId` / `reviewerNote`. Deposit data is exposed as **counts only**: no amounts, no payer
  identity.
- **`Application.safeStatus`** is the only externally-shareable status projection; `stage` and
  `reviewStatus` are internal.
- A test asserts the repository contains **no hard-coded default session or JWT secrets**.
  `SECRET_SCAN_REPORT.md` records the scan.

---

## 5. Multi-tenant isolation (s69)

Partner A must never see Partner B's students, internal ALO notes or confidential commission data.

Isolation is **structural**, not a filter applied after loading:

- The tenant `partnerId` comes from the **session**, never from a request body or query parameter, so a
  partner cannot widen their own scope by editing a payload.
- Webhook deliveries resolve the tenant's allowed subscription ids **first**; if the tenant owns none
  the response is an empty list rather than an unfiltered query. A partner cannot page through another
  tenant's log by omitting the filter.
- University accounts bind `universityId` to the **stored** `UniversityPortalAccount`.
- The parent portal resolves the parent **from the session only**; a `?studentId=` that differs from the
  linked one is refused as a cross-student read.
- The opportunity graph returns `TENANT_MISMATCH` for a partner with no linked application, and does not
  produce internal-only edge types for a partner caller at all.

### Direct object reference protection (s99)

Cross-tenant and cross-student reads are refused with a specific reason rather than a generic 404, so
the refusal is diagnosable without leaking existence. Ordering is deliberate: the **permission check
runs before the tenant check**, so an unauthorised caller receives `PERMISSION_DENIED:<capability>` and
learns nothing about whether the record exists. An authorised caller reaching another tenant's record
receives `TENANT_MISMATCH`.

---

## 6. SSRF and injection

- **SSRF.** `validateWebhookUrl` rejects private and link-local hosts. An escape hatch
  (`allowPrivateHost`) is honoured **only** for `ADMIN` / `SUPER_ADMIN`, and a partner can never target
  an internal address.
- **SQL injection.** All database access goes through the Prisma client with parameterised queries. No
  raw string interpolation of user input into SQL was introduced by this work. Note that
  `src/lib/accounting/ledger.ts` uses `Prisma.sql` — tagged-template parameterisation, not
  concatenation.
- **XSS.** React escapes by default, but the CSP weakness in §3 means this should not be the only line
  of defence.
- **CSRF.** Session tokens are bearer tokens in the `Authorization` header rather than ambient cookies,
  which removes the classic CSRF vector for API routes. `EventSource` uses `withCredentials`, so the
  realtime stream is same-origin and the route resolves identity server-side.
- **Input validation.** Every new route validates its body explicitly and returns a specific 400
  rather than coercing silently. Dates are parsed and rejected when invalid.

---

## 7. Privacy (s67)

Consent, data access, correction, retention, deletion workflows, communication opt-out, privacy policy
and an audit trail.

- **Parent consent is append-only.** There is no edit or delete: you grant or revoke, each action
  creates a new dated record, and the latest one governs (a revocation wins). History is never erased.
- **Contact requires two conditions** — an active `COMMUNICATION` consent *and* the channel in the
  parent's preferences. Having `EMAIL`/`SMS`/`WHATSAPP` stored is not sufficient. Contact is also
  refused when the parent is suspended or unknown, and corrupt preference JSON degrades to "no
  channels" rather than throwing.
- **Regulatory rule history is retained.** A superseded rule version is never deleted or renumbered, so
  it remains possible to answer what ALO believed on a past date.
- Retention jobs exist (`audit-maintenance`, `notification-cleanup`, `expired-session-cleanup`,
  `temp-file-cleanup`). The scheduler certification asserts there is **no scheduled deletion of private
  files or student data**.

---

## 8. Human-in-the-loop (s116)

Five action classes require a named human approver and cannot be performed by a system job or an AI
agent: visa submission, application submission, financial decisions, commission adjustments, and
regulatory rule changes.

Enforcement for rule changes: `approveRuleVersion` refuses an empty actor, so approval is always
attributable. `requiresHumanApproval()` returns true for visa, entry, English, financial, work-right
and policy rule types, and `detectPolicyChange` forces `requiresApproval` true for those types **even
when the caller asks otherwise** — a caller may raise the bar, never lower it.

AI actions are split by `validateAiAction`: low-risk (`READ`, `ANALYZE`, `SUMMARIZE`, `CLASSIFY`,
`DRAFT`, `RECOMMEND`, `PREPARE`) may run autonomously; high-risk (`FINALIZE`, `APPROVE`, `SEND`, `PAY`,
`DELETE`, `ESCALATE`) require a human.

---

## 9. Error handling without leakage (s91)

- A failed operation records the error, returns a user-friendly message, allows retry where safe, avoids
  duplicate execution, and never fails silently.
- Unexpected 500s return a **generic** message so internals are not leaked; specific 4xx reasons are
  returned where they are safe to disclose.
- No route returns an empty list to represent a failure. The attention engine marks a failed bucket
  `status: "ERROR"` with its reason and **excludes it from totals**, so an unknown is never mistaken for
  a clear zero.
- Database error safety is covered by `tests/unit/db-error-safety.test.ts`.

---

## 10. Security test coverage

Thirty security-focused test files, all passing:

`ai-security-remediation`, `ai-workforce-security`, `api-authz-regression`,
`automation-run-route-safety`, `brand-kit-safety`, `catalog-import-safety`,
`catalog-update-review-security`, `catalogue-phase1-security`, `central-security-authority`,
`communication-draft-security`, `course-finder-final-safety`, `critical-safety-remediation`,
`crm-lead-security`, `db-client-bundle-safety`, `db-error-safety`, `erp-routes-authz-regression`,
`finance-authz-regression`, `integration-runner-safety`, `partner-programs-public-safety`,
`password-hashing`, `portal-reset-password`, `proxy-security`, `public-leads-security`,
`security-hardening`, `test-database-safety`, `ucc-lead-bridge-security`, `ucc-webhook-security`,
`weekly-update-security`, `whatsapp-ai-reply-security`, `workforce-route-security`.

Plus the tenant-isolation, IDOR and permission assertions in `university-portal` (33),
`parent-guardian` (36), `rule-versioning` (92), `feature-flags` (22) and `webhooks` (35).

Notable guarantees these pin: `portal-reset-password` sets the new password once, revokes sessions and
invalidates other tokens; `password-hashing` confirms salted hashes differ for the same password;
`db-client-bundle-safety` keeps the database client out of the browser bundle.

---

## 11. Verification status — s99

| Test area | Status |
|---|---|
| Unauthorised API access | **PARTIAL** — `api-authz-regression` passes statically; not probed over HTTP |
| Cross-role access | **PARTIAL** — as above |
| Cross-partner access | **PASS** (unit) / **NOT VERIFIED** (runtime) |
| Direct object reference | **PASS** — unit tested for university, parent and graph routes |
| File access | **NOT VERIFIED** — no storage backend exercised |
| Session handling | **PARTIAL** — reset-password and expiry logic tested; live sessions not |
| Rate limiting | **PARTIAL** — implemented; `checkRateLimit` not load-tested |
| Input validation | **PASS** — unit tested on new routes |
| XSS | **NOT VERIFIED** — and see the CSP weakness in §3 |
| CSRF | **PARTIAL** — bearer-token design mitigates; not tested |
| SQL injection | **PARTIAL** — Prisma parameterisation throughout; no injection test suite run |
| Sensitive data exposure | **PASS** — unit tested allowlists and redaction |

**No penetration test, runtime authorisation probe, or rate-limit load test was performed.** There was
no running server and no database in this environment, so the entire s99 runtime suite is
`NOT CONFIGURED`. Static and unit coverage is real but is not a substitute for it.

---

## 12. Open items

1. **CSP `unsafe-inline` / `unsafe-eval`** — the highest-value fix; see §3.
2. **Runtime s99 suite** — requires a deployed environment with a real database.
3. **No payment gateway** (see `INTEGRATIONS.md` §10) — any UI that appears to take a payment must
   report `NOT CONFIGURED` (s94) until one exists.
4. **No database-level status validation** — zero Prisma enums means a direct write can store an
   invalid status (see `DATA-MODEL.md` §6).
5. **`scripts/verify-15-cron.ts`** is stale (asserts 15 jobs); it is not run by CI but should be
   deleted or updated.
