# ALO Education — Google Stack Pre-Implementation Audit

**Audit date:** 2026-10-19
**Auditor method:** static inspection of the production tree (`grep` + file reads). No code was
modified during the audit. Nothing here is inferred from documentation — every row cites the file
that proves it.

Statuses used: `PASS` · `PARTIAL` · `MISSING` · `BROKEN` · `FAIL` · `NOT REQUIRED`.

---

## 1. What already exists (do not duplicate)

| Area | File(s) | Status |
|---|---|---|
| Sitemap | `src/app/sitemap.ts` (`force-dynamic`, DB-backed: blogs, courses, CRM courses, scholarships, universities, CRM universities, guides, services, resources) | **PASS** |
| robots.txt | `src/app/robots.ts` (allow `/`; disallow `/api/`, `/crm/`, `/admin/`, `/partner-admin/`, `/employee/`; sitemap pointer) | **PASS** |
| Canonical / metadata | `src/app/layout.tsx` `generateMetadata()` + `src/lib/cms-managed-content.ts` (`getSiteSeoDefaults`) | **PASS** |
| Structured data | `src/lib/seo/schema-helpers.ts` — `articleSchema`, `breadcrumbSchema`, `faqPageSchema`, `organizationSchema` (real Dhaka address + phone) | **PASS** |
| SEO health probe | `src/app/api/seo/health/route.ts` — honest, configuration-only, self-labelled `verification: "configuration_only_not_authenticated_or_operational"` | **PASS** |
| SEO analysis engine | `src/lib/seo-engine.ts` — `analyzeSearchConsoleData`, `createSeoTask`, `completeSeoTask`, `getSeoStats` | **PASS** (pure analyser) |
| SEO admin surface | `src/app/crm/seo-manager/page.tsx`, `src/components/crm/seo/SeoEvidencePanel.tsx` (`mode="keywords" \| "technical"`), mounted by `CrmSeoKeywordTracker`, `CrmSeoTechnicalAudit`, `SEOBlogManagerView` | **PASS** — extend, never fork |
| Behaviour tracking | `src/lib/behavior-tracking.ts` — `trackBehaviorEvent` → `AuditLog` (`action="BEHAVIOR_EVENT"`), intent weights, visitor intent score, marketing profile, identity linking | **PASS** (server-side CRM pipeline) |
| Marketing consent | `src/lib/marketing-consent.ts` — `grantConsent`, `revokeConsent`, `hasConsent`, `checkFrequencyCap`, `recordMarketingTouch` | **PASS** (communication consent — *not* analytics consent) |
| Business Profile **inbound** | `src/app/api/marketing/webhooks/google-business/route.ts` — `timingSafeEqual` token check, fails closed with HTTP 500 in production when the secret is unset/short | **PASS** |
| GA4 config module | `src/lib/seo/ga4.ts` — `getGA4Config()`, `ga4Script()`, `trackLeadConversion()` | **PARTIAL** |
| YouTube | External channel links only: `src/components/alo/public-shell.tsx:443`, `src/components/alo/views/public-contact.tsx:84` → `https://www.youtube.com/@aloeducation` | **PARTIAL** |
| Maps | "Open in Google Maps" deep links only: `src/app/global-offices/page.tsx:79`, `public-contact.tsx:259`, `PublicFooter.tsx:328` | **NOT REQUIRED** (see §4) |

## 2. What is broken

