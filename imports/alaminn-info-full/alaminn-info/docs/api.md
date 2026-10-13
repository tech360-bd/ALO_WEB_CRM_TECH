# API Reference — Alaminn.info V5

This document lists every HTTP endpoint exposed by the application. The API
surface is split into two top-level groups:

- `/api/health/*` — unversioned health endpoints (used by external monitors).
- `/api/v1/*` — versioned application API. All future breaking changes will
  bump the version (`v2`, `v3`, …).

All endpoints emit the standard JSON envelope:

```ts
type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T | null;
  meta: Record<string, unknown>;
  errors: string[];
};
```

Successful responses include `data` and an empty `errors` array. Failed
responses include a non-empty `errors` array (string error codes like
`"credentials_invalid"`, `"rate_limited"`, `"forbidden"`) and `data: null`.
The `meta` field carries optional context (pagination cursors, error IDs,
etc.). The HTTP status code matches the semantic outcome (`200`, `201`, `204`,
`400`, `401`, `403`, `404`, `405`, `422`, `429`, `500`).

---

## Table of Contents

- [Health](#health)
- [Authentication](#authentication)
- [Admin](#admin)
- [AI Workspace](#ai-workspace)
- [Newsletter](#newsletter)
- [Analytics](#analytics)
- [Meetings](#meetings)
- [Inquiries](#inquiries)
- [Public Content](#public-content)
- [Root](#root)
- [Standard headers](#standard-headers)
- [Rate limits](#rate-limits)
- [Error codes](#error-codes)

---

## Health

### `GET /api/health`

**Auth:** none.
**Rate limit:** none.

Public, minimal, safe health check. Used by external monitors (uptime
checkers, load balancers). Never exposes private record counts, DB schema,
secrets, internal IPs, or raw exceptions.

**Response (200):**

```json
{
  "success": true,
  "message": "Alaminn.info is operational.",
  "data": {
    "application": "Alaminn.info",
    "status": "ok",
    "timestamp": "2026-07-12T03:00:00.000Z"
  },
  "meta": {},
  "errors": []
}
```

---

### `GET /api/health/deep`

**Auth:** two tiers — see below.
**Rate limit:** none.

Deep health check with two response tiers based on the caller's
authentication:

1. **Public (unauthenticated)** — returns a minimal status block +
   non-sensitive runtime metrics (uptime, PID, Node version, memory, request
   count). **Never** exposes private counts, schema, secrets, or internal
   hostnames.

2. **Authenticated** (requires the `security_settings.view` permission, i.e.
   `SECURITY_AUDITOR` or `SUPER_ADMIN`/`OWNER`) — returns the full checks
   block: DB connectivity, migrations, storage, SMTP, scheduler, cache,
   agent hub, webhook, queue, backup, content counts, private counts, and a
   security posture summary.

**Public response (200):**

```json
{
  "success": true,
  "message": "Deep health check complete.",
  "data": {
    "application": "Alaminn.info",
    "environment": "production",
    "version": "5.0.0",
    "status": "ok",
    "timestamp": "2026-07-12T03:00:00.000Z",
    "services": {
      "website": "available",
      "contactForm": "available",
      "newsletter": "available"
    },
    "runtime": {
      "uptimeSeconds": 3600,
      "pid": 12345,
      "nodeVersion": "v20.10.0",
      "memory": { "rss": 104857600, "heapUsed": 52428800, "heapTotal": 73400320, "external": 2097152 },
      "requestCount": 12345
    }
  },
  "meta": { "tier": "public" },
  "errors": []
}
```

**Authenticated response (200)** — same shape, plus a `checks` object and a
`session` block:

```json
{
  "data": {
    "application": "Alaminn.info",
    "environment": "production",
    "version": "5.0.0",
    "status": "ok",
    "timestamp": "2026-07-12T03:00:00.000Z",
    "checks": {
      "database":   { "status": "ok" },
      "migrations": { "status": "ok", "message": "core tables present" },
      "storage":    { "status": "ok", "message": "filesystem accessible" },
      "smtp":       { "status": "ok", "message": "SMTP host configured" },
      "scheduler":  { "status": "not_configured", "message": "…" },
      "cache":      { "status": "ok", "message": "in-memory cache active" },
      "agentHub":   { "status": "not_configured", "message": "…" },
      "webhook":    { "status": "not_configured", "message": "…" },
      "queue":      { "status": "ok", "message": "…" },
      "backup":     { "status": "not_configured", "message": "…" },
      "content":    { "status": "ok", "message": "3 projects · 12 published articles · …" },
      "privateCounts": { "status": "ok", "message": "12 contacts · 5 inquiries · …" },
      "security":   { "status": "ok", "message": "AUTH_SECRET set · session cookies HttpOnly+SameSite · …" }
    },
    "session": { "userId": "…", "role": "SECURITY_AUDITOR", "email": "…" },
    "runtime": { … }
  },
  "meta": { "tier": "authenticated" },
  "errors": []
}
```

If the caller is unauthenticated but the DB is unreachable, the public tier
returns `status: "degraded"` (never the underlying error).

---

## Authentication

### `POST /api/v1/auth/login`

**Auth:** none.
**Rate limit:** 5 failed attempts per 15 minutes per IP hash; 15-minute
lockout after the 5th failure. Successful logins reset the failure counter.

Sign in with email + password. On success, sets an HMAC-signed session cookie
(`alaminn_session`) and returns a redacted session object. Never returns the
password hash.

**Request body:**

```json
{ "email": "owner@alaminn.info", "password": "…" }
```

**Success (200):**

```json
{
  "success": true,
  "message": "Signed in.",
  "data": {
    "user": {
      "id": "clx…",
      "email": "owner@alaminn.info",
      "name": "Al Aminn",
      "role": "OWNER"
    },
    "expiresAt": 1720766400
  },
  "meta": {},
  "errors": []
}
```

The `expiresAt` field is an epoch-second timestamp (8 hours from now).

**Failure responses:**

| Status | `errors` | Cause |
| --- | --- | --- |
| 401 | `["credentials_invalid"]` | Wrong email/password, or account not `active` |
| 403 | `["role_invalid"]` | Account's `role` field is not a valid UserRole |
| 422 | `["credentials_required"]` | Missing email or password |
| 422 | `["input_too_long"]` | Password > 1024 chars (DoS guard) |
| 429 | `["rate_limited_locked"]` | 5+ failures in 15 min — locked for 15 min |

After 3 failed attempts on a known email, a `securityAlert` email is sent to
the account owner (best-effort; failure doesn't crash the login flow).

Audit log entries written: `auth.login_failed` (actor unknown), `auth.login_success`.

---

### `POST /api/v1/auth/logout`

**Auth:** best-effort — clears whatever session cookie is present, even if
invalid. Writes an `auth.logout` audit-log entry if a valid session exists.

**Request body:** none (empty).

**Response (200):**

```json
{
  "success": true,
  "message": "Signed out.",
  "data": null,
  "meta": {},
  "errors": []
}
```

Clears the `alaminn_session` cookie by setting it to an empty value with an
immediate expiry.

---

### `GET /api/v1/auth/session`

**Auth:** none — but returns 401 if no valid session is present.

Returns the current redacted session, used by the Command Center on mount to
detect an existing valid session cookie and skip the login form.

**Success (200):**

```json
{
  "success": true,
  "message": "Session active.",
  "data": {
    "user": { "id": "clx…", "email": "owner@alaminn.info", "name": "Al Aminn", "role": "OWNER" },
    "expiresAt": 1720766400
  },
  "meta": {},
  "errors": []
}
```

**Failure (401):**

```json
{
  "success": false,
  "message": "Not authenticated.",
  "data": null,
  "meta": {},
  "errors": ["unauthenticated"]
}
```

The handler also re-checks the user's status against the DB and returns 401
with `errors: ["session_invalid"]` if the account has been suspended since
the session was issued.

---

## Admin

### `GET /api/v1/admin/dashboard`

**Auth:** `dashboard.view` permission (any authenticated role except
`VIEWER`-without-permissions — every role except unauthenticated gets at
least `dashboard.view`).
**Rate limit:** none.

Returns the full Command Center dataset: recent inquiries, opportunities, AI
tasks, meeting requests, contact/newsletter/pending-approval counts, recent
audit logs, the signed-in session, **and** a 7-day privacy-friendly analytics
summary.

**Response (200):**

```json
{
  "success": true,
  "message": "Dashboard data loaded.",
  "data": {
    "inquiries": [
      { "id": "…", "type": "business-consultation", "status": "new",
        "reference": "ALM-2026-ABCD1234", "createdAt": "2026-07-12T…",
        "contact": { "fullName": "Jane Doe", "organization": "Acme" } }
    ],
    "opportunities": [
      { "id": "…", "title": "business consultation — Jane Doe", "stage": "new",
        "priority": "medium", "contact": { "fullName": "Jane Doe" } }
    ],
    "aiTasks": [
      { "id": "…", "workflow": "seo-article-draft", "objective": "…",
        "status": "awaiting-approval", "sensitivity": "internal",
        "createdAt": "2026-07-12T…", "requesterName": "Al Aminn" }
    ],
    "meetings": [
      { "id": "…", "reference": "MTG-2026-…", "meetingType": "discovery",
        "requestedDate": "2026-07-15T00:00:00.000Z", "requestedTime": "10:00",
        "contactName": "Jane Doe", "contactEmail": "jane@example.com",
        "organization": "Acme", "topic": "…", "status": "new",
        "timezone": "Asia/Dhaka", "createdAt": "2026-07-12T…" }
    ],
    "contacts": 12,
    "newsletters": 8,
    "pendingApprovals": 2,
    "auditLogs": [
      { "id": "…", "action": "auth.login_success", "resource": "user",
        "resourceId": "…", "actorName": "Al Aminn",
        "createdAt": "2026-07-12T…", "meta": "{…}" }
    ],
    "session": {
      "userId": "…", "email": "owner@alaminn.info",
      "name": "Al Aminn", "role": "OWNER", "expiresAt": 1720766400
    },
    "analytics": {
      "totalEvents": 1234,
      "windowDays": 7,
      "windowStartsAt": "2026-07-05T03:00:00.000Z",
      "topEventTypes": [ { "eventName": "page_view", "count": 800 } ],
      "topUtmSources": [ { "source": "linkedin", "count": 120 } ],
      "funnel": {
        "page_view": 800,
        "inquiry_submitted": 5,
        "newsletter_signup": 8,
        "meeting_requested": 2,
        "inquiry_rate": 0.0063,
        "newsletter_rate": 0.01,
        "meeting_rate": 0.0025
      }
    }
  },
  "meta": {},
  "errors": []
}
```

If the analytics DB query fails, the `analytics` field falls back to a
zeroed-out shape so the dashboard still renders.

---

## AI Workspace

### `GET /api/v1/ai/tasks`

**Auth:** `ai_tasks.view` permission (`EXECUTIVE_ASSISTANT`, `AI_REVIEWER`,
`SUPER_ADMIN`, `OWNER`).
**Rate limit:** none.

Lists the 25 most recent AI tasks, newest first.

**Response (200):**

```json
{
  "success": true,
  "message": "AI tasks fetched.",
  "data": {
    "tasks": [
      { "id": "…", "workflow": "seo-article-draft", "objective": "…",
        "status": "awaiting-approval", "sensitivity": "internal",
        "createdAt": "2026-07-12T…", "requesterName": "Al Aminn" }
    ]
  },
  "meta": { "count": 1 },
  "errors": []
}
```

---

### `POST /api/v1/ai/tasks`

**Auth:** `ai_tasks.create` permission (`EXECUTIVE_ASSISTANT`,
`SUPER_ADMIN`, `OWNER`).
**Rate limit:** 10 requests per minute per IP hash.

Creates a new AI task. The requester is the authenticated user. The task
enters `awaiting-approval` status if `approvalRequired` is `true` (default),
or `draft` otherwise.

**Request body:**

```json
{
  "workflow": "seo-article-draft",
  "objective": "Draft a 600-word SEO article on university partnerships in Bangladesh.",
  "prompt": "(optional — defaults to objective)",
  "sensitivity": "internal",           // optional: public|internal|confidential|low|medium|high
  "outputFormat": "markdown",          // optional: markdown|html|json|plain-text
  "approvalRequired": true,            // optional, default true
  "project": "(optional project slug)",
  "deadline": "2026-07-20T00:00:00.000Z"  // optional ISO date
}
```

`workflow` must be one of 44 approved workflows (see `APPROVED_WORKFLOWS` in
`src/app/api/v1/ai/tasks/route.ts`).

**Response (200):**

```json
{
  "success": true,
  "message": "AI task created.",
  "data": {
    "id": "clx…",
    "workflow": "seo-article-draft",
    "objective": "…",
    "sensitivity": "internal",
    "outputFormat": "markdown",
    "approvalRequired": true,
    "project": null,
    "status": "awaiting-approval",
    "createdAt": "2026-07-12T03:00:00.000Z",
    "requestedBy": "owner@alaminn.info"
  },
  "meta": { "requestId": "clx…" },
  "errors": []
}
```

Audit log: `ai-task.created` with the requester's `userId` as `actorId`.

---

### `GET /api/v1/ai/approvals`

**Auth:** `ai_approvals.view` permission (`AI_REVIEWER`, `SUPER_ADMIN`,
`OWNER`).
**Rate limit:** none.

Lists the 25 most recent AI tasks in `awaiting-approval`, `quality-review`,
or `revision-requested` status.

**Response (200):**

```json
{
  "success": true,
  "message": "Approvals fetched.",
  "data": {
    "tasks": [
      { "id": "…", "workflow": "seo-article-draft", "objective": "…",
        "status": "awaiting-approval", "sensitivity": "internal",
        "createdAt": "2026-07-12T…", "requesterName": "Al Aminn" }
    ]
  },
  "meta": { "count": 1 },
  "errors": []
}
```

---

### `POST /api/v1/ai/approvals`

**Auth:** `ai_approvals.decide` permission (`AI_REVIEWER`, `SUPER_ADMIN`,
`OWNER`).
**Rate limit:** none.

Approve, reject, or request revision on an AI task. The reviewer is the
authenticated user.

**Request body:**

```json
{
  "taskId": "clx…",
  "decision": "approved",     // approved | rejected | revision  (also accepts "action")
  "note": "(optional reviewer note)"
}
```

The task's `status` is updated to `approved`, `rejected`, or
`revision-requested` respectively. An `AiApproval` row is created with the
reviewer's `userId`, the decision, and the optional note.

A `aiTaskCompleted` email is sent to the task requester (best-effort).

**Response (200):**

```json
{
  "success": true,
  "message": "Task approved.",
  "data": {
    "id": "clx…",
    "workflow": "seo-article-draft",
    "objective": "…",
    "status": "approved",
    "sensitivity": "internal",
    "decision": "approved",
    "reviewedAt": "2026-07-12T03:01:00.000Z",
    "reviewedBy": "reviewer@alaminn.info"
  },
  "meta": { "taskId": "clx…", "decision": "approved" },
  "errors": []
}
```

Audit log: `ai-task.approved` / `ai-task.rejected` / `ai-task.revision` with
the reviewer's `userId` as `actorId` and the previous/new status in `meta`.

---

## Newsletter

### `POST /api/v1/newsletter`

**Auth:** none.
**Rate limit:** 5 requests per minute per IP hash.

Subscribe an email to the newsletter. Creates a `pending` subscriber with a
random 32-char hex token and sends a verification email.

**Request body:**

```json
{
  "email": "jane@example.com",
  "name": "Jane Doe",                    // optional
  "interest": "executive",               // optional: executive|operations|education|technology|partnership|student|other
  "consent": true,                       // required — must be true
  "utmSource": "linkedin"                // optional
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Subscription received. Please confirm via email.",
  "data": { "status": "pending" },
  "meta": {},
  "errors": []
}
```

If the email already exists, the subscriber record is updated (new token,
status reset to `pending`, name/consent updated).

**Failure responses:** 422 `email_invalid`, 422 `consent_required`, 429
`rate_limited`.

Audit log: `newsletter.subscribed`.

---

### `GET /api/v1/newsletter/verify`

**Auth:** none.
**Rate limit:** none.

Email verification endpoint — the link in the verification email points
here. Validates the token, marks the subscriber as `confirmed`, clears the
token, sends a welcome email, and redirects to the homepage.

**Query parameters:**

```
GET /api/v1/newsletter/verify?token=abcdef0123456789abcdef0123456789
```

The token must match `^[a-f0-9]{32}$i`.

**Redirect responses:**

| Outcome | Redirect target |
| --- | --- |
| Success | `https://alaminn.info/#newsletter?verified=1` |
| Invalid token format | `https://alaminn.info/#newsletter?verified=0&error=invalid_token` |
| Token not found / already confirmed | `https://alaminn.info/#newsletter?verified=0&error=not_found` |
| Server error | `https://alaminn.info/#newsletter?verified=0&error=server` |

The redirect target's domain comes from `env().siteUrl`.

Audit log: `newsletter.confirmed`.

---

## Analytics

### `POST /api/v1/analytics/track`

**Auth:** none.
**Rate limit:** 30 events per minute per IP hash. Over the limit returns 429.

First-party, cookie-less, privacy-friendly analytics ingestion. The client
(`src/lib/analytics.ts`) fires events via `navigator.sendBeacon` (preferred)
or `fetch(..., { keepalive: true })` (fallback).

**Privacy contract:**

- No cookies are set or read.
- The raw IP is **never** stored. Only a sha256 hash (truncated to 16 hex
  chars) is persisted — for rate-limiting and abuse detection. The hash is
  one-way.
- `sessionId` is a client-generated, daily-rotating anonymous ID
  (`YYYY-MM-DD-<8 hex chars>`) stored in the visitor's `localStorage`. It
  carries no personal data.
- UTM parameters are accepted from the request body (the client sends them)
  and persisted for marketing attribution.
- The handler **never throws**. Errors are swallowed and a 204 is returned so
  the client's fire-and-forget `sendBeacon` never surfaces a failure.

**Request body:**

```json
{
  "eventName": "page_view",        // required — must be in the allowlist
  "page": "/#about",                // optional, max 512 chars
  "referrer": "https://linkedin.com/feed",  // optional, max 512 chars (origin+path only)
  "sessionId": "2026-07-12-abcd1234",       // optional, max 64 chars
  "utmSource": "linkedin",         // optional, max 256 chars
  "utmMedium": "social",
  "utmCampaign": "launch",
  "utmContent": "...",
  "utmTerm": "...",
  "meta": { "depth": 75 }          // optional — JSON-serialized, max 4 KB
}
```

**Allowed event names:** `page_view`, `inquiry_submitted`,
`newsletter_signup`, `meeting_requested`, `resource_download`, `cta_click`,
`scroll_depth`, `outbound_click`.

**Response:** always **204 No Content**, even on validation failure, except
for rate-limit which returns **429**. This keeps the client simple and avoids
retry storms.

Other methods (`GET`, `PUT`, `DELETE`, `PATCH`) return 204 as well — the
endpoint is fire-and-forget and noise should not surface to the client.

---

## Meetings

### `POST /api/v1/meetings`

**Auth:** none.
**Rate limit:** 5 requests per minute per IP hash.

Public meeting request endpoint — used by the homepage's
"Schedule a Meeting" modal.

**Request body:**

```json
{
  "meetingType": "discovery",       // required: discovery|strategy|partnership|education
  "requestedDate": "2026-07-15",    // required — YYYY-MM-DD, must be within next 30 days, not Friday
  "requestedTime": "10:00",         // required — must be in VALID_TIME_SLOTS (see below)
  "contactName": "Jane Doe",        // required — min 2 chars
  "contactEmail": "jane@example.com", // required — valid email
  "organization": "Acme",           // optional
  "topic": "Discuss partnership opportunity",  // optional, max 1000 chars
  "utmSource": "linkedin",          // optional
  "utmMedium": "social",
  "utmCampaign": "launch"
}
```

`VALID_TIME_SLOTS`: `09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `11:30`,
`14:00`, `14:30`, `15:00`, `15:30`, `16:00`, `16:30`, `17:00`, `17:30`,
`20:00`, `20:30`, `21:00` (Asia/Dhaka timezone).

**Response (200):**

```json
{
  "success": true,
  "message": "Meeting request received.",
  "data": {
    "reference": "MTG-2026-ABCD1234",
    "id": "clx…",
    "status": "new",
    "meetingType": "discovery",
    "requestedDate": "2026-07-15T00:00:00.000Z",
    "requestedTime": "10:00",
    "contactEmail": "jane@example.com",
    "expectedResponse": "Confirmation within 24 hours with meeting link"
  },
  "meta": {},
  "errors": []
}
```

Sends a `meetingConfirmation` email to the requester (best-effort).

Audit log: `meeting_request.created`.

---

### `GET /api/v1/meetings/admin`

**Auth:** `meetings.view` permission (`EXECUTIVE_ASSISTANT`, `CRM_MANAGER`,
`PARTNERSHIP_MANAGER`, `PROJECT_MANAGER`, `SUPER_ADMIN`, `OWNER`).
**Rate limit:** 30 requests per minute per IP hash.

Lists all meeting requests, newest first. Optional `?status=<status>` filter
(one of `new|confirmed|rescheduled|cancelled|completed`).

**Response (200):**

```json
{
  "success": true,
  "message": "Meeting requests fetched.",
  "data": {
    "meetings": [
      { "id": "…", "reference": "MTG-2026-…", "meetingType": "discovery",
        "requestedDate": "2026-07-15T00:00:00.000Z", "requestedTime": "10:00",
        "timezone": "Asia/Dhaka", "contactName": "Jane Doe",
        "contactEmail": "jane@example.com", "organization": "Acme",
        "topic": "…", "status": "new", "notes": null,
        "utmSource": "linkedin", "utmMedium": "social", "utmCampaign": "launch",
        "createdAt": "2026-07-12T…", "updatedAt": "2026-07-12T…" }
    ],
    "total": 1
  },
  "meta": { "statusFilter": "all" },
  "errors": []
}
```

---

### `PATCH /api/v1/meetings/admin`

**Auth:** `meetings.update` permission (same set as `meetings.view`).
**Rate limit:** 30 requests per minute per IP hash.

Update a meeting request's status. Enforces a state machine — see
`TRANSITIONS` in the route file:

- `new` → `confirmed` | `rescheduled` | `cancelled`
- `confirmed` → `rescheduled` | `cancelled` | `completed`
- `rescheduled` → `confirmed` | `cancelled` | `completed`
- `cancelled` → (terminal)
- `completed` → (terminal)

**Request body:**

```json
{
  "id": "clx…",
  "status": "rescheduled",     // required — must be a valid transition
  "newDate": "2026-07-17",     // required when status === "rescheduled"
  "newTime": "14:00",          // required when status === "rescheduled"
  "notes": "Rescheduled at requester's request."  // optional
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Meeting request rescheduled.",
  "data": {
    "id": "clx…",
    "reference": "MTG-2026-…",
    "status": "rescheduled",
    "requestedDate": "2026-07-17T00:00:00.000Z",
    "requestedTime": "14:00"
  },
  "meta": {},
  "errors": []
}
```

Audit log: `meeting_request.status_changed` with `from`/`to` in `meta`.

---

## Inquiries

### `POST /api/v1/inquiries`

**Auth:** none.
**Rate limit:** 5 requests per minute per IP hash.

Public contact-form submission. Creates or updates a `Contact`, creates an
`Inquiry`, optionally creates an `Opportunity` (non-referral types) or a
`StudentReferral` (referral type), creates a follow-up `Task`, sends a
confirmation email to the inquirer + an internal notification to
`hello@alaminn.info`, and writes an audit log.

**Request body (subset — full schema in the route file):**

```json
{
  "type": "business-consultation",    // required — see Inquiry.type values
  "fullName": "Jane Doe",             // required
  "email": "jane@example.com",        // required — valid email
  "phone": "+8801712345678",          // optional
  "whatsapp": "...",                  // optional
  "organization": "Acme",             // optional
  "role": "CEO",                      // optional
  "country": "Bangladesh",            // optional
  "city": "Dhaka",                    // optional
  "preferredChannel": "email",        // optional
  "currentChallenge": "...",          // optional
  "desiredOutcome": "...",            // optional
  "timeline": "1-3 months",           // optional
  "scope": "...",                     // optional
  "existingSystem": "...",            // optional
  "preferredTime": "...",             // optional
  "notes": "...",                     // optional
  "utmSource": "linkedin",            // optional
  "utmMedium": "social",
  "utmCampaign": "launch",
  "referralSource": "...",
  "privacyConsent": true,             // required
  "commsConsent": true,               // required
  "marketingConsent": false,          // optional
  "studentDataConsent": false,        // required when type === "student-referral"
  "website": ""                       // honeypot — must be empty
}
```

Inquiry `type` enum: `university-partnership | business-consultation |
operations-review | sales-strategy | education-advisory | ai-automation |
crm-digital | tech-collaboration | personal-branding | speaking | media |
student-referral | other`.

Spam heuristics: honeypot field (`website` must be empty), regex on common
spam terms (`viagra|casino|crypto airdrop|http://\S+\.(ru|cn)`).

**Response (200):**

```json
{
  "success": true,
  "message": "Inquiry received.",
  "data": {
    "reference": "ALM-2026-ABCD1234",
    "status": "new",
    "duplicate": false,
    "expectedResponse": "Acknowledgement within one business day"
  },
  "meta": {},
  "errors": []
}
```

If a contact with the same email submitted an inquiry of the same type in the
last 24 hours, `status` is `"reviewing"` and `duplicate` is `true`.

**Failure responses:** 422 (validation), 429 `rate_limited`, 400 `spam`.

Audit log: `inquiry.created`.

---

## Public Content

### `GET /api/v1/public/articles`

**Auth:** none.
**Rate limit:** none.

Lists published articles. With a `?q=<query>` parameter (min 2 chars),
returns up to 5 articles matching the query in `title`, `summary`, or
`category`. Without `q`, returns up to 12 articles, ordered by featured then
publishedAt desc.

**Response (200):**

```json
{
  "success": true,
  "message": "Articles fetched.",
  "data": {
    "articles": [
      { "id": "…", "slug": "operations-systems", "title": "…",
        "summary": "…", "category": "business-operations",
        "tags": "operations,systems", "author": "Al Aminn",
        "readingMinutes": 5, "verificationStatus": "verified",
        "publishedAt": "2026-07-01T…", "featured": true }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

### `GET /api/v1/public/projects`

**Auth:** none.
**Rate limit:** none.

Lists public projects (only those with `visibility: "public"`). With a
`?q=<query>` parameter (min 2 chars), returns up to 5 projects matching
`name`, `subtitle`, or `businessProblem`. Without `q`, returns all public
projects, ordered by featured then createdAt desc.

**Response (200):**

```json
{
  "success": true,
  "message": "Projects fetched.",
  "data": {
    "projects": [
      { "id": "…", "slug": "alo-education-crm", "name": "ALO Education CRM",
        "subtitle": "…", "category": "crm", "shortDescription": "…",
        "approvedRole": "Operations Lead", "status": "active",
        "approvedUrl": "https://…", "featured": true,
        "businessProblem": "…" }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## Root

### `GET /api/`

**Auth:** none.

Default Next.js API root — returns a minimal "Hello, world!" message. Useful
as a smoke test that the API surface is reachable.

**Response (200):**

```json
{ "message": "Hello, world!" }
```

(This endpoint predates the standardized envelope and does not follow it —
it's the default Next.js scaffold. Use `/api/health` for monitoring instead.)

---

## Standard Headers

Every response includes the following headers, set by `src/middleware.ts`:

| Header | Value |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (production only) |
| `X-Request-Id` | Per-request UUID (echoed back; used for log correlation) |

The middleware is **pass-through** — it never blocks, redirects, or rewrites.
Auth, rate limiting, and validation live in the route handlers themselves.

Routes wrapped with `withObservability()` (see `src/lib/observability.ts`)
additionally log an `http_request` structured event with `method`, `path`,
`status`, and `durationMs` on every request.

---

## Rate Limits

All rate limits are in-memory, per IP hash (sha256, truncated to 16 hex chars).
They reset on process restart. This is intentional for a single-host
deployment — for multi-host, replace with a Redis-backed limiter.

| Endpoint | Limit | Window | Lockout |
| --- | --- | --- | --- |
| `POST /api/v1/auth/login` | 5 failures | 15 min | 15 min after 5 failures |
| `POST /api/v1/inquiries` | 5 requests | 1 min | — |
| `POST /api/v1/newsletter` | 5 requests | 1 min | — |
| `POST /api/v1/meetings` | 5 requests | 1 min | — |
| `POST /api/v1/analytics/track` | 30 events | 1 min | — |
| `POST /api/v1/ai/tasks` | 10 requests | 1 min | — |
| `GET /api/v1/meetings/admin` | 30 requests | 1 min | — |
| `PATCH /api/v1/meetings/admin` | 30 requests | 1 min | — |

The login route is the only one that locks out — after 5 failures the IP is
locked for 15 minutes, regardless of which email was attempted.

---

## Error Codes

The `errors` array in the standard envelope carries machine-readable error
codes. Common ones:

| Code | HTTP | Meaning |
| --- | --- | --- |
| `unauthenticated` | 401 | No session cookie, or session invalid |
| `forbidden` | 403 | Authenticated but lacks the required permission |
| `account_inactive` | 401 | User status is not `active` |
| `role_invalid` | 403 | User's role is not in `ALL_ROLES` |
| `credentials_invalid` | 401 | Wrong email or password |
| `credentials_required` | 422 | Missing email or password |
| `rate_limited` | 429 | Over the per-IP rate limit |
| `rate_limited_locked` | 429 | Login locked out (15 min) |
| `input_too_long` | 422 | Password > 1024 chars |
| `not_found` | 404 | Resource doesn't exist |
| `task_not_found` | 404 | AI task ID doesn't exist |
| `invalid_transition` | 400 | Meeting status transition not allowed |
| `spam` | 400 | Honeypot triggered or spam regex matched |
| `server_error` | 500 | Unhandled exception (check `meta.errorId` for log correlation) |
| `method_not_allowed` | 405 | HTTP method not supported on this route |
| `email_invalid` | 422 | Email field failed regex validation |
| `consent_required` | 422 | Newsletter consent not given |
| `<field>_required` | 422 | Missing required field (e.g. `email_required`, `taskId_required`) |
| `<field>_invalid` | 422 | Field value failed validation (e.g. `meetingType_invalid`, `requestedDate_out_of_range`, `requestedDate_weekend`) |

For 500 responses, the `meta` object includes `errorId` (the request ID) so
support staff can locate the exact log lines for the failure without
revealing the underlying exception to the client.
