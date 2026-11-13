# ALO EDUCATION — GOOGLE STACK IMPLEMENTATION REPORT

**Repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Branch:** `arena/11fdac10-alo-web-crm-tech`
**Base commit:** `c2ca1d0c47cc84915044bb65c2847dfc01695f87`
**Date:** 2026-10-19
**Companion documents:** `docs/GOOGLE-STACK-AUDIT.md` (what was found),
`docs/GOOGLE-FREE-STACK.md` (how to operate it)

**Status vocabulary used throughout:** `PASS` (implemented and verified),
`PARTIAL` (implemented, verification incomplete or scope deliberately reduced),
`MISSING` (required and not implemented), `BLOCKED` (cannot be completed from
this environment), `NOT REQUIRED` (genuinely out of scope).

> **Read this first.** No Google credential of any kind exists in this
> environment, and there is no database connection. Every item that depends on a
> live Google account or a live database is therefore reported `BLOCKED`, not
> `PASS`. Code that compiles, type-checks and passes unit tests is not the same
> thing as an integration that has been observed working against Google, and this
> report does not claim otherwise.

---

## Part 1 — Existing integrations found

Established by audit before any code was written (`docs/GOOGLE-STACK-AUDIT.md`).

| Found | Location | Real state |
|---|---|---|
| GA4 config reader | `src/lib/seo/ga4.ts` | `getGA4Config()` real; `ga4Script()` **dead code with zero render-path callers**; `trackLeadConversion()` zero callers |
| Measurement Protocol sender | `src/lib/seo/ga4.ts` | Present but unused, used the raw `leadId` as the GA4 `client_id`, no environment gate |
| SEO opportunity engine | `src/lib/seo-engine.ts` | Real and pure — consumes caller-supplied rows, **no Google API call anywhere in it** |
| SEO admin surfaces | `src/app/api/seo/{health,opportunities,stats,keywords*,tasks*}`, `/admin/seo/{link-health,orphan-pages}`, `/crm/seo-manager` | Real; `POST /api/seo/opportunities` asked a human to paste Search Console JSON |
| Organisation JSON-LD | `src/lib/seo/schema-helpers.ts` | `organizationSchema()` **defined but never rendered anywhere** |
| robots.txt | `src/app/robots.ts` | Real generator; disallowed only `/api`, `/admin`, `/crm` |
| sitemap.xml | `src/app/sitemap.ts` | Real, `force-dynamic`, nine sources gated by the public content policy |
| Business Profile **inbound** | `src/app/api/marketing/webhooks/google-business/route.ts` | Real and well built: `timingSafeEqual`, fails closed with 500 in production |
| Maps deep links | `global-offices/page.tsx:79`, `alo/views/public-contact.tsx:259`, `website/PublicFooter.tsx:328` | Real, zero-cost, no API key |
| Staff access control for SEO | `src/lib/seo/request-access.ts` | Real — `requireSeoStaff` |
| Rate limiting | `src/lib/rate-limiter.ts` | Real, already applied to lead intake |
| Lead scoring / counsellor assignment | `src/lib/crm-automation.ts` | Real — `scoreLead`, `autoAssignCounselor`, `createFollowUpTask`, `findDuplicateLead` |
| Marketing consent | `src/lib/marketing-consent.ts` | Real — `grantConsent()`, audit-logged; **never called from any lead route** |

**Found to be absent entirely:** any analytics script on any page, any GTM
container, Consent Mode, a cookie banner, a Search Console API client, any
outbound Business Profile call, any YouTube embed component, lead attribution of
any kind, a `google-site-verification` meta tag, and any Google entry in the CSP.

`grep -rln "gtag|dataLayer|googletagmanager" src/` returned **2 files**, neither
on a render path. The site was producing **zero** GA4 page views while
`docs/GOOGLE_SEO_SETUP.md` line 36 claimed otherwise. That document's claim was
false and the file is superseded by `docs/GOOGLE-FREE-STACK.md`.

---

## Part 2 — New integrations implemented

| Integration | Files | Verification |
|---|---|---|
| Shared Google OAuth 2.0 (service-account JWT + refresh token, per-scope cache, 401 retry) | `src/lib/google/oauth.ts` | **PARTIAL** — unit-tested on credential parsing; token exchange needs a real credential |
| Google stack configuration + environment gating + tag-loader arbitration | `src/lib/google/config.ts` | **PASS** — 20 unit tests |
| GA4 tag injection, Consent Mode v2 bootstrap | `src/components/analytics/GoogleTags.tsx`, `src/app/layout.tsx` | **PARTIAL** — build-verified; network delivery not observed |
| Consent banner, revocable, clears identity on reject | `src/components/analytics/ConsentBanner.tsx` | **PARTIAL** |
| Page-view ownership + route-derived events | `src/components/analytics/AnalyticsPageView.tsx`, `src/lib/analytics/{events,page-context,visitor,client}.ts` | **PASS** for detection logic (unit-tested); **PARTIAL** for delivery |
| Site-wide contact-click tracking | `src/components/analytics/AnalyticsClickTracker.tsx` | **PASS** for classification (unit-tested); **PARTIAL** for delivery |
| Event/parameter allowlist + three-layer PII screen | `src/lib/analytics/events.ts` | **PASS** — unit-tested |
| Search Console API client | `src/lib/seo/search-console-client.ts` | **BLOCKED** — needs a credential |
| Search Console endpoints (status, performance, sitemaps, ingest) | `src/app/api/seo/search-console/*/route.ts` | **BLOCKED** |
| Business Profile outbound client | `src/lib/google/business-profile.ts` | **BLOCKED** |
| Business Profile read endpoint | `src/app/api/google/business-profile/route.ts` | **BLOCKED** |
| YouTube privacy-enhanced embed + category section | `src/components/website/YouTubeEmbed.tsx` | **PASS** for ID validation (unit-tested); **PARTIAL** — no real video placed on a page yet |
| Server-side Measurement Protocol conversions | `src/lib/analytics/server-conversions.ts` | **PASS** for guard behaviour (unit-tested); **BLOCKED** for delivery |
| Lead attribution capture / merge / persistence | `src/lib/attribution/lead-attribution.ts`, `src/lib/analytics/attribution-payload.ts` | **PASS** — 24 unit tests |
| Attribution wired into every lead-intake path | 5 API routes, 2 client forms, `registration-lead.ts`, `canonical-student.ts`, `portal-store.ts` | **PASS** — type-checked, unit-tested at the library level |
| Conversion funnel engine | `src/lib/analytics/conversion-funnel.ts` | **PASS** — 13 unit tests against a stub client |
| Funnel endpoint | `src/app/api/analytics/conversion-funnel/route.ts` | **BLOCKED** — the engine is unit-tested against a stub client; the HTTP route has not been exercised against a populated database, and CI's smoke test does not call it |
| Aggregate status endpoint | `src/app/api/google/status/route.ts` | **PARTIAL** — compiles; live checks blocked |
| Admin module | `src/app/admin/google-stack/page.tsx` | **PARTIAL** — compiles; not exercised in a browser |
| robots.txt hardening | `src/app/robots.ts` | **PASS** — see Part 15 |
| Organisation JSON-LD now actually rendered | `src/app/layout.tsx` | **PASS** |
| Site-verification meta tag support | `src/app/layout.tsx`, `src/lib/google/config.ts` | **PARTIAL** — needs a real token |
| CSP for Google origins | `next.config.ts` | **PASS** |

