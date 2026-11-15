# 03 — Google API inventory

Authoritative, machine-checked companion: `GET /api/google/status` (see
`src/app/api/google/status/route.ts`). That endpoint reports, per service, `configured`,
`costTier`, `billingRequired`, `liveVerified`, `status` and a human-readable `reason`.
This document explains what is behind each row.

**No API is "enabled" by code.** Enabling an API is a Cloud-console action. What this
repository does is *consume* APIs correctly, refuse to pretend when they are unavailable, and
report their state honestly.

---

## 1. Inventory

Legend — **Enabled?**: `n/a (no project needed)`, `operator action`, `not needed`.
**Tested?**: what was actually observed in this environment.

| API | Service id in status | Cost | Billing account | Enabled? | Auth method | Scope / permission | Quota | Test result |
|---|---|---|---|---|---|---|---|---|
| GA4 tag collection (`gtag.js` / GTM) | `GA4`, `GTM` | **FREE** | No | n/a | public Measurement/Container ID | — | none material | **PARTIAL** — bootstrap + consent ordering unit-tested; delivery to Google not observable from the server |
| GA4 Measurement Protocol (`/mp/collect`) | `MEASUREMENT_PROTOCOL` | **FREE** | No | n/a | data-stream API secret | — | abuse-limited by ALO, not Google | **BLOCKED (delivery)** / **PASS (guards)** — NOT_CONFIGURED and environment gate unit-tested; no API secret exists here |
| **GA4 Analytics Data API** (`analyticsdata.googleapis.com`) | `GA4_DATA_API` | **FREE** | No | operator action | service account or OAuth refresh token | `analytics.readonly` | core report tokens per property/day (Google default; ALO makes single-digit calls) | **BLOCKED** — client + endpoint implemented and unit-tested (29 tests); needs a credential and a property |
| Search Console API (`searchconsole.googleapis.com`) | `SEARCH_CONSOLE` | **FREE** | No | operator action | service account or OAuth refresh token | `webmasters.readonly` | per-site daily query quota, far above ALO usage | **BLOCKED** — client + 4 endpoints implemented; needs a credential |
| Business Profile Account Management + Business Information | `BUSINESS_PROFILE` | **FREE** | No | operator action | service account or OAuth refresh token | `business.manage` | low-volume | **BLOCKED** — client + read endpoint implemented |
| Business Profile v4 reviews | — | **FREE** | No | not requested | — | — | — | **NOT REQUIRED** — Google restricts v4 reviews to accounts with 10+ locations; ALO is single-office |
| Business Profile inbound webhook (ALO → Google notifications) | `BUSINESS_PROFILE` detail | **FREE** | No | ALO-side | shared token, `timingSafeEqual` | — | — | **PASS (code)** — fails closed with 500 in production when the token is absent |
| YouTube privacy-enhanced embedding | `YOUTUBE` | **FREE** | No | n/a | none (iframe) | — | — | **PASS (component)** — video-ID validation unit-tested; no real video placed on a page yet |
| YouTube Data API v3 | `YOUTUBE` detail `dataApiConfigured` | **FREE** | No | **not enabled** | API key or OAuth | — | 10k units/day default | **NOT REQUIRED** — ALO curates video IDs; nothing uploads or lists automatically |
| Maps JavaScript / Places / Geocoding / Routes | `MAPS` | **PAID** | **Yes** | **not enabled** | API key | — | billed | **NOT REQUIRED** — see `10-maps-integration.md` |
| Cloud Run / Scheduler / Storage / Pub/Sub / Secret Manager | `CLOUD_RUN`, `CLOUD_SCHEDULER`, `CLOUD_STORAGE`, `PUBSUB`, `SECRET_MANAGER` | **FREE TIER** | **Yes** | **not enabled** | — | — | — | **NOT REQUIRED** — the existing VPS + 17 cron definitions already do this |
| Google Ads conversion API | — | FREE API, PAID ads | Yes (ads) | n/a | — | — | — | **NOT REQUIRED** — no Ads account; GTM is ready for it |
| Indexing API | — | FREE | No | not enabled | — | — | — | **NOT REQUIRED** — restricted to JobPosting/BroadcastEvent; misuse risks the property |
| CrUX / Core Web Vitals field data | via Search Console | FREE | No | operator action | same credential | `webmasters.readonly` | — | **BLOCKED** — needs the Search Console credential |

## 2. The credential model (one credential, three APIs)

`src/lib/google/oauth.ts` is the only place a token is minted.