| # | Defect | Evidence | Impact |
|---|---|---|---|
| B1 | **GA4 script is never injected.** `ga4Script()` has exactly one call site in the whole repo and it is not in a render path — the only importer of `src/lib/seo/ga4.ts` is `api/seo/health/route.ts`, which calls `getGA4Config()` alone. `src/app/layout.tsx` contains no `<Script>`, no `dataLayer`, no `gtag`. | `grep -rn "getGA4Config\|ga4Script\|trackLeadConversion" src/` → 2 hits, both in `api/seo/health`; `layout.tsx` body read in full | GA4 collects **zero** page views even with `GA4_MEASUREMENT_ID` + `NEXT_PUBLIC_GA4_ENABLED=true` set. |
| B2 | **Documentation asserts a wiring that does not exist.** `docs/GOOGLE_SEO_SETUP.md:36` states: "`ga4Script()` injected in layout when `NEXT_PUBLIC_GA4_ENABLED=true` + consent granted." | file read | The setup guide would lead an operator to believe tracking is live after setting two env vars. It is not. |
| B3 | **Measurement Protocol conversion is never fired.** `trackLeadConversion()` has no call site outside its own definition. | same grep | No server-side conversion ever reaches GA4. |
| B4 | **CSP blocks every Google tag domain.** `next.config.ts:70` sets `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (no `https://www.googletagmanager.com`) and `connect-src 'self' https://api.groq.com https://openrouter.ai` (no `google-analytics.com` / `analytics.google.com`). No `frame-src` exists, so `default-src 'self'` also blocks YouTube iframes. | `next.config.ts` read | Even after fixing B1, the browser would refuse the tag script and the collect beacon. |

## 3. What is missing

| # | Gap | Spec requirement |
|---|---|---|
| M1 | **No GTM at all** — no container ID env var, no `googletagmanager.com/gtm.js`, no dataLayer bootstrap. | §C — GTM as primary tag layer |
| M2 | **No analytics consent UI** — `NEXT_PUBLIC_CONSENT_MODE` is read by `getGA4Config()` but nothing consumes `consentMode`, and no `gtag('consent', …)` call exists anywhere. No cookie/consent banner component exists (`grep -rln "CookieConsent\|consent-banner\|ConsentBanner\|cookie-consent" src/` → 0 hits). | §C — consent/privacy-safe behaviour |
| M3 | **None of the 18 required GA4 events exist** as an event catalogue or as instrumentation. `behavior-tracking.ts` has a *different*, CRM-internal vocabulary (`course_viewed`, `consultation_booked`, …) that is never bridged to GA4. | §B — required event list |
| M4 | **Lead attribution is not captured.** `Lead` (schema line ~6573) has only `utmSource`, `utmMedium`, `utmCampaign`. `LeadForm` has **no** attribution columns at all. No endpoint reads `utm_*`, `gclid`, `fbclid`, `landingPage` or `referrer` from a request. | §"Minimum lead attribution fields" — 16 fields |
| M5 | **No `firstTouchSource` / `lastTouchSource`** anywhere in the schema. | same |
| M6 | **No Search Console API client.** `analyzeSearchConsoleData(metrics: SearchConsoleRow[])` takes rows *supplied by the caller*; `SeoEvidencePanel` asks a human to paste JSON. There is no OAuth token exchange, no `searchanalytics.query` call, no `sitemaps.list`, no `urlInspection`. | §A — Search Console integration |
| M7 | **No Business Profile outbound API client** — locations, reviews, posts are unreachable. Only the inbound webhook exists. | §D |
| M8 | **No YouTube embed component** — no `youtube-nocookie` facade, no `videoId` handling (`grep -rn "youtube.com/embed\|youtube-nocookie\|videoId" src/` → 0 hits), no video category library. | §E |
| M9 | **No environment gate for analytics.** Nothing distinguishes development / staging / production for tag injection, so enabling GA4 locally or on a preview URL would pollute the production property. | §"Detect development / staging / production" |
| M10 | **No server-side business conversion events** (`lead_qualified`, `application_started`, `application_submitted`, `enrollment_completed`). | §"prepare server-side/business conversion events" |
| M11 | **No Google-service admin settings surface.** GA4/GTM/Search Console/Maps/YouTube/Cloud configuration status is not visible to an admin beyond the 5-line GA4/GSC bullet list inside `SeoEvidencePanel mode="technical"`. | §"Create/configure a secure admin settings area" |
| M12 | **No conversion-funnel reporting** from attribution → lead → qualified → application → enrolment. | §"Create real business conversion reporting" |
| M13 | **`docs/GOOGLE-FREE-STACK.md` does not exist.** Only the legacy `docs/GOOGLE_SEO_SETUP.md`, which is itself header-marked `LEGACY / NOT USED FOR CURRENT PRODUCTION`. | §"Create/update docs/GOOGLE-FREE-STACK.md" |
| M14 | **No `google-site-verification` meta** support in `layout.tsx` metadata. | §A — verify ownership |