---

## Part 3 — Not implemented

| Item | Status |
|---|---|
| Google Ads conversion tagging | **NOT REQUIRED** — the specification asks that GTM be *ready* for it, not that it be configured. No Ads account exists |
| Meta Pixel | **NOT REQUIRED** — same reasoning |
| YouTube Data API integration (channel feed, upload) | **MISSING by decision** — embedding needs no API. A feed would need an API key and an OAuth consent screen; nothing publishes automatically |
| Cloud Run / Scheduler / Storage / Pub/Sub / Secret Manager | **NOT REQUIRED** — see Part 12 |
| Maps JavaScript API / embeds | **NOT REQUIRED** — see Part 11 |
| Core Web Vitals *field* data collection | **MISSING** — CWV field data comes from the CrUX dataset via Search Console, which requires the blocked credential. No `web-vitals` reporting was added, because adding it would create a second analytics path competing with the one GTM owns |
| Indexing API (on-demand URL submission) | **NOT REQUIRED** — restricted to JobPosting and BroadcastEvent schemas; not applicable to an education consultancy, and using it outside those types violates Google's terms |
| Attribution backfill for leads created before 2026-10-19 | **NOT REQUIRED** — historical leads carry no UTM data anywhere, so any backfill would be fabrication. They report as `unknown` |
| A second lead database | **NOT REQUIRED and prohibited** — the existing `Lead` / `LeadForm` / `MarketingLead` models are the single source of truth |

---

## Part 4 — Reason for each skip

**Maps Platform (PAID).** Requires a Cloud billing account. ALO's real need is to
show where its office and partner universities are, already met at zero cost by
"Open in Google Maps" deep links in three live components. An embedded map would
add a paid dependency, a key that must be restricted, and a consent problem, in
exchange for a convenience one click away. Enabling it is documented with a
mandatory pre-flight checklist rather than being left implicit.

**Google Cloud (FREE TIER).** "Free tier" is not "no billing account". The
existing VPS stays primary and nothing is being moved. ALO already has its own
scheduler — 22 cron definitions, 16 enabled, with recorded reasons for the 6
disabled. Replacing it with Cloud Scheduler would add a billing account, a
network dependency and a second place where job state lives, for nothing the
current system lacks.

**YouTube Data API.** Embedding works with no credential at all. The API is only
needed to list videos dynamically, which ALO does not do — video IDs are curated.
Auto-publishing is explicitly prohibited without a real authenticated
integration, and none exists.

**Google Ads / Meta Pixel.** Out of scope for a *Google free stack* task, and no
accounts exist. GTM is the tag layer precisely so that adding them later is a
container change rather than a deploy.

**Indexing API.** Google restricts it to JobPosting and BroadcastEvent content.
Using it for course or destination pages would violate the terms and risk the
property.

**Core Web Vitals field reporting.** Field data is available through Search
Console once the credential exists; adding a separate `web-vitals` client would
create a second measurement path competing with GTM and duplicate data the
specification forbids duplicating.

---

## Part 5 — APIs enabled

| API | Required | Cost | Enabled here? |
|---|---|---|---|
| GA4 Measurement Protocol | For server conversions | FREE | No project needed — authenticated by API secret |
| Search Console API (`webmasters.readonly`) | For SEO measurement | FREE | **Operator must enable** in the Cloud project |
| Google Business Profile APIs (Account Management, Business Information) | For location read | FREE | **Operator must enable** |
| Business Profile v4 reviews | For review read | FREE | **Operator must enable**, and Google restricts it to accounts with 10+ locations |
| YouTube Data API v3 | Only for a channel feed | FREE (quota) | **Not enabled** — not used |
| Maps JavaScript / Embed / Geocoding | Only if Maps is adopted | PAID | **Not enabled** |

No API is enabled by this work. Enabling an API is a console action tied to a
billing account and cannot be performed from code. Each endpoint is listed so the
operator enables exactly what is needed and nothing more.

---

## Part 6 — Environment variables required

All are documented in `.env.example` with their cost tier. **No existing variable
was renamed, removed or repurposed** — new ones were added alongside, and
`GA4_MEASUREMENT_ID` / `GA4_API_SECRET` / `GOOGLE_SEARCH_CONSOLE_SITE_URL` /
`GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` / `NEXT_PUBLIC_GA4_ENABLED` /
`NEXT_PUBLIC_CONSENT_MODE` keep their existing names and meanings.

**Required to measure anything:** `GA4_MEASUREMENT_ID`,
`NEXT_PUBLIC_GA4_ENABLED=true`.

**Required for server-side conversions:** `GA4_API_SECRET` (or
`GA4_MEASUREMENT_PROTOCOL_SECRET`).

**Required for GTM:** `NEXT_PUBLIC_GTM_ID`. When set, GTM owns the page and
`ga4.injectTags` is forced false.

**Required for the Search Console API:** either
`GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` / `GOOGLE_SERVICE_ACCOUNT_JSON`, or
`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_OAUTH_REFRESH_TOKEN`.

**Optional:** `GOOGLE_SITE_VERIFICATION_TOKEN`, `GOOGLE_BUSINESS_ACCOUNT_ID`,
`GOOGLE_BUSINESS_WEBHOOK_TOKEN` (mandatory in production for the existing
webhook), `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`,
`YOUTUBE_API_KEY`, `ANALYTICS_ALLOW_NON_PRODUCTION`, `ANALYTICS_CLIENT_ID_SALT`.

**Deliberately left blank:** `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_MAPS_API_KEY`.

> **These must be present at BUILD time, not only at runtime.**
> `GoogleTags` is a server component and 397 of 946 routes are statically
> prerendered, so their tag markup is fixed when `next build` runs. Export
> `GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GA4_ENABLED`, `NEXT_PUBLIC_GTM_ID` and
> `NEXT_PUBLIC_SITE_URL` in the build environment and rebuild after changing
> them. Setting them only at runtime leaves the static pages — the homepage and
> every destination page among them — with no analytics at all, while the dynamic
> routes work, which makes the failure look intermittent rather than total.
> `NEXT_PUBLIC_*` values are additionally inlined into the client bundle at build
> time, so they cannot be changed at runtime in any case.

