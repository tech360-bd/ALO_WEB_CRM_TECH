# 12 — Billing and cost control

**Governing rule:** no paid Google service may become a dependency. **No billing account was
created, and none is required by anything ALO actually runs.**

The live, authoritative version of this table is `GET /api/google/status` →
`services[*].costTier` / `billingRequired` and its `costSummary` block, fed from
`GOOGLE_SERVICE_COSTS` in `src/lib/google/config.ts`.

---

## 1. Service classification

| Service | Tier | Billing account | In use? | Current usage | Free allowance / limit | Billing status | Estimated exposure | Last checked |
|---|---|---|---|---|---|---|---|---|
| GA4 (Standard property, tag collection) | **FREE** | Not required | **Yes** | Unknown — no property exists yet | No event-volume limit; 360 is the paid tier and is not used | None | **BDT 0** | 2026-11-15 (config audit) |
| GTM (web container) | **FREE** | Not required | **Yes** | 1 container planned | No limit | None | **BDT 0** | 2026-11-15 |
| GA4 Measurement Protocol | **FREE** | Not required | **Yes** | 0 events (unconfigured) | Free; no published cap for reasonable volume | None | **BDT 0** | 2026-11-15 |
| GA4 **Analytics Data API** | **FREE** | Not required | **Yes (new this pass)** | 0 calls (unconfigured) | Core report tokens per property per day (Google default); ALO makes single-digit calls per operator action | None | **BDT 0** | 2026-11-15 |
| Search Console API | **FREE** | Not required | **Yes** | 0 calls (unconfigured) | Per-site daily query quota, far above ALO usage | None | **BDT 0** | 2026-11-15 |
| Business Profile API | **FREE** | Not required | **Yes** | 0 calls (unconfigured) | Low-volume quota | None | **BDT 0** | 2026-11-15 |
| YouTube embedding | **FREE** | Not required | **Yes** | n/a | No limit | None | **BDT 0** | 2026-11-15 |
| YouTube Data API v3 | **FREE** | Not required | **No** | 0 | 10,000 units/day default | Not enabled | **BDT 0** | 2026-11-15 |
| Maps Platform (JS / Places / Geocoding / Routes) | **PAID** | **Required** | **No** | 0 | No billing-free tier | No billing account | **BDT 0 now; unbounded if adopted** | 2026-11-15 |
| Cloud Run / Scheduler / Storage / Pub/Sub / Secret Manager | **FREE TIER** | **Required** | **No** | 0 | Monthly free allowances | No billing account | **BDT 0 now; unbounded if adopted** | 2026-11-15 |
| Google Ads | PAID (media) | Required | **No** | 0 | n/a | No account | n/a | 2026-11-15 |

`paidServicesInUse` in the status response is therefore **empty**, and that is the single
number to check when the question is "is ALO paying Google for anything?".

## 2. What could create a charge — and what prevents it

| Path to a charge | Prevention in place | Residual risk |
|---|---|---|
| Attaching a billing account to the Cloud project | Nothing in code attaches one; this is a console action requiring a human with Billing Admin | A human could attach one. **No code can prevent that** |
| Enabling Maps and embedding it | No Maps SDK call exists; the key is read server-side and never rendered; `MAPS.optional = true`; cost note in the config says PAID | A future developer could add the SDK. The pre-flight checklist in `10-maps-integration.md` is the control |
| GA4 360 | Not purchased; Standard property is the documented choice | — |
| BigQuery export of GA4 | Not configured | — |
| API abuse by an attacker hitting ALO's reporting endpoints | Rate limiting + staff-only auth + bounded row limits (see `03` §6) | An authenticated malicious staff member could burn quota; it cannot create cost |
| A leaked API key used by someone else | No billable key exists in this system | — |

## 3. Budget guidance if a billing account is ever created

Sequenced, and none of it is optional if Maps or Cloud is adopted:

1. **Written director approval first**, naming the feature that needs it.
2. Dedicated Cloud project — never the project that holds analytics/search credentials.
3. Billing account attached to that project only.
4. **Budget alert** at a low threshold (e.g. 50% of the intended monthly ceiling) with at least
   two named recipients.
5. **Per-API daily quota caps** set below the budget. **This is the only real ceiling** —
   budget alerts are notifications, not hard stops. A quota cap degrades the feature; a budget
   alert merely tells you afterwards.
6. API key restricted by **HTTP referrer and by API**.
7. Monthly review of usage against quota, recorded with a date.
8. Written statement of what one unit of overage would cost, re-checked at adoption time.

**Never promise that any Google service is permanently free.** Pricing and free allowances
change; this document dates its claims (2026-11-15) for exactly that reason.

## 4. Quota control inside ALO (independent of Google's quotas)

| Control | Where |
|---|---|
| Per-route rate limiting on every Google-reporting endpoint | `rateLimitMiddleware(request, 'admin_settings')` |
| Row-limit clamps | Analytics Data API `limit` 1–10,000; Search Console `rowLimit` 1–25,000 |
| Request timeouts | 15s reporting, 4s Measurement Protocol |
| Dashboards fetch on demand only | The GA4 acquisition panel is explicitly **not** part of the initial load — each call costs quota |
| No cron job calls Google | Verified: none of the 17 cron definitions calls a Google API |
| No retry loops | One 401 retry; no exponential backoff storms |

## 5. Ongoing cost-control procedure

| Cadence | Action | Owner |
|---|---|---|
| Monthly | `GET /api/google/status` → confirm `costSummary.paidServicesInUse` is empty | Marketing manager |
| Monthly | Review quota/usage per service in the respective console | Marketing manager |
| Quarterly | Rotate the service-account key and the Measurement Protocol secret | Operations lead |
| On any new integration | Re-read §1 and add a row **before** configuring it | Whoever proposes it |
| Before any billing change | Director approval, recorded | Director |

## 6. Honest statement of exposure

- **Today:** ALO's Google spend is **zero**, and nothing in the codebase can change that.
  There is no billing account, no billable API, and no code path that would bill.
- **If the operator enables Maps or Cloud without following §3:** exposure becomes unbounded
  and is not mitigated by anything in this repository. That is why Maps is documented as a
  decision, not an omission.
- **Analytics/reporting volume risk:** quota exhaustion, not cost. The failure mode is a
  `429`/quota error surfaced honestly by the status and report endpoints.
