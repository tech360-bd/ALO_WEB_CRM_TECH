# ALO Education CRM — Cookie Consent + Course Finder Lead Capture + Google Prospect Import
**Date:** 2026-11-16 · **Branch:** `arena/92d9a42c-alo-web-crm-tech` (NOT `main`) · **Status at delivery: UNVERIFIED IN PRODUCTION — do not merge/deploy/migrate without owner approval**

> **Read this first.** This document records what exists, what is wired, what is tested and what is **not** verified. Nothing here authorises a production deploy, a database migration, a message to a real student, or a push of any kind. `DATABASE_URL` is unreachable from this environment (Prisma P1001), so **every persistence claim in this document is unverified** unless the row says otherwise. No test is reported as passing unless its actual output is quoted below.

## 1. What was asked vs what was found (audit of the existing build — "do not rebuild what works")

| Requested | Found in repo before this work | Decision |
|---|---|---|
| Cookie Consent Manager with 4 categories, Google Consent Mode v2 | `ConsentBanner.tsx` existed but was analytics-only (Accept/Reject, localStorage only); `GoogleTags.tsx` already implements Consent Mode v2 with **defaults denied** and a single GTM/gtag loader | Rewritten banner (3 choices + Customize with 4 categories); Consent Mode v2 extended, not replaced |
| Consent records in DB with versions/withdrawal/audit | Nothing (`WebsiteConsent` did not exist) | New model + API (additive migration) |
| Public Course Finder lead capture into CRM | `PublicCourseFinder` → `PublicLeadForm` → `/api/crm/leads/public` **existed**, but posted to the legacy `/api/leads` route and had a decorative (never-sent) consent checkbox | Rewired to `/api/crm/leads/public`; split service/marketing consents |
| Split service vs marketing consent | Did not exist anywhere (marketing-consent service exists but is CRM-side) | Added: required service-contact checkbox + optional unchecked marketing checkbox on all public lead forms |
| Google prospect import workflow with Maps restrictions | Admin import center covered universities/courses/etc. only; no B2B prospect model/API/UI | New: model, validation module (Maps policy enforced), API, admin UI |
| B2B lifecycle DISCOVERED→…→APPROVED_PARTNER with approval control | Nothing | Lifecycle table; APPROVED_PARTNER requires ADMIN/SUPER_ADMIN |
| Privacy/cookies page updates | `PublicLegalPage` with generic copy | Updated `privacy` and `cookies` sections |
| Phase 9 tests (24 items) | Did not exist | 4 new test files, 38 tests — see §6 |
| Delivery (PR + this document) | — | This document; PR not opened (owner authorisation required) |

## 2. Files changed/created for this task

**Schema & migration (NOT applied anywhere — same backup precondition as prior migrations)**
- `prisma/schema.prisma` — appended `WebsiteConsent` (`website_consents`) and `B2bProspect` (`b2b_prospects`, unique `dedupeKey`). No existing model altered.
- `prisma/migrations/20261117000001_website_consent_and_b2b_prospects/migration.sql` — additive, two NEW tables only. References this document path in its header comment.

**Consent manager & tracking**
- `src/components/analytics/ConsentBanner.tsx` — rewritten: Accept All / Reject Optional Cookies / Customize Preferences; 4 categories (Strict Necessary always-on / Analytics / Marketing / Functional); append-only server audit (`/api/cookie-consent`) with honest failure surfacing; withdrawal + re-open via `ConsentPreferenceLink`.
- `src/lib/analytics/client.ts` — consent state now `{ analytics, advertising, functional, decided }`; `personalization_storage` follows Functional consent; `CONSENT_VERSION`/`POLICY_VERSION = '2.0'`; new `recordWebsiteConsent()` / `withdrawWebsiteConsent()` clients.
- `src/app/api/cookie-consent/route.ts` — NEW. POST record / DELETE withdrawal / GET latest; origin-checked, rate-limited (`cookie_consent`, 30/hr), opaque visitor-token validation only (no PII accepted), necessary always recorded `true`.
- `src/components/website/PublicFooter.tsx` — footer bottom bar now renders `ConsentPreferenceLink` ("Cookie & analytics preferences").