Placeholder IDs copied from documentation (`GTM-XXXXXXX`, `G-XXXXXXXXXX`) are
**rejected**, not injected. Without that guard an unedited `.env.example` would
load a container that does not exist while `/api/google/status` reported the
service as configured — see Part 14.

---

## Part 7 — CRM fields added / used

**Migration:** `prisma/migrations/20261019100000_lead_acquisition_attribution/migration.sql`
— **additive only**, 0 destructive statements, full rollback in the file's
comments.

`Lead` — **19 new nullable columns + 4 indexes:** `medium`, `campaign`,
`content`, `term`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`,
`utmTerm`, `gclid`, `fbclid`, `landingPage`, `referrer`, `firstTouchSource`,
`firstTouchMedium`, `firstTouchCampaign`, `firstTouchLandingPage`,
`firstTouchAt`, `lastTouchSource`, `lastTouchMedium`, `lastTouchAt`, `visitorId`.

`LeadForm` — **10 new `''`-defaulted VARCHAR columns + 2 indexes** (same UTM set
plus `landingPage`, `referrer`, `gclid`, `fbclid`).

**Existing fields used, not duplicated:** `Lead.source` (ALO's acquisition
channel — kept semantically distinct from `utmSource`), `Lead.status`,
`Lead.leadScore`, `Lead.leadTier`, `Lead.studentId`, `Lead.visitorId` (the
GA4-session ↔ CRM-lead join), `MarketingLead.consent`, `MarketingLead.score`,
`MarketingLead.hotLead`, `Application.stage`, `Application.studentId`,
`PortalStudentProfile.studentId`, `PortalStudentApplication.stage`.

**No new table.** No second lead database. No Prisma enum was introduced (the
schema has 0 enums; that is a pre-existing condition recorded in
`FINAL-VERIFICATION-REPORT.md`, not something this work changed).

`MarketingLead` deliberately has **no** UTM columns: it is the marketing
automation view, and adding attribution there would create two competing sources
of truth for the same fact.

**Migration applied?** **PASS — verified on CI against a real MySQL 8 database.**
It could not be applied in this development environment, which has no
`DATABASE_URL` at all, so the pull-request workflow is what proved it. On an empty
MySQL 8 service container, `prisma migrate deploy` applied all 29 migrations
(step 6), `prisma migrate status` then reported the database up to date (step 7),
and the authoritative `prisma migrate diff` from the migrations to
`schema.prisma` found no drift (step 8). Two defects that only a real database
could expose were found and fixed on the way — see Part 14.

---

## Part 8 — Events implemented

All 19 required events exist in the closed vocabulary and are emitted from a real
trigger. Nothing is declared-but-unfired.

| Event | Emitted from | Trigger |
|---|---|---|
| `page_view` | `AnalyticsPageView` | Every route change, including SPA navigation |
| `course_view` | `AnalyticsPageView` | Route `/course/[slug]` |
| `university_view` | `AnalyticsPageView` | Route `/universities/[slug]` |
| `scholarship_view` | `AnalyticsPageView` | Route `/scholarships/[slug]` |
| `visa_page_view` | `AnalyticsPageView` | `/visa*` and `/destinations/[slug]/visa-guide` |
| `ielts_page_view` | `AnalyticsPageView` | `/language-prep/ielts*` and the language-prep hub |
| `course_search` | `course-finder-enhanced` | After results are set |
| `university_search` | `course-finder-enhanced` | After results are set |
| `lead_form_start` | `public-lead-form`, `ApplyNowForm` | First field focus |
| `lead_form_submit` | `public-lead-form`, `ApplyNowForm` | Success (`lead_reference`) or failure (`error_code`) |
| `whatsapp_click` | `AnalyticsClickTracker` | Any `wa.me` / `api.whatsapp.com` anchor, site-wide |
| `phone_click` | `AnalyticsClickTracker` | Any `tel:` anchor, site-wide |
| `email_click` | `AnalyticsClickTracker` | Any `mailto:` anchor, site-wide |
| `counselor_request` | `public-lead-form`, `ApplyNowForm` | On successful submission |
| `application_start` | `ApplyNowForm` | Once per mount |
| `application_submit` | `ApplyNowForm` | Success or failure |
| `student_registration` | `RegisterPage` | After `register()` resolves |
| `student_login` | `LoginPage` | After `login()` resolves, with the result |
| `english_test_start` | `POST /api/student-portal/mock-tests` | A mock-test session is created server-side |
| `english_test_complete` | **MISSING** | See below |

**Parameters implemented:** all 15 required — `course_id`, `course_slug`,
`university_id`, `university_slug`, `country`, `destination`, `page_type`,
`lead_source`, `campaign`, `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term`, `landing_page` — enforced by a closed allowlist.

**`english_test_complete` is MISSING, and this is the one required event that is
not implemented.** The reason is a genuine product gap, not an oversight:
`/api/student-portal/mock-tests` can *start* a session (`status: 'in_progress'`,
`startedAt`), but there is **no submission or completion endpoint anywhere in the
codebase** and **no frontend consumer of that API at all** —
`grep -rn "student-portal/mock-tests" src/` outside the API directory returns
nothing. A test that cannot be completed cannot emit a completion event. Emitting
one on start, or on a timer, would fabricate a conversion. Building the
mock-test-taking UI and its submission endpoint is a student-portal feature well
outside a Google-stack task, and doing it half-way would be worse than recording
the gap. When that endpoint exists, one `reportServerEvent({ event:
'english_test_complete', reference: session.id, params: { test_type, score_band
} })` call completes it.

**Privacy decisions applied to every event.** No raw WhatsApp `text=` parameter
(it can contain the visitor's own words). No raw search keyword — facets only
(`destination`, `study_level`, `intake`, `items_count`), because a search box can
contain a name. Referrer reduced to a hostname. `lead_reference` and
`application_reference` are ALO's own opaque codes. `student_login` and
`student_registration` carry only a success flag and a portal type.

**Verification:** event *emission* is unit-tested at every decision point.
Event *delivery to Google* is **BLOCKED** — it requires a real GA4 property and a
browser session, and no credential exists here.

---

## Part 9 — SEO tracking implemented

| Item | Status | Evidence |
|---|---|---|
| robots.txt | **PASS** | 22 disallowed paths; generated at `/robots.txt`; verified by runtime check (Part 15) |
| sitemap.xml | **PASS** | Pre-existing, real, `force-dynamic`, nine sources |
| Canonical URLs | **PARTIAL** | Metadata-driven; a canonical-tag audit across all 420 pages was not performed |
| Organisation structured data | **PASS** | `organizationSchema()` was defined but never rendered; now mounted in the root layout |
| Site-verification meta tag | **PARTIAL** | Supported and wired; needs a real token |
| Indexing status | **BLOCKED** | Requires the Search Console credential |
| Core Web Vitals | **BLOCKED** | Requires the Search Console credential |
| Search performance (clicks, impressions, CTR, position) | **BLOCKED** | Client and endpoints implemented; no credential |
| Top queries / top pages / country / device / date | **BLOCKED** | Same — all five dimensions are supported by the client |
| Sitemap submitted/indexed counts | **BLOCKED** | Same |
| Opportunity generation from live data | **BLOCKED** | `POST /api/seo/search-console/ingest` feeds the existing engine |
| Admin reporting surface | **PARTIAL** | `/admin/google-stack` built; not exercised in a browser |
| Keyword targeting for Bangladesh | **NOT REQUIRED as code** | Keyword lists are content strategy. No keyword-stuffing was added to any page, per the explicit prohibition |

**robots.txt detail.** Previously disallowed only `/api`, `/admin`, `/crm`. Now
also `/counselor`, `/super-admin`, `/dashboard`, `/application-manager`,
`/employee`, `/hr`, `/hrm`, `/user-guide`, `/partner`, `/partner-admin`,
`/student`, `/parent-portal`, `/university-portal`, `/portal`, `/review`, plus
`/offline`, `/forgot-password`, `/reset-password`, `/verify-email`.

`/review/[token]` matters most: those are capability links whose token *is* the
authorisation, and having Googlebot request one puts a live token in a crawl log.
`/login` and `/register` are left crawlable deliberately. No `crawl-delay` was
added, because Google ignores it. robots.txt is **not** access control — those
routes are protected by authentication, and the file documents that.

A stale `public/public/robots.txt` still exists in the repository. It is not
served (the generated route wins) and was left in place rather than deleted,
because removing files is outside the "don't delete functionality" constraint. It
should be deleted by an operator who can confirm nothing references it.

---

## Part 10 — Business Profile preparation

| Item | Status |
|---|---|
| Inbound review webhook | **PASS** — pre-existing, token-verified with `timingSafeEqual`, fails closed in production |
| Outbound account list | **BLOCKED** — implemented, needs a credential |
| Outbound location read (name, category, phone, website, hours, address, rating) | **BLOCKED** — implemented, needs a credential |
| Outbound review read | **BLOCKED**, and expected to remain so — Google restricts the v4 reviews API to accounts with 10+ locations; ALO is single-office |
| Real location data | **NOT REQUIRED as code** — the listing must be created in Google Business Profile by a human |
| Photos, logo, posts, services | **MISSING** — no write path exists, by design |
| Fake locations for SEO | **None created** — structurally impossible: the client is read-only |

The read-only design is deliberate. The specification forbids inventing locations
for SEO, and a module with no write path enforces that structurally rather than
by policy.

---

## Part 11 — Maps status

**NOT REQUIRED / not used.** No Maps SDK, no embed, no key, no JavaScript API
call anywhere in the codebase.

Existing zero-cost deep links are preserved and were not modified:
`src/app/global-offices/page.tsx`, `src/components/website/PublicFooter.tsx`,
`src/components/alo/views/public-contact.tsx`.

`GOOGLE_MAPS_API_KEY` is documented in `.env.example` with an explicit
instruction to leave it blank, and `GET /api/google/status` reports Maps as
`NOT_CONFIGURED` with `costTier: PAID` and `billingRequired: true`. If it is ever
configured, the same endpoint reports it under `costSummary.paidServicesInUse`
and the admin page renders a red banner naming the service.

No unrestricted key exists, because no key exists.

---

## Part 12 — YouTube status

**PARTIAL.**

Implemented: `YouTubeEmbed` (click-to-load `youtube-nocookie.com` facade),
`YouTubeVideoSection` (15 official categories), ID validation, CSP `frame-src`
and `img-src` allowances.

The facade is a deliberate design choice with three justifications: zero requests
to YouTube until the visitor clicks (so embedding cannot bypass the consent
banner); a thumbnail plus ~1 KB instead of an iframe per video (Search Console
reports Core Web Vitals, and destination pages carry several videos each); and no
API key, project or billing account.

Not done: **no video is placed on any live page yet.** The component exists and
is tested, but the curated video list must be populated with real published ALO
video IDs by someone with channel access. An entry with a placeholder or borrowed
ID would render a broken player — or someone else's video — on a public ALO page,
so none was invented.

No auto-publishing. Nothing in the codebase uploads to YouTube.

---

## Part 13 — Cloud status

**NOT REQUIRED / not used.** No Cloud Run service, no Cloud Scheduler job, no
Cloud Storage bucket, no Pub/Sub topic, no Secret Manager secret.

The existing VPS remains the primary runtime. The existing in-repo scheduler
remains the scheduler: 22 cron definitions, 16 enabled, 6 disabled with recorded
reasons. Nothing was moved, and no deployment architecture was changed.

No dedicated project, no billing account, no budget — because nothing requires
them. `GOOGLE_CLOUD_PROJECT_ID` is documented as optional and unused.

Secrets stay in the deployment environment. No service-account credential is
exposed to the client: only `NEXT_PUBLIC_*` identifiers are embedded, and those
are values Google ships to every browser anyway.

---

## Part 14 — Security checks

| Check | Result |
|---|---|
| No API secret or service-account JSON in Git | **PASS** — `.gitignore` excludes `.env*`; no secret committed |
| No private key in any frontend bundle | **PASS** — only `NEXT_PUBLIC_*` identifiers reach the client |
| No unrestricted Maps key | **PASS** — no key exists |
| No hard-coded credentials in `src/` | **PASS** |
| Webhook validated | **PASS** — pre-existing `timingSafeEqual`, fails closed |
| Public endpoints rate limited | **PASS** — `lead_create` 5/min/IP |
| Admin Google endpoints authenticated + authorised | **PASS** — `requireSeoStaff` (ADMIN, SUPER_ADMIN, MARKETING, MARKETING_MANAGER) |
| Admin Google endpoints rate limited | **PASS** — `admin_settings` 30/min/IP, because each call spends Google quota |
| New endpoints validate input | **PASS** — strict zod schemas; attribution fields added as explicit bounded keys rather than loosening `.strict()` |
| New endpoints return success and failure shapes | **PASS** |
| Integration failures logged | **PASS** — structured, secret-free |
| Student private info never exposed | **PASS** — see PII screen below |
| DB / server credentials never exposed | **PASS** — driver errors are logged, never echoed |
| OAuth scope minimisation | **PASS** — `webmasters.readonly`, not read-write |
| CSP | **PARTIAL** — minimum directives per Google origin added; `'unsafe-inline' 'unsafe-eval'` remains because Next.js and Tailwind require it, and the inline bootstrap depends on it |

**Seven real defects found by the new unit tests and fixed.** These were not
theoretical:

1. `credit_card`, `debit_card` and a bare `card` key were **not blocked**. Only
   `card_number` / `cardnumber` were. The specification's explicit "never send
   card data" rule had a hole in it.
2. `mother_name` and `father_name` were **not blocked**. `\bname\b` does not
   match `mother_name`, because in a regular expression an underscore is a word
   character and so provides no boundary.
3. `bank_account` was **not blocked** — same cause, `\bbank\b`.
4. `email_address`, `phone_number` and `document_url` were **not blocked** — same
   cause. This was the whole class, not three instances, so `isForbiddenKey()`
   now tests the key both as written and with separators normalised to spaces.
5. `cv_file` and `resume` were **not blocked**, though a CV is a private
   application document carrying a name, address, date of birth and photo.
6. `ga4.injectTags` stayed `true` when GTM won the loader arbitration.
   `resolveTagLoader()` already prevented a double *loader* at render time, but
   `injectTags` is a public flag that `/api/google/status` reports and any future
   caller could act on — which would inject a second GA4 tag beside the
   container's own, double-counting every `page_view` and silently halving every
   conversion rate. The two flags are now mutually exclusive at the source of
   truth.
7. Placeholder tag IDs from the documentation (`GTM-XXXXXXX`, `G-XXXXXXXXXX`)
   satisfied the shape patterns and would have been injected, loading a container
   that does not exist while the status endpoint reported the service as
   configured.

**Two further defects found only by serving the production build** (Part 16):
the React 19 `<script src async>` hoist that placed the gtag loader ahead of the
consent defaults in the built HTML, and the discovery that tag configuration is a
build-time rather than a runtime requirement for the 397 statically prerendered
routes. Neither was visible to the type checker, the linter or any unit test.

**Two pre-existing defects fixed on the way:**

- `/api/crm/leads/public` substituted `'United Kingdom'`, `'Postgraduate'`,
  `'September 2026'` and `'IELTS'` for answers the visitor never gave. The
  invented country then scored **+15** in `scoreLead()` and entered the counsellor
  queue as a real preference. It also hard-coded `score: 75` and `hotLead: true`
  ahead of the real engine, and wrote `consent: true` for a visitor who was never
  asked.
- `public-lead-form`'s consent checkbox defaulted to `checked` **and was never
  transmitted to the API** — it looked like it granted marketing permission while
  doing nothing at all. It is now unchecked by default, required for submission,
  marked `*`, transmitted, and recorded through the existing `grantConsent()`.

**One regression introduced and fixed.** Adding `consentRecorded` to the
`/api/leads` response broke `tests/unit/public-leads-security.test.ts`, which
pins the exact response shape as a deliberate security contract: a contact match
must return precisely the same receipt as a new lead, so nothing about another
person's record is revealed. The field was **removed** rather than the assertion
weakened. The caller already knows what consent it sent.

**One build regression introduced and fixed.** `AnalyticsPageView` uses
`useSearchParams()`, which forces a client-render bailout. Mounted in the root
layout without a Suspense boundary, it made **every** statically generated page
unbuildable — the production build failed at `/_not-found`. Fixed with
`<Suspense fallback={null}>`, which is correct rather than merely convenient: the
component renders nothing, so there is no visual state to suspend.

**Three further defects found only by CI, on a real MySQL 8 database.** This
development environment has no database at all, so the migrations had never been
executed anywhere until the pull-request workflow ran them. None of these three
was visible to `prisma validate`, `tsc`, `eslint`, the 2599-test suite or a
production build — every one of those gates passed while the defects were live.

1. **A unique index MySQL cannot create at any row format.**
   `OpportunityGraphEdge_sourceType_sourceId_targetType_targetId_relation_key`
   spanned five `VARCHAR(191)` columns. Under utf8mb4 that is 5 × 764 = **3820
   bytes**, above InnoDB's hard **3072-byte** per-index ceiling, so `migrate
   deploy` failed with Prisma `P3018` / MySQL error 1071 ("Specified key was too
   long") on an empty database. This is not tunable: the index could not exist on
   any MySQL 8. Fixed by narrowing the five columns to `VARCHAR(64)` (key now
   1280 bytes) in `schema.prisma` **and** the migration together, since CI diffs
   the two. Safe because those columns hold closed-union labels — `GraphNodeType`
   has 10 members, longest `SCHOLARSHIP` (11 chars); `GraphRelation` has 13,
   longest `TARGETS_UNIVERSITY` (18 chars) — and cuid/UUID identifiers (≤36
   chars). The model has no relation fields, so no foreign key needed a matching
   width. An audit of every index in every migration confirmed this was the only
   one over the ceiling; the next largest is 2296 bytes.

2. **32 LOB defaults declared in a form MySQL rejects.** MySQL cannot give a
   `TEXT`/`BLOB`/`JSON` column a literal default (error 1101), so the migrations
   correctly wrote the expression form `DEFAULT (_utf8mb4'[]')`. But the fields in
   `schema.prisma` were declared `@default("[]") @db.Text`, which Prisma renders
   as `DEFAULT '[]'`. The shadow database and the datamodel therefore disagreed on
   all 32 columns, and `scripts/ci/filter-lob-default-drift.mjs` correctly refused
   to suppress the drift, because it only suppresses a re-assertion when the field
   carries the identical `@default(dbgenerated("(_utf8mb4'…')"))`. This repo
   already enforces that convention everywhere else: `main` has **275** dbgenerated
   LOB defaults and **zero** plain defaults on a LOB column. All 32 offenders were
   in models appended on this branch. Fixed in the schema only — the migrations
   were already correct — taking the count to 307 and the violations to 0.

3. **The environment-variable audit could not see indirect reads.**
   `scripts/audit-env-vars.mjs` recognised only `process.env.NAME` and
   `const { NAME } = process.env`. The Google stack reads its configuration
   through an injectable `env: NodeJS.ProcessEnv` record so it can be unit tested
   without mutating the real environment (`env.ANALYTICS_ALLOW_NON_PRODUCTION`,
   `firstString(env, 'NEXT_PUBLIC_GTM_ID', 'GTM_CONTAINER_ID')`), so regenerating
   `docs/environment-classification.json` reported **13 live variables as UNUSED**
   — every GA4, GTM, YouTube and Search Console setting. That contradicted
   `docs/GOOGLE-FREE-STACK.md` and would have told an operator that configuring
   them does nothing. The same blind spot had already misreported **nine**
   `EMAIL_*` variables read via `integerSetting(env, 'X', …)` in
   `src/lib/email-marketing/config.ts`, which were documented as UNUSED on `main`.
   The script now runs a second pass for property access and helper key literals
   on any identifier containing `env`; it only records names the direct scan
   missed, so no existing classification moved, and it cannot invent variables.
   **33 variables** are correctly rescued from UNUSED and each emitted record now
   carries `referencedIndirectly`.

Also removed on the way: `resolveGoogleStackConfig` tolerated a
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` alias. Nothing client-side consumed it and Maps
Platform is a paid service this deployment does not use, so the alias only invited
an operator to inline a paid key into the client bundle. It was the sole entry in
the audit's `publicSecretSuspects` list — which the script itself calls a hard
error — and that list is empty again. Only the server-side `GOOGLE_MAPS_API_KEY`
is read now.

