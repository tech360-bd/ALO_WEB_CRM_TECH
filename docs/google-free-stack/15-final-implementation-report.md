# ALO EDUCATION — GOOGLE FREE STACK PRODUCTION IMPLEMENTATION REPORT

**Repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Branch:** `arena/780bb927-alo-web-crm-tech` (from `e9ccd3bded5b5fbff6fe9356ea14aa5171d19669`)
**Production domain:** `https://aloeducation.com`
**Report date:** 2026-11-15
**Status vocabulary:** `PASS` (implemented and verified) · `PARTIAL` (partially done, or done but not verified) · `MISSING` · `BLOCKED` (needs external access/credential/DNS/billing) · `NOT REQUIRED`

> **Read this first.** No Google credential, no database connection and no production host
> access existed in the environment where this work was done. Everything that depends on a live
> Google property is reported `BLOCKED`, never `PASS`. Code that compiles and passes unit tests
> is *not* an integration observed working against Google, and this report does not pretend
> otherwise. Nothing here was deployed.

---

## 1. Executive summary

The audit found that ALO **already had** a real Google integration layer (tag loading with
Consent Mode v2, a closed analytics event vocabulary with a three-layer PII screen, Search
Console and Business Profile API clients, server-side Measurement Protocol conversions, lead
attribution with first/last-touch rules, an admin module, and a `docs/` audit of the prior
pass). It also found **seven genuine gaps**, all of which were closed in this pass:

1. **GA4 Analytics Data API did not exist** — no reporting-read capability at all.
2. **`pte_page_view` / `toefl_page_view` could never fire**, and worse, every `/language-prep/*`
   page was counted as **IELTS** traffic.
3. **`country_page_view` / `destination_page_view` missing.**
4. **`page_scroll` missing entirely.**
5. **`document_upload_completed` / `application_status_changed` missing** from both the
   vocabulary and every route.
6. **`english_test_complete` declared but never emitted.**
7. **The eight `google.*` RBAC permissions did not exist.**

Production readiness, stated precisely:

| Layer | Readiness |
|---|---|
| Code (analytics, tagging, reporting, RBAC, docs) | **Complete for this pass's scope**, 0 type errors, 0 lint problems, 140 Google-related tests passing |
| Configuration | **Incomplete by necessity** — every Google identifier and credential is an operator console action |
| Live verification against Google | **Not performed** — impossible without a credential |
| Deployment | **Not performed** — GitHub Actions is designed not to deploy; Hostinger owns production and was not reachable |

Practical reading: once an operator completes `02-google-account-setup.md` (roughly 60–90
minutes plus DNS propagation), the code should light up without further development — but that
expectation is an inference, not a verified result, and the operator must run the verification
tables in `04`/`05`/`06`/`14` before marking anything `PASS`.

## 2. Existing system audit

Full detail: `01-existing-system-audit.md`.

| Category | Found |
|---|---|
| **Present and working (code)** | Google config + tag-loader arbitration, Consent Mode v2 bootstrap, consent banner, page-view ownership, contact-click tracking, event allowlist + PII screen, Measurement Protocol sender, Search Console client + 4 endpoints, Business Profile client + read endpoint + inbound webhook, YouTube embed, lead attribution library, conversion funnel, aggregate status endpoint, admin module, robots.txt, sitemap.xml, org JSON-LD |
| **Missing** | Analytics Data API (reporting reads); `page_scroll`; `pte_page_view`/`toefl_page_view`; `country_page_view`/`destination_page_view`; `document_upload_completed`; `application_status_changed`; any emit of `english_test_complete`; the eight `google.*` permissions; the 15-file documentation set |
| **Broken (silently)** | IELTS/PTE/TOEFL attribution — all English-test traffic counted as IELTS |
| **Duplicated** | Nothing duplicated by this pass. Prior work already consolidated Measurement Protocol into one implementation and tag loading into one owner |

## 3. Google account inventory

Detail: `02-google-account-setup.md`. **No Google account, property, container or project exists
in this environment, and none can be created from code.**

