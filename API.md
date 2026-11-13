# ALO EDUCATION — API REFERENCE

**Route files:** 954 (`src/app/api/**/route.ts`) · **Framework:** Next.js 16 App Router · **Runtime:** Node

---

## 1. Conventions every route follows

### Authentication

All protected routes use `withAuth` from `src/lib/auth-middleware.ts`:

```ts
export const GET = withAuth(async (request, auth, context) => { … },
  { requireUserTypes: ['SUPER_ADMIN', 'ADMIN'] });
```

Options: `requireUserTypes`, `requireRoles`, `requirePermissions`. `SUPER_ADMIN` and `ADMIN` bypass
role/permission checks. Related helpers: `authenticateRequest`, `checkOwnership`, `logAuditAction`,
`getOptionalAuth`.

**Next 16 route params are a Promise and must be awaited:**

```ts
type RouteContext = { params: Promise<{ id: string }> };
const { id } = await context.params;
```

`auth` carries `userId`, `actorUserId`, `actorEmail`, `userType`, `roles`, `partnerId`, `partnerRole`,
`email`.

### Response envelope

```jsonc
{ "success": true,  …payload }
{ "success": false, "error": "specific message" }
{ "success": false, "status": "NOT_CONFIGURED", "error": "…" }   // s94
```

`status: "NOT_CONFIGURED"` is reserved for a capability that is switched off or has no credentials. It
is **never** reported as success (s94).

### Error semantics used across the new routes

| Code | Meaning |
|---|---|
| 400 | Malformed request, missing required field, validation refusal |
| 401 / 403 | Unauthenticated / not permitted. `TENANT_MISMATCH` and `PERMISSION_DENIED:<capability>` are cross-tenant and IDOR refusals (s69, s99) |
| 404 | Not found, **or** a feature flag is disabled (`status: NOT_CONFIGURED`) |
| 409 | State conflict — e.g. replaying an already-`DELIVERED` webhook event |
| 500 | Unexpected failure; the message is generic so internals are not leaked |

No route returns an empty list to represent a failure (s91).

---

## 2. Route groups by size

| Group | Routes | Group | Routes |
|---|---|---|---|
| `admin` | 92 | `partner` | 23 |
| `crm` | 84 | `applications` | 22 |
| `employee-access` | 40 | `ai-workforce` | 22 |
| `visa` | 38 | `communications` | 21 |
| `employee` | 36 | `student-portal` | 18 |
| `marketing` | 34 | `integrations` | 16 |
| `student` | 29 | `course-finder` | 16 |
| `brains` | 28 | `hrm` | 14 |
| `counselor` | 26 | `whatsapp` / `cron` | 13 / 13 |

---

## 3. Endpoints added by this work

### Feature flags (s117)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/feature-flags` | any authenticated | Admins read the full table; **anyone else may only evaluate flags for themselves** (`?evaluate=true` or by falling through) |
| POST | `/api/feature-flags` | ADMIN | `{action:"bootstrap"}` seeds the catalogue, all disabled at 0% |
| GET | `/api/feature-flags/[key]` | any authenticated | Evaluation, plus audit trail for admins |
| PATCH | `/api/feature-flags/[key]` | ADMIN | Audited; `reason` recorded |

Flags **fail closed**: an unknown key, a database error or a disabled flag all evaluate to `false`.

### Outbound webhooks (s77)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/webhooks/events` | staff/partner | Canonical event catalogue + signing contract |
| GET | `/api/webhooks/subscriptions` | ADMIN, PARTNER, EMPLOYEE | Returns `configured: false` when the tenant has none |
| POST | `/api/webhooks/subscriptions` | ADMIN, PARTNER, EMPLOYEE | Plaintext secret returned **exactly once**. A partner's `partnerId` comes from the session, never the body (s69). `allowPrivateHost` is honoured only for admins (SSRF guard) |
| GET/PATCH/DELETE | `/api/webhooks/subscriptions/[id]` | owner-scoped | |
| POST | `/api/webhooks/subscriptions/[id]` | owner-scoped | `{action:"rotate-secret"}` |
| GET | `/api/webhooks/deliveries` | owner-scoped | A partner cannot page through another tenant's log by omitting filters |
| POST | `/api/webhooks/deliveries/[id]/replay` | owner-scoped | Replaying a `DELIVERED` event → **409** |
| POST | `/api/webhooks/test` | ADMIN, PARTNER, EMPLOYEE | See below |