---

## Part 15 — Billing risks

**Current billing risk: none.** Every service ALO uses is `FREE` with no billing
dimension. `GET /api/google/status` returns `costSummary.paidServicesInUse: []`
and the admin page renders a green confirmation. If that array ever becomes
non-empty the banner turns red and names the service.

**Residual risks, recorded:**

| Risk | Exposure | Mitigation in place |
|---|---|---|
| Maps enabled without restriction | Unbounded — a scraped key can be run up arbitrarily | Not enabled. If enabled: budget alerts, referrer restriction, API restriction and quota caps are documented as mandatory pre-flight steps |
| Cloud free-tier overage | Billed automatically above quota | Not enabled. `FREE TIER` is labelled as requiring a billing account everywhere it appears, so "free tier" is never read as "no billing account" |
| GA4 / GTM / Search Console / Business Profile / YouTube | **Zero** | No billing dimension exists |
| Search Console API quota exhaustion | Free but rate-limited by Google; exhaustion breaks reporting, not the site | Ingest and status endpoints are rate limited per IP |
| Measurement Protocol abuse | Free, but a flood would corrupt analytics data | Server-side only, fired from authenticated business transitions, never from a public endpoint |

No paid dependency was introduced silently. The two paid-capable services are
documented as deliberately unused, with the reasoning, rather than being left
ambiguous.

