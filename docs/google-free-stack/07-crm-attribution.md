# 07 — CRM attribution

**Principle:** the ALO CRM is the single source of truth for students, leads, communications,
counsellors, applications, documents and visas. Google receives *aggregate, non-identifying*
events. Nothing in this document creates a second contact store.

**Code of record:** `src/lib/attribution/lead-attribution.ts`,
`src/lib/analytics/attribution-payload.ts`, `src/lib/analytics/page-context.ts`,
`src/lib/analytics/conversion-funnel.ts`, `prisma/schema.prisma` (model `Lead`).

---

## 1. Field audit — the `Lead` model (existing, reused, not duplicated)

Attribution columns already existed on `Lead` before this pass. They were **reused**; no
duplicate column was added:

| Column | Purpose |
|---|---|
| `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm` | Classic UTM set |
| `gclid`, `fbclid` | Click identifiers for future paid campaigns |
| `landingPage` | Path **with** its attribution query string — a landing page is only meaningful together with the campaign that produced it |
| `referrer` | Referring **origin only**, never a full URL, so a third-party query string cannot become stored data |
| `source`, `medium`, `campaign` | Normalised pair derived when no UTM is present (referrer → organic/referral; nothing → `direct`/`none`) |
| `firstTouchSource`, `firstTouchMedium`, `firstTouchCampaign`, `firstTouchLandingPage`, `firstTouchAt` | First-touch block — **write-once** |
| `lastTouchSource`, `lastTouchMedium`, `lastTouchAt` | Last-touch block — updated per documented rule |
| Indexes | `@@index([utmSource, utmMedium, utmCampaign])`, `@@index([landingPage])`, `@@index([gclid])` |

`LeadForm` carries the same logic for form-origin records. `MarketingLead` has its own
`utmSource` field. **No new table and no new column was added in this pass** — the audit's
conclusion was that the existing set already satisfies the specification's suggested list
(`source`, `medium`, `campaign`, `content`, `term`, `landingPage`, `referrer`, `gclid`,
`fbclid`, `utm*`, `firstTouch*`, `lastTouch*`, `firstTouchAt`, `lastTouchAt`).

## 2. Capture rules

### Where it is captured

`buildPageContext()` reads the browser URL and produces one `PageContext`, used by **both** the
analytics page-view emitter and lead attribution. One parser means an analytics report and a
CRM attribution row cannot disagree about what `utm_source` was.

Also captured server-side from the request where a form posts (`attribution-payload.ts`), so a
lead created by an API caller without client-side JS still carries attribution.

**Wired into (existing routes, unchanged contract):** the public lead routes,
`src/app/api/website/lead`, `src/app/api/leads`, `src/app/api/crm/leads/public`,
`src/app/api/language-prep/leads`, `src/lib/identity/registration-lead.ts`,
`src/lib/identity/canonical-student.ts`, `portal-store.ts`.

### Parsing rules

- Canonical `utm_*` wins over the aliases (`source`, `medium`, `campaign`, `content`, `term`,
  `utmSource`, `utmMedium`, `campaignName`, `keyword`, …) that Google Ads autotagging and
  hand-built links use.
- Values are stripped of control characters, trimmed, and **truncated to 200 characters**, so a
  hostile URL cannot inflate a `VARCHAR` column or smuggle a payload.
- `landing_page` keeps the query string; `page_path` does not.
- `referrer` stores the **hostname only**.

### Derivation when no UTM exists

| Situation | `source` / `medium` |
|---|---|
| `gclid` present | `utm_source` or `google` / `utm_medium` or `cpc` |
| `fbclid` present | `utm_source` or `facebook` / `utm_medium` or `social` |
| `utm_source` present | that source / `utm_medium` or `referral` |
| Referrer is a known search engine | that domain / `organic` |
| Any other referrer | that domain / `referral` |
| Nothing at all | `direct` / `none` |

A campaign is **never invented**. An empty campaign stays empty; the funnel reports it as
"unattributed" rather than inventing a bucket.

## 3. First-touch vs last-touch — the documented rule

| Rule | Implementation |
|---|---|
| First touch is written **once**, when the lead is created | `mergeAttribution` never overwrites a populated `firstTouch*` block |
| A later visit **cannot** overwrite first touch | If `firstTouchSource` is set, an incoming direct visit is ignored for the first-touch block |
| Last touch **is** updated when a new attributable visit occurs | `lastTouch*` and `lastTouchAt` are refreshed only when the incoming context carries attribution (UTM or click id) |
| A direct visit does not erase a campaign | Direct traffic (`source: direct`) does not update last touch; otherwise every returning student would look like a direct lead |
| Multiple channels contacting the same student | The **same** lead row is reused; attribution is merged per the two rules above. No second lead is created |
| Existing student identity is never overwritten | Matching resolves to the existing student; identity fields are not touched by attribution |