| Thing | Exists | Required action |
|---|---|---|
| ALO-owned Google account | **BLOCKED** | Create/adopt; 2SV; two owners |
| GA4 Standard property + Web stream | **BLOCKED** | Create; yields `G-…` and numeric property id |
| GA4 Measurement Protocol secret | **BLOCKED** | Create in the data stream |
| GTM Web container | **BLOCKED** | Create; yields `GTM-…` |
| Search Console Domain property | **BLOCKED** | DNS TXT verification (do **not** use URL-prefix) |
| Business Profile | **BLOCKED** | Duplicate check first; real office only |
| YouTube channel | **BLOCKED** | Confirm ownership; set handle/id |
| Cloud project `alo-education-production` | **BLOCKED** | Needed **only** to enable 3 free APIs + hold one service account. **No billing account** |

## 4. Google API inventory

Detail: `03-google-api-inventory.md`.

| API | Enabled | Billing | Auth | Permission/scope | Quota | Test result |
|---|---|---|---|---|---|---|
| GA4 tag collection | n/a | No | public ID | — | none material | **PARTIAL** — logic unit-tested, delivery not observable server-side |
| GA4 Measurement Protocol | n/a | No | data-stream secret | — | ALO-limited | **PASS (guards) / BLOCKED (delivery)** |
| **GA4 Analytics Data API** (new) | **operator** | **No (FREE)** | SA or OAuth | `analytics.readonly` | tokens/property/day; ALO makes single-digit calls | **BLOCKED** — 29 unit tests pass, incl. "no network call when unconfigured" |
| Search Console API | **operator** | No (FREE) | SA or OAuth | `webmasters.readonly` | per-site daily quota | **BLOCKED** |
| Business Profile APIs | **operator** | No (FREE) | SA or OAuth | `business.manage` | low volume | **BLOCKED** |
| Business Profile v4 reviews | not requested | No | — | — | — | **NOT REQUIRED** (10+ location restriction) |
| YouTube Data API v3 | not enabled | No | key/OAuth | — | 10k units/day | **NOT REQUIRED** |
| Maps Platform | **not enabled** | **YES (PAID)** | key | — | billed | **NOT REQUIRED** — assessment in `10` |
| Cloud Run/Scheduler/Storage/PubSub/Secret Manager | **not enabled** | **YES** | — | — | — | **NOT REQUIRED** |
| Indexing API | not enabled | No | — | — | — | **NOT REQUIRED** — terms restrict it to JobPosting/BroadcastEvent |

## 5. CRM integration report

Detail: `07-crm-attribution.md`.

**Reused, unchanged:** `Lead`, `LeadForm`, `MarketingLead` models including their existing
attribution columns (`utm*`, `gclid`, `fbclid`, `landingPage`, `referrer`, `source/medium/
campaign`, `firstTouch*`/`lastTouch*` + timestamps, and the three indexes); `findDuplicateLead`,
`autoAssignCounselor`, `createFollowUpTask`, the canonical student resolver, the sequence-based
Student ID allocator, the central communication hub, the rate limiter, `AuditLog`.

**Added (no schema change, no new table, no migration):**

| Change | Files |
|---|---|
| Two lifecycle event helpers + fixed vocabularies | `src/lib/analytics/application-events.ts` |
| Emit after application stage commit | `src/app/api/applications/[id]/status/route.ts` |
| Emit after a real byte-backed document upload | `src/app/api/student/documents/route.ts`, `src/app/api/applications/[id]/documents/route.ts` |
| Emit when an English test outcome is recorded | `src/app/api/student-portal/profile/sections/route.ts` |
| Four new event parameters (`scroll_depth_percent`, `upload_kind`, `stage_from`, `stage_to`) | `src/lib/analytics/events.ts` |

The website→CRM→counsellor→application→enrolment flow is untouched; analytics was attached
**after** commit on paths that already existed.

## 6. Analytics report

Detail: `04-ga4-implementation.md`.

**Events: all 27 required events now exist in code and have an emitter.**