---

## Part 16 — Test results

**Static and unit gates — all executed in this environment:**

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — exit 0, 0 errors |
| `npx eslint .` | **PASS** — exit 0, 0 errors, 0 warnings |
| `npx vitest run` (full suite) | **PASS** — 203 files, **2599 passed**, 75 skipped, **0 failed** |
| New `tests/unit/google-stack.test.ts` | **PASS** — **109 tests** |
| `npx prisma validate` | **PASS** — schema valid, 548 models |
| `scripts/verify-prisma-client.mjs` | **PASS** — 548 models |
| `npm run build` (production) | **PASS** — see below |
| Schema diff discipline | **PASS** — 64 additions, **0 deletions**, append-only |

The production build initially **failed** at `/_not-found` because of the missing
Suspense boundary described in Part 14. It was fixed and the build re-run to
completion (946 routes, standalone output verified).

Two further full builds were then run with test GA4 credentials to verify tag
injection and ordering. One of those builds died with a JavaScript heap OOM at the
4096 MB cap that `npm run build` hardcodes; re-running with a 6144 MB heap
succeeded. **This is an environment memory ceiling, not a code defect** — the
same command at the same cap also succeeded — but it is worth recording because a
CI runner with less memory than this one may need the heap raised. The build is
close to its limit at 4096 MB.