## 4. Failures against standing project rules

| # | Violation | Evidence | Rule |
|---|---|---|---|
| F1 | **Fabricated lead data in production capture path.** `src/app/api/crm/leads/public/route.ts` invents values the visitor never supplied: `country = preferredCountry \|\| destination \|\| 'United Kingdom'`, `preferredLevel \|\| 'Postgraduate'`, `intake \|\| 'September 2026'`, `englishTest \|\| 'IELTS'`, and on the `MarketingLead` row hard-codes `score: 75`, `hotLead: true`, **`consent: true`**. | route read in full | §92 no mock/fake data in production; §66/§116 — recorded consent must never be invented |

`consent: true` is the most serious line in this audit: it writes an affirmative marketing-consent
record for a visitor who was never asked.

## 5. Deliberate exclusions

| Service | Decision | Reason |
|---|---|---|
| **Google Maps Platform** | **NOT REQUIRED — not implemented** | Maps Platform requires a Cloud billing account. The only real ALO need (office/university locations) is already served by zero-cost "Open in Google Maps" deep links, which require no API key and no billing. Introducing a billing-dependent service for functionality that already works would violate the free-first mandate. Documented, with the exact activation path recorded if the business later decides the cost is justified. |
| **Google Cloud (Run / Scheduler / Storage / Pub/Sub / Secret Manager)** | **NOT REQUIRED — not implemented** | The existing VPS + Node 22 + npm architecture is the production system (see `HOSTINGER-RUNTIME-STANDARD.md`) and already runs 22 cron jobs through `src/cron/cron-definitions.ts`. Moving any of it to Cloud Run/Scheduler would introduce a billing account for zero functional gain. Documented as optional with budget/alert requirements. |
| **Google Ads conversion tags** | Architecture prepared, tag not installed | Requires an Ads account and a real conversion action ID. GTM container wiring is in place so an approved Ads tag can be added in GTM without a code change. |
| **Meta Pixel** | Architecture prepared, tag not installed | Same — GTM is the single injection point, so no second script loader is added to the page. |

## 6. Counts

- Google-related env vars already declared in `.env.example`: **10** (`GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `NEXT_PUBLIC_GA4_ENABLED`, `NEXT_PUBLIC_CONSENT_MODE`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON`, `GOOGLE_PUBSUB_AUDIENCE`).
- Files importing `src/lib/seo/ga4.ts`: **1** (a read-only status probe).
- Live GA4 page views currently produced by the site: **0**.

## 7. Plan derived from this audit

1. **Foundation** — single Google config module (env + environment gate + free/paid classification), GA4 event catalogue with a PII blocklist, one tag injector that loads GTM *or* gtag but never both, real consent banner emitting `gtag('consent', …)`, CSP updated to allow the tag and collect domains.
2. **Instrumentation** — wire the 18 required events into existing public components; bridge `behavior-tracking.ts` vocabulary to GA4 rather than replacing it.
3. **Attribution** — append-only Prisma migration adding the 16 attribution fields to `Lead` and `LeadForm`; a shared capture/normalise module; wire into all three public lead endpoints; fix F1.
4. **Search Console** — real OAuth2 client (`searchanalytics.query`, `sitemaps.list`) feeding the *existing* `analyzeSearchConsoleData`, reporting `NOT CONFIGURED` when credentials are absent.
5. **Business Profile** — outbound client for locations/reviews/posts, `NOT CONFIGURED` when unauthorised.
6. **YouTube** — privacy-enhanced (`youtube-nocookie.com`) click-to-load facade + category library; no publishing without a configured authenticated integration.
7. **Admin** — `/api/google/status` + `/admin/google-stack` module; extend (not fork) `SeoEvidencePanel`.
8. **Reporting** — attribution → lead → qualified → application → enrolment funnel endpoint + UI.
9. **Docs/tests/report** — `docs/GOOGLE-FREE-STACK.md`, unit tests, `GOOGLE-STACK-IMPLEMENTATION-REPORT.md`.