Worked example (implemented, unit-tested):

```
Visit 1  ?utm_source=google&utm_medium=cpc&utm_campaign=UK-Recruitment&gclid=X
         → first_touch = google/cpc/UK-Recruitment, last_touch = same
Visit 2  (typed the URL directly, no params)
         → first_touch UNCHANGED, last_touch UNCHANGED (direct does not overwrite)
Visit 3  ?utm_source=newsletter&utm_medium=email
         → first_touch UNCHANGED (still google/cpc), last_touch = newsletter/email
```

## 4. Validation and injection defence

| Threat | Defence |
|---|---|
| Oversized parameter | truncated at 200 chars after control-character stripping |
| Control characters / header injection | `[\u0000-\u001f\u007f]` removed |
| Full referrer URL leakage | only `url.hostname` is stored |
| Prototype pollution via query keys | parameters are read by explicit name into a fixed object shape; no key from the URL is ever used as an object key |
| Values reaching analytics | every parameter must pass the allowlist **and** the value-shape screen (`04` §3) |
| Free text reaching Google | there is no free-text attribution parameter |

## 5. Website → CRM flow (as implemented)

```
visitor → landing page → course/university interaction → lead form / WhatsApp / phone
   → existing ALO lead API (rate limited, duplicate-checked)
   → identity matching (findDuplicateLead / canonical student resolver)
   → existing student OR new lead (never a second database)
   → automatic Student ID (existing sequence allocator)
   → attribution persisted (first touch once, last touch per rule)
   → counsellor assignment (autoAssignCounselor)
   → follow-up engine (createFollowUpTask)
   → application → enrolment
```

The webhook verification, duplicate prevention and central communication hub of the existing
system are **not bypassed**: attribution is an addition to the payload these paths already
carried, not a new path around them.

## 6. CRM → GA4 business conversion reporting

`src/lib/analytics/server-conversions.ts` sends, via the GA4 **Measurement Protocol**:

`generate_lead`, `lead_qualified`, `application_started`, `application_submitted`,
`enrollment_completed`, `english_test_complete`.

Added in this pass (all after their transaction commits): `document_upload_completed`,
`application_status_changed`.

| Requirement | Implementation |
|---|---|
| Consent and privacy controls | No PII; only allowlisted, coarse parameters (`upload_kind` is a fixed vocabulary; `application_stage` is an ALO workflow label) |
| Appropriate event identifiers | `client_id` is the anonymous ALO visitor token, or a **salted SHA-256** of an internal reference — never the reference itself |
| Duplicate-event prevention | Events fire from the committed transition, not from page renders; the Measurement Protocol has no retry loop; each business transition emits once |
| Timestamp validation | Events are sent at the moment of the transition; no back-dated replay exists |
| Secure server-side credentials | `GA4_API_SECRET` server-side only; never `NEXT_PUBLIC_*` |
| No PII | Enforced by `scrubEventParams`, and the reduced surface of these specific helpers |
| Raw CRM records never sent to Google | A conversion is one event with ≤4 parameters; no record, no contact field, no document |
| Environment gate | Nothing sent outside production unless explicitly opted in, and then with `debug_mode: 1` (DebugView only) |
| Cannot break the business | `reportServerEvent` is fire-and-forget and swallows all errors |

## 7. Reporting that joins acquisition to enrolment

`src/lib/analytics/conversion-funnel.ts` + `GET /api/analytics/conversion-funnel` build the
funnel **from the ALO database** (leads → qualified → applications → enrolments), grouped by
channel, source, medium, campaign, landing page or first-touch source. It states its own
caveats, including how many leads could not be joined to an application, so a low conversion
rate is not mistaken for a broken join. It does not read GA4 and GA4 does not read it: two
independent measurements that can be compared.

## 8. Status

| Item | Status |
|---|---|
| Attribution fields present and reused (no duplication) | **PASS** — audit of `Lead`/`LeadForm`/`MarketingLead` |
| Capture on every lead-intake path | **PASS** (type-checked; library unit-tested — 24 tests) |
| First-touch immutability / last-touch rule | **PASS** — unit-tested including the direct-visit case |
| Injection defence | **PASS** — truncation, control-char stripping, fixed object shape |
| End-to-end UTM round-trip through a real MySQL insert | **PARTIAL** — no automated test posts a UTM parameter through HTTP into a live database in this environment |
| Server-side conversion delivery | **BLOCKED** — needs `GA4_API_SECRET` |
| Funnel against real data | **BLOCKED** — needs a populated database |
| Historical backfill for pre-2026 leads | **NOT REQUIRED** — no UTM data exists for them anywhere; a backfill would be fabrication. They report as `unknown` |