**Integration tests: 75 skipped in this environment, PASS on CI.** Locally they
all skip because `TEST_DATABASE_URL` is not configured — pre-existing behaviour,
not a new gap. CI supplies a disposable MySQL 8 database, and the
`MySQL 8 · Migrate · Integrate · Boot` job ran the real integration suite against
it (step 9) and passed. Those eight files exercise persistence, RBAC and security
boundaries that unit tests can only stub.

**Database migrations: PASS — verified on CI against real MySQL 8.** They could
not be applied here (no `DATABASE_URL`), so the pull-request workflow is the
evidence:

| CI step | What it proves | Result |
|---|---|---|
| 6 — `migrate deploy` on an **empty** MySQL 8 | All 29 migrations execute; every index is creatable | **success** |
| 7 — `migrate status` | Database reports up to date, no pending migration | **success** |
| 8 — `migrate diff` migrations → `schema.prisma` | No drift; the schema and the SQL agree | **success** |
| 9 — integration tests on real MySQL | Persistence and RBAC against a real server | **success** |
| 10 — production build | 946-route build with the migrated schema | **success** |
| 11 — boot standalone + HTTP smoke against the real DB | Lead POST persists to `LeadForm`, `SearchLog` row written, missing-contact POST still **400**, `/api/crm/leads` and `/api/admin/student-benefits` still **401/403**, `/api/health` reports `database.connected=true` | **success** |

Steps 6 and 8 initially **failed** and both failures were real defects, not CI
flakiness: a 3820-byte unique index MySQL cannot create at all, and 32 LOB
defaults declared in a form the drift filter cannot reconcile. Both are described
in Part 14 and both are fixed. The migration is additive and carries a written
rollback, but note that the `database-backup` cron job is disabled because
mysqldump credentials are unavailable — so **no logical dump exists to fall back
to**. Take a manual backup before applying to production.

**Runtime checks performed in this environment.** A production standalone build
was produced and served, then exercised over HTTP. These are real observations,
not inferences from code:

| Check | Result | Evidence |
|---|---|---|
| `/robots.txt` served with the hardened list | **PASS** | Exactly **22** `Disallow:` entries over HTTP, including `/counselor/`, `/super-admin/`, `/review/`, `/student/`, plus the `Sitemap:` line |
| Organisation JSON-LD actually rendered | **PASS** | `EducationalOrganization` present in served HTML on `/`, `/visa` and `/login` — it was defined but never mounted before |
| Tags suppressed when nothing is configured | **PASS** | **0** references to `googletagmanager` in served HTML, and no bootstrap script — `GoogleTags` returns `null` when no loader resolves |
| Tags injected when configured | **PASS** | Rebuilt with `GA4_MEASUREMENT_ID` + `NEXT_PUBLIC_GA4_ENABLED=true`: bootstrap, consent defaults, loader and config all present |
| Consent defaults execute **before** the loader | **PASS** | Verified by byte offset in the prerendered HTML: defaults @5771 → context @6036 → loader @6302 → config @6476 |
| `send_page_view: false` (no duplicate page views) | **PASS** | Present in the served config object |
| `wait_for_update: 500` (Consent Mode v2) | **PASS** | Present in the served bootstrap |
| All storage purposes start `denied` | **PASS** | `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` all `'denied'` in served HTML |
| New admin endpoints reject anonymous callers | **PASS** | **401** on all 8: `/api/google/status` (±`live=true`), `/api/google/business-profile`, `/api/seo/search-console/{status,performance,sitemaps,ingest}`, `/api/analytics/conversion-funnel` |
| `/admin/google-stack` is not publicly reachable | **PASS** | **307** → `/login?callbackUrl=%2Fadmin%2Fgoogle-stack` |
| Lead schema accepts the attribution fields | **PASS** | Valid payload with `utmSource`/`gclid`/`visitorId`/`consent` passed validation and reached the database layer (**503**, no DB here) rather than being rejected at **400** |
| Lead schema still blocks privilege escalation | **PASS** | `counselorId` in the body → **400**; `.strict()` holds after attribution was added |
| Attribution values are bounded | **PASS** | A 300-character `utmCampaign` → **400** |
| Contact links exist for the click tracker to classify | **PASS** | Homepage HTML carries 1 `wa.me`, 2 `tel:` and 1 `mailto:` anchor |