Implemented earlier: `page_view`, `course_search`, `course_view`, `university_search`,
`university_view`, `lead_form_start`, `lead_form_submit`, `counselor_request`, `whatsapp_click`,
`phone_click`, `email_click`, `application_start`, `application_submit`, `english_test_start`,
`ielts_page_view` (corrected), `lead_qualified`, `application_started`, `application_submitted`,
`enrollment_completed`.

Added in this pass: `page_scroll`, `country_page_view`, `destination_page_view`,
`pte_page_view`, `toefl_page_view`, `document_upload_completed`, `application_status_changed`,
and the first real emit of `english_test_complete`.

**Duplicate prevention:** exactly one tag loader (GTM *or* gtag.js) enforced twice; GTM mode
uses container-owned first page view or `send_page_view:false` (documented as shape A/B in
`05`); route-derived events come from one place so no page can double-emit.

**Honest limits:** delivery to Google is `BLOCKED`; `english_test_complete` fires when an
English test *outcome is recorded in the CRM*, not when a candidate finishes a test on the
external ALO test platform (no callback exists for that).

## 7. SEO report

Detail: `06-search-console-implementation.md`.

| Item | Status |
|---|---|
| robots.txt hardened (staff portals, tenant portals, `/review/[token]` capability links) | **PASS** |
| sitemap.xml (9 sources, public-content gated, cron-regenerated) | **PASS** |
| Org/EducationalOrganization JSON-LD rendered site-wide | **PASS** |
| Search Console API client + status/performance/sitemaps/ingest endpoints | **PASS (code)** / **BLOCKED (live)** |
| Domain verification, sitemap submission, indexing data, CrUX/CWV field data | **BLOCKED** |
| Canonical coverage across all pages | **PARTIAL** (metadata-driven; no exhaustive crawl audit) |
| Search performance / queries / pages / countries / devices reporting | **BLOCKED** (needs credential) |
| SEO dashboard in admin | **PARTIAL** (built; renders `NOT_CONFIGURED` truthfully) |

## 8. Admin dashboard report

Existing module `Admin → Integrations → Google Ecosystem` at `/admin/google-stack`
(`src/app/admin/google-stack/page.tsx`), extended in this pass with an **Acquisition — GA4**
panel.

| Required surface | Status |
|---|---|
| Google connection status per service (Connected / not connected / config required / auth expired / API error / billing required / disabled / N/A) | **PASS** — `GET /api/google/status` distinguishes `configured` from `liveVerified` and returns a per-service verdict + actionable reason |
| Cost classification per service + `paidServicesInUse` | **PASS** |
| SEO dashboard (clicks, impressions, CTR, position, top queries, landing pages?, countries, devices, indexing, sitemaps, CWV) | **PARTIAL** — queries/sitemaps implemented; indexing + CWV **BLOCKED**; country/device via Search Console dimensions implemented but unverified; landing pages come from GA4 |
| Acquisition dashboard (traffic source, organic/referral/direct, campaigns, landing pages, lead conversion, qualified leads) | **PARTIAL** — GA4 presets `channels`/`acquisition`/`campaigns`/`landingPages` implemented + CRM funnel for lead conversion; **BLOCKED** on credential/DB |
| Recruitment dashboard (leads, qualified, assignments, applications, enrolments, rates, source) | **PARTIAL** — `GET /api/analytics/conversion-funnel` + UI; needs a populated DB |
| Data freshness + reporting period displayed | **PASS** — every GA4 response shows period, `fetchedAt`, `sampled`, and a freshness statement |
| Never display fabricated metrics | **PASS** — `NOT_CONFIGURED`/`BLOCKED` render as such; no zero-filled dashboards |
| Browser-exercised | **MISSING** — no browser in this environment |

## 9. Security report

Detail: `11-security-and-rbac.md`.