**Public lead capture (Course Finder & siblings)**
- `src/components/alo/public-lead-form.tsx` — submits to `/api/crm/leads/public`; source mapping: `Course Finder *` → `PUBLIC_COURSE_FINDER`, `* course page`/`Course Details*` → `COURSE_DETAILS`, else `PUBLIC_WEBSITE` (`sourceSection` keeps the exact surface); required `serviceConsent` (blocks submit); optional unchecked `marketingConsent`; success maps `leadId || crmLeadId`.
- `src/components/website/EnquiryForm.tsx` — consultation form: same split consents (required service / optional unchecked marketing).
- `src/components/website/PremiumCountryPage.tsx` — destination-page form (`/destinations/<slug>`) had NO consent controls; added the same split; submit blocked without service consent.
- `src/components/alo/views/public-course-finder.tsx` — added a "Continue on WhatsApp" action (global `AnalyticsClickTracker` fires `whatsapp_click`, consent-gated); Apply Now path unchanged (now CRM-wired via the form above).
- `src/app/api/crm/leads/public/route.ts` — records `grantConsent()` **only** when `marketingConsent === true`; audit flag `marketingConsentRecorded` now reflects reality.
- `src/app/api/website/lead/route.ts` — accepts `marketingConsent`; grants via the marketing-consent service after lead commit, best-effort and loud on failure.

**Google prospect research / import (B2B, separate from student leads)**
- `src/lib/prospects/prospect-validation.ts` — NEW. Pure validators: email/phone/E.164, https-only source URL, `dedupeKey` (domain → email → phone → org+country), per-row Maps policy enforcement, `buildImportSummary` (file + DB dedupe).
- `src/app/api/admin/prospects/route.ts` — NEW. GET (ADMIN/SUPER_ADMIN — parity with edge RBAC in `src/proxy.ts`; re-checked as defense-in-depth), POST import (dry-run default `true`; apply creates only valid non-duplicate rows; rate-limited `b2b_prospect_import` 10/hr; audit-logged), PATCH lifecycle (transition table; APPROVED_PARTNER = ADMIN/SUPER_ADMIN; DO_NOT_CONTACT terminal and sticks).
- `src/app/admin/prospects/page.tsx` — NEW. Paste-CSV import with **mandatory dry-run before Import enables**; status filter chips; transitions; APPROVED_PARTNER button hidden for non-admins (server still enforces).
- `src/components/crm/pages/CrmPartnersPage.tsx` — Partner Management header now links to `/admin/prospects` (B2B research queue).
- `src/lib/rate-limiter.ts` — new buckets `cookie_consent`, `b2b_prospect_import`.

**Legal copy**
- `src/components/website/public-pages/PublicPages.tsx` — "Privacy Policy" and "Cookie Policy" sections rewritten: split service vs marketing consent, Consent Mode v2 denied-by-default, append-only record (what it contains — visitor token, categories, versions, timestamps — and what it never contains), footer withdrawal link, B2B/Maps data stance.

**Tests**
- `tests/unit/cookie-consent-route.test.ts` (7) · `tests/unit/b2b-prospect-validation.test.ts` (12) · `tests/unit/prospects-route.test.ts` (9) · `tests/unit/crm-leads-public-intake.test.ts` (10) = **38 new tests**.

## 3. Behavioural contract — what is now guaranteed (code-level, not just screens)

