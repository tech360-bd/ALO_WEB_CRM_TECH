# Unified Communication Center — Admin Guide

> Mandate §74, §80, §82. Admin → `/admin/communications`.

## Sections
Unified Inbox · Conversations · Connected Accounts · Providers · OAuth ·
Webhooks · Provider Errors · Retry Queue · SLA · Escalations · Templates ·
Audit Logs · Analytics · Health · Configuration.

## Connected Accounts (mandate §10)
Shows provider, account name/id/type, owner, connected employee, department,
scopes, token status (masked), token expiration, last successful API request,
last webhook event, webhook status, connection health, provider approval status,
error count, last error, created/updated. Actions: Connect, Reconnect, Verify,
Refresh, Disconnect, Revoke, Test, View logs/scopes/webhook/audit.

> Tokens are **never** shown in full — only `••••••••1234`. Connect/disconnect/
> OAuth/webhook/scope changes are restricted to Integration Admin / Super Admin
> (mandate §33).

## Integration Readiness (mandate §82) — one master screen
For every provider: Code · Credentials · OAuth · Webhook · Provider Approval ·
Account Connection · API Health · Live Receive Test · Live Send Test · CRM Test ·
Employee Assignment Test · Audit Test · **Overall Status** (computed, §83).

## Provider Health (mandate §47) — colour discipline
- 🟢 GREEN = genuinely verified (live test passed)
- 🟡 YELLOW = configuration / approval / pending
- 🔴 RED = error / broken
- ⚪ GRAY = not configured

> **Never GREEN merely because code exists.** The colour comes from
> `statusColour(computeIntegrationStatus(...))`.

## Provider Error Center (mandate §38) + Retry (mandate §39)
Errors classified: Authentication / Authorization / Rate Limit / Validation /
Webhook / Network / Provider outage / Unsupported feature / Configuration /
Internal. Retries use exponential backoff + max attempts + idempotency +
dead-letter; never retry permanent auth failures or invalid recipients.

## Verification status
Admin screens are `PLANNED` (data layer + status engine exist). No provider is
connected; readiness shows computed `*_REQUIRED` / `LIVE_TEST_PENDING`.
