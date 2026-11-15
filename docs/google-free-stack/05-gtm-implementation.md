# 05 — Google Tag Manager implementation

**Cost:** FREE, no billing account. **Code of record:** `src/components/analytics/GoogleTags.tsx`,
`src/lib/google/config.ts`, `src/lib/analytics/client.ts`.

**Container status:** `BLOCKED` — no GTM container exists in this environment. Everything
below is the implementation and the exact configuration the operator must create, and every
claim about *code* behaviour is unit-tested.

---

## 1. The contract between the website and the container

The website owns the **data layer**; the container owns **tags**.

```
ALO code                      dataLayer                      GTM container
────────                      ─────────                      ─────────────
trackAnalyticsEvent(           { event: 'lead_form_submit',   GA4 Event tag
  'lead_form_submit',            lead_source: 'google',         trigger: Custom Event
  {…}                            page_type: 'country',          = lead_form_submit
)                                destination: 'UK' }          → GA4 property
```

Rules this contract enforces:

1. `trackAnalyticsEvent()` only ever **pushes** to `window.dataLayer`. It never loads gtag.js
   and never calls `gtag('config', …)`, so it cannot duplicate what the loader already fires.
2. Event names are validated against `ANALYTICS_EVENT_NAMES`; parameters against the allowlist
   and the PII screen. Nothing reaches the data layer unscreened.
3. When no loader is present every call is a no-op returning `status: 'not_configured'`. The
   website never depends on GTM.

Example push (from a country page lead form):

```javascript
dataLayer.push({
  event: "lead_form_submit",
  lead_source: "google",
  page_type: "country",
  destination: "UK"
});
```

No personal data appears in `dataLayer` at any point — see `04-ga4-implementation.md` §3.

## 2. Container configuration the operator must create

Do this in this order. **Nothing is published until step 7 passes.**

### Step 1 — Basic container

- Account `ALO Education`, container `aloeducation.com`, platform **Web**.
- Container ID → `NEXT_PUBLIC_GTM_ID` in the production environment.

### Step 2 — Consent Mode (do this FIRST, before any GA4 tag)

1. **Variables → New → Consent** type: create `alo_consent_analytics`.
2. On the GA4 Configuration tag, under **Advanced Settings → Consent Settings → Require
   additional consent** → add `analytics_storage`.
3. Do **not** add a separate "consent" tag. The application already sets Consent Mode v2
   defaults inline *before* the container script runs, and upgrades them when the visitor
   accepts. A container-side consent tag would race with this.

### Step 3 — GA4 Configuration tag

- Tag type **Google Tag** (GA4), Measurement ID = `G-…`.
- **Critical setting: `send_page_view` = false.**
  Rationale: `AnalyticsPageView` owns every `page_view` so each one carries ALO's `page_type`
  and the entity slugs. If the container's tag also fires an automatic page view, every view
  is counted twice and every conversion rate halves. When the loader is gtag.js the app sets
  `send_page_view: false` in code; under GTM this is the operator's equivalent, and the app
  compensates by skipping the first view under GTM… **but only if you also leave it true**.
  Two supported shapes — pick one and write it down:
  - **A (recommended):** `send_page_view = false` on the tag. The app fires every page view,
    including the first. One source of truth, no skip logic involved.
  - **B:** leave the tag's automatic page view on. Then the app skips the first view, which it
    detects from `window.aloAnalyticsContext.loader === 'gtm'`. This works but is fragile.
  Choose **A** and do not change it later without re-testing duplicates.

### Step 4 — GA4 Event tags (one per event, or one reusable)

Create one **GA4 Event** tag per event name, each with a **Custom Event** trigger whose
`event name` equals the data-layer event exactly:

`page_view` (only if using shape A above), `page_scroll`, `course_search`, `course_view`,
`university_search`, `university_view`, `country_page_view`, `destination_page_view`,
`lead_form_start`, `lead_form_submit`, `counselor_request`, `whatsapp_click`, `phone_click`,
`email_click`, `application_start`, `application_submit`, `document_upload_completed`,
`application_status_changed`, `english_test_start`, `english_test_complete`, `ielts_page_view`,
`pte_page_view`, `toefl_page_view`, `student_registration`, `student_login`, `visa_page_view`,
`scholarship_view`.