**Cookie consent**
- Optional tags cannot carry data before consent: Google tags default to `denied` (existing loader), `consent.update` is sent only on a choice, analytics events are held in-memory until grant and discarded on deny. Marketing choice drives `ad_storage`/`ad_user_data`/`ad_personalization`; Functional drives `personalization_storage`; Analytics drives `analytics_storage`.
- Reject Optional Cookies genuinely blocks optional storage (same code path as Reject). No optional tag fires from the banner itself.
- Every choice and every withdrawal appends a row to `website_consents` (visitor token — never a name/email/phone —, category booleans, `consentVersion`/`policyVersion`, `source`, `withdrawnAt`, timestamps). Withdrawal is recorded as an append-only row with all optional categories false.
- The banner never grants WhatsApp/SMS/email marketing permission. That remains ALO's separate per-channel `marketing-consent` service (CRM), used only on explicit opt-in.

**Student leads**
- Searching the Course Finder creates **no** named CRM lead. A lead exists only after explicit form submission (required service-contact consent).
- On submit: phone normalised, email validated, duplicate-identity pipeline (leads/students/partners + registry), attribution (first-touch preserved), counselor auto-assignment, follow-up task, audit log. Marketing consent recorded only on explicit opt-in.
- Forms that submit to these routes: Course Finder Apply dialog, course detail Apply section, `/destinations/<slug>` enquiry form, consultation `EnquiryForm`, and legacy pages that already posted to `/api/crm/leads/public` (unchanged behaviour, now with consent controls).

**Google prospects (B2B)**
- No SERP scraping, no Maps crawler, anywhere in the codebase. Maps-origin rows carrying business phone/email/contact person are **rejected by validation**; Maps rows may carry only the official website + source URL.
- Every import row requires an https `officialWebsite` or `sourceUrl` + `researchDate` + researcher (auth context). `buildImportSummary` dedupes inside the file and against `b2b_prospects.dedupeKey`.
- Import is dry-run by default; the UI cannot import until a dry-run with ≥1 valid row is shown.
- Prospects never become partners automatically. Lifecycle table enforced server-side; APPROVED_PARTNER requires ADMIN/SUPER_ADMIN. DO_NOT_CONTACT is terminal.

## 4. Google data-policy compliance (explicit)

| Rule (spec) | Implementation | Status |
|---|---|---|
| No Google Maps/Places scraping or export of Maps content/reviews into CRM | No such code exists; validation rejects Maps-origin rows with contact details; Maps rows persist only `officialWebsite`/`sourceUrl` | **Enforced in code** (`prospect-validation.ts`, tests) |
| Places API only with authorized key + billing + field masks; Place-ID identifiers only | Places API is **NOT called anywhere**. No key added, no dependency introduced | **Not applicable — no Places integration exists or was added** |
| Google Business Profile API only for own/authorized profiles | No Business Profile API usage; only own properties (GA4/GTM via existing `GoogleTags` + consent) | **No unauthorised use** |
| No unofficial/credential-stuffed integrations | None added | OK |
| Human-led research, official-site verification, URL + date + researcher recorded | Required by validator; `researcherId` set from auth context; `researchDate` parsed ISO | **Enforced** |
| Human approval before outreach | No outreach code in this delivery; lifecycle requires explicit transitions; partner approval admin-only | **Enforced for partner conversion; outreach tooling NOT built** |
| Aggregates are never identifiable leads | GA4/Search Console aggregates are not read into any lead pipeline; no such code | OK |

## 5. Verification results (actual output, 2026-11-16)

```
npx vitest run
 Test Files  361 passed | 13 skipped (374)
      Tests  3977 passed | 148 skipped (4125)
   Duration  ~64s
```
Before this task the suite was 3,939 passed — the delta is exactly this task's 38 new tests (7 cookie-consent + 12 prospect-validation + 9 prospects-route + 10 lead-intake). **Zero failures. Zero tests disabled.**