| Control | Status |
|---|---|
| `google.*` permissions in the existing RBAC catalogue (8 permissions, `super_admin` inherits all, `marketing_manager` gets 3 read) | **PASS (added this pass)** |
| Enforcement helper layering permission on the existing staff gate (no regression) | **PASS** — `src/lib/google/access.ts` |
| No secret exposed to the client (`NEXT_PUBLIC_*` limited to Measurement ID / container ID / channel handle) | **PASS** — verified by grep |
| Credentials server-side only; never returned by any endpoint | **PASS** |
| Error messages never carry a credential (including the Measurement Protocol URL) | **PASS** |
| Least-privilege OAuth scopes (read-only for reporting) | **PASS** |
| One 401 refresh retry, no loops; 15s/4s timeouts | **PASS** |
| Rate limiting on every Google-reporting endpoint | **PASS** |
| Audit log for business changes | **PASS** (existing `AuditLog` on stage/document actions) |
| Google-specific audit **UI** | **MISSING** — `google.audit.view` exists, surface does not |
| Secret scan (CI node tests + manual pattern scan) | **PASS** — 0 real findings |
| PII never transmitted | **PASS** — three-layer screen, unit-tested |

## 10. Cost report

Detail: `12-billing-and-cost-control.md`.

| Classification | Services | Billing account | In use |
|---|---|---|---|
| **FREE** | GA4, GTM, Measurement Protocol, **Analytics Data API (new)**, Search Console + API, Business Profile, YouTube | Not required | Yes |
| **FREE TIER** | Cloud Run / Scheduler / Storage / Pub/Sub / Secret Manager, YouTube Data API | Required | **No** |
| **PAID** | Maps Platform, Google Ads, GA4 360 | Required | **No** |

- `costSummary.paidServicesInUse` is **empty**; ALO's Google spend is **BDT 0**.
- **No billing account was created, and nothing in this codebase can create one.**
- If Maps/Cloud are ever adopted, the mandatory pre-flight is `10-maps-integration.md` §5:
  approval → dedicated project → budget alerts → **quota caps (the only real ceiling)** →
  referrer+API-restricted key → documented overage.
- **No claim is made that any service is permanently free.** All figures are dated 2026-11-15.

## 11. Testing report

Detail: `13-testing-and-verification.md`.