A single reusable GA4 Event tag with `{{Event}}` as the event name works too, provided the
trigger fires only on the names above — an unconditional trigger would forward `gtm.js`,
`gtm.dom` and every consent push as fabricated events. That mistake is why per-name triggers
are the safer default.

Pass parameters as **Data Layer Variables** with exactly the snake_case names the app pushes
(`page_type`, `destination`, `course_slug`, `scroll_depth_percent`, `upload_kind`, …). Renaming
in the container forks the vocabulary from the code and breaks the allowlist guarantee.

**Do not create an event tag for the server-side conversions** (`generate_lead`,
`lead_qualified`, `application_started`, `application_submitted`, `enrollment_completed`).
Those are sent by the Measurement Protocol from the server. Forwarding them from the browser
would double-count every business conversion.

### Step 5 — Mark the business conversions as key events

In GA4 → **Admin → Events → Key events**, mark: `lead_form_submit`, `counselor_request`,
`whatsapp_click`, `application_submit`, `generate_lead`, `lead_qualified`,
`application_submitted`, `enrollment_completed`. ALO does not use `value` for these beyond
what the server sends.

### Step 6 — Approved marketing tags

Currently **none**. Ads and Meta Pixel are out of scope for the Google free stack and no
accounts exist. The container is the reason adding them later needs no deploy — but adding them
requires a consent review and an approval record first.

### Step 7 — Test before publishing

1. **Preview** on the production URL with a second browser profile (no stale consent).
2. Confirm in the data layer: exactly one `page_view` per navigation, and none duplicated by
   the container.
3. Navigate `/destinations/uk` → one `page_view` + one `country_page_view`.
4. Navigate `/language-prep/pte-academic` → `pte_page_view` present, `ielts_page_view` absent.
5. Scroll a long page → four `page_scroll` events (25/50/75/90) and no more.
6. Submit a lead form → `lead_form_start`, `lead_form_submit`.
7. Decline consent → no GA4 hit appears in the Network tab; accept → hits appear.
8. Run **Tag Assistant** / **Preview** → no tag fires twice; no "unknown event" tag.
9. Only then **Publish**, with a version name and notes ("GA4 + ALO event vocabulary v1").

## 3. Environment gating and failure isolation

| Situation | Behaviour |
|---|---|
| `NEXT_PUBLIC_GTM_ID` absent | Nothing injected; the site is unaffected |
| Placeholder `GTM-XXXXXXX` | Treated as absent (`isPlaceholderTagId`) — the documented example is not a container |
| `NEXT_PUBLIC_GTM_ENABLED=false` | ID kept, injection off |
| Non-production | Suppressed entirely (unless `ANALYTICS_ALLOW_NON_PRODUCTION=true` on staging) |
| Container script unreachable | The inline bootstrap has no `onError` handler; the failed script simply never executes. Lead capture, routing and the CRM are untouched |
| Both GTM and GA4 configured | GTM wins and the direct gtag loader is disabled at the config layer |

## 4. Debugging reference

| Symptom | Most likely cause |
|---|---|
| Two `page_view` per navigation | Container Config tag has `send_page_view` on **and** shape A was assumed, or both loaders were injected (impossible by config, so this is a container problem) |
| `page_scroll` fires hundreds of times | A container trigger on "all events" instead of the custom event name |
| Events missing in GA4 but present in Preview | Consent denied, or key events not marked, or the event tag lacks the GA4 Event type |
| `document_upload_completed` has no `upload_kind` | Data Layer Variable not created / misnamed |
| Server conversions double-counted | A browser tag was created for `generate_lead`/`lead_qualified` — delete it |
| Nothing at all in Preview | Production environment variables not set, or the page is not served from the production origin |

## 5. Status summary

| Item | Status |
|---|---|
| Tag loader implementation, single-loader arbitration, consent ordering | **PASS** (unit-tested) |
| Controlled dataLayer interface with closed vocabulary | **PASS** (unit-tested) |
| Container creation and tag configuration | **BLOCKED** — console action |
| GTM Preview verification | **BLOCKED** — needs a container and a browser |
| Duplicate-trigger prevention | **PARTIAL** — mechanism implemented and tested; not observed in a live session |