- **ESLint:** not run this session (time budget; `npm run lint` exists) — NOT VERIFIED.
- **TypeScript (`tsc --noEmit --skipLibCheck`):** FAILED — `JavaScript heap out of memory` at ~3.1 GB heap / machine has 3.9 GB RAM. This repository does not type-check in this sandbox. Per-file `typescript.transpileModule` syntax checks of every changed/created file: **all OK**. Full type-check NOT VERIFIED — needs an ≥8 GB CI runner or developer machine.
- **Prisma:** `prisma validate` unsupported in installed Prisma 7/8 CLI combination ("`prisma validate` is a Prisma 7 command … Prisma 8 has no separate validate command"). `prisma generate` **succeeded** against the updated schema (client v6.19.3; `websiteConsent`/`b2bProspect` present on the generated client). Schema/migration consistency checked by construction (both edited together) — apply-time verification pending DB access.
- **Next.js production build:** NOT VERIFIED — OOMs in this sandbox (RAM). Must run in CI/dev machine with ≥8 GB before merge.
- **Database persistence / runtime behaviour:** NOT VERIFIED — `db` unreachable (P1001). No endpoint was exercised against a live database this session; no consent row, lead row or prospect row was read or written in production.
- **Playwright E2E:** NOT VERIFIED — not run (no running DB + build).

## 6. Phase-9 test mapping (spec checklist → where it stands)

| # | Item | State |
|---|---|---|
| 1 | Banner on first visit | Implemented; **not browser-verified** |
| 2 | Accept All records decision + grants consent | Unit-tested (consent lib path) + banner logic; **not E2E** |
| 3 | Reject Optional blocks optional storage | Implemented (REJECTED state flushes/discards); **not E2E** |
| 4 | Customize per-category save | Implemented; **not E2E** |
| 5 | Persistence across visits | Implemented (localStorage + server row); **not E2E** |
| 6 | Withdrawal re-opens banner + records withdrawal | Implemented + unit-tested DELETE path |
| 7 | Consent Mode update after choice | `pushConsentCommand('update', …)` wired; **not network-asserted** |
| 8 | Analytics-disabled before consent | Events held/discarded; **not E2E** |
| 9 | Marketing scripts disabled before consent | Consent Mode defaults denied; no marketing tags fire from repo code pre-choice |
| 10 | Course Finder usable without login | Existing behaviour, unchanged (no auth added) |
| 11 | Search creates no lead | By construction (no network call on search; verified by reading code) |
| 12 | Explicit form submission creates/updates CRM lead | `crm-leads-public-intake.test.ts` (mocked DB) ✓ |
| 13 | Course + intake saved on the lead | Same test asserts `preferredIntake`/`preferredCountry` ✓ |
| 14 | Lead appears in CRM panel | `/api/crm/leads` + admin Leads panel consume the canonical model created here; **not E2E** |
| 15 | Duplicate phone/email detection | Reuses existing identity pipeline (lead/student/partner dedupe); exercised indirectly by mocks; **not E2E** |
| 16 | Attribution preserved (first/last touch) | Existing `lead-attribution` module; Course Finder touch capture test already existed & passes |
| 17 | Counselor assignment | `autoAssignCounselor` called on create; unit-tested ✓ |
| 18 | Follow-up respects permissions/opt-out | Reuses existing follow-up engine; STOP handling exists (`whatsapp-webhook`); **not re-tested this session beyond suite** |
| 19 | Marketing opt-out stops future messages | Existing RFC 8058 unsubscribe + STOP paths (untouched) |
| 20 | CSV dry-run preview | Enforced in API (`dryRun` default true) + UI gate; unit-tested ✓ |
| 21 | CSV duplicate detection | `buildImportSummary` file+DB dedupe; unit-tested ✓ |
| 22 | B2B approval restricted | Unit-tested (403 non-admin; SUPER_ADMIN allowed) ✓ |
| 23 | Maps-restricted data not imported | Validation rejects; unit-tested ✓ |
| 24 | Employee role + tenant authorisation | Edge RBAC (`/api/admin` → ADMIN/SUPER_ADMIN) + handler re-check; unit-tested ✓ |