| Mode | Env | Notes |
|---|---|---|
| Service account | `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` (alias `GOOGLE_SERVICE_ACCOUNT_JSON`), inline JSON **or** base64 | RS256 self-signed JWT → access token. Must be added to each Google product *separately*; Google never inherits a project grant |
| OAuth refresh token | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_OAUTH_REFRESH_TOKEN` (alias `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`) | One consented refresh |
| None | — | Every consumer returns `NOT_CONFIGURED`; no request is attempted |

Token cache is per scope with a 60-second expiry margin, and a 401 triggers exactly **one**
forced-refresh retry — not a loop.

## 3. Why one credential serves three APIs

The three read APIs need three different scopes but the same *identity*. Minting a token per
API from the same service account is cheap and correct; minting a *credential* per API would
mean three keys to rotate, three places to leak one from, and three chances to forget to add
the service account to a property. `googleApiRequest(scope, url, init)` therefore takes the
scope as an argument.

| API client | Scope constant | Where |
|---|---|---|
| Search Console | `SEARCH_CONSOLE_SCOPE` (`webmasters.readonly`) | `src/lib/seo/search-console-client.ts` |
| Analytics Data | `GA4_DATA_API_SCOPE` (`analytics.readonly`) | `src/lib/google/analytics-data.ts` |
| Business Profile | `SCOPE_BUSINESS_PROFILE` (`business.manage`) | `src/lib/google/business-profile.ts` |
| YouTube (only if ever enabled) | `SCOPE_YOUTUBE_READONLY` / `SCOPE_YOUTUBE_UPLOAD` | `src/lib/google/oauth.ts` |

## 4. Analytics Data API — what was added and how it is constrained

`src/lib/google/analytics-data.ts` + `GET /api/google/analytics/report`.

| Constraint | Why |
|---|---|
| `ALLOWED_DIMENSIONS` / `ALLOWED_METRICS` allowlists | The endpoint takes a query string. Without an allowlist it is an open query proxy into the property. An unknown field also produces an opaque Google 400, which looks like an outage |
| Numeric property-id validation | `G-ABCDE12345` (the measurement ID) is the mistake operators actually make; it is rejected locally with a reason instead of being sent to Google |
| Named presets | The dashboard shows the same definitions every time, so a number quoted in a report can be reproduced |
| `metricAggregations: ['TOTAL']` | Totals are Google's own aggregate. Summing a dimensioned report client-side double-counts under sampling |
| `sampled` from `metadata.dataLossFromOtherRow` | Prevents a partial figure being presented as exact ("(other)" row present) |
| Named failure states (`NOT_CONFIGURED`, `NO_ACCESS`, `AUTH_FAILED`, `API_ERROR`, `TIMEOUT`) | `NO_ACCESS` names the two real causes: API not enabled for the project, or the service account is not a Viewer on the property |
| `rows: []` with `status: READY` | A genuinely empty property is distinguishable from a failed request. A dashboard that renders zeroes for both is how teams conclude "analytics is broken" incorrectly |
| Read-only scope | A reporting read can never modify the property |

## 5. How to verify each API yourself (operator runbook)

```bash
# 1. Configuration only, no outbound call
curl -s -H "Cookie: <staff session>" https://aloeducation.com/api/google/status | jq '.services'

# 2. Live verification — makes one real call per configured service
curl -s -H "Cookie: <staff session>" \
  "https://aloeducation.com/api/google/status?live=true" | jq '.services | map_values({status, liveVerified, reason})'

# 3. GA4 reporting
curl -s -H "Cookie: <staff session>" \
  "https://aloeducation.com/api/google/analytics/report?preset=acquisition&startDate=28daysAgo&endDate=yesterday" | jq '{status,rowCount,rows: .rows[:3]}'

# 4. Search Console performance
curl -s -H "Cookie: <staff session>" \
  "https://aloeducation.com/api/seo/search-console/performance?days=28&dimensions=query" | jq '{status, totals}'
```

A `BLOCKED`/`NO_ACCESS` answer here is the correct behaviour, not a bug: it means Google did
not answer, and ALO does not substitute a zero for that.

## 6. Quota and rate-limit posture

| Protection | Where |
|---|---|
| Per-route rate limiting on every Google-reporting endpoint | `rateLimitMiddleware(request, 'admin_settings')` in `src/app/api/google/status`, `…/analytics/report`, `…/seo/search-console/*` |
| Bounded row limits | `limit` clamped to 1–10,000; Search Console `rowLimit` clamped to 1–25,000 |
| Request timeouts | 15s for reporting APIs, 4s for Measurement Protocol (`DEFAULT_TIMEOUT_MS`) |
| No retry storms | A single 401 retry; no exponential retry loop anywhere |
| No background polling of Google | Dashboards fetch on operator action only; nothing calls Google from a cron job |
