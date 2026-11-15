# 04 — GA4 implementation

**Property type:** GA4 **Standard** (never 360). **Cost:** FREE, no billing account.
**Code of record:** `src/lib/analytics/*`, `src/components/analytics/*`, `src/lib/google/config.ts`.

---

## 1. How the tag gets onto the page

`src/app/layout.tsx` renders, inside `<AloSiteOnly>`:

```
<GoogleTags />            ← exactly one tag loader (GTM or gtag.js)
<AnalyticsPageView />     ← owns every page_view
<AnalyticsClickTracker /> ← WhatsApp / tel: / mailto: clicks
<AnalyticsScrollTracker />← scroll milestones (added in this pass)
```

`resolveTagLoader()` in `src/lib/google/config.ts` decides **one** owner:

| Condition | Loader injected |
|---|---|
| GTM container valid + enabled + production | GTM only; GA4 tag lives inside the container |
| No GTM, GA4 valid + `NEXT_PUBLIC_GA4_ENABLED=true` + production | `gtag.js` only |
| Neither | Nothing at all (renders `null`) |

Both loaders are never injected together. If they were, GA4 would count two `page_view` hits
per view and every conversion rate would be silently halved. The rule is enforced twice: in
`resolveTagLoader()` and in `getGoogleStackConfig()` (which clears `ga4.injectTags` when GTM
wins), so no future caller can re-introduce the double count.

### Environment gating

Analytics inject **only** in production. Staging can opt in with
`ANALYTICS_ALLOW_NON_PRODUCTION=true`, and even then server-side events carry
`debug_mode: 1` so they land in DebugView and never in reporting. Development and test never
emit. This is what stops engineer traffic polluting the production property.

### Consent Mode v2

`GoogleTags` builds one inline bootstrap script that, in order:

1. creates `dataLayer` and the `gtag` shim,
2. pushes `gtag('consent','default', …)` with `ad_storage`, `ad_user_data`,
   `ad_personalization`, `analytics_storage`, `personalization_storage` = **denied**, and
   `functionality_storage`/`security_storage` = granted, `wait_for_update: 500`,
3. publishes `window.aloAnalyticsContext` (which loader is live, environment, consent mode),
4. **then** injects the Google library.

The library is injected *from the script* rather than with `<script src>` because React 19
hoists an async `src` script into `<head>`, i.e. physically before the consent defaults —
observed in the prerendered HTML during earlier work. Ordering is therefore guaranteed by
execution sequence, not by markup position.

There is deliberately no GTM `<noscript>` iframe: it would fire a page view for a visitor with
JavaScript disabled, including one who denied consent, because no consent logic can run.

`ConsentBanner` (`src/components/analytics/ConsentBanner.tsx`) is revocable, persists the
decision in `localStorage` under `alo.analytics.consent.v1`, upgrades consent for a grant, and
**discards** held events for a refusal. `trackAnalyticsEvent` queues (max 50) while undecided
so a late grant still measures the visit, but never sends anything before a choice.

## 2. Event implementation — actual status

There is exactly **one** event vocabulary: `ANALYTICS_EVENT_NAMES` in
`src/lib/analytics/events.ts`. An event not in that array is rejected in development with a
message telling the developer to add it deliberately.

