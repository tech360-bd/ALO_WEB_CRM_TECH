# Unified Communication Center — Security

> Mandate §11, §12, §13, §37, §69, §70, §80.

## Token security (§11)
- Provider secrets/tokens are stored **encrypted** (AES-256-GCM) in
  `ConnectedAccount.accessTokenEnc`/`refreshTokenEnc` via
  `src/lib/token-encryption.ts`. `ENCRYPTION_KEY` (64-char hex) comes from env;
  in production a missing key **throws** (no insecure fallback).
- Secrets never appear in: source, frontend JS, localStorage, public config,
  docs, DB plaintext, API responses, React props, console, logs, error pages,
  audit logs, analytics, or git history.
- Only masked values are displayed (`••••••••1234`).
- **Known issue (OWNER ACTION):** `SocialIntegration.accessToken` is a plaintext
  column. New code uses the encrypted `ConnectedAccount`. Migrating the legacy
  column is a non-destructive, backup-gated OWNER ACTION (not executed here).

## OAuth security (§12)
- Mandatory `state` (CSRF), exact redirect-URI match, PKCE where required,
  server-side exchange, encrypted storage, refresh + expiry/revocation handling,
  audit events. Callback failures never expose codes/secrets/tokens.

## Webhook security (§13)
- Official signature scheme per provider, raw-body HMAC, constant-time compare,
  fail-closed on missing secret, idempotent event dedup, fast acknowledgement.
  See `WEBHOOKS.md`.

## API security (§70)
- Every sensitive route verifies authentication, authorization, tenant, role,
  permission, ownership, and input validation **server-side**. Frontend hiding
  is never authorization.
- Regression-tested: `/api/commissions`, `/api/counselor/students/[id]`,
  `/api/crm/seed`, `/api/hr/payroll`, `/api/finance`, `/api/student/profile`,
  `/api/employee/documents/[id]/download`, and all 9 `/api/cron/*` routes
  (see `tests/unit/*-regression.test.ts`).

## Audit logging (§37)
- Audit actor, role, tenant, action, resource, resource id, timestamp, result,
  error. **Never log secrets.** Existing `logAuditAction` + `IntegrationAuditLog`
  / `MarketingAuditLog` / `PortalAuditLog` models.

## Anti-fake guarantees (structural)
- The status engine cannot return `*_VERIFIED` without evidence
  (`status.ts` — proven by tests).
- The base adapter cannot fabricate a provider success — unsupported ops return
  `UNSUPPORTED_FEATURE`, unimplemented ops return `CONFIGURATION` (proven by tests).
- Webhook verification fails closed and never claims a JWKS check it didn't run.

## Verification status
- Server-side authz on the sensitive routes: **VERIFIED** (regression tests).
- Token encryption: **CODE_COMPLETE** + unit-tested.
- Live provider security tests (real OAuth/webhook): **LIVE_TEST_PENDING** — no
  credentials, sandbox egress blocked.