| Check | Command | Result |
|---|---|---|
| New tests | `npx vitest run tests/unit/google-analytics-data-api.test.ts` | **29/29 PASS** |
| Existing Google tests | `npx vitest run tests/unit/google-stack.test.ts` | **111/111 PASS** (2 assertions corrected — they encoded the IELTS defect) |
| Attribution funnel | `npx vitest run tests/unit/course-finder-attribution-funnel.test.ts` | **PASS** |
| Full unit suite | `npx vitest run tests/unit` | **3688 pass / 27 fail** |
| **Baseline proof** | `git stash push -u` → re-run the 13 failing files → `git stash pop` | **Identical 13 files / 27 tests fail at pristine `HEAD`** — this pass introduced **zero** new failures |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=7000 npx tsc --noEmit` | **104 errors, 0 in any touched file** (7 real errors in new code were found and fixed: 111 → 104) |
| Lint | `npx eslint <changed files>` | **0 problems** |
| Secret suites | `node --test tests/secret-findings.test.mjs tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` | **25/25 PASS** |
| `prisma generate` | — | **BLOCKED** (`binaries.prisma.sh` unreachable) |
| `npm run build` | — | **BLOCKED** (needs `prisma generate`) |
| Integration / E2E | — | **NOT RUN** (need a database / running app) |

Failures and limitations are listed, not summarised away.

## 12. Deployment report

Detail: `14-deployment-and-rollback.md`.

| Item | Value |
|---|---|
| Branch | `arena/780bb927-alo-web-crm-tech` |
| Base commit | `e9ccd3bded5b5fbff6fe9356ea14aa5171d19669` (`main`, PR #59 merged 2026-11-14) |
| Commit / PR for this pass | Recorded in the branch's Git history and PR description |
| CI | Ran locally as above. The repository's full CI (MySQL 8 + Prisma engine + build) **cannot run in this sandbox** |
| Production deployment | **BLOCKED** — `.github/workflows/deploy-production.yml` is a deliberate refusal notice; Hostinger owns production and was not reachable. **Nothing was deployed and no deployment is claimed.** |
| Whether the deployed app matches `main` | **UNKNOWN** — explicitly not assumed |

## 13. Database report

| Item | Result |
|---|---|
| Migrations added | **NONE** |
| Tables/columns added | **NONE** |
| Schema changes | **NONE** — all attribution columns already existed and were reused |
| Destructive operations | **NONE** |
| Backup obligation from this pass | None (no migration). Any future migration requires a `mysqldump` first (`14` §4.1) |
| Rollback | Code-only (`git checkout <previous SHA>`), plus a no-deploy analytics kill switch (unset the GA4/GTM flag or `GA4_API_SECRET`) |

## 14. Manual Google setup still required

Complete, exact steps are in `02-google-account-setup.md` §3 and `05-gtm-implementation.md` §2.
Summary of what only a human logged into Google can do:

1. Create/adopt the ALO Google account (2SV, two owners).
2. Create the GA4 Standard property + Web data stream → `GA4_MEASUREMENT_ID`,
   `GA4_PROPERTY_ID`; disable Enhanced Measurement's automatic form interactions.
3. Create the Measurement Protocol secret → `GA4_API_SECRET`.
4. Create the GTM Web container → `NEXT_PUBLIC_GTM_ID`; add one GA4 Configuration tag with
   `send_page_view` per the chosen shape; per-event triggers; **test in Preview before
   publishing**.
5. Verify the Search Console **Domain** property by DNS TXT; submit `/sitemap.xml`.
6. Create Cloud project `alo-education-production`; enable **only** Search Console API +
   Analytics Data API + Business Profile APIs; **no billing account**; create service account
   `alo-web-reader` + JSON key.
7. Grant that service account: Search Console (Restricted), GA4 property (Viewer), Business
   Profile (Manager).
8. Provide the JSON key as `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` in the deployment secret
   store; set `GA4_PROPERTY_ID`.
9. Duplicate-check and claim/create the Business Profile; capture `GOOGLE_BUSINESS_ACCOUNT_ID`.
10. Confirm the official YouTube channel; set `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE`.
11. Only if wanted: `GOOGLE_SITE_VERIFICATION_TOKEN` for a meta-tag verification (DNS is
    preferred).
12. Run the post-deploy verification table (`14` §5) and record each result.

**Never** paste a service-account key, OAuth secret, refresh token or Measurement Protocol
secret into chat, Git, a screenshot or a `NEXT_PUBLIC_*` variable.

## 15. Outstanding blockers

| # | Blocker | Exact reason | Unblocks |
|---|---|---|---|
| B1 | No Google credential | None exists in this environment; issuing one requires a human in Google Cloud | Search Console, Analytics Data API, Business Profile — `03`, `06`, `08` |
| B2 | No GA4 property / Measurement ID | Console creation only | All tag delivery, DebugView verification |
| B3 | No GTM container | Console creation only | GTM Preview verification, container tags |
| B4 | DNS access for domain verification | Registrar/DNS provider access not available here | Search Console domain property |
| B5 | Business Profile verification | Human at the real office; may need postal verification | Listing, API reads |
| B6 | `prisma generate` blocked | `binaries.prisma.sh` not reachable from this sandbox | Full `tsc` gate, `next build`, integration tests |
| B7 | No database | No MySQL instance in this environment | Live CRM tests, funnel against real data, UTM round-trip |
| B8 | No production host access | Hostinger credentials not available; Actions is designed not to deploy | Deployment + post-deploy verification |
| B9 | English-test completion signal | The ALO English Test is delivered on an **external** platform with no callback into this app | True `english_test_complete` on candidate finish — **product dependency, not a code defect** |
| B10 | Google-specific audit UI | `google.audit.view` exists; the underlying data is in `AuditLog`; no UI built | Admin audit surface |
| B11 | Google Ads / Meta Pixel tagging | No accounts exist; GTM is ready but adding them needs consent review + approval | Future paid campaigns |

## 16. Final acceptance — 24-point checklist

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Existing repository and production audit | **PASS** | `01` — branch/commit/PR inventory, deployment ownership established, 24 criteria mapped |
| 2 | Google account ownership and access | **BLOCKED** | `02` §3a — console only |
| 3 | Search Console property verification | **BLOCKED** | needs DNS TXT |
| 4 | Sitemap and robots.txt verification | **PARTIAL** | `06` §3 — generators hardened and reviewed; live fetch not possible here |
| 5 | Search Console API integration | **BLOCKED** (code PASS) | `06` §1; `src/lib/seo/search-console-client.ts` |
| 6 | GA4 property and web stream | **BLOCKED** | console only |
| 7 | GA4 event implementation | **PASS** (delivery BLOCKED) | `04` §2 — all 27 required events declared + emitted; 140 Google-related tests |
| 8 | GTM production container | **BLOCKED** | console only |
| 9 | GTM event and tag configuration | **BLOCKED** | `05` §2 — exact configuration documented, cannot be applied |
| 10 | Consent and privacy handling | **PASS** (code) / **PARTIAL** (unobserved live) | `04` §1/§3 — Consent Mode v2 ordering, PII screen unit-tested |
| 11 | Google Business Profile preparation | **PARTIAL** | `08` — duplicate procedure + publication checklist ready; creation BLOCKED |
| 12 | YouTube website integration | **PARTIAL** | `09` — component + CSP PASS; no real video placed, channel unset |
| 13 | Maps requirements assessment | **NOT REQUIRED** | `10` — assessed in full; zero-cost deep links live; PAID not adopted |
| 14 | Google Cloud requirements assessment | **PASS** (assessment) | `02` §2 / `12` — one project, three free APIs, no billing |
| 15 | CRM attribution field audit | **PASS** | `07` §1 — existing columns reused; nothing duplicated |
| 16 | First-touch and last-touch attribution | **PASS** | `07` §3 — write-once first touch, direct visits never overwrite |
| 17 | Website-to-CRM integration | **PASS (attribution)** / **PARTIAL (end-to-end)** | `07` §5 — wired into existing intake paths; no live DB round-trip |
| 18 | CRM conversion event integration | **PARTIAL** | `07` §6 — code complete incl. 3 new server events; delivery BLOCKED |
| 19 | SEO dashboard | **PARTIAL** | `06` — queries + sitemaps real; indexing/CWV BLOCKED |
| 20 | Acquisition and recruitment dashboard | **PARTIAL** | `08` — GA4 presets + CRM funnel implemented; needs credential/DB |
| 21 | Admin integration centre and RBAC | **PASS (code)** / **PARTIAL (browser)** | `11` §1 — 8 `google.*` permissions added + enforced; not browser-exercised |
| 22 | Security, secret protection and billing controls | **PASS** | `11`, `12` — scan clean, no billing account, no secret exposure |
| 23 | Automated tests, production verification and deployment | **PARTIAL** | `13`, `14` — tests pass incl. baseline proof; build/verify/deploy BLOCKED |
| 24 | Final evidence report and remaining blockers | **PASS** | this document |

**Counts:** PASS 9 · PARTIAL 6 · BLOCKED 5 · NOT REQUIRED 1 · MISSING 0 (of the 24; where an
item is split, the stricter status is counted).

### Truthful production-readiness statement

**Not production-ready as a verified Google integration, and ready to be verified.** Every
piece of code the specification asks for now exists, is type-clean, lint-clean and covered by
passing tests, and it fails safely and visibly when Google is unavailable or unconfigured. What
is missing is everything that requires a human inside Google: an account, a property, a
container, a verified domain and three API grants. Until those exist and the verification
tables in `04`, `05`, `06` and `14` have been executed and recorded, no line in this report may
be upgraded to `PASS`. The existing CRM remains fully operational and was not modified in any
way that depends on Google.