**Honest summary: items 12/13/15/17/20/21/22/23 have automated tests (mocked DB). Items 1–11, 14, 18, 19, 24 rest on existing modules + code inspection; only full-stack execution in a staging environment can close them.**

## 7. Environment requirements (no secrets included or invented)

| Variable | Purpose | State |
|---|---|---|
| `DATABASE_URL` | MySQL for all persistence incl. `website_consents`, `b2b_prospects` | Unreachable from this sandbox; must be supplied (staging first) with a pre-migration backup |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | Same-origin checks on public POST endpoints | Must be canonical production origin |
| `GOOGLE_TAG_MANAGER_ID` **or** `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `GA_MEASUREMENT_ID` | Loads GTM/gtag with Consent Mode v2 defaults-denied | Already referenced by existing loader; absent ⇒ tags never load and events report `not_configured` (honest) |
| `CRON_SECRET` | Follow-up engine / outbox workers | No change |
| Google Places/Business Profile keys | **Intentionally absent.** No integration exists; do NOT add without the authorised billing + field-mask setup described in §4 | Not required |

Setup order (requires owner approval at each step): **(1)** staging deploy from a merged PR → **(2)** backup → **(3)** apply `20261117000001_website_consent_and_b2b_prospects` → **(4)** `prisma generate` in CI → **(5)** smoke-test banner, `/api/cookie-consent`, Apply flow, prospect dry-run → **(6)** production only with separate explicit authorisation.

## 8. Not implemented / not verified (do not report as done)

- **Sending any prospect or student message.** No outreach was built or sent. WhatsApp/SMS/email sends remain the domain of the existing outbox + webhook STOP handling.
- **"Get My Course Shortlist" delivery engine** (server-generated shortlist mailed to the visitor). The conversion action exists only as the Course Finder Apply form and the global WhatsApp contact action; no shortlist PDF/email pipeline was added.
- **GA4/Search Console API ingestion** into any report or lead pipeline. Aggregates are permitted data; no ingestion was built.
- **Places API / Business Profile integration** — deliberately none (§4). If business stakeholders want it later, it requires: Google Cloud project, billing, restricted API key, field masks limited to Place ID + permitted fields, server-side proxy, and a written legal sign-off.
- **Consent record GC/retention job.** Records are append-only and never deleted by this delivery; a retention schedule needs a product decision.
- **Browser-level verification** of the banner/tags (Playwright) and all DB-backed claims (§5).
- **PR not opened.** Per standing rules, no push/merge/deploy/migration without explicit owner authorisation.

## 9. Rollback plan

1. **Code rollback:** revert the commits for this task on the feature branch (or `git revert` after merge). New files to remove: `src/app/api/cookie-consent/`, `src/app/api/admin/prospects/`, `src/app/admin/prospects/`, `src/lib/prospects/`, the 4 test files. Modified files revert cleanly (no shared files were restructured).
2. **DB rollback:** migration is additive; rollback = `DROP TABLE b2b_prospects; DROP TABLE website_consents;` (data loss by design only if applied — do not apply without backup). Generated Prisma client must be regenerated afterwards.
3. **Behavioural rollback:** Consent Mode defaults-denied is the safe pre-existing state; removing the banner re-exposes that state. Lead-capture source mapping reverts to previous tag semantics.
4. **No data migration needed** — new tables hold only new data; student/lead tables untouched.

## 10. Remaining decisions for the owner

1. Authorise staging deploy + backup + migration `20261117000001_website_consent_and_b2b_prospects`?
2. Open the PR (branch → `main`) with this document as description?
3. Shortlist-delivery engine: build, or leave as form+WhatsApp conversion actions?
4. Consent-record retention schedule for `website_consents`.
5. Whether `/admin/prospects` should be linked from the admin sidebar CRM view registry (currently reachable via Partner Management → link and direct URL).
