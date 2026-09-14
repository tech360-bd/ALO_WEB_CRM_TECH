# FINAL_API_ROUTE_AUDIT — 748 files
**Generated:** 2026-09-14 | **Method:** `find src/app/api -name route.ts` + `grep -l` guards  
**Formatter:** `grep -E "export (async )?function (GET|POST|PUT|PATCH|DELETE)"` per file (sample).

## How to read
Every row: `ROUTE | HTTP methods (grep) | AUTH guard? | RBAC re-check? | Idempotency / validation | Result | Evidence`
`PASS` = method+auth+validation present. `FAIL`/`BLOCKED` explained. Full list follows (truncated sample shown; complete via inventory script):

```
src/app/api/health/route.ts — GET — public — PASS — returns {ok}
src/app/api/auth/* — POST — public+hash — PASS — next-auth
src/app/api/marketing/dashboard/route.ts — GET — withAuth(MARKETING_MANAGER) — FAIL: 403 for student NOT_TESTED — code has guard
src/app/api/marketing/social/route.ts — GET(inbox) + POST(reply-suggest,reply-send) — withAuth — FAIL: Official account 403 incomplete, no 24h window
src/app/api/marketing/comments/convert-lead/route.ts — POST — withAuth — FAIL: dedup phone-only, not email/social/WhatsApp
src/app/api/marketing/approvals/route.ts — GET + POST(approve/reject) — withAuth — PASS code, FAIL: publish not gated
src/app/api/marketing/whatsapp-doc-upload/route.ts — POST — withAuth — FAIL: param detectedDocType, not classifier + orphan risk
src/app/api/marketing/content/route.ts — GET,POST — withAuth — FAIL: platformSize String, no size map
src/app/api/marketing/campaigns/route.ts — GET,POST — withAuth — FAIL: no approval gate on publish
src/app/api/marketing/calendar/route.ts — GET,POST,PATCH — withAuth — FAIL: scheduledAt String
src/app/api/marketing/user-access/route.ts — GET,POST,PATCH — withAuth — FAIL: limit 3 not enforced
src/app/api/whatsapp/webhook/route.ts — GET(verify) + POST(inbound/status) — HMAC verify — PASS verify, BLOCKED live with Meta — see WA integration
src/app/api/whatsapp/send/route.ts — POST — withAuth — NOT_TESTED
src/app/api/brand-assets/route.ts — GET,POST,PATCH — no withAuth on GET — FAIL: should require FULL
src/app/api/crm/leads/route.ts — GET,POST — withAuth — PASS
src/app/api/crm/applications/route.ts — * — withAuth — PASS
src/app/api/admin/audit/route.ts — GET — withAuth(SUPER_ADMIN) — PASS
... (remaining 732 rows: see script `src/lib/test-all-api-endpoints.ts` for enumeration)
```

## Counts
- Total route files: **748**
- With auth guard (`withAuth`/`authenticateRequest`): **397 (53%)**
- Without guard: **351** — of which ~180 are public (`/api/health`, `/api/auth`, public `course-finder`) and ~171 require triage (is gap intentional or missing?).
- Methods present: `GET 612`, `POST 401`, `PATCH 74`, `DELETE 31`, `PUT 12` (one file may export multiple).

## Required exhaustive validation (not done → NOT_TESTED/BLOCKED)
For each API, run: valid+invalid input, auth 401/403, pagination/filter, DB side-effect (SELECT before/after), duplicate idempotency, audit write, error envelope (no stack leak). Script `src/lib/test-all-api-endpoints.ts` enumerates endpoints but was not executed against live DB in sandbox (BLOCKED). `npm run test:integration` would cover a subset — not run here.

## Top FAILs before prod
- `/api/marketing/*` Official-account 403, cap 3, dedup composite, approval gate, n8n toggle (see traceability).
- `/api/whatsapp/webhook` OTP branch, full context join, classifier, ask-confirm.
- `/api/brand-assets` POST should require `FULL` manager and seed colors.
- `Caddy` rate-limit not on API (see security).

## Evidence files
- Inventory: `00_BASELINE_INVENTORY.md`
- Guard grep: `find ... | xargs grep -l withAuth`
- Spot checks above; full CSV can be emitted by `node src/lib/test-all-api-endpoints.ts > /tmp/api_inventory.csv` (not committed).

**Status:** Inventoried, not fully tested. Corrective actions in readiness.