`POST /api/webhooks/test` deliberately does **not** call `emitWebhook()`. Emit fans an event out to
every matching active subscription, so a "test" would push traffic to unrelated third parties. It
creates the delivery row for the target subscription only, then hands it to the same `deliverWebhook()`
the cron worker uses — real signing, real timeout, real retry accounting. The payload carries
`__aloTestEvent: true` so a receiver cannot ingest it as business data (s92). The response reports the
true HTTP outcome: a failed test returns `delivered: false` with the real status, never a fake success.

Signing: `HMAC-SHA256` over `<x-alo-timestamp>.<raw json body>`; headers `x-alo-event`,
`x-alo-delivery`, `x-alo-timestamp`, `x-alo-signature`. Retries use exponential backoff
(30s, 2m, 8m, 32m, 2h, capped 6h) then dead-letter.

### Risk & intelligence (s108, s110, s111, s112)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/risk/applications/[id]` | staff | `?recompute=true` re-scores. Gated by `APPLICATION_RISK_SCORE`; disabled → 404 `NOT_CONFIGURED` |
| GET | `/api/risk/students/[id]` | staff | Always returns `SUCCESS_SCORE_DISCLAIMER` (s15, s93) |
| GET | `/api/risk/distribution` | management | Reports `assessed` **and** `unassessed` separately, so unscored rows are never folded into GREEN |
| GET | `/api/intelligence/attention` | management | `?scope=GLOBAL\|BRANCH\|USER`, `?persist=true`. A bucket whose query failed returns `status:"ERROR"` with its reason and is excluded from totals (s91) |
| GET | `/api/intelligence/opportunity-graph/[studentId]` | staff, student (own), partner (own tenant) | `?recommend=true`. A partner with no linked application → `TENANT_MISMATCH` |
| POST | `/api/intelligence/opportunity-graph/[studentId]/materialise` | staff | Idempotent upsert |
| GET | `/api/intelligence/opportunity-graph/[studentId]/recommendations` | as above | Each carries `becauseOf` edges (s16) |

### Realtime (s86)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/realtime/stream` | Server-Sent Events over the existing `PortalNotification` / `StudentNotification` tables. Cursor-based via `?since=`; interval via `?pollMs=` clamped server-side to 5–120s (default 15s). Emits `ready`, `notification`, `cursor`, `error` and heartbeat comment frames. |
| GET | `/api/realtime/stream?probe=1` | JSON short-circuit letting the client distinguish 404/`NOT_CONFIGURED` from a transient drop and back off exponentially (2s→60s) |

SSE was chosen over WebSocket: Next streams it natively on the Node runtime, it survives proxies, and
it needs no extra infrastructure. Polling the database is deliberate — Redis is available but must
remain optional, so the database stays the source of truth.

### Parent / guardian (s13, s67)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/parents?studentId=` | staff only | Never reachable by a parent — it would expose other families' contacts |
| POST | `/api/parents` | staff | Consent records created in the same transaction |
| GET/PATCH | `/api/parents/[id]` | staff | Setting `accessLevel: NONE` forces `portalEnabled: false` |
| GET/POST | `/api/parents/[id]/consents` | staff | **Append-only.** No edit or delete (s67) |
| POST | `/api/parents/[id]/responsibilities` | staff | Negative amounts are clamped to 0 |
| POST | `/api/parents/[id]/responsibilities/[rid]/pay` | staff | `PARENT_MISMATCH` → 403. `paidAmount` is capped at the owed amount — no phantom credit |
| GET | `/api/parents/portal/me` | PARENT, GUARDIAN | Resolves the parent **from the session only**; a `?studentId=` that differs is refused |

