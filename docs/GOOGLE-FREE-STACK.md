# ALO Education — Google Free Stack

Operator and developer reference for every Google service ALO uses, what each
one costs, what it needs configured, how it connects to the CRM, how to test it,
and what to do when it breaks.

**Cost discipline is the organising principle of this document.** The free-first
mandate means no paid Google product may become a required dependency of the
website or the CRM. Every service below is classified `FREE` (no billing account
at all), `FREE TIER` (free within quota, but a billing account must exist) or
`PAID` (billed usage). Two services fall outside `FREE`, and ALO uses neither.

> **No secret appears anywhere in this file.** Where a credential is required the
> environment variable is named and its Google Console location is given. Values
> live only in the deployment environment.

---

## Contents

1. [At a glance](#1-at-a-glance)
2. [Which Google account and project](#2-which-google-account-and-project)
3. [Environment variables](#3-environment-variables)
4. [GA4 — Google Analytics 4](#4-ga4--google-analytics-4)
5. [GTM — Google Tag Manager](#5-gtm--google-tag-manager)
6. [Search Console](#6-search-console)
7. [Business Profile](#7-business-profile)
8. [YouTube](#8-youtube)
9. [Maps Platform — deliberately not used](#9-maps-platform--deliberately-not-used)
10. [Google Cloud — deliberately not used](#10-google-cloud--deliberately-not-used)
11. [Server-side business conversions](#11-server-side-business-conversions)
12. [Lead attribution](#12-lead-attribution)
13. [Two layers of conversion events](#13-two-layers-of-conversion-events)
14. [Consent and privacy](#14-consent-and-privacy)
15. [Admin module](#15-admin-module)
16. [Environment gating](#16-environment-gating)
17. [Security requirements](#17-security-requirements)
18. [Failure isolation](#18-failure-isolation)
19. [Cost-control procedure](#19-cost-control-procedure)
20. [Troubleshooting](#20-troubleshooting)
21. [Manual console steps](#21-manual-console-steps)

---

## 1. At a glance

| Service | Cost tier | Billing account | Used by ALO | Status |
|---|---|---|---|---|
| Google Analytics 4 | **FREE** | Not required | Yes — primary analytics | Implemented |
| Google Tag Manager | **FREE** | Not required | Yes — primary tag layer | Implemented |
| Search Console | **FREE** | Not required | Yes — SEO measurement | Implemented (API client + ingest) |
| Business Profile | **FREE** | Not required | Yes — location listing | Implemented (inbound webhook + outbound read) |
| YouTube | **FREE** | Not required | Yes — video embedding | Implemented (privacy facade) |
| Maps Platform | **PAID** | **Required** | **No** — deep links instead | Not used, by decision |
| Google Cloud (Run/Scheduler/Storage/Pub/Sub/Secret Manager) | **FREE TIER** | **Required** | **No** — existing VPS stays primary | Not used, by decision |

The live, authoritative version of this table is `GET /api/google/status`, which
reports each service's configured state, cost tier, billing requirement and —
when a credential exists — whether Google actually answered a real API call.

---

## 2. Which Google account and project

ALO needs **one** Google account and **at most one** Cloud project.

| Thing | What ALO expects | Notes |
|---|---|---|
| Google account | A shared ALO-owned account, not a personal one | Ownership must survive staff turnover |
| GA4 property | One **production web** data stream for `https://aloeducation.com` | Create a *separate* property for staging |
| GTM container | One **Web** container for `aloeducation.com` | Owns the GA4 configuration tag |
| Search Console property | A **Domain** property for `aloeducation.com` | Domain properties cover http/https and all subdomains; a URL-prefix property does not |
| Business Profile | One account, one location — the real Dhaka office | Never create a location that is not a real office |
| YouTube | One official channel | Embedding needs no API access |
| Cloud project | **None required** | Only if Cloud or Maps is ever genuinely adopted: `alo-education-production`, dedicated billing, budgets and alerts first |

A service account, if used, belongs to the Cloud project — but a Cloud project
can exist purely to hold that service account **without enabling any billable
API**. Search Console and Business Profile APIs are free and need no billing
account.

---

## 3. Environment variables

All are documented in `.env.example`. Copying the example file verbatim is safe:
placeholder values such as `GTM-XXXXXXX` are **rejected** rather than injected,
so an unedited copy results in `NOT CONFIGURED`, not in a broken container being
loaded on every page.

| Variable | Service | Required | Purpose |
|---|---|---|---|
| `GA4_MEASUREMENT_ID` | GA4 | Yes, to measure anything | `G-…` measurement ID |
| `NEXT_PUBLIC_GA4_ENABLED` | GA4 | Yes | Must be `true` to inject |
| `GA4_API_SECRET` | GA4 | For server conversions | Measurement Protocol secret |
| `GA4_MEASUREMENT_PROTOCOL_SECRET` | GA4 | Alias | Longer spelling, also accepted |
| `NEXT_PUBLIC_GTM_ID` | GTM | Optional | `GTM-…` container ID. **When set, GTM owns the page** |
| `NEXT_PUBLIC_GTM_ENABLED` | GTM | No | `false` disables while keeping the ID |
| `NEXT_PUBLIC_CONSENT_MODE` | Consent | No | Consent Mode v2 (default on) |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Search Console | No | Property URL |
| `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` | Search Console | Yes, for API | Service-account JSON, inline or base64 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Shared | Alternative | Generic spelling |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Shared | Alternative | OAuth path |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Shared | Alternative | OAuth path |
| `GOOGLE_SITE_VERIFICATION_TOKEN` | Search Console | No | Renders the ownership `<meta>` tag |
| `GOOGLE_BUSINESS_ACCOUNT_ID` | Business Profile | No | Account to read |
| `GOOGLE_BUSINESS_WEBHOOK_TOKEN` | Business Profile | **Yes in production** | Inbound review webhook secret; production fails closed without it |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE` | YouTube | No | Channel handle for links |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` | YouTube | No | Channel ID |
| `YOUTUBE_API_KEY` | YouTube | No | Only for a Data API channel feed |
| `ANALYTICS_ALLOW_NON_PRODUCTION` | Gating | No | Staging opt-in; routes events to DebugView |
| `ANALYTICS_CLIENT_ID_SALT` | Conversions | No | Salt for hashing an internal reference into a client id |
| `GOOGLE_CLOUD_PROJECT_ID` | Cloud | No | Unused |
| `GOOGLE_MAPS_API_KEY` | Maps | No | Unused — leave blank |

> **Build-time variables.** `GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GA4_ENABLED`,
> `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GTM_ENABLED` and `NEXT_PUBLIC_SITE_URL` must
> be set when `next build` runs, because 397 routes are statically prerendered
> and their tag markup is fixed at that moment. See §16.

`NEXT_PUBLIC_*` values are embedded in the client bundle. Only identifiers
Google already ships to every browser belong there. No secret may use that
prefix, and none does.

---

## 4. GA4 — Google Analytics 4

| | |
|---|---|
| **Purpose** | Measure how visitors find ALO, what they look at, and which of them become leads |
| **Cost** | **FREE** — no billing account, no quota that costs money |
| **Credentials** | Measurement ID (public), Measurement Protocol secret (server-only) |
| **Variables** | `GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GA4_ENABLED`, `GA4_API_SECRET` |
| **Scopes** | None. The Measurement Protocol is authenticated by secret, not OAuth |

**Frontend connection.** `src/components/analytics/GoogleTags.tsx` is mounted in
`src/app/layout.tsx` and emits plain inline `<script>` elements — not
`next/script`, because `beforeInteractive` is a Pages Router feature and
`afterInteractive` injects during hydration, which can run *after*
`AnalyticsPageView` has already pushed a `page_view` into a `dataLayer` whose
consent defaults are not yet set. Inline scripts guarantee the order the consent
model depends on: defaults, then loader, then configuration, all during HTML
parsing.

`src/components/analytics/AnalyticsPageView.tsx` owns every `page_view`,
including SPA navigations that never reload the document. gtag.js is configured
with `send_page_view: false` so the automatic hit cannot double-count.

**Backend connection.** `src/lib/analytics/server-conversions.ts` posts business
conversions to the Measurement Protocol (see §11).

**CRM connection.** The anonymous `visitorId` from
`src/lib/analytics/visitor.ts` is persisted on `Lead.visitorId`. That is the join
between a GA4 session and a CRM lead, and it carries no personal data.

**Implemented events.** All 19 required events are in the closed vocabulary in
`src/lib/analytics/events.ts`, plus the business conversions. `page_view`,
`course_view`, `university_view`, `scholarship_view`, `visa_page_view` and
`ielts_page_view` are derived from the route by `pageViewEventsFor()`, so no page
can forget them and no page can emit them twice.

**Testing procedure.**

1. Set the variables, deploy to production (or staging with the opt-in).
2. View source and confirm exactly one of `googletagmanager.com/gtm.js` or
   `googletagmanager.com/gtag/js` appears — never both.
3. Open GA4 → Admin → DebugView. Load the homepage: one `page_view`. Navigate
   client-side to `/destinations/uk`: a second `page_view`, with no document
   reload.
4. Load `/course/<slug>`: `page_view` + `course_view` with `course_slug`.
5. Click a WhatsApp link anywhere on the site: `whatsapp_click`. Click a `tel:`
   link: `phone_click`. Both appear in DebugView within seconds.
6. Submit the public enquiry form: `lead_form_start` on first focus,
   `lead_form_submit` with `lead_reference` on success.
7. Confirm `GET /api/google/status` reports `GA4.configured: true`.

**Troubleshooting.**

| Symptom | Cause | Fix |
|---|---|---|
| No hits in DebugView | Not production, or `NEXT_PUBLIC_GA4_ENABLED` not `true` | `/api/google/status` states which; the reason string names the gate |
| Hits appear but reports stay empty | DebugView only; reports need 24–48 h | Wait. Realtime ≠ DebugView ≠ standard reports |
| Double `page_view` | GTM container *and* gtag.js both configured | GTM wins in code. Remove the GA4 config tag from the container **or** unset `NEXT_PUBLIC_GTM_ID` |
| `NOT CONFIGURED` in status | Placeholder ID left in `.env` | Real IDs from GA4 → Admin → Data Streams |

**Cost control.** Nothing to do. GA4 has no billing dimension. Standard GA4 data
retention (2 months by default) should be raised to 14 months in Admin → Data
Settings → Data Retention, which is free and is what makes year-on-year
comparison possible.

---

## 5. GTM — Google Tag Manager

| | |
|---|---|
| **Purpose** | Single tag layer, so adding Google Ads or Meta Pixel later is a container change, not a deploy |
| **Cost** | **FREE** |
| **Credentials** | Container ID (public) |
| **Variables** | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GTM_ENABLED` |
| **Scopes** | None |

**Mutual exclusion is enforced in code, not by convention.**
`resolveTagLoader()` in `src/lib/google/config.ts` returns exactly one loader —
GTM when it is injectable, otherwise gtag.js, otherwise nothing. When GTM wins,
`ga4.injectTags` is forced to `false` at the source of truth, so any code
consulting that flag cannot inject a second GA4 tag beside the container's own.

`AnalyticsPageView` skips the *first* page view under GTM, because the
container's GA4 configuration tag already sent it. Subsequent SPA navigations
are still pushed to `dataLayer`, which the container should forward via a
History Change or custom-event trigger.

The GTM `<noscript>` iframe is **deliberately omitted**: it would fire a page
view for a visitor with JavaScript disabled while consent is still unresolved.

**Testing procedure.** Load the page in GTM's Preview mode. Confirm exactly one
GA4 configuration tag fires, that `page_view` appears once per navigation, and
that no tag fires before `consent_state` resolves.

**Contact-click triggers.** `AnalyticsClickTracker` emits
`whatsapp_click` / `phone_click` / `email_click` with
`lead_source: 'alo-delegated-click'`. Configure a Click trigger in GTM for the
same links **or** rely on the component — not both, or every contact click is
counted twice. The `lead_source` value makes an accidental duplicate visible in
reporting rather than invisible.

---

## 6. Search Console

| | |
|---|---|
| **Purpose** | Measure organic search: clicks, impressions, CTR, position, indexing, sitemaps |
| **Cost** | **FREE** — no billing account |
| **Credentials** | Service-account JSON **or** OAuth refresh token |
| **Variables** | `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON`, `GOOGLE_SITE_VERIFICATION_TOKEN` |
| **Scopes** | `https://www.googleapis.com/auth/webmasters.readonly` — read-only, and nothing more |

**Implementation.** `src/lib/seo/search-console-client.ts` on top of the shared
`src/lib/google/oauth.ts`. Before this, ALO had an analyser
(`src/lib/seo-engine.ts`) and an admin textarea asking a human to paste Search
Console JSON into it. The analyser is reused unchanged; only the data source is
now Google.

| Endpoint | Purpose |
|---|---|
| `GET /api/seo/search-console/status` | Credential **and** live verification |
| `GET /api/seo/search-console/performance` | Clicks, impressions, CTR, position by query/page/country/device/date |
| `GET /api/seo/search-console/sitemaps` | What Google received, and how much it indexed |
| `POST /api/seo/search-console/ingest` | Pull live data → existing opportunity engine → real `SeoOpportunity` rows |

All require `requireSeoStaff` (ADMIN, SUPER_ADMIN, MARKETING, MARKETING_MANAGER)
and are rate limited, because each call spends quota shared across the property.

**Two design points worth knowing.**

*Performance windows end three days ago.* Search Console data lags 2–3 days. A
"last 7 days" query ending today silently truncates and looks like a traffic
collapse. `status` also separates `configured` from `liveVerified`: a
valid-looking service account that was never added to the property passes the
first and fails the second, and reporting only the first would hide the most
common real failure.

*CTR and average position are impression-weighted.* A simple mean would let one
low-impression query dominate a summary.

**Testing procedure.**

1. `GET /api/google/status?live=true` → `SEARCH_CONSOLE.status: PASS` and
   `propertyAccessible: true`.
2. `GET /api/seo/search-console/sitemaps` → `expectedSitemapSubmitted: true`.
3. `POST /api/seo/search-console/ingest` with `{"days":28,"dimension":"query"}`
   → rows fetched and opportunities created, then visible at
   `/api/seo/opportunities`.
4. With no credential, every one of those returns `status: NOT_CONFIGURED` and
   creates nothing.

**Indexing and structured data** are handled separately and were already real:
`src/app/sitemap.ts` (`force-dynamic`, nine sources gated by the public content
policy), `src/app/robots.ts`, and JSON-LD from `src/lib/seo/schema-helpers.ts`.

**robots.txt now disallows 22 paths**, including `/counselor`, `/super-admin`,
`/dashboard`, `/application-manager`, `/student`, `/partner`, `/parent-portal`,
`/university-portal`, `/user-guide` and `/review`. `/review/[token]` matters
most: those are capability links whose token *is* the authorisation, and having
Googlebot request one puts a live token in a crawl log. `/login` and `/register`
are left crawlable deliberately.

Note that robots.txt is **not** access control. It asks well-behaved crawlers not
to fetch; it does not prevent anyone from doing so. Those routes are protected by
authentication.

**Cost control.** Search Console API quota is free and generous. The ingest
endpoint is rate limited so a refresh loop cannot exhaust it.

---

## 7. Business Profile

| | |
|---|---|
| **Purpose** | Keep the real Dhaka office listing accurate; read reviews into the CRM |
| **Cost** | **FREE** |
| **Credentials** | Same Google credential as Search Console |
| **Variables** | `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_BUSINESS_WEBHOOK_TOKEN` |
| **Scopes** | `https://www.googleapis.com/auth/business.manage` |

**Inbound already worked** and was not touched:
`POST /api/marketing/webhooks/google-business` verifies a shared secret with
`timingSafeEqual` and fails closed with a 500 in production when the token is
missing, so a misconfigured deployment rejects rather than accepts unsigned
reviews.

**Outbound is new**: `src/lib/google/business-profile.ts` plus
`GET /api/google/business-profile` returns accounts, locations and reviews read
live from Google — name, category, phone, website, hours, address, rating.

**Read-only by construction.** Nothing in this module can create or edit a
location. The specification forbids inventing locations for SEO, and the absence
of a write path enforces that structurally rather than by policy. Listing edits
must be made in Google Business Profile itself.

**Reviews are the known limitation.** Google never shipped a v1 reviews endpoint;
it restricted the v4 one instead, and since 2022 grants access only to accounts
with **10 or more locations**. ALO is a single-office consultancy, so a reviews
call will normally return 403. That is reported as `NO_ACCESS` with Google's own
reason. An empty list is never substituted, because "no reviews" and "reviews
unavailable" mean different things to a marketing team. Review capture therefore
continues to run through the inbound webhook, which is not subject to that
restriction.

**Testing procedure.** `GET /api/google/business-profile?verify=true` →
`status: READY` and `locationCount: 1`. Then confirm the returned phone, website
and hours match the real listing and the footer.

---

## 8. YouTube

| | |
|---|---|
| **Purpose** | Embed study-abroad guidance on destination, course and service pages |
| **Cost** | **FREE** — embedding needs no API key, no project, no billing account |
| **Credentials** | None for embedding |
| **Variables** | `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`, `YOUTUBE_API_KEY` (optional) |
| **Scopes** | `youtube.readonly` / `youtube.upload` — only if a Data API integration is added |

`src/components/website/YouTubeEmbed.tsx` renders a **click-to-load facade** over
`youtube-nocookie.com`, for three reasons:

1. **Consent.** A raw iframe contacts Google and sets third-party cookies the
   moment the page renders — before any consent choice exists. The facade makes
   zero requests to YouTube until the visitor clicks play, so embedding a video
   cannot silently bypass the analytics consent banner. The click *is* the
   consent, which is why the component does not consult consent state.
2. **Core Web Vitals.** Search Console reports CWV, and an iframe per video is
   among the heaviest things a page can load. The facade ships a thumbnail and
   about 1 KB of markup. Destination pages carry several videos each.
3. **Cost.** `youtube-nocookie.com` needs nothing billable. The Data API is only
   required to *list* videos dynamically, which ALO does not do — the video IDs
   are curated.

An invalid video ID renders an explanation rather than a broken player, because a
placeholder or borrowed ID would otherwise put someone else's video on a public
ALO page. `YouTubeVideoSection` covers the 15 official channel categories (UK,
Canada, Australia, USA and Europe study; Student Visa; IELTS, PTE, TOEFL; English
Learning; University and Course Reviews; Scholarships; Application Guides;
Success Stories) and renders nothing when a filter empties the list.

**No auto-publishing.** Nothing in the codebase uploads to YouTube. Publishing
would require a real authenticated integration with `youtube.upload` scope and an
OAuth consent screen; it does not exist and must not be simulated.

**Testing procedure.** Place a real ALO video ID on a page. Confirm no request to
`youtube-nocookie.com` appears in the network log before the click, and exactly
one after. Confirm the thumbnail loads from `i.ytimg.com` and the CSP allows it.

---

## 9. Maps Platform — deliberately not used

| | |
|---|---|
| **Cost** | **PAID** — requires a Cloud **billing account** |
| **Status** | **Not used, by decision** |

Maps Platform is not free: it needs a billing account, and usage beyond the
monthly credit is billed. ALO's actual need is to show where its office and its
partner universities are, and that is already met at zero cost by "Open in Google
Maps" deep links — `src/app/global-offices/page.tsx`,
`src/components/website/PublicFooter.tsx` and
`src/components/alo/views/public-contact.tsx`.

An embedded map would add a paid dependency, a key that must be restricted, and a
consent problem, in exchange for a convenience visitors can get in one click.

**If Maps is ever enabled**, all of the following are mandatory before the key
reaches a browser:

- Cloud billing account with a **budget and alert thresholds** configured first
- Key restricted by **HTTP referrer** to `https://aloeducation.com/*`
- Key restricted by **API** to only the Maps APIs actually used
- Quota caps set per API
- Key stored server-side and never committed
- `GOOGLE_MAPS_API_KEY` set; `/api/google/status` will then report `MAPS` as
  configured **and flag a PAID service in use**

An unrestricted key in a public bundle is a billing incident waiting to happen.

---

## 10. Google Cloud — deliberately not used

| | |
|---|---|
| **Cost** | **FREE TIER** — free within quota, but a billing account must exist |
| **Status** | **Not used, by decision** |

Cloud Run, Cloud Scheduler, Cloud Storage, Pub/Sub and Secret Manager are all
free *within quota*, but "free tier" is not "no billing account" — enabling any
of them requires one, and overage is billed.

The existing VPS remains the primary runtime and nothing is being moved. ALO
already has its own scheduler: 22 cron job definitions, 16 enabled, with the 6
disabled ones carrying recorded reasons. Replacing that with Cloud Scheduler
would add a billing account, a network dependency and a second place where job
state lives, in exchange for nothing the current system lacks.

**If Cloud is ever adopted**: dedicated project `alo-education-production`,
dedicated billing account, budgets and alerts configured **before** deployment,
only the required APIs enabled, service-account credentials never exposed to the
client, and no secret hard-coded anywhere.

---

## 11. Server-side business conversions

`src/lib/analytics/server-conversions.ts` posts to the GA4 Measurement Protocol.

| Event | Fires from | Trigger |
|---|---|---|
| `generate_lead` | `src/lib/seo/ga4.ts` → shared module | Existing entry point, preserved |
| `lead_qualified` | `src/lib/crm/lead-handlers.ts` | Lead status moves to `qualified`/`hot`, or its score tier does |
| `application_started` | `POST /api/applications` | An application record is created |
| `application_submitted` | `POST /api/applications/[id]/submit` | A staff member with `application_manager` commits it |
| `enrollment_completed` | `PUT /api/crm/applications` | Stage moves **into** `enrolled` |
| `english_test_start` | `POST /api/student-portal/mock-tests` | A mock-test session is created and a credit consumed |

**Guarantees.**

- **No fabricated success.** Without `GA4_MEASUREMENT_ID` *and* `GA4_API_SECRET`
  every call returns `NOT_CONFIGURED`. It never returns `ok: true`, never logs a
  success and never pretends the conversion was measured. A measurement ID alone
  is not enough to post, and is correctly reported as unconfigured.
- **Transitions, not saves.** `enrollment_completed` fires only on the move
  *into* `enrolled`, never on a re-save of an already-enrolled application.
  `lead_qualified` fires only on the transition into a qualified status. An edit
  cannot inflate a count.
- **Environment gated.** Nothing is sent outside production. With
  `ANALYTICS_ALLOW_NON_PRODUCTION=true` on staging, events are sent with
  `debug_mode: true` so they land in DebugView and never in reporting.
- **No PII.** Parameters pass through the same `scrubEventParams` screen as
  client events. The `client_id` is the anonymous visitor token, or a salted
  SHA-256 of an internal reference — never an email, phone number or name.
- **Cannot break the business flow.** Every call is fire-and-forget, bounded by a
  4-second timeout, and returns a status rather than throwing.
- **Secrets never logged.** A `fetch` failure message contains the request URL,
  and that URL carries the API secret, so errors are reduced to a fixed string
  plus the error *name*.

`trackLeadConversion()` in the pre-existing `src/lib/seo/ga4.ts` now delegates
here, removing a second Measurement Protocol implementation that used the raw
`leadId` as the GA4 `client_id` and had no environment gate.

---

## 12. Lead attribution

Sixteen required fields, captured in
`src/lib/attribution/lead-attribution.ts` and persisted on the existing `Lead`
and `LeadForm` models — no second lead database, no bypass of the existing API.

`source`, `medium`, `campaign`, `content`, `term`, `landingPage`, `referrer`,
`gclid`, `fbclid`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`,
`utmTerm`, `firstTouchSource`, `lastTouchSource` — plus `firstTouchMedium`,
`firstTouchCampaign`, `firstTouchLandingPage`, `firstTouchAt`, `lastTouchMedium`,
`lastTouchAt` and `visitorId`.

**Rules.**

- **Nothing is invented.** An unsent parameter stays `null` (or `''` on the
  VARCHAR `LeadForm` columns). No `'direct'` guess is ever persisted; an
  unattributed lead reports `unknown`. A `gclid` proves a paid Google click and
  is recorded as `paidClick`, but `source` is not back-filled with `google`,
  because `Lead.source` is ALO's own acquisition channel (`WEBSITE`,
  `GOOGLE_MAPS`) and means something different from `utmSource`.
- **First touch is immutable.** `mergeAttribution` omits the `firstTouch*`
  columns entirely when they are already set, so a Prisma update cannot rewrite
  them.
- **Last touch advances** on each new conversion, which is what makes a
  multi-touch journey visible.
- **A returning direct visitor cannot blank existing attribution.** When nothing
  new was captured, `mergeAttribution` returns `{}`.
- **Every value is bounded to VARCHAR(191)** with control characters stripped.
  The `referrer` is reduced to a hostname, so no path or query string is stored.
- **URL values beat posted body values**, because a form field is trivially
  forgeable while the URL the visitor actually arrived on is not.

**Why the client sends the landing page.** A form POSTs to `/api/leads`, so the
request URL the server sees is the API path — useless for attribution.
`src/lib/analytics/attribution-payload.ts` therefore has the client state the
page it converted on, with the `referer` header as a server-side fallback.
`rememberEntryAttribution()` keeps the campaign a visitor *arrived* with across
SPA navigation in a multi-step journey, preserving the original `landingPage`
while refreshing last touch.

Migration `20261019100000_lead_acquisition_attribution` is **additive only** —
29 new columns and 6 new indexes across `Lead` and `LeadForm`, no destructive
statement, with a full rollback in the migration file's comments.

---

## 13. Two layers of conversion events

ALO measures conversions twice, deliberately, and the two layers answer
different questions.

| | Client events | Server events |
|---|---|---|
| Examples | `application_start`, `lead_form_submit` | `application_started`, `application_submitted` |
| Fired by | The browser | ALO's API, after the database commits |
| Measures | Visitor intent and UX drop-off | What the business actually recorded |
| Survives an ad blocker | No | Yes |
| Can double-count on retry | Yes | No — transition-gated |

**Business reporting must use the server-side events.** The client events measure
how far a visitor got; the server events measure what happened. Summing the two
would double-count, which is why the names differ.

---

## 14. Consent and privacy

`src/components/analytics/ConsentBanner.tsx` implements Consent Mode v2.

- Tags load with `ad_storage`, `ad_user_data`, `ad_personalization` and
  `analytics_storage` all **denied**, `wait_for_update: 500`.
- **Accept** flushes the held event queue (capped at 50).
- **Reject** discards the queue **and** clears the visitor and session tokens, so
  a refused visitor leaves no analytics identity behind.
- Consent is revocable at any time.
- The preference is stored locally and is never sent as a personal identifier.

**The enquiry-form consent box was fixed.** It previously defaulted to `checked`
*and* was never transmitted to the API — it looked like it granted marketing
permission while doing nothing. It is now unchecked by default, required for
submission, marked with `*`, transmitted as `consent`, and recorded through the
existing `grantConsent()` only when genuinely `true`, after the lead commits so a
consent failure can never roll back a saved enquiry. A pre-ticked box is not
consent.

**What is never sent to Google.** Passport numbers, national IDs, birth
certificates, passwords, card data, bank details, private application documents,
CVs and résumés, transcripts, names, addresses, emails, phone numbers, dates of
birth, CGPA, fee amounts, commissions, salaries, internal notes, medical or
disability information, religion, race, political affiliation, biometrics, IP
addresses and user agents.

Enforcement is a closed allowlist (`ALLOWED_EVENT_PARAMS`, 48 entries) plus a
blocklist, applied by `scrubEventParams()` to **every** event on both the client
and server path. Three layers:

1. **Key blocklist.** Rejects any key matching a forbidden pattern.
2. **Value screening.** Rejects a value that *looks* like an email, a phone
   number, a passport, a card number or a long numeric identifier — whatever key
   it arrived under, because a developer can always pick an innocent key name.
3. **Allowlist.** Anything not explicitly permitted is dropped, and non-primitive
   values are dropped rather than JSON-serialised, because serialisation is how
   nested PII escapes.

Over-long free text is **rejected, not truncated** — truncating would keep 200
characters of whatever a visitor typed into a search box.

Specific choices worth recording:

- The WhatsApp `text=` parameter is never sent. A pre-filled message can contain
  the visitor's own words.
- Search events send facets (`destination`, `study_level`, `intake`,
  `items_count`) but never the raw keyword, because a search box can contain a
  name.
- `lead_reference` and `application_reference` are ALO's own opaque codes
  (`ALO-L-<uuid>`, an application code) — never names or contact details.
- `student_login` and `student_registration` carry only a success flag and a
  portal type.

---

## 15. Admin module

`/admin/google-stack` (`src/app/admin/google-stack/page.tsx`) is the secure
settings and reporting surface. Access goes through the existing
`requireSeoStaff` (ADMIN, SUPER_ADMIN, MARKETING, MARKETING_MANAGER); no new
permission system was invented and no secret is ever returned.

It shows, per service: configured state, cost tier, billing requirement, live
verification, a `PASS / PARTIAL / NOT_CONFIGURED / NOT_VERIFIED / BLOCKED`
verdict, and an actionable reason. Plus the resolved tag loader, the Search
Console top-queries and sitemap views, the Business Profile location read, and
the acquisition-to-enrolment funnel.

**It is a new module rather than an extension of the existing SEO panels**,
because those answer different questions and must not be forked:
`/crm/seo-manager` is the keyword and draft/approval workbench, and the technical
SEO evidence panel checks that the sitemap and robots modules are importable.
This page covers Google *service* configuration and links to both.

**The funnel** (`GET /api/analytics/conversion-funnel`) reports
leads → qualified → applications → enrolments grouped by channel, source,
medium, campaign, landing page or first-touch source. It is built from ALO's own
database, not from GA4. It states its own caveats in every response, including
how many leads could not be joined to an application — without which a 0%
conversion rate is indistinguishable from a broken join.

---

## 16. Environment gating

### Build-time configuration — read this before deploying

`GoogleTags` is a **server component**, and **397 of ALO's 946 routes are
statically prerendered**. Their tag markup is baked in when `next build` runs, so
the following must be present in the **build** environment, not merely at
runtime:

```
GA4_MEASUREMENT_ID, NEXT_PUBLIC_GA4_ENABLED,
NEXT_PUBLIC_GTM_ID, NEXT_PUBLIC_GTM_ENABLED, NEXT_PUBLIC_SITE_URL
```

Setting them only in the runtime environment produces the worst kind of failure:
analytics works on the ~549 dynamic routes and does not exist at all on the 397
static ones — which include the homepage and every destination page, exactly the
pages that matter for organic attribution. It looks intermittent rather than
total, so it tends to be diagnosed as "GA4 is flaky".

`NEXT_PUBLIC_*` values are additionally inlined into the client bundle at build
time and cannot be changed at runtime in any case.

**Rebuild after changing any tag variable**, then confirm by viewing source on a
static page: exactly one of `googletagmanager.com/gtm.js` or `.../gtag/js` should
appear, and the consent defaults should precede it.

### Traffic gating

Analytics must never mix test traffic into the production property.

| Environment | Tags injected | Server conversions |
|---|---|---|
| `development` | Never | Never |
| `test` | Never | Never |
| `staging` / preview | Only with `ANALYTICS_ALLOW_NON_PRODUCTION=true` | Only with that flag, and then to DebugView via `debug_mode` |
| `production` | Yes | Yes |

There is **no** override for development or test. Staging should point at its own
separate GA4 property.

---

## 17. Security requirements

- No API secret, service-account JSON or private key in Git. `.gitignore`
  already excludes `.env*`; credentials live only in the deployment
  environment.
- No private key or secret in any client bundle. Only `NEXT_PUBLIC_*` values are
  embedded, and those are identifiers Google ships to every browser anyway.
- No unrestricted Maps key — because no Maps key at all (§9).
- No hard-coded credentials anywhere in `src/`.
- The inbound Business Profile webhook validates its token with
  `timingSafeEqual` and fails closed in production.
- Public lead endpoints are rate limited (`lead_create`, 5/min/IP); admin Google
  endpoints are rate limited (`admin_settings`, 30/min/IP) because each call
  spends Google quota.
- Every new endpoint authenticates, authorises, validates, returns both success
  and failure shapes, and logs.
- Integration failures are logged. Error messages are sanitised: a `fetch`
  failure message contains the request URL, and for the token endpoint that URL
  carries the credential.
- OAuth requests the **minimum** scope per service — `webmasters.readonly` for
  Search Console, not the read-write scope.
- Student private information, database credentials and server credentials are
  never exposed.
- CSP in `next.config.ts` allows the **minimum** directives per Google origin:
  `script-src` for `googletagmanager.com` and `google-analytics.com`,
  `connect-src` scoped to the GA collect hosts, `frame-src` for
  `youtube-nocookie.com`, `img-src` for `i.ytimg.com`.

Known honest gap, recorded rather than hidden: the CSP still permits
`script-src 'unsafe-inline' 'unsafe-eval'`, which Next.js and Tailwind currently
require. Inline scripts are how the tag bootstrap guarantees its ordering (§4),
so this is a real trade-off, not an oversight.

---

## 18. Failure isolation

No Google integration may break the website or the CRM.

| Failure | Behaviour |
|---|---|
| GA4 or GTM script blocked or unreachable | A plain `<script>` that fails to load simply does not execute. No error handler is needed because there is no code path to fail |
| Consent unresolved | Tags load with everything denied; no data is collected |
| Measurement Protocol unreachable | 4-second timeout, status returned, business transaction already committed |
| Search Console API down or unauthorised | `API_ERROR` / `NO_ACCESS` with Google's reason; the SEO panels keep working on stored data |
| Business Profile API down | Same; the inbound webhook path is independent |
| YouTube unavailable | The facade renders a thumbnail and an explanation; the page is unaffected |
| Maps unavailable | Not applicable — no Maps dependency exists |
| Any analytics call throws | Every `onError` and every server conversion is swallowed and logged |

Server conversions are fired **after** the business transaction commits, so a
Google outage can never roll back a lead, an application or an enrolment.

---

## 19. Cost-control procedure

**Today: nothing to do.** Every service ALO uses is `FREE` and has no billing
dimension. `GET /api/google/status` returns
`costSummary.paidServicesInUse: []`, and `/admin/google-stack` renders a green
"No paid Google service is in use" banner. If that array is ever non-empty the
banner turns red and names the service.

**If Maps or Cloud is ever enabled**, in this order and before deployment:

1. Create the dedicated project `alo-education-production` and a dedicated
   billing account.
2. Set a **budget** with alert thresholds at 50%, 90% and 100%.
3. Enable **only** the APIs actually used.
4. Set **quota caps** per API.
5. Restrict every key by HTTP referrer **and** by API.
6. Never expose a service-account credential to the client.
7. Document the possible overage cost in this file.

Overage risk to record now: Maps Platform's free monthly credit does not make it
free — a high-traffic page with an embedded map can exceed it, and the overage is
billed automatically. That is the specific reason ALO uses deep links instead.

---

## 20. Troubleshooting

| Symptom | First check | Then |
|---|---|---|
| `/api/google/status` says `NOT_CONFIGURED` | The reason string names the exact variable | Placeholder IDs are rejected deliberately |
| Search Console `NO_ACCESS` (403) | Was the service account added as a user **on that property**? | Google never grants access implicitly |
| Search Console connected but the property is missing | `verifyConnection` compares `sc-domain:` and URL-prefix forms | Add the credential to the right property |
| No GA4 hits at all | Environment gate — is this production? | `injectTags` and its reason are in `/api/google/status` |
| Double `page_view` | Is GTM configured *and* does the container hold a GA4 tag? | Code prevents a double *loader*; a duplicate tag inside the container is a container problem |
| Business Profile reviews 403 | Expected for under 10 locations | Use the inbound webhook instead |
| Server conversions not appearing | `GA4_API_SECRET` present? | `NOT_CONFIGURED` is logged at info level, not as an error |
| Funnel shows 0 applications | `leadsWithoutStudentLink` in the response | A lead with no `studentId` cannot be joined — that is a data-linkage gap, not a conversion failure |
| Funnel shows everything as `unknown` | Attribution was added 2026-10-19 and is **not backfilled** | Leads created before that date legitimately have none |

---

## 21. Manual console steps

These cannot be done from code and require a human with account access. None of
them is a substitute for an implementation; all of them are prerequisites for one
to report `PASS`.

1. **GA4** — create the property, add a **web** data stream for
   `https://aloeducation.com`, copy the measurement ID into
   `GA4_MEASUREMENT_ID`, set `NEXT_PUBLIC_GA4_ENABLED=true`, create a
   Measurement Protocol API secret and set `GA4_API_SECRET`. Raise data retention
   to 14 months (free). Mark the key events that matter:
   `generate_lead`, `lead_qualified`, `application_submitted`,
   `enrollment_completed`.
2. **GTM** — create a **Web** container, copy the ID into `NEXT_PUBLIC_GTM_ID`,
   add the GA4 configuration tag **inside the container**, and publish. Decide
   where contact-click triggers live (GTM *or* `AnalyticsClickTracker`, not
   both).
3. **Search Console** — verify the **Domain** property for `aloeducation.com`
   (DNS TXT preferred). Either add the HTML-tag value to
   `GOOGLE_SITE_VERIFICATION_TOKEN`, or rely on DNS. Submit
   `https://aloeducation.com/sitemap.xml`. Create a service account in the Cloud
   project, grant it access **on the property**, export its JSON key into
   `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON`. Confirm
   `/api/seo/search-console/status` reports `verified: true`.
4. **Business Profile** — create the listing for the real Dhaka office with
   accurate name, category, website, phone, hours, services, photos and logo. Set
   `GOOGLE_BUSINESS_ACCOUNT_ID`. Set `GOOGLE_BUSINESS_WEBHOOK_TOKEN` to a random
   string of at least 16 characters and register the webhook URL.
5. **YouTube** — create the channel, organise uploads into the 15 categories, and
   set `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE` and `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`.
   Populate the curated video list with real published video IDs only.
6. **Cloud / Maps** — no action. Leave both unconfigured.

---

*Generated for the ALO Education Google Free Stack implementation. The live
authority for current status is `GET /api/google/status`; this document explains
what that status means and how to change it.*