**Two defects were found by these runtime checks that unit tests could not
catch**, and both are fixed:

1. **Consent-defaults ordering was wrong in the built output.** React 19 hoists a
   `<script src async>` into `<head>` as a resource hint, which placed the gtag
   loader at byte 2541 while the inline consent defaults sat in the body at byte
   5702 — the library could execute *before* Consent Mode's defaults were set,
   which is precisely what Consent Mode v2 forbids. This was invisible to
   `tsc`, to eslint and to every unit test, because the markup order in the
   component source was correct; only the *built* HTML revealed the hoist. Fixed
   by having the bootstrap inject the loader with `document.createElement`
   instead of rendering a `<script src>`, so ordering is a property of execution
   sequence rather than markup position. Re-verified above.
2. **Tag configuration is a BUILD-TIME requirement, not runtime.** `GoogleTags`
   is a server component, and **397 of 946 routes are statically prerendered**.
   Their tag markup is baked in when `next build` runs. Setting
   `GA4_MEASUREMENT_ID` only in the runtime environment therefore produces a site
   where analytics silently works on the ~549 dynamic routes and does not exist at
   all on the 397 static ones — including the homepage and every destination page,
   which are exactly the pages that matter for organic attribution. Verified by
   inspecting the prerendered `.html` files directly. See Part 6.

**Not performed — and this is the most important caveat in this report:**

| Check | Status |
|---|---|
| Events observed arriving in GA4 DebugView | **BLOCKED** — no GA4 property, no credential |
| GTM `dataLayer` inspected in a browser | **BLOCKED** — no container ID |
| Network-tab confirmation that hits are actually sent | **BLOCKED** — no browser session against a configured property |
| Search Console live query | **BLOCKED** — no credential |
| Business Profile live read | **BLOCKED** — no credential |
| Lead form → CRM persistence against a real database | **PASS** on CI — the smoke test POSTs `/api/website/lead`, then verifies the `LeadForm` row and its `SearchLog` entry by direct SQL against MySQL 8, and confirms a contact-less POST still returns **400** |
| …with an actual UTM value round-tripped through MySQL | **BLOCKED** — no automated test sends UTM parameters, so the 19 new `Lead` and 10 new `LeadForm` columns are proven to *exist* on a real database but not proven to *carry a value* through a real insert |
| Conversion funnel against real data | **BLOCKED** — CI does not call `/api/analytics/conversion-funnel`; the engine is unit-tested against a stub Prisma client only |
| Core Web Vitals field data | **BLOCKED** — no credential |

**Code that compiles and passes unit tests is not an integration that has been
observed working against Google.** No item in this report is marked `PASS` on the
strength of compilation alone. Where delivery could not be observed, the status is
`PARTIAL` or `BLOCKED`.

---

## Part 17 — Files changed

**New — Google stack (24 files):**

```
docs/GOOGLE-STACK-AUDIT.md
docs/GOOGLE-FREE-STACK.md
docs/GOOGLE-STACK-IMPLEMENTATION-REPORT.md
prisma/migrations/20261019100000_lead_acquisition_attribution/migration.sql
src/app/admin/google-stack/page.tsx
src/app/api/analytics/conversion-funnel/route.ts
src/app/api/google/business-profile/route.ts
src/app/api/google/status/route.ts
src/app/api/seo/search-console/ingest/route.ts
src/app/api/seo/search-console/performance/route.ts
src/app/api/seo/search-console/sitemaps/route.ts
src/app/api/seo/search-console/status/route.ts
src/components/analytics/AnalyticsClickTracker.tsx
src/components/analytics/AnalyticsPageView.tsx
src/components/analytics/ConsentBanner.tsx
src/components/analytics/GoogleTags.tsx
src/components/website/YouTubeEmbed.tsx
src/lib/analytics/attribution-payload.ts
src/lib/analytics/client.ts
src/lib/analytics/conversion-funnel.ts
src/lib/analytics/events.ts
src/lib/analytics/page-context.ts
src/lib/analytics/server-conversions.ts
src/lib/analytics/visitor.ts
src/lib/attribution/lead-attribution.ts
src/lib/google/business-profile.ts
src/lib/google/config.ts
src/lib/google/oauth.ts
src/lib/seo/search-console-client.ts
tests/unit/google-stack.test.ts
```

**Modified — Google stack (18 files):**

```
.env.example
next.config.ts                                  CSP for Google origins
prisma/schema.prisma                            +29 columns, +6 indexes (append-only)
src/app/api/applications/[id]/submit/route.ts   application_submitted
src/app/api/applications/route.ts               application_started
src/app/api/auth/register/route.ts              registration attribution
src/app/api/crm/applications/route.ts           enrollment_completed
src/app/api/crm/leads/public/route.ts           fabricated-data defect fixed + attribution
src/app/api/leads/route.ts                      attribution + real consent
src/app/api/portal-auth/register/route.ts       registration attribution
src/app/api/student-portal/mock-tests/route.ts  english_test_start
src/app/api/website/lead/route.ts               attribution
src/app/layout.tsx                              tags, consent, JSON-LD, verification meta
src/app/robots.ts                               22 disallowed paths
src/components/alo/public-lead-form.tsx         consent defect fixed + events
src/components/apply/ApplyNowForm.tsx           application events + attribution
src/components/auth/LoginPage.tsx               student_login
src/components/auth/RegisterPage.tsx            student_registration
src/components/course-finder/course-finder-enhanced.tsx   course/university_search
src/lib/crm/lead-handlers.ts                    lead_qualified
src/lib/crm/registration-lead.ts                attribution thread
src/lib/seo/ga4.ts                              delegates to the shared module
src/lib/stores/portal-store.ts                  attribution passthrough
src/lib/student/canonical-student.ts            attribution thread
```

Nothing was deleted. No working feature was removed. The pre-existing SEO
surfaces (`/crm/seo-manager`, `/admin/seo/*`, `/api/seo/*`) were extended, not
forked, and the admin page links to them.

---

## Part 18 — DB migrations

**One new migration:** `20261019100000_lead_acquisition_attribution`.

- `ALTER TABLE Lead ADD COLUMN` × 19, all nullable
- `ALTER TABLE LeadForm ADD COLUMN` × 10, all `VARCHAR(191) NOT NULL DEFAULT ''`
- `CREATE INDEX` × 6
- **0 destructive statements.** No `DROP`, no `MODIFY`, no data rewrite
- Full rollback script in the migration file's comments
- Neither table has `@@map`, so the SQL targets `Lead` and `LeadForm` literally