### University / institution portal (s39)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/university-portal/applications` | `universityId` comes from the **stored account row**, not the request. Built from an explicit field allowlist — never `select: true` |
| GET | `/api/university-portal/applications/[id]/documents` | IDOR guard: the application must belong to this tenant |
| POST | `/api/university-portal/applications/[id]/request-document` | Records a request; never mutates the authoritative document row |
| POST | `/api/university-portal/applications/[id]/propose-status` | Returns **202** `status:"PROPOSED"`, `requiresAloApproval:true` (s116). Permission is checked **before** tenant, so an unauthorised caller learns nothing about whether the record exists |
| GET | `/api/university-portal/stats` | Gated by `view_recruitment_data` |
| GET | `/api/university-portal/deposits` | Gated by `view_deposits`. **Counts only** — no amounts, no payer identity |
| GET/POST | `/api/university-portal/accounts`, `/accounts/[id]` | Accounts are created `INVITED`, not `ACTIVE` |

### Regulatory rules & policy changes (s106, s64)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/rules/versions?ruleKey=` | staff | Full retained history, oldest first |
| POST | `/api/rules/versions` | **ADMIN only** | Append-only; high-risk rule types go straight to `PENDING_APPROVAL` |
| POST | `/api/rules/versions/[id]/approve` | **ADMIN only** | The only way a version becomes live. Requires a named actor. Supersedes and **retains** the previous version |
| POST | `/api/rules/versions/[id]/reject` | **ADMIN only** | Reason mandatory |
| POST | `/api/rules/versions/[id]/verify` | staff | A request for `VERIFIED` with no source is **downgraded** to `NEEDS_REVIEW` and the response says so (s105) |
| GET | `/api/rules/active?ruleKey=&at=` | staff | Point-in-time resolution. Returns `authoritative`, `trustWeight`, and an `advisory` string when unverified. No rule in force → 404, never a fabricated default |
| GET | `/api/rules/stale?olderThanDays=180` | staff | Includes a `neverVerified` count (s43) |
| GET/POST | `/api/policy-changes` | staff | POST returns `applied: false` — detection is not application (s64) |
| POST | `/api/policy-changes/[id]/triage` | staff | Links to a proposed version and/or review task |
| POST | `/api/policy-changes/[id]/dismiss` | staff | Reason mandatory |
| POST | `/api/policy-changes/[id]/resolve` | **ADMIN only** | |

### Cron (s89)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/cron/webhook-dispatch` | New. Drains the outbound webhook queue every 5 minutes |

All cron routes go through `requireCron(req)` then `handleAuthorizedCronRequest(req, registryKey)`.
22 jobs are declared, 16 enabled, 6 blocked with a recorded reason. `scripts/cron-scheduler-policy-check.ts` certifies the whole
scheduler (223 assertions).

---

## 4. Security properties of the new endpoints

- **No secret is ever returned twice.** Webhook plaintext secrets appear only in the creation and
  rotation responses; stored values are encrypted (`src/lib/token-encryption.ts`, AES-256-GCM,
  requires `ENCRYPTION_KEY`).
- **SSRF guard.** `validateWebhookUrl` rejects private/link-local hosts unless an administrator
  explicitly passes `allowPrivateHost`.
- **Tenant isolation** is resolved server-side from the session or the stored row in every
  partner- and university-scoped route (s69).
- **Internal fields are never selected.** The university portal and parent portal both use explicit
  allowlists; `Application.safeStatus` is the only external status projection.
- **Replay protection.** Webhook delivery is unique per `(subscriptionId, eventId)`; replaying a
  delivered event returns 409.
- **Human-in-the-loop (s116)** gates visa submission, application submission, financial decisions,
  commission adjustments and regulatory rule changes.

---

## 5. Verification status

Every endpoint above compiles and is included in a successful production `next build`. **None has been
called against a running server with a real database** — no MySQL was available. Runtime behaviour,
authorisation enforcement and response bodies are therefore `NOT VERIFIED`; the logic beneath them is
covered by 2,490 passing unit tests with mocked persistence.