| Required event | Implemented? | Emitted from | Notes |
|---|---|---|---|
| `page_view` | ✅ | `AnalyticsPageView` | Owns initial + SPA navigations. Skips the first view under GTM (its Configuration tag already fired) |
| `page_scroll` | ✅ **(added this pass)** | `AnalyticsScrollTracker` | 25/50/75/90, once per path, rAF-throttled, `passive: true`, no measurement when the page cannot scroll, suppressed for `prefers-reduced-motion` |
| `course_search` | ✅ | course-finder search | |
| `course_view` | ✅ | route-derived (`/course/[slug]`) | Also attaches `course_slug` |
| `university_search` | ✅ | university listing search | |
| `university_view` | ✅ | route-derived (`/universities/[slug]`) | Attaches `university_slug` |
| `country_page_view` | ✅ **(added this pass)** | route-derived, `/destinations/[slug]…` | Previously only visible as `page_type=country` |
| `destination_page_view` | ✅ **(added this pass)** | route-derived, `/destinations` index | Deliberately distinct from the above: the chooser vs the chosen destination |
| `lead_form_start` | ✅ | lead forms | |
| `lead_form_submit` | ✅ | every lead-intake path | |
| `counselor_request` | ✅ | consultation requests | |
| `whatsapp_click` | ✅ | `AnalyticsClickTracker` (delegated) | Covers every WhatsApp link on the site, including pages written before tracking existed |
| `phone_click` | ✅ | `AnalyticsClickTracker` | |
| `email_click` | ✅ | `AnalyticsClickTracker` | |
| `application_start` | ✅ | application flow | |
| `application_submit` | ✅ | application submit | |
| `document_upload_completed` | ✅ **(added this pass)** | `reportDocumentUploadCompleted` from the student upload route and the staff application-document route | Fires **after** the upload commits, and only for a real byte-backed upload — never for a document *requirement* row. Carries `upload_kind` from a fixed vocabulary |
| `application_status_changed` | ✅ **(added this pass)** | `reportApplicationStatusChanged` from `PATCH /api/applications/[id]/status` | After commit; carries `application_stage`, `stage_from`, `stage_to` and an opaque `application_reference` |
| `english_test_start` | ✅ (vocabulary) | test entry surfaces | |
| `english_test_complete` | ✅ **(added this pass, with a scope limit)** | `reportEnglishTestComplete` from `POST /api/student-portal/profile/sections` (section `english`) | Fires when an English test **outcome is recorded** against a student. An ALO English Test finished on the **external** test platform is not observable from this application — there is no callback — and this event does not claim to measure that |
| `ielts_page_view` | ✅ **corrected** | route-derived | Now only for IELTS pages |
| `pte_page_view` | ✅ **(added this pass)** | route-derived, `/language-prep/pte*` | Previously impossible |
| `toefl_page_view` | ✅ **(added this pass)** | route-derived, `/language-prep/toefl*` | Previously impossible |
| `lead_qualified` | ✅ | server-side (Measurement Protocol) | |
| `application_started` | ✅ | server-side | |
| `application_submitted` | ✅ | server-side | |
| `enrollment_completed` | ✅ | server-side | |

### The defect this pass fixed

Before this pass, `pageViewEventsFor()` contained:

```ts
if (type === 'ielts' || /ielts/.test(path) || type === 'english_test') events.push('ielts_page_view');
```

Every `/language-prep/*` page was classified `english_test`, so **PTE and TOEFL traffic was
counted as IELTS**, and the required `pte_page_view` / `toefl_page_view` events could never
exist. The mapping is now: IELTS pages → `ielts_page_view`; `/language-prep/pte*` →
`pte_page_view`; `/language-prep/toefl*` → `toefl_page_view`; the language-prep hub emits none
of the three. Two pre-existing unit tests asserted the old behaviour and were corrected with
an explanatory comment rather than deleted.

## 3. Event parameters (and the PII wall)

Allowed parameters are an explicit allowlist (`ALLOWED_EVENT_PARAMS`): `course_id`,
`course_slug`, `university_id`, `university_slug`, `scholarship_id`, `scholarship_slug`,
`country`, `destination`, `study_level`, `intake`, `english_test`, `page_type`, `page_path`,
`landing_page`, `lead_source`, `form_id`, `form_step`, `campaign`, `campaign_id`, `utm_*`,
`gclid`, `fbclid`, `referrer_domain`, `first_touch_source`, `last_touch_source`,
opaque references (`lead_reference`, `application_reference`, `student_reference`,
`visitor_id`, `session_id`), outcome fields (`test_type`, `test_result_band`, `score_band`,
`result`, `success`, `error_code`, `value`, `currency`, `items_count`,
`search_term_category`, `application_stage`, `enrollment_status`, `test_session_id`), plus the
three added this pass: `scroll_depth_percent`, `upload_kind`, `stage_from`, `stage_to`.