**Applied: PASS — verified on CI against a real MySQL 8 service container.** It
cannot be applied in this development environment, which has no `DATABASE_URL`,
so the pull-request workflow is the evidence: `migrate deploy` on an **empty**
database applied all 29 migrations, `migrate status` reported up to date, and the
authoritative `migrate diff` against `schema.prisma` found no drift. The
integration suite then ran against that database, and a standalone production
server booted against it and passed an HTTP smoke test that persists a real lead.

**Pre-deployment requirement:** take a manual database backup first. The
`database-backup` cron job is disabled because mysqldump credentials are
unavailable, so there is no automated dump to fall back to.

`npx prisma format` was **never** run against this schema (it would reformat
12,300 lines and 548 models). All schema edits were append-only, verified by diff
at 64 additions and 0 deletions.

Two earlier migrations from the prior task
(`20261018000000_platform_control_plane`,
`20261019000000_regulatory_rule_versioning`) are also additive, and all three are
now applied and drift-free on CI. Both defects CI found were in the earlier of the
two, not in the attribution migration: the uncreatable 3820-byte
`OpportunityGraphEdge` unique index, and 32 LOB defaults whose `schema.prisma`
declarations did not match the expression form MySQL requires. Neither migration
had ever met a real database before this pull request, which is why both survived
every local gate. See Part 14.

**Column widths changed on this branch.** The five key columns of
`OpportunityGraphEdge` (`sourceType`, `sourceId`, `targetType`, `targetId`,
`relation`) are `VARCHAR(64)` rather than Prisma's default `VARCHAR(191)`. That is
the fix for the index ceiling above, and it is safe: the table is new and empty
everywhere, the columns hold closed-union labels of at most 18 characters and
identifiers of at most 36, and the model has no relation fields, so no foreign key
requires a matching width.

---

## Part 19 — Remaining manual Google-console steps

None of these can be done from code. Each is a prerequisite for a `BLOCKED` or
`PARTIAL` item above to become `PASS`.

1. **GA4** — create the property; add a **web** data stream for
   `https://aloeducation.com`; set `GA4_MEASUREMENT_ID` and
   `NEXT_PUBLIC_GA4_ENABLED=true`; create a Measurement Protocol API secret and
   set `GA4_API_SECRET`; raise data retention to 14 months (free); mark
   `generate_lead`, `lead_qualified`, `application_submitted` and
   `enrollment_completed` as key events.
2. **GTM** — create a **Web** container; set `NEXT_PUBLIC_GTM_ID`; add the GA4
   configuration tag **inside the container**; publish. Decide where contact-click
   triggers live — GTM *or* `AnalyticsClickTracker`, **not both**, or every
   contact click is counted twice.
3. **Search Console** — verify the **Domain** property for `aloeducation.com`
   (DNS TXT preferred); optionally set `GOOGLE_SITE_VERIFICATION_TOKEN`; submit
   `https://aloeducation.com/sitemap.xml`; create a service account, **add it as a
   user on the property**, export its JSON key into
   `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON`; enable the Search Console API;
   confirm `/api/seo/search-console/status` reports `verified: true`.
4. **Business Profile** — create the listing for the real Dhaka office with
   accurate name, category, website, phone, hours, services, photos and logo; set
   `GOOGLE_BUSINESS_ACCOUNT_ID`; enable the Business Profile APIs; set
   `GOOGLE_BUSINESS_WEBHOOK_TOKEN` to a random string of at least 16 characters
   and register the webhook URL.
5. **YouTube** — create the channel; organise uploads into the 15 categories; set
   `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE` and `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`;
   populate the curated video list with **real published ALO video IDs only**.
6. **Database** — back up manually, then apply all three pending migrations and
   verify the 29 new columns and 6 new indexes exist.
7. **Rebuild after setting credentials.** The tag decision is baked into 397
   statically prerendered pages at build time. Setting `GA4_MEASUREMENT_ID` or
   `NEXT_PUBLIC_GTM_ID` in the runtime environment alone leaves the homepage and
   every destination page without analytics. Export them in the build environment
   and run `npm run build` again.
8. **Verification** — after credentials are in place and the site is rebuilt,
   confirm in GA4 DebugView and the browser network tab that events are actually
   sent. Do not consider any `BLOCKED` item closed until it has been observed
   working.
9. **Cleanup** — delete the stale `public/public/robots.txt` once confirmed
   unreferenced, and retire `docs/GOOGLE_SEO_SETUP.md`, whose line 36 claim that
   GA4 was implemented was false.
10. **Cloud / Maps** — no action. Leave both unconfigured.

---

## Summary verdict

| Area | Verdict |
|---|---|
| Analytics foundation (tags, consent, page views, event vocabulary, PII screen) | **PASS** on logic; **PARTIAL** on delivery |
| Lead attribution (16 fields, capture, merge, persistence, first-touch immutability) | **PASS** on logic; **PASS** on schema — the columns exist on a real MySQL 8 database (CI). No automated test yet round-trips a UTM *value* through MySQL |
| Event instrumentation (19 required events) | **PARTIAL** — 18 of 19 implemented; `english_test_complete` is **MISSING** for a real product reason |
| Server-side business conversions | **PASS** on guards; **BLOCKED** on delivery |
| Search Console integration | **BLOCKED** — fully implemented, no credential |
| Business Profile integration | **BLOCKED** — fully implemented, no credential |
| YouTube embedding | **PARTIAL** — component complete, no real video placed |
| Maps | **NOT REQUIRED** |
| Cloud | **NOT REQUIRED** |
| SEO hygiene (robots, sitemap, JSON-LD, CSP) | **PASS** |
| Admin module and funnel reporting | **PARTIAL** — built, not exercised against live data |
| Security | **PASS** |
| Billing risk | **PASS** — no paid service in use |
| Test gates (typecheck, lint, 2599 unit tests, production build) | **PASS** locally and on CI |
| Database-backed gates (migrate deploy on empty MySQL 8, migration status, drift diff, integration tests, standalone boot + HTTP smoke) | **PASS** on CI — these cannot run in this development environment, which has no database |
| Environment-variable classification gate | **PASS** — `npm run audit:env -- --check`, after fixing a blind spot that misreported 33 live variables as UNUSED |
| Database migration applied | **PASS** on CI (empty MySQL 8); still to be applied to production, with a manual backup first |

**The Google Free Stack is implemented in code and verified by every gate that
can run without a Google credential — including, on CI, a real MySQL 8 database
that this development environment does not have.** The remaining `BLOCKED` items
are blocked on Google, not on code: they need the Part 19 console steps and a real
credential, after which each can be closed by observation — and only by
observation. The migration is verified on CI but must still be applied to
production, and the `database-backup` cron job remains quarantined for want of
mysqldump credentials, so take a manual dump first.
