# 11 — Security and RBAC

Scope: the Google integration surfaces added or changed in this pass, plus the RBAC they use.

---

## 1. Permissions — added to the existing RBAC catalogue

`src/lib/permissions.ts` now has a `google` module. These are the permissions the
specification names, with no extra ones invented:

| Permission id | Grants | Granted to |
|---|---|---|
| `google.integrations.view` | See connection status, cost tier, billing requirement per service | `super_admin` (via the whole catalogue), `marketing_manager` |
| `google.integrations.manage` | Change integration configuration surface (never read a credential) | `super_admin` |
| `google.analytics.view` | Read GA4 reporting through the Analytics Data API | `super_admin`, `marketing_manager` |
| `google.search_console.view` | Read Search Console performance / sitemaps / indexing | `super_admin`, `marketing_manager` |
| `google.maps.manage` | Manage Maps configuration. Exists so Maps could never be activated without it | `super_admin` |
| `google.youtube.manage` | Manage channel configuration and video IDs | `super_admin` |
| `google.billing.view` | See cost tier / billing requirement / quota exposure | `super_admin` |
| `google.audit.view` | See the audit trail of integration changes and failures | `super_admin` |

`super_admin` inherits the catalogue by construction (`DEFAULT_ROLE_PERMISSIONS.super_admin =
PERMISSION_CATALOG.map(p => p.id)`), so no separate grant list was edited for it.

### Enforcement helper — `src/lib/google/access.ts`

`requireGoogleAccess(request, permission)` **layers** the granular permission on top of the
pre-existing `requireSeoStaff` gate rather than replacing it:

1. If the existing SEO/staff gate admits the caller → admitted (so no working dashboard can
   break, and no account loses access it had before).
2. Otherwise the caller needs the explicit `google.*` permission. This is how a non-staff
   role — a branch manager, say — can be granted analytics read without also being made SEO
   staff.
3. Mutations additionally require a same-origin request.

Applied to the new endpoint `GET /api/google/analytics/report` with
`google.analytics.view`. The existing Search Console, status and Business Profile endpoints
keep their existing guards unchanged.

**No permission grants access to a secret.** There is no endpoint that returns a credential
value, and none was added. `GET /api/google/status` returns presence booleans, a
service-account *email* (not a key), and public identifiers only.

## 2. Secrets management