`scrubEventParams()` runs **before** anything reaches `dataLayer` and applies three layers:

1. **Key allowlist** — unknown keys dropped.
2. **Forbidden key patterns** — `passport`, `nid`, `national_id`, `birth_certificate`,
   `password`, `token`, `api_key`, any `card`/`credit`/`debit`/`cvv`/`iban`/`bank`/`payment`
   spelling, `email`, `phone`, `mobile`, `name` (unanchored — so `mother_name` is caught),
   `address`, `dob`, `document`, `cv`, `resume`, `scan`, `attachment`, `transcript`, `cgpa`,
   `note`, `medical`, `disabilit`, `religion`, `race`, `political`, `biometric`, `fingerprint`,
   `ip_address`, `user_agent`. Tested twice — raw and with `_`/`-` normalised to spaces —
   because `\bemail\b` does not match `email_address`.
3. **Forbidden value shapes** — an email-shaped value, a Bangladeshi mobile, a generic phone
   number, passport/NID-shaped strings, card-number digit runs, and any 10–17 digit numeric id
   are rejected **whatever key they arrive under**, plus anything over 200 characters.

Rejections are reported to the developer console in non-production so the mistake is caught in
review, not in an audit.

**Never transmitted:** passport numbers, NID, student names as identifiers, emails, phones,
passwords, private documents, payment data, visa case details. Student-level records stay in
the CRM.

## 4. Verified vs not verified

| Claim | Status |
|---|---|
| Event vocabulary is closed and complete for the specification's list | **PASS** — asserted by a test that names all 27 required events |
| PII screen drops forbidden keys/values | **PASS** — unit-tested, including the new `upload_kind` / stage parameters |
| Consent defaults precede the library | **PASS by construction** — single inline bootstrap; ordering asserted in code comments and prior HTML inspection |
| Scroll arithmetic and milestone dedupe | **PASS** — unit-tested (4 tests) |
| Tag-loader mutual exclusion | **PASS** — unit-tested across the config matrix |
| Events actually arriving in GA4 | **BLOCKED** — no property, no credential, no browser session in this environment. Only GA4 DebugView can confirm this |
| No duplicate `page_view` in a real session | **PARTIAL** — the mechanism is unit-tested; a live session has not been observed |
| Conversion events reaching Google | **BLOCKED** — needs `GA4_API_SECRET` |

## 5. Operator checklist to close the BLOCKED items

1. Create the property (`02`), set `GA4_MEASUREMENT_ID`, `GA4_PROPERTY_ID`,
   `GA4_API_SECRET`, `NEXT_PUBLIC_GA4_ENABLED=true` in the production environment.
2. Open the site with GA4 **DebugView** open. Expect exactly one `page_view` per navigation,
   plus `page_scroll` at 25/50/75/90, plus `country_page_view` on `/destinations/uk`.
3. Open `/language-prep/pte-academic` → expect `pte_page_view`, **not** `ielts_page_view`.
4. Open `/language-prep/toefl-ibt` → expect `toefl_page_view`.
5. Submit a lead form → `lead_form_start` then `lead_form_submit`.
6. In the CRM, move an application stage → `application_status_changed` in DebugView within
   ~1 minute (Measurement Protocol).
7. Upload a student document → `document_upload_completed` with `upload_kind` populated and
   **no file name**.
8. Accept the consent banner → queued events flush. Reload, decline → no hits leave the
   browser (Network tab, `google-analytics.com` / `analytics.google.com` absent).
9. Confirm `GET /api/google/analytics/report?preset=events` returns `status: READY` and lists
   the events above.