| Secret | Where it lives | Where it must never appear |
|---|---|---|
| Service-account JSON / key | deployment secret store → `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` (inline or base64) | Git, logs, API responses, chat, screenshots |
| `GA4_API_SECRET` | deployment secret store | same |
| `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | deployment secret store | same |
| `GOOGLE_MAPS_API_KEY` | server env only (no `NEXT_PUBLIC_` alias exists) | the client bundle |
| Shared webhook token (Business Profile inbound) | deployment secret store | logs; comparison uses `timingSafeEqual` |

### Rules enforced in code

- **No `NEXT_PUBLIC_` secret.** Public identifiers exposed to the browser are limited to the
  GA4 Measurement ID, the GTM container ID and the YouTube channel handle — all public by
  Google's design. Verified: no `NEXT_PUBLIC_*SECRET*` / `*KEY*` name exists in the Google
  modules.
- **Error messages never carry a credential.** A failed token request produces a fixed string
  plus the error *name*, because a `fetch` failure message includes the URL — and for the token
  endpoint that URL is the credential.
- **The Measurement Protocol URL (which contains the API secret) is never logged.** A failure
  is reduced to `Measurement Protocol request failed (<error name>)`.
- **Configuration is reported, never echoed.** `describeGoogleCredential()` returns
  `{mode, configured, serviceAccountEmail, reason}`.

## 3. OAuth and API restrictions

| Control | Implementation |
|---|---|
| Least-privilege scopes | `webmasters.readonly`, `analytics.readonly`, `business.manage`, `youtube.readonly` (unused). No write scope is requested for reporting |
| Token cache | Per scope, invalidated 60s before expiry; a 401 forces exactly **one** refresh retry, then fails — no loop |
| Timeouts | 15s reporting APIs, 4s Measurement Protocol |
| No credential sharing across environments | Config is read per request from `process.env`; nothing is baked into a build artefact |
| Key rotation | A service-account key can be replaced without a code change; documented cadence of 90 days in `02` |
| Cloud project separation (recommended) | The analytics/search project holds no billing account; if Maps were ever adopted it must use a different project |

## 4. API endpoint protection

| Endpoint | Auth | Rate limit | Returns on failure |
|---|---|---|---|
| `GET /api/google/status` | staff gate | `admin_settings` bucket | `NOT_CONFIGURED` / `BLOCKED` with reason; never a fake PASS |
| `GET /api/google/analytics/report` | `google.analytics.view` (via staff gate) | `admin_settings` bucket | `NOT_CONFIGURED` / `NO_ACCESS` / `AUTH_FAILED` / `API_ERROR` / `TIMEOUT`; `404`-free, no zeroes |
| `GET /api/seo/search-console/*` | staff gate | as existing | as above |
| `POST /api/seo/search-console/ingest` | staff gate + same-origin | as existing | refuses without data |
| `GET /api/google/business-profile` | staff gate | as existing | as above |
| `POST /api/marketing/webhooks/google-business` | shared token, `timingSafeEqual` | n/a | **fails closed with 500 in production** when the token is unset |

No Google-reporting endpoint is public. None accepts a credential as a parameter.

## 5. Data-protection guarantees on the analytics path

Layers, in order of execution, all **before** anything leaves the browser or server:

1. Closed event vocabulary (`ANALYTICS_EVENT_NAMES`) — an invented event name is rejected.
2. Parameter allowlist — unknown keys dropped.
3. Forbidden-key patterns including `passport`, `nid`, `national_id`, `password`, `token`,
   `card`/`credit`/`debit`/`cvv`, `bank`, `email`, `phone`, `name` (unanchored so
   `mother_name` is caught), `address`, `dob`, `document`, `cv`, `resume`, `scan`,
   `transcript`, `cgpa`, `note`, `medical`, `disabilit`, `biometric`, `ip_address`,
   `user_agent`.
4. Forbidden value shapes — email, Bangladeshi mobile, generic phone, passport/NID pattern,
   card digit runs, any 10–17 digit id, anything >200 chars — rejected whatever the key.
5. Server-side: `sendServerEvent` re-runs the **same** screen, and the `client_id` is an
   anonymous token or a salted SHA-256 of an internal reference.

No student-level record is transmitted to Google, in either direction, at any point.

## 6. Audit trail

| Event class | Where recorded |
|---|---|
| Application stage changes (the new analytics emit is attached here) | existing `AuditLog` row `UPDATE_APPLICATION_STATUS`, with before/after values |
| Document link/upload | existing `AuditLog` row `LINK_APPLICATION_DOCUMENT` |
| Analytics transmission failures | structured `console.info` / `console.error` with event name and status only — never a payload, never a secret |
| Google configuration changes | the change itself is a Git commit; the status endpoint reports the resulting state |
| Credential rotation | not automated; a manual procedure with a documented owner (see `12-billing-and-cost-control.md` §5) |

Dedicated `google.audit.view` permission exists for a future audit surface; the data is already
in `AuditLog`, but **no Google-specific audit UI was built** — stated as `MISSING` in
`15-final-implementation-report.md` rather than implied.

## 7. Verification performed

| Check | Result |
|---|---|
| `node --test tests/secret-findings.test.mjs tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` | 25/25 pass |
| Manual secret-pattern scan of every file changed in this pass (`AIza…`, `ghp_…`, `sk-…`, `-----BEGIN … PRIVATE KEY`, `client_secret=…`, `api_secret=…`) | **0 real findings** — the only `PRIVATE KEY` matches are pre-existing dummy fixtures in `tests/unit/google-stack.test.ts` |
| `grep NEXT_PUBLIC_*SECRET|*KEY` across Google modules | none |
| Tests asserting unconfigured requests make no network call | pass (`tests/unit/google-analytics-data-api.test.ts`) |
| PII screen drops file names, document ids, free-text reasons | pass |

## 8. Residual risks (stated, not hidden)

| Risk | Mitigation | Residual |
|---|---|---|
| A developer adds a PII field to an event | Allowlist + patterns + value screen, all unit-tested | A *new* allowlisted key could be added carelessly; the tests require deliberate action |
| Service-account key leaks | Server-side only; 90-day rotation | Not automated; depends on the rotation actually being performed |
| Consent banner bypass on a new page | Banner is mounted in the root layout | A page rendered outside that layout would bypass it |
| Webhook token unset in production | Fails closed with 500 | Availability depends on configuration being completed |
| Maps key set by mistake | Server-side only, never rendered | Would still be billable if some future code added the SDK |
